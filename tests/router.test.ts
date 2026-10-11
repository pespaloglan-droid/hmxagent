import fs from "node:fs";
import path from "node:path";
import type { T } from "./run.js";

export async function run(t: T) {
  const { MediaRouter } = await import("@hmx/router");

  const mockFail = { id: "flow-ai", kind: "video" as const, authMode: "browser-session" as const,
    isAvailable: async () => true, generate: async () => ({ ok: false as const, error: "mock hata" }) };
  const mockOk = { id: "mock-backup", kind: "video" as const, authMode: "api-key" as const,
    isAvailable: async () => true, generate: async (req: any) => {
      fs.writeFileSync(req.outputPath, Buffer.alloc(50_000));
      return { ok: true as const, filePath: req.outputPath, meta: { bytes: 50_000 } };
    } };

  const router = new MediaRouter();
  (router as any).providers = [mockFail, mockOk];

  // fallback: env override ile zincir sabitlenir, basarisiz -> yedek
  process.env.HMX_ORDER_VIDEO = "flow-ai,mock-backup";
  const r = await router.generate("video", { prompt: "x", outputPath: path.join(process.env.HMX_HOME!, "fb.mp4") });
  t("router: basarisiz saglayicidan yedek saglayiciya dusur", r.ok && r.provider === "mock-backup");

  // circuit breaker: 2 ust uste hata -> devre disi
  process.env.HMX_ORDER_VIDEO = "flow-ai";
  await router.generate("video", { prompt: "x", outputPath: "/tmp/a.mp4" });
  const r2 = await router.generate("video", { prompt: "x", outputPath: "/tmp/a.mp4" });
  t("router: circuit breaker devrede", r2.error!.includes("devre disi"));
  delete process.env.HMX_ORDER_VIDEO;

  // preferred: tercih edilen saglayici zincirin basina gelir
  const r3 = await router.generate("video", { prompt: "x", outputPath: path.join(process.env.HMX_HOME!, "pref.mp4") }, "mock-backup");
  t("router: preferred saglayici once denenir", r3.ok && r3.provider === "mock-backup");
}
