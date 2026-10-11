// Based on opencode-dev/packages/desktop (MIT) — main process deseni:
// tek ornek kilidi, sunucu spawn, koyu tema pencere, tray, temiz kapanis.
// Startup safety layer: her baslatma hatasi loglanir, recovery penceresi sunulur.
import { app, BrowserWindow, Tray, Menu, nativeImage, shell, dialog } from "electron";
import contextMenu from "electron-context-menu";
import log from "electron-log/main";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { spawnDashboardServer, waitForServer, type ServerHandle } from "./spawn-server";

const HMX_HOME = process.env.HMX_HOME ?? path.join(os.homedir(), ".hmx");
const CRASH_DIR = path.join(HMX_HOME, "logs");

log.initialize();
log.transports.file.resolvePathFn = () => path.join(CRASH_DIR, "desktop.log");

// Crash'ler sessiz kalmaz: hepsi loglanir (startup.log + desktop.log)
process.on("uncaughtException", (e) => {
  log.error("UNCAUGHT", e);
  writeCrashLog("uncaughtException", e);
});
process.on("unhandledRejection", (e) => {
  log.error("UNHANDLED_REJECTION", e);
  writeCrashLog("unhandledRejection", e);
});

function writeCrashLog(kind: string, err: unknown) {
  try {
    fs.mkdirSync(CRASH_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(CRASH_DIR, "crash.log"),
      `[${new Date().toISOString()}] ${kind}: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
    );
  } catch { /* log dizini de yazilamiyorsa yapacak bir sey yok */ }
}

contextMenu({ showLookUpSelection: false, showCopyImage: true });

// 1. Tek ornek kilidi
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

let win: BrowserWindow | null = null;
let server: ServerHandle | null = null;
let tray: Tray | null = null;
let quitting = false;

function firstRun(): boolean {
  return !fs.existsSync(path.join(HMX_HOME, "settings.json"));
}

/** Startup recovery: corrupt state suphelileri kenara tasir */
function recoverState() {
  try {
    const backup = path.join(HMX_HOME, `backup-${Date.now()}`);
    for (const f of ["settings.json", "agents.json"]) {
      const src = path.join(HMX_HOME, f);
      if (fs.existsSync(src)) {
        fs.mkdirSync(backup, { recursive: true });
        fs.renameSync(src, path.join(backup, f));
      }
    }
    log.info("state yedegi:", backup);
  } catch (e) {
    log.error("recovery yedegi alinamadi:", e);
  }
}

function showRecoveryWindow(err: unknown) {
  const rec = new BrowserWindow({
    width: 640, height: 420, title: "HMX Agent — Kurtarma",
    backgroundColor: "#0d0a1a",
    webPreferences: { nodeIntegration: false },
  });
  const detail = String(err instanceof Error ? err.message : err).replace(/</g, "&lt;");
  rec.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <body style="background:#0d0a1a;color:#e8e6f5;font-family:Segoe UI,sans-serif;padding:40px">
      <h2>HMX Agent baslatilamadi</h2>
      <p style="color:#8b86ad">Hata: ${detail}</p>
      <p style="color:#8b86ad">Crash logu: ${CRASH_DIR.replace(/\\/g, "\\\\")}\\crash.log</p>
      <p>Bozuk ayar dosyalari kenara tasinip uygulama temiz baslatilabilir.</p>
    </body>`)}`);
  const choice = dialog.showMessageBoxSync(rec, {
    type: "error",
    title: "HMX Agent",
    message: "Baslatma hatasi",
    detail: "Ayarlar yedeklenip temiz baslatilsin mi (recovery mode)?",
    buttons: ["Temiz baslat (recovery)", "Kapat"],
    defaultId: 0,
  });
  rec.close();
  if (choice === 0) {
    recoverState();
    app.relaunch();
  }
  app.quit();
}

async function createWindow() {
  // 2. Dashboard sunucusunu child process olarak baslat
  const serverScript = path.join(__dirname, "../server.cjs");
  const resourcesPath = process.resourcesPath ?? path.join(__dirname, "../..");
  server = await spawnDashboardServer(serverScript, resourcesPath);
  await waitForServer(server.port);
  log.info(`dashboard hazir: http://127.0.0.1:${server.port}`);

  // 3. Ana pencere: 1440x900, koyu tema
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "HMX Agent",
    backgroundColor: "#0d0a1a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.once("ready-to-show", () => win?.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Renderer crash'ini yakala (bos/beyaz ekran yerine logla + recovery)
  win.webContents.on("render-process-gone", (_e, details) => {
    log.error("render-process-gone:", details);
    writeCrashLog("render-process-gone", details);
    dialog.showErrorBox("HMX Agent", "Arayuz coktu. Uygulama yeniden baslatiliyor.");
    app.relaunch();
    app.quit();
  });

  // Ilk acilista kurulum sihirbazi
  await win.loadURL(`http://127.0.0.1:${server.port}/${firstRun() ? "#/wizard" : ""}`);

  win.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      win?.hide(); // tray'e kucul
    }
  });
  win.on("closed", () => { win = null; });

  // 6. Sistem tepsisi
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("HMX Agent");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Paneli Ac", click: () => { win?.show(); win?.focus(); } },
    { type: "separator" },
    { label: "Cikis", click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on("click", () => { win?.show(); win?.focus(); });
}

app.whenReady().then(async () => {
  log.info("startup begin", { version: app.getVersion(), platform: process.platform });
  try {
    await createWindow();
  } catch (e) {
    log.error("startup failed:", e);
    writeCrashLog("startup", e);
    showRecoveryWindow(e);
  }
});

// 5. Kapanista child process'i temiz oldur
app.on("before-quit", () => { quitting = true; server?.stop(); });
app.on("window-all-closed", () => { /* tray'de yasamaya devam et */ });
