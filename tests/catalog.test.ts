import fs from "node:fs";
import path from "node:path";
import type { T } from "./run.js";

export async function run(t: T) {
  const { AssetCatalog } = await import("@hmx/media");

  const catalog = new AssetCatalog();
  const realFile = path.join(process.env.HMX_HOME!, "real.bin");
  fs.writeFileSync(realFile, Buffer.alloc(2048));
  const a1 = catalog.register({ type: "audio", provider: "mock", prompt: "p1", filePath: realFile, tags: ["t"] });
  const a2 = catalog.register({ type: "video", provider: "mock", prompt: "p2", filePath: "/yok/boyle.mp4", tags: [] });
  t("katalog: gercek dosya verified", a1.status === "verified");
  t("katalog: olmayan dosya missing", a2.status === "missing");
  t("katalog: sorgu calisiyor", catalog.query({ type: "audio" }).length === 1);
}
