import fs from "node:fs";
import path from "node:path";
import { AccountPool } from "../account-pool.js";
import { isQuotaError } from "../quota.js";
import type {
  MediaProvider,
  GenerateRequest,
  GenerateResult,
  ProviderKind,
  ProviderConfig,
} from "../types.js";

/**
 * API anahtarli medya saglayicisi (OpenAI TTS, Stability vb. - OpenAI-uyumlu basit POST).
 * Anahtar kaynagi onceligi: AccountPool'daki hesaplar > cfg.apiKeyEnv env degiskeni.
 * Kota (429 / quotaIndicators) hatasinda havuzdaki bir sonraki hesaba doner (Bolum 2).
 */
export class ApiMediaProvider implements MediaProvider {
  id: string;
  kind: ProviderKind;
  authMode = "api-key" as const;

  constructor(
    private cfg: ProviderConfig,
    private pool: AccountPool = new AccountPool(),
  ) {
    this.id = cfg.id;
    this.kind = cfg.kind;
  }

  async isAvailable(): Promise<boolean> {
    if (this.pool.pickNext(this.id)) return true;
    return !!this.envApiKey && !!this.cfg.endpoint;
  }

  private get envApiKey() {
    return this.cfg.apiKeyEnv ? process.env[this.cfg.apiKeyEnv] : undefined;
  }

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    if (!this.cfg.endpoint) {
      return { ok: false, error: `[${this.id}] endpoint tanimli degil` };
    }

    req.signal?.throwIfAborted();
    const tried = new Set<string>();
    for (;;) {
      req.signal?.throwIfAborted();
      const acc = this.pool.pickNext(this.id, tried);
      const apiKey =
        acc?.apiKey ?? (tried.size === 0 ? this.envApiKey : undefined);
      if (!apiKey) {
        return {
          ok: false,
          error: `[${this.id}] API anahtari yok (havuz bos, ${this.cfg.apiKeyEnv ?? "?"} env'i de tanimli degil)`,
        };
      }
      if (acc) tried.add(acc.id);

      try {
        const res = await fetch(this.cfg.endpoint, {
          method: "POST",
          signal: req.signal,
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.cfg.model,
            prompt: req.prompt,
            input: req.prompt, // TTS uyumlulugu
            voice: req.voiceId,
            response_format: "binary",
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          const errText = `HTTP ${res.status}: ${body}`;
          if (
            res.status === 429 ||
            isQuotaError(errText, this.cfg.quotaIndicators)
          ) {
            if (acc) {
              this.pool.reportFailure(acc, true, errText);
              continue;
            } // kota -> sonraki hesap
            return { ok: false, error: errText };
          }
          if (acc) this.pool.reportFailure(acc, false, errText);
          return { ok: false, error: errText };
        }

        const buf = Buffer.from(await res.arrayBuffer());
        req.signal?.throwIfAborted();
        fs.mkdirSync(path.dirname(req.outputPath), { recursive: true });
        fs.writeFileSync(req.outputPath, buf);

        if (buf.length < 1_000)
          return { ok: false, error: `Cikti cok kucuk (${buf.length} bayt)` };
        if (acc) this.pool.reportSuccess(acc);
        return {
          ok: true,
          filePath: req.outputPath,
          meta: { bytes: buf.length, account: acc?.id },
        };
      } catch (err) {
        if (req.signal?.aborted) throw err;
        const msg = err instanceof Error ? err.message : String(err);
        if (acc)
          this.pool.reportFailure(
            acc,
            isQuotaError(msg, this.cfg.quotaIndicators),
            msg,
          );
        return { ok: false, error: msg };
      }
    }
  }
}
