import type {
  MediaProvider,
  GenerateRequest,
  GenerateResult,
  ProviderKind,
  ProviderConfig,
} from "@hmx/providers";
import { loadAllProviders, loadProviderConfigs } from "@hmx/providers";
import { TaskLedger } from "@hmx/agent-core";
import { CircuitBreaker } from "./circuit-breaker.js";

const TIER_ORDER: Record<string, number> = {
  subscription: 0,
  cheap: 1,
  free: 2,
};

/**
 * Medya router'i (Bolum 5.3 + 6.2).
 * - Fallback zinciri: tercih edilen saglayici once, sonra tier sirasina gore
 *   (subscription -> cheap -> free); HMX_ORDER_<KIND> env'i ile ezilebilir.
 * - Devre kesici: ayni saglayici ardisik 2 hata -> 5 dk "open" (atlanir).
 */
export class MediaRouter {
  private providers: MediaProvider[] = [];
  private circuit = new CircuitBreaker(2, 5 * 60_000);

  constructor(private ledger?: TaskLedger) {
    this.providers = loadAllProviders();
  }

  reload() {
    this.providers = loadAllProviders();
  }

  /** Efektif fallback sirasi: env override > preferred > tier sirasi (Bolum 6.2) */
  orderFor(kind: ProviderKind, preferred?: string): string[] {
    const envKey = `HMX_ORDER_${kind.toUpperCase()}`;
    const envOrder = process.env[envKey]
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    let base: string[];
    if (envOrder && envOrder.length > 0) {
      base = envOrder;
    } else {
      const cfgs = loadProviderConfigs().filter((c) => c.kind === kind);
      base = cfgs.sort((a, b) => tierRank(a) - tierRank(b)).map((c) => c.id);
    }
    const order = preferred
      ? [preferred, ...base.filter((id) => id !== preferred)]
      : base;
    return order.length > 0 ? order : base;
  }

  list(): {
    id: string;
    kind: ProviderKind;
    authMode: string;
    tier: string;
    circuitOpen: boolean;
  }[] {
    const cfgs = loadProviderConfigs();
    return this.providers.map((p) => ({
      id: p.id,
      kind: p.kind,
      authMode: p.authMode,
      tier:
        cfgs.find((c) => c.id === p.id)?.tier ??
        defaultTier(cfgs.find((c) => c.id === p.id)),
      circuitOpen: this.circuit.isOpen(p.id),
    }));
  }

  circuitSnapshot() {
    return this.circuit.snapshot();
  }

  async generate(
    kind: ProviderKind,
    req: Omit<GenerateRequest, "kind">,
    preferred?: string,
  ): Promise<GenerateResult & { provider?: string }> {
    const order = this.orderFor(kind, preferred);
    const errors: string[] = [];

    for (const id of order) {
      req.signal?.throwIfAborted();
      if (this.circuit.isOpen(id)) {
        errors.push(`${id}: devre disi (tekrarlayan hata)`);
        continue;
      }
      const p = this.providers.find((x) => x.id === id && x.kind === kind);
      if (!p) {
        errors.push(`${id}: tanimli degil`);
        continue;
      }
      if (!(await p.isAvailable())) {
        errors.push(`${id}: kullanilamiyor (oturum/anahtar yok)`);
        continue;
      }

      this.ledger?.log("action", `Uretim deneniyor: ${id} (${kind})`);
      const result = await p.generate({ ...req, kind });
      req.signal?.throwIfAborted();
      if (result.ok) this.circuit.recordSuccess(id);
      else this.circuit.recordFailure(id);

      if (result.ok) {
        this.ledger?.log(
          "verify",
          `Uretim basarili: ${result.filePath} (${result.meta?.bytes} bayt)`,
        );
        return { ...result, provider: id };
      }
      errors.push(`${id}: ${result.error}`);
      this.ledger?.log("error", `Uretim basarisiz: ${id} - ${result.error}`);
    }
    return {
      ok: false,
      error: `${kind}: tum saglayicilar basarisiz — zincir: ${order.join(" -> ")}\n- ${errors.join("\n- ")}`,
    };
  }
}

function defaultTier(cfg?: ProviderConfig): string {
  // tanimli degilse: tarayici oturumu ucretsiz sayilir, API anahtari ucretli sayilir
  return cfg?.authMode === "api-key" ? "cheap" : "free";
}

function tierRank(cfg: ProviderConfig): number {
  return TIER_ORDER[cfg.tier ?? defaultTier(cfg)] ?? 3;
}
