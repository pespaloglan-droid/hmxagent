import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { paths, ensureDirs, getLogger } from "@hmx/core";

export type LedgerEvent = {
  ts: string;
  sessionId: string;
  step: number;
  type: "goal" | "plan" | "action" | "verify" | "error" | "deliver" | "note";
  summary: string;
  detail?: unknown;
};

/**
 * Gorev Defteri: agent'in her adimini JSONL olarak diske yazar.
 * - "Konudan sapma" kontrolu: goal her zaman son acilan oturumda okunabilir.
 * - Hata ayiklama: her eylem + dogrulama kaniti kayitlidir.
 */
export class TaskLedger {
  readonly sessionId: string;
  private file: string;
  private step = 0;
  private goal: string | null = null;

  constructor(sessionId?: string) {
    ensureDirs();
    this.sessionId =
      sessionId ??
      `ses_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}_${crypto.randomBytes(2).toString("hex")}`;
    this.file = path.join(paths.logs, `${this.sessionId}.jsonl`);
  }

  log(type: LedgerEvent["type"], summary: string, detail?: unknown) {
    const ev: LedgerEvent = {
      ts: new Date().toISOString(),
      sessionId: this.sessionId,
      step: ++this.step,
      type,
      summary,
      detail,
    };
    getLogger("agent")
      .child({ sessionId: this.sessionId, step: ev.step, event: type })
      [type === "error" ? "error" : "info"](summary);
    try {
      fs.appendFileSync(this.file, JSON.stringify(ev) + "\n");
    } catch (error) {
      getLogger("agent").warn("Görev defteri yazılamadı", {
        sessionId: this.sessionId,
        error,
      });
    }
    if (type === "goal") this.goal = summary;
    return ev;
  }

  /** Kural 1.2: her 5 adimda bir hedefi hatirlat */
  shouldReinjectGoal() {
    return this.step > 0 && this.step % 5 === 0 && this.goal !== null;
  }

  getGoal() {
    return this.goal;
  }

  getFile() {
    return this.file;
  }
}
