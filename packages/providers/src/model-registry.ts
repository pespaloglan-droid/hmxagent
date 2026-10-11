import { LlmClient } from "@hmx/core";
import { loadProviderConfigs } from "./registry.js";
import { AccountPool } from "./account-pool.js";
export type RegisteredModel = {
  id: string;
  label: string;
  source: "llm-endpoint" | "media-provider";
  kind: "llm" | "image" | "video" | "audio";
  available: boolean;
  reason?: string;
};
export class ModelRegistry {
  private cache: RegisteredModel[] | null = null;
  private expires = 0;
  private pending: Promise<RegisteredModel[]> | null = null;
  private generation = 0;
  async list(): Promise<RegisteredModel[]> {
    if (this.cache && Date.now() < this.expires)
      return this.cache.map((row) => ({ ...row }));
    if (!this.pending) {
      const generation = this.generation;
      const scan = this.scan()
        .then((rows) => {
          if (generation === this.generation) {
            this.cache = rows;
            this.expires = Date.now() + 30000;
          }
          return rows;
        })
        .finally(() => {
          if (this.pending === scan) this.pending = null;
        });
      this.pending = scan;
    }
    return (await this.pending).map((row) => ({ ...row }));
  }
  async listAvailable(): Promise<RegisteredModel[]> {
    return (await this.list()).filter((m) => m.available);
  }
  invalidate(): void {
    this.cache = null;
    this.expires = 0;
    this.pending = null;
    this.generation++;
  }
  private async scan(): Promise<RegisteredModel[]> {
    const rows: RegisteredModel[] = [];
    try {
      const ids = await LlmClient.fromEnv().listModels();
      if (!ids.length) throw new Error("Model listesi boş.");
      for (const id of new Set(ids))
        rows.push({
          id: `llm:${id}`,
          label: id,
          source: "llm-endpoint",
          kind: "llm",
          available: true,
        });
    } catch {
      const id = process.env.HMX_LLM_MODEL ?? "qwen2.5:14b";
      rows.push({
        id: `llm:${id}`,
        label: id,
        source: "llm-endpoint",
        kind: "llm",
        available: false,
        reason: "endpoint erisilemiyor",
      });
    }
    const pool = new AccountPool();
    for (const config of loadProviderConfigs().filter(
      (p) => p.kind !== "llm",
    )) {
      const account = pool.pickNext(config.id);
      const usable =
        !!account &&
        (config.authMode === "api-key"
          ? !!account.apiKey
          : !!account.profileDirectory);
      const env =
        config.authMode === "api-key" &&
        !!config.apiKeyEnv &&
        !!process.env[config.apiKeyEnv];
      const available = usable || env;
      rows.push({
        id: `media:${config.id}`,
        label: config.model ? `${config.id} · ${config.model}` : config.id,
        source: "media-provider",
        kind: config.kind,
        available,
        ...(!available
          ? {
              reason:
                config.authMode === "api-key"
                  ? "hesap veya API anahtari yok"
                  : "kullanilabilir tarayici hesabi yok",
            }
          : {}),
      });
    }
    return rows;
  }
}
