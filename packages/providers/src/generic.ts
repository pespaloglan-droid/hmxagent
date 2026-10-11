import { BrowserSessionProvider } from "./base/browser-session-provider.js";
import type { GenerateRequest, GenerateResult, ProviderKind } from "./types.js";

/**
 * Generic config-tabanli saglayici: config/providers/<id>.json ile tanimlanir.
 * Flow AI, ElevenLabs ve kullanicinin panelden ekledigi tum siteler bu sinifla calisir.
 */
export class GenericBrowserProvider extends BrowserSessionProvider {
  constructor(
    public id: string,
    public kind: ProviderKind,
    cfg: ConstructorParameters<typeof BrowserSessionProvider>[0],
  ) {
    super(cfg);
  }

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    const minBytes = this.kind === "audio" ? 5_000 : 10_000;
    return this.runSiteFlow(req, minBytes);
  }
}
