# GÖREV 14 — İş kuyruğu (jobs.ts) + /api/jobs uçları

## Bağlam
Uzun medya üretimleri HTTP isteğini blokluyor; iptal/retry yok. DeepSeek Harness'in
"jobs service" deseni portlanacak (Cordis yerine hafif servis deseni).
Referans: `@hmx/router` MediaRouter.generate, `@hmx/media` AssetCatalog,
`@hmx/core` store helper'ları (readJson/writeJson).

## Üretilecek dosyalar
1. `packages/core/src/jobs.ts` — kuyruk çekirdeği
2. `packages/dashboard-api/src/routes/jobs.ts` — Hono route tanımları (server.ts'e mount edilecek şekilde export)

## jobs.ts kontratı
```ts
export type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";
export type Job = {
  id: string; kind: "image" | "video" | "audio" | "compose";
  prompt: string; provider?: string;
  status: JobStatus; error?: string; resultPath?: string;
  createdAt: number; startedAt?: number; finishedAt?: number;
};

export class JobQueue {
  /** handler: işi calistiran fonksiyon (ornegin MediaRouter.generate sarmalayicisi) */
  constructor(opts: { concurrency?: number; handler: (job: Job, signal: AbortSignal) => Promise<string> });
  enqueue(job: Omit<Job, "id" | "status" | "createdAt">): Job;
  cancel(id: string): boolean;            // queued -> cancelled; running -> AbortController.abort
  retry(id: string): Job | null;          // failed/cancelled -> queued (yeni deneme)
  get(id: string): Job | null;
  list(filter?: { status?: JobStatus }): Job[];
  onChange(cb: (job: Job) => void): () => void;  // panel canli izleme icin
}
```
- Kalıcılık: `~/.hmx/jobs.json` (atomik writeJson ile); restart'ta running → failed ("sunucu yeniden basladi").
- Concurrency varsayılan 2; FIFO.

## routes/jobs.ts kontratı
```ts
import { Hono } from "hono";
export function jobRoutes(queue: JobQueue): Hono;
// GET /api/jobs, GET /api/jobs/:id, POST /api/jobs {kind,prompt,provider?},
// POST /api/jobs/:id/cancel, POST /api/jobs/:id/retry
// Tamamlanan job'lar AssetCatalog'a register edilir.
```

## Kurallar
- Bağımlılık yok (hono zaten dashboard-api'de var). Strict TS.
- Dokümante et: server.ts'te `app.route("/api/jobs", jobRoutes(queue))` olarak bağlanacak.
