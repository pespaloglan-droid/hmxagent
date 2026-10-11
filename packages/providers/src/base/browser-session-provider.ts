import path from "node:path";
import fs from "node:fs";
import readline from "node:readline";
import { ensureDirs } from "@hmx/core";
import {
  listChromeProfiles,
  launchRealChrome,
  connectChrome,
  findChromeExe,
  ensureProfileCopy,
} from "../chrome.js";
import { AccountPool, type PooledAccount } from "../account-pool.js";
import { QuotaError, isQuotaError } from "../quota.js";
import type {
  MediaProvider,
  GenerateRequest,
  GenerateResult,
  ProviderKind,
  ProviderConfig,
} from "../types.js";

/**
 * API'siz baglanti tabani (Bolum 2.2 + 3.2).
 * - Kullanicinin gercek Chrome'u + sectigi profil (kopya uzerinden, Chrome 136+ kisiti)
 * - Oturumlar AccountPool'a kaydedilir: kota dolunca otomatik sonraki hesaba gecilir
 * - generateWithRotation: kota -> sonraki hesap; kota disi hata -> fırlat
 */
export abstract class BrowserSessionProvider implements MediaProvider {
  abstract id: string;
  abstract kind: ProviderKind;
  authMode = "browser-session" as const;

  constructor(
    protected cfg: ProviderConfig,
    protected pool: AccountPool = new AccountPool(),
  ) {}

  protected selector(key: string): string {
    const sel = this.cfg.selectors?.[key];
    if (!sel)
      throw new Error(
        `[${this.id}] selector tanimli degil: ${key} (config/providers/${this.id}.json)`,
      );
    return sel;
  }

  /** Havuzda kullanilabilir hesap var mi? (Chrome baslatmadan, ucuz kontrol) */
  async isAvailable(): Promise<boolean> {
    return !!this.pool.pickNext(this.id);
  }

  /**
   * Interaktif giris: gercek Chrome profillerini listeler, kullaniciya sektirir,
   * o profille Chrome'u acar; kullanici siteye elle girer, Enter'a basinca oturum
   * hesap havuzuna kaydedilir (Bolum 3.2 giris akisi).
   */
  async interactiveLogin(label?: string): Promise<PooledAccount> {
    ensureDirs();
    if (!findChromeExe())
      throw new Error("Google Chrome bulunamadi. Once Chrome kur.");

    const profiles = listChromeProfiles();
    if (profiles.length === 0) throw new Error("Chrome profili bulunamadi.");

    console.log("\nChrome profillerin:");
    profiles.forEach((p, i) => {
      console.log(
        `  [${i + 1}] ${p.name}${p.email ? `  (${p.email})` : ""}  — ${p.dir}`,
      );
    });
    const answer = await this.ask(
      `\nHangi profille giris yapilsin? (1-${profiles.length}): `,
    );
    const idx = parseInt(answer, 10) - 1;
    const chosen = profiles[idx];
    if (!chosen) throw new Error("Gecersiz secim.");

    // Profili HMX'in izole dizinine kopyala (Chrome 136+ debug portu ancak
    // boyle calisir; kullanicinin acik Chrome'larini kapatmasi da gerekmez)
    ensureProfileCopy(chosen.dir);

    console.log(`\nChrome aciliyor (profil: ${chosen.name})...`);
    const { proc } = await launchRealChrome({
      url: this.cfg.baseUrl,
      profileDir: chosen.dir,
    });
    console.log(
      `[${this.id}] Acilan Chrome'da giris yap (${this.cfg.baseUrl}).`,
    );
    await this.ask("Giris bitince burada Enter'a bas...");
    proc.kill("SIGTERM");

    const acc = this.pool.add({
      providerId: this.id,
      label:
        label ??
        (chosen.email ? `${chosen.name} (${chosen.email})` : chosen.name),
      profileDirectory: chosen.dir,
    });
    console.log(`[${this.id}] Hesap kaydedildi: ${acc.label} (${acc.id})`);
    return acc;
  }

  private ask(q: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise((res) =>
      rl.question(q, (a) => {
        rl.close();
        res(a.trim());
      }),
    );
  }

  /** Kayitli hesabin profiliyle gercek Chrome'u baslatip bir sayfa uzerinde islem yapar */
  protected async withPage<T>(
    acc: PooledAccount,
    job: (page: import("playwright").Page) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    if (!acc.profileDirectory) {
      throw new Error(
        `[${this.id}] Hesapta Chrome profili yok: ${acc.id}. Yeniden hesap ekleyin.`,
      );
    }
    signal?.throwIfAborted();
    const headless = process.env.HMX_HEADLESS === "1";
    const { proc, port } = await launchRealChrome({
      url: this.cfg.baseUrl,
      profileDir: acc.profileDirectory,
      headless,
    });
    const abort = () => {
      proc.kill("SIGTERM");
    };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      signal?.throwIfAborted();
      const { browser, context } = await connectChrome(port);
      const page = context.pages()[0] ?? (await context.newPage());
      const result = await job(page);
      await browser.close().catch(() => {});
      return result;
    } finally {
      signal?.removeEventListener("abort", abort);
      proc.kill("SIGTERM");
    }
  }

  /**
   * Kota rotasyon dongusu (Bolum 2.2): kota dolan hesap cooldown'a alinir,
   * siradaki hesapla devam edilir. Kota disi hata aninda firlatilir
   * (baska hesap denemek anlamsizdir).
   */
  async generateWithRotation<T>(
    job: (acc: PooledAccount, page: import("playwright").Page) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    const tried = new Set<string>();
    for (;;) {
      signal?.throwIfAborted();
      const acc = this.pool.pickNext(this.id, tried);
      if (!acc)
        throw new Error(
          `${this.id}: kullanilabilir hesap kalmadi (hepsi kota/hata durumunda). ` +
            `Panelden yeni hesap ekleyin veya cooldown bitmesini bekleyin.`,
        );
      tried.add(acc.id);
      try {
        const result = await this.withPage(
          acc,
          (page) => job(acc, page),
          signal,
        );
        this.pool.reportSuccess(acc);
        return result;
      } catch (e) {
        if (signal?.aborted) throw e;
        const quota =
          e instanceof QuotaError || isQuotaError(e, this.cfg.quotaIndicators);
        this.pool.reportFailure(acc, quota, String(e));
        if (!quota) throw e; // kota degilse baska hesap denemek anlamsiz -> firlat
        // kota ise dongu devam: bir sonraki hesap
      }
    }
  }

  /** Sayfa govde metni kota gostergelerine karsi taranir (Bolum 2.2 detectQuota) */
  protected async detectQuota(
    page: import("playwright").Page,
  ): Promise<boolean> {
    const text = (await page.textContent("body").catch(() => "")) ?? "";
    return isQuotaError(text, this.cfg.quotaIndicators);
  }

  abstract generate(req: GenerateRequest): Promise<GenerateResult>;

  /** Ortak akis: prompt yaz -> uret -> kota kontrolu -> sonucu bekle -> indir -> dogrula */
  protected async runSiteFlow(
    req: GenerateRequest,
    minBytes: number,
  ): Promise<GenerateResult> {
    try {
      return await this.generateWithRotation(async (_acc, page) => {
        await page.goto(this.cfg.baseUrl, { waitUntil: "domcontentloaded" });

        if (req.voiceId && this.cfg.selectors?.[`voice_${req.voiceId}`]) {
          await page.click(this.selector("voicePicker"));
          await page.click(this.selector(`voice_${req.voiceId}`));
        }
        if (req.aspectRatio && this.cfg.selectors?.aspectSelect) {
          await page
            .selectOption(this.selector("aspectSelect"), req.aspectRatio)
            .catch(() => {});
        }

        await page.fill(this.selector("promptInput"), req.prompt);
        await page.click(this.selector("submitButton"));
        await page.waitForTimeout(3000);
        if (await this.detectQuota(page)) throw new QuotaError(this.id);

        const timeout = this.cfg.timeouts?.generateMs ?? 300_000;
        await page.waitForSelector(this.selector("resultItem"), { timeout });
        if (await this.detectQuota(page)) throw new QuotaError(this.id);

        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout }),
          page.click(this.selector("downloadButton")),
        ]);
        fs.mkdirSync(path.dirname(req.outputPath), { recursive: true });
        req.signal?.throwIfAborted();
        await download.saveAs(req.outputPath);
        req.signal?.throwIfAborted();

        // Dogrulama: sifir bayt / bozuk dosya kabul edilmez (Kural 1.4)
        const stat = fs.statSync(req.outputPath);
        if (stat.size < minBytes) {
          return {
            ok: false as const,
            error: `Indirilen dosya gecersiz (${stat.size} bayt)`,
          };
        }
        return {
          ok: true as const,
          filePath: req.outputPath,
          meta: { bytes: stat.size },
        };
      }, req.signal);
    } catch (err) {
      if (req.signal?.aborted) throw err;
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
