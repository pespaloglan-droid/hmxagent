import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { paths } from "./paths.js";
import { readJson, writeJson } from "./store.js";
import { getLogger } from "./logger.js";
export type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";
export type Job = {
  id: string;
  kind: "image" | "video" | "audio" | "compose";
  prompt: string;
  provider?: string;
  status: JobStatus;
  error?: string;
  resultPath?: string;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
};
const statuses: JobStatus[] = [
  "queued",
  "running",
  "done",
  "failed",
  "cancelled",
];
export class JobQueue {
  private jobs = new Map<string, Job>();
  private pending: string[] = [];
  private active = new Map<string, AbortController>();
  private listeners = new Set<(job: Job) => void>();
  private file: string;
  private concurrency: number;
  private log = getLogger("app").child({ service: "jobs" });
  private scheduled = false;
  private closed = false;
  constructor(
    private opts: {
      concurrency?: number;
      handler: (job: Job, signal: AbortSignal) => Promise<string>;
      storageFile?: string;
    },
  ) {
    this.concurrency = opts.concurrency ?? 2;
    if (
      !Number.isInteger(this.concurrency) ||
      this.concurrency < 1 ||
      this.concurrency > 32
    )
      throw new Error("Concurrency 1–32 arasında olmalı.");
    this.file = opts.storageFile ?? path.join(paths.home, "jobs.json");
    const saved = readJson<unknown>(this.file);
    if (fs.existsSync(this.file) && !Array.isArray(saved))
      throw new Error(
        "jobs.json bozuk; üzerine yazılmadı. Dosyayı yedekleyip düzeltin.",
      );
    for (const raw of (saved ?? []) as unknown[]) {
      if (!raw || typeof raw !== "object")
        throw new Error("Geçersiz iş kaydı.");
      const j = raw as Job;
      if (
        typeof j.id !== "string" ||
        !["image", "video", "audio", "compose"].includes(j.kind) ||
        typeof j.prompt !== "string" ||
        !Number.isFinite(j.createdAt) ||
        !statuses.includes(j.status) ||
        this.jobs.has(j.id)
      )
        throw new Error("Geçersiz/yinelenen iş kaydı; jobs.json korunuyor.");
      const job = { ...j };
      if (job.status === "running") {
        job.status = "failed";
        job.error = "sunucu yeniden basladi";
        job.finishedAt = Date.now();
      }
      this.jobs.set(job.id, job);
    }
    this.pending = this.list({ status: "queued" })
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((j) => j.id);
    this.persist();
    this.schedule();
  }
  enqueue(input: Omit<Job, "id" | "status" | "createdAt">): Job {
    if (this.closed) throw new Error("İş kuyruğu kapalı.");
    if (
      !["image", "video", "audio", "compose"].includes(input.kind) ||
      !input.prompt.trim()
    )
      throw new Error("Geçerli iş türü ve prompt gerekli.");
    const job: Job = {
      kind: input.kind,
      prompt: input.prompt,
      ...(input.provider ? { provider: input.provider } : {}),
      id: randomUUID(),
      status: "queued",
      createdAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    this.pending.push(job.id);
    try {
      this.persist();
    } catch (error) {
      this.jobs.delete(job.id);
      this.pending = this.pending.filter((id) => id !== job.id);
      throw error;
    }
    this.emit(job);
    this.schedule();
    return { ...job };
  }
  cancel(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || !["queued", "running"].includes(job.status)) return false;
    const old = { ...job };
    job.status = "cancelled";
    job.finishedAt = Date.now();
    job.error = "Kullanıcı iptal etti.";
    try {
      this.persist();
    } catch (error) {
      this.jobs.set(id, old);
      throw error;
    }
    this.pending = this.pending.filter((key) => key !== id);
    this.active.get(id)?.abort();
    this.emit(job);
    return true;
  }
  retry(id: string): Job | null {
    const job = this.jobs.get(id);
    if (
      !job ||
      this.closed ||
      this.active.has(id) ||
      !["failed", "cancelled"].includes(job.status)
    )
      return null;
    const old = { ...job };
    job.status = "queued";
    delete job.error;
    delete job.resultPath;
    delete job.startedAt;
    delete job.finishedAt;
    try {
      this.persist();
    } catch (error) {
      this.jobs.set(id, old);
      throw error;
    }
    this.pending.push(id);
    this.emit(job);
    this.schedule();
    return { ...job };
  }
  get(id: string): Job | null {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }
  list(filter?: { status?: JobStatus }): Job[] {
    return [...this.jobs.values()]
      .filter((j) => !filter?.status || j.status === filter.status)
      .map((j) => ({ ...j }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  onChange(cb: (job: Job) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  close(): void {
    this.closed = true;
    for (const id of [...this.active.keys()]) this.cancel(id);
  }
  private persist() {
    writeJson(this.file, [...this.jobs.values()]);
  }
  private emit(job: Job) {
    for (const listener of this.listeners) {
      try {
        listener({ ...job });
      } catch (error) {
        this.log.warn("İş dinleyicisi hata verdi", { error });
      }
    }
  }
  private schedule() {
    if (this.scheduled || this.closed) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      this.pump();
    });
  }
  private pump() {
    while (
      !this.closed &&
      this.active.size < this.concurrency &&
      this.pending.length
    ) {
      const id = this.pending.shift()!;
      const job = this.jobs.get(id);
      if (!job || job.status !== "queued") continue;
      const controller = new AbortController();
      this.active.set(id, controller);
      job.status = "running";
      job.startedAt = Date.now();
      try {
        this.persist();
        this.emit(job);
      } catch (error) {
        this.active.delete(id);
        job.status = "failed";
        job.error = String(error);
        this.emit(job);
        continue;
      }
      void Promise.resolve()
        .then(() => this.opts.handler({ ...job }, controller.signal))
        .then((out) => {
          if (controller.signal.aborted || job.status === "cancelled") return;
          if (!out) throw new Error("İş çıktı dosyası döndürmedi.");
          job.status = "done";
          job.resultPath = out;
        })
        .catch((error: unknown) => {
          if (job.status !== "cancelled") {
            job.status = "failed";
            job.error = error instanceof Error ? error.message : String(error);
          }
        })
        .finally(() => {
          job.finishedAt ??= Date.now();
          this.active.delete(id);
          try {
            this.persist();
          } catch (error) {
            this.log.error("İş durumu diske yazılamadı", { error });
          }
          this.emit(job);
          this.schedule();
        });
    }
  }
}
