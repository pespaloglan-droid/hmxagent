import net from "node:net";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

/** Bos port bulur (4173'ten baslar). Port her zaman number olarak akar. */
export async function findFreePort(start = 4173): Promise<number> {
  for (let p = start; p < start + 50; p++) {
    const ok = await new Promise<boolean>((res) => {
      const s = net.createServer()
        .once("error", () => res(false))
        .once("listening", () => s.close(() => res(true)))
        .listen(p, "127.0.0.1");
    });
    if (ok) return p;
  }
  throw new Error("Bos port bulunamadi (4173-4222)");
}

export type ServerHandle = { proc: ChildProcess; port: number; stop: () => void };

/**
 * Dashboard sunucusunu child process olarak baslatir.
 * Electron ikilisi ELECTRON_RUN_AS_NODE=1 ile saf Node gibi calistirilir;
 * boylece ayri bir Node kurulumu gerekmez.
 */
export async function spawnDashboardServer(serverScript: string, resourcesPath: string): Promise<ServerHandle> {
  const port = await findFreePort(4173);
  const proc = spawn(process.execPath, [serverScript, String(port)], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HMX_WEB_DIST: path.join(resourcesPath, "web-dist"),
      HMX_CONFIG_DIR: path.join(resourcesPath, "config", "providers"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    proc,
    port,
    stop: () => {
      // Windows'ta agac halinde oldur (taskkill /T), POSIX'te SIGTERM yeterli
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        proc.kill("SIGTERM");
      }
    },
  };
}

/** Sunucu hazir olana kadar bekler (/api/health yanit verene dek) */
export async function waitForServer(port: number, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) return;
    } catch { /* henuz hazir degil */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Dashboard sunucusu ${timeoutMs / 1000} sn icinde acilmadi (:${port})`);
}
