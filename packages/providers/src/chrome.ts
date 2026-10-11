import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { paths } from "@hmx/core";

/**
 * Gercek Chrome entegrasyonu (Bolum 3.2).
 *
 * Neden boyle: Google, Playwright'in bundled Chromium'unu "guvensiz tarayici"
 * diye reddeder; ayrica Chrome 136+ VARSAYILAN "User Data" dizini kullanilirken
 * --remote-debugging-port bayragini tamamen yok sayar.
 *
 * Cozum: Gercek chrome.exe calistirilir ama HMX'e ozel izole bir user-data-dir
 * ile (HMX_CHROME_DATA). Kullanicinin sectigi Chrome profili bu dizine
 * kopyalanir -> debug portu acilir, Google girisi calisir, kullanicinin
 * acik Chrome pencerelerini kapatmasi gerekmez.
 *
 * Port: --remote-debugging-port=0 (bos port secilir) ve DevToolsActivePort
 * dosyasindan okunur — elle port secmek ve "port dolu" hatasi boylece biter.
 */

export type ChromeProfile = { dir: string; name: string; email?: string };

/** HMX'in izole Chrome veri dizini (debug portunun calismasinin sarti) */
export const HMX_CHROME_DATA = paths.chromeData;

export function findChromeExe(): string | null {
  const candidates: string[] = [];
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA ?? "";
    candidates.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      path.join(local, "Google\\Chrome\\Application\\chrome.exe"),
    );
  } else if (process.platform === "darwin") {
    candidates.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  } else {
    candidates.push("/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium");
  }
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

/** Kullanicinin gercek Chrome User Data dizini (profil listelemek icin) */
export function chromeUserDataDir(): string {
  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "User Data");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
  }
  return path.join(os.homedir(), ".config", "google-chrome");
}

/** Chrome'un Local State dosyasindan profilleri okur (isim + e-posta ile) */
export function listChromeProfiles(userDataDir = chromeUserDataDir()): ChromeProfile[] {
  const localState = path.join(userDataDir, "Local State");
  const out: ChromeProfile[] = [];
  try {
    const raw = JSON.parse(fs.readFileSync(localState, "utf8"));
    const cache = raw?.profile?.info_cache ?? {};
    for (const [dir, info] of Object.entries<any>(cache)) {
      out.push({ dir, name: info.name ?? dir, email: info.user_name || undefined });
    }
  } catch {
    if (fs.existsSync(userDataDir)) {
      for (const d of fs.readdirSync(userDataDir)) {
        if (d === "Default" || /^Profile \d+$/.test(d)) out.push({ dir: d, name: d });
      }
    }
  }
  return out;
}

/**
 * Secilen profili HMX'in izole dizinine kopyalar (bir kez).
 * Mevcut oturum cerezleri de tasindigi icin cogu zaman yeniden giris bile gerekmez.
 * Zaten kopyalanmissa atlar; guncellemek icin force=true.
 */
export function ensureProfileCopy(profileDir: string, force = false): void {
  const srcRoot = chromeUserDataDir();
  const srcProfile = path.join(srcRoot, profileDir);
  const dstProfile = path.join(HMX_CHROME_DATA, profileDir);

  fs.mkdirSync(HMX_CHROME_DATA, { recursive: true });

  if (fs.existsSync(dstProfile) && !force) return; // zaten kopyali

  if (!fs.existsSync(srcProfile)) {
    // Profil ana Chrome'da yoksa sifirdan olusturulacak; bos dizin birak
    fs.mkdirSync(dstProfile, { recursive: true });
    return;
  }

  console.log(`Profil kopyalaniyor: ${profileDir} (boyuta gore 1-2 dk surebilir)...`);
  fs.cpSync(srcProfile, dstProfile, { recursive: true, force: true });

  // Local State: cerez sifreleme anahtarlari burada; onsuz oturumlar okunamaz
  const localState = path.join(srcRoot, "Local State");
  if (fs.existsSync(localState)) {
    fs.copyFileSync(localState, path.join(HMX_CHROME_DATA, "Local State"));
  }
  console.log("Profil kopyalandi.");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** DevToolsActivePort dosyasindan debug portunu okur (1. satir = port) */
function readDevToolsPort(userDataDir: string): number | null {
  try {
    const raw = fs.readFileSync(path.join(userDataDir, "DevToolsActivePort"), "utf8");
    const port = Number(raw.split("\n")[0].trim());
    return Number.isInteger(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

/**
 * DevToolsActivePort dosyasi gorunene kadar bekler ve portu dondurur.
 * - Varsayilan timeout: 60 sn (yavas makineler icin)
 * - Chrome erken cokerse hemen hata firlatir (bos yere beklemez)
 */
export async function waitForDebugger(
  proc: ChildProcess,
  userDataDir: string,
  timeoutMs = 60_000,
): Promise<number> {
  const start = Date.now();
  let stderr = "";
  proc.stderr?.on("data", (d) => { stderr += d.toString(); });
  while (Date.now() - start < timeoutMs) {
    const port = readDevToolsPort(userDataDir);
    if (port) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (res.ok) return port;
      } catch { /* port yazildi ama sunucu henuz cevap vermiyor */ }
    }
    if (proc.exitCode !== null) {
      throw new Error(
        `Chrome beklenmedik sekilde kapandi (debug portu hic acilmadi).\n` +
        `Son Chrome ciktisi:\n${stderr.slice(-800) || "(cikti yok)"}`,
      );
    }
    await sleep(400);
  }
  throw new Error(
    `Chrome debug portu ${timeoutMs / 1000} sn icinde acilmadi. ` +
    `Antivirus/firewall 127.0.0.1 baglantisini engelliyor olabilir.`,
  );
}

/**
 * Gercek Chrome'u HMX'in izole user-data-dir'i ile baslatir.
 * KRITIK: --user-data-dir ASLA kullanicinin ana Chrome dizini olmamalidir;
 * Chrome 136+ o durumda debug portunu yok sayar.
 * Port 0 verilir -> Chrome bos port secer, DevToolsActivePort'tan okunur.
 */
export async function launchRealChrome(opts: {
  url: string;
  profileDir?: string;
  headless?: boolean;
}): Promise<{ proc: ChildProcess; port: number }> {
  const exe = findChromeExe();
  if (!exe) throw new Error("Chrome bulunamadi. Google Chrome kurulu olmali.");

  fs.mkdirSync(HMX_CHROME_DATA, { recursive: true });

  const args = [
    "--remote-debugging-port=0",            // 0 = bos port sec; DevToolsActivePort'tan okunur
    `--user-data-dir=${HMX_CHROME_DATA}`,   // izole dizin -> debug portu calisir
    "--remote-allow-origins=*",             // Playwright WS baglantisi icin ZORUNLU
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-session-crashed-bubble",     // "sayfalari geri yukle" balonunu kapat
    "--hide-crash-restore-bubble",
    "--disable-features=ChromeWhatsNewUI",
  ];
  if (opts.profileDir) args.push(`--profile-directory=${opts.profileDir}`);
  if (opts.headless) args.push("--headless=new");
  else args.push("--start-maximized");
  args.push(opts.url);

  const proc = spawn(exe, args, { stdio: ["ignore", "ignore", "pipe"] });
  const port = await waitForDebugger(proc, HMX_CHROME_DATA);
  return { proc, port };
}

/** CDP uzerinden baglanir ve ilk browser context'i dondurur */
export async function connectChrome(port: number) {
  const { chromium } = await import("playwright");
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0] ?? (await browser.newContext());
  return { browser, context };
}
