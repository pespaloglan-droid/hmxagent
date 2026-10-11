import { LlmClient, type ChatMessage } from "@hmx/core";
import { TaskLedger } from "./ledger.js";
import { HMX_SYSTEM_PROMPT } from "./prompt.js";

/**
 * Genel tarayici ajan (Bolum 4) — "browser_task" araci.
 * Kullanicinin kendi Chrome profiliyle (kopya uzerinden) sitelere girip
 * dogal dil gorevleri icra eder:
 *
 *  1. Sayfa durumu (gorunur etkilesimli ogeler + metin) modele verilir.
 *  2. Model tek bir JSON eylem uretir: click/type/navigate/extract/done.
 *  3. Her eylemden sonra sayfa durumu dogrulanir (Kural 1.4).
 *  4. Yikici eylemler (silme/odeme/gonderme) icin kullanici onayi ZORUNLU.
 *  5. Adim limiti (varsayilan 30) + ayni eylem 2 kez basarisizsa dur (Kural 1.5).
 *
 * Test edilebilirlik: tarayici ve LLM enjekte edilebilir (deps).
 */

export type BrowserAction =
  | { action: "click"; selector: string; reason?: string }
  | { action: "type"; selector: string; text: string; reason?: string }
  | { action: "navigate"; url: string; reason?: string }
  | { action: "extract"; selector?: string; reason?: string }
  | { action: "done"; summary: string };

/** Playwright Page'in kullandigimiz alt kumesi (sahte sayfayla test edilebilir) */
export interface PageLike {
  goto(url: string, opts?: unknown): Promise<unknown>;
  click(selector: string): Promise<unknown>;
  fill(selector: string, text: string): Promise<unknown>;
  textContent(selector: string): Promise<string | null>;
  url(): string;
  evaluate(fn: unknown, arg?: unknown): Promise<unknown>;
  waitForTimeout(ms: number): Promise<unknown>;
}

export type BrowserTaskOptions = {
  url: string;                 // hedef site
  task: string;                // dogal dil gorev: "son videonun basligini degistir"
  maxSteps?: number;           // varsayilan 30
  /** Yikici eylem onayi; verilmezse yikici eylem gorevi DURDURUR (reddetmez) */
  confirm?: (question: string) => Promise<boolean>;
};

export type BrowserTaskDeps = {
  llm?: LlmClient;
  openPage?: (url: string) => Promise<PageLike>;   // gercek Chrome (varsayilan) veya sahte
  /** Sayfa metnini modele vermeden once sikistir (token-saver, Bolum 6.1) */
  compress?: (raw: string) => { text: string };
};

export type BrowserTaskResult = {
  ok: boolean;
  summary: string;
  steps: number;
  ledgerFile: string;
  error?: string;
};

// ---------- saf fonksiyonlar (testsiz tarayici gerektirmez) ----------

/** Model cevabindaki ilk JSON blogunu BrowserAction'a cevirir */
export function parseModelAction(reply: string): BrowserAction | null {
  const m = reply.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]);
    if (typeof parsed.action !== "string") return null;
    switch (parsed.action) {
      case "click":
        return typeof parsed.selector === "string" ? { action: "click", selector: parsed.selector, reason: parsed.reason } : null;
      case "type":
        return typeof parsed.selector === "string" && typeof parsed.text === "string"
          ? { action: "type", selector: parsed.selector, text: parsed.text, reason: parsed.reason } : null;
      case "navigate":
        return typeof parsed.url === "string" ? { action: "navigate", url: parsed.url, reason: parsed.reason } : null;
      case "extract":
        return { action: "extract", selector: parsed.selector, reason: parsed.reason };
      case "done":
        return { action: "done", summary: String(parsed.summary ?? "") };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

const DESTRUCTIVE_KEYWORDS = [
  "delete", "remove", "sil", "kaldır", "kaldir",
  "pay", "payment", "öde", "ode", "purchase", "satın al", "satin al", "checkout",
  "send", "gönder", "gonder", "publish", "yayınla", "yayinla", "confirm order", "sipariş", "siparis",
];

/** Eylem yikici mi? (selector + metin + gerekce anahtar kelimelere karsi taranir) */
export function isDestructive(action: BrowserAction): boolean {
  if (action.action === "done" || action.action === "extract" || action.action === "navigate") return false;
  const haystack = [action.selector, "reason" in action ? action.reason : "", action.action === "type" ? action.text : ""]
    .filter(Boolean).join(" ").toLowerCase();
  return DESTRUCTIVE_KEYWORDS.some((k) => haystack.includes(k));
}

/** Ayni eylem imzasi (tekrar tespiti icin) */
export function actionSignature(action: BrowserAction): string {
  return JSON.stringify(action);
}

/** Sayfadaki etkilesimli ogeleri + kisa metni cikarir (gorunurluk agacinin hafif hali) */
export async function snapshotPage(page: PageLike): Promise<string> {
  const state = await page.evaluate(`(() => {
    const els = [...document.querySelectorAll("a, button, input, textarea, select, [role=button], [contenteditable]")];
    const items = els.slice(0, 60).map((el, i) => {
      const tag = el.tagName.toLowerCase();
      const text = (el.innerText || el.value || el.placeholder || el.getAttribute("aria-label") || "").trim().slice(0, 80);
      const id = el.id ? "#" + el.id : "";
      const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "";
      return "[" + i + "] " + tag + id + cls + " :: " + text;
    });
    return {
      url: location.href,
      title: document.title,
      elements: items,
      bodyText: (document.body?.innerText || "").slice(0, 3000),
    };
  })()`) as { url: string; title: string; elements: string[]; bodyText: string };
  return [
    `URL: ${state.url}`,
    `TITLE: ${state.title}`,
    "ELEMENTS:",
    ...state.elements,
    "VISIBLE TEXT (first 3000 chars):",
    state.bodyText,
  ].join("\n");
}

const ACTION_PROMPT = `Sayfa durumu asagida. Goreve dogru TEK bir sonraki eylemi JSON olarak yaz (baska hicbir sey yazma):
{"action":"click","selector":"...","reason":"..."}
{"action":"type","selector":"...","text":"...","reason":"..."}
{"action":"navigate","url":"...","reason":"..."}
{"action":"extract","selector":"...","reason":"..."}   (icerik okumak icin)
{"action":"done","summary":"gorev tamamlandi cunku..."}  (gorev BITTIGINDE)
Kurallar: listedeki ogelerin selector'unu kullan; emin olmadigin selector uydurma; gorev bitmeden "done" deme.`;

// ---------- ana dongu ----------

export async function runBrowserTask(opts: BrowserTaskOptions, deps: BrowserTaskDeps = {}): Promise<BrowserTaskResult> {
  const maxSteps = opts.maxSteps ?? 30;
  const llm = deps.llm ?? LlmClient.fromEnv();
  const ledger = new TaskLedger();
  ledger.log("goal", `browser_task: ${opts.task} @ ${opts.url}`);

  const openPage = deps.openPage ?? defaultOpenPage;
  let page: PageLike;
  try {
    page = await openPage(opts.url);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    ledger.log("error", `sayfa acilamadi: ${error}`);
    return { ok: false, summary: "", steps: 0, ledgerFile: ledger.getFile(), error };
  }

  const history: ChatMessage[] = [{ role: "system", content: HMX_SYSTEM_PROMPT }];
  const failedActions = new Map<string, number>();
  let extracted: string[] = [];

  for (let step = 1; step <= maxSteps; step++) {
    // Kural 1.2: her 5 adimda bir hedef hatirlatma
    if (ledger.shouldReinjectGoal()) {
      history.push({ role: "system", content: `[HEDEF HATIRLATMA] Gorevin: ${opts.task}. Su anki adim buna hizmet ediyor mu?` });
    }

    // 1) Sayfa durumu -> (token-saver) -> model
    let state: string;
    try {
      state = await snapshotPage(page);
    } catch (e) {
      ledger.log("error", `sayfa durumu okunamadi: ${e}`);
      return { ok: false, summary: "", steps: step, ledgerFile: ledger.getFile(), error: String(e) };
    }
    if (deps.compress) state = deps.compress(state).text;

    history.push({ role: "user", content: `${ACTION_PROMPT}\n\nGOREV: ${opts.task}\n\n${state}` });
    let reply: string;
    try {
      reply = await llm.chat(history);
    } catch (e) {
      ledger.log("error", `LLM hatasi: ${e}`);
      return { ok: false, summary: "", steps: step, ledgerFile: ledger.getFile(), error: `LLM: ${e}` };
    }
    history.push({ role: "assistant", content: reply });

    // 2) Eylemi ayristir
    const action = parseModelAction(reply);
    if (!action) {
      ledger.log("error", `model eylem uretmedi: ${reply.slice(0, 200)}`);
      history.push({ role: "user", content: "Cevabin gecerli bir JSON eylemi degildi. Sadece tek bir JSON eylem blogu yaz." });
      continue;
    }

    if (action.action === "done") {
      ledger.log("deliver", action.summary);
      return { ok: true, summary: action.summary, steps: step, ledgerFile: ledger.getFile() };
    }

    // 3) Yikici eylem kapisi (Kural: onay zorunlu)
    if (isDestructive(action)) {
      ledger.log("note", `yikici eylem tespit edildi: ${actionSignature(action)}`);
      if (!opts.confirm) {
        const error = "Yikici eylem icin onay mekanizmasi yok; guvenlik icin durduruldu.";
        ledger.log("error", error);
        return { ok: false, summary: "", steps: step, ledgerFile: ledger.getFile(), error };
      }
      const approved = await opts.confirm(`Yikici eylemi onayliyor musun?\n${actionSignature(action)}\n(e/h) `);
      if (!approved) {
        const error = "Kullanici yikici eylemi reddetti.";
        ledger.log("note", error);
        return { ok: false, summary: "", steps: step, ledgerFile: ledger.getFile(), error };
      }
    }

    // 4) Kural 1.5: ayni eylem 2 kez basarisizsa dur
    const sig = actionSignature(action);
    if ((failedActions.get(sig) ?? 0) >= 2) {
      const error = `Ayni eylem 2+ kez basarisiz oldu: ${sig}. Strateji degistirilmeli.`;
      ledger.log("error", error);
      return { ok: false, summary: "", steps: step, ledgerFile: ledger.getFile(), error };
    }

    // 5) Icra + dogrulama (Kural 1.4)
    const urlBefore = page.url();
    ledger.log("action", `${action.action} ${actionSignature(action).slice(0, 150)}`);
    try {
      if (action.action === "click") await page.click(action.selector);
      else if (action.action === "type") await page.fill(action.selector, action.text);
      else if (action.action === "navigate") await page.goto(action.url);
      else if (action.action === "extract") {
        const text = await page.textContent(action.selector ?? "body");
        extracted.push((text ?? "").slice(0, 2000));
      }
      await page.waitForTimeout(1000);
    } catch (e) {
      failedActions.set(sig, (failedActions.get(sig) ?? 0) + 1);
      const msg = e instanceof Error ? e.message : String(e);
      ledger.log("error", `eylem basarisiz (${failedActions.get(sig)}/2): ${msg}`);
      history.push({ role: "user", content: `Eylem basarisiz oldu: ${msg}. Farkli bir selector veya yaklasim dene.` });
      continue;
    }

    // Dogrulama kaniti: url degisimi veya icra hatasiz tamamlandi
    const urlAfter = page.url();
    ledger.log("verify", urlAfter !== urlBefore ? `url degisti: ${urlAfter}` : "eylem hatasiz tamamlandi");
    failedActions.delete(sig);
  }

  const error = `Adim limiti asildi (${maxSteps}). Gorev tamamlanamadi.`;
  ledger.log("error", error);
  return {
    ok: false,
    summary: extracted.join("\n"),
    steps: maxSteps,
    ledgerFile: ledger.getFile(),
    error,
  };
}

/** Varsayilan: kullanicinin gercek Chrome'u (Bolum 3.2). "browser-task" havuzundan hesap secer. */
async function defaultOpenPage(url: string): Promise<PageLike> {
  const { AccountPool, launchRealChrome, connectChrome } = await import("@hmx/providers");
  const pool = new AccountPool();
  const acc = pool.pickNext("browser-task") ?? pool.listAll().find((a) => a.profileDirectory) ?? null;
  if (!acc?.profileDirectory) {
    throw new Error("Havuzda Chrome profilli hesap yok. Once: hmx login <saglayici> ile bir hesap ekleyin.");
  }
  const { proc, port } = await launchRealChrome({ url, profileDir: acc.profileDirectory });
  const { browser, context } = await connectChrome(port);
  const page = context.pages()[0] ?? (await context.newPage());
  // Tarayici, gorev nesnesiyle birlikte yasasin diye sayfaya kapatma kancasi eklenir
  const raw = page as unknown as PageLike & { __cleanup?: () => Promise<void> };
  raw.__cleanup = async () => { await browser.close().catch(() => {}); proc.kill("SIGTERM"); };
  return raw;
}
