import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { T } from "./run.js";

/**
 * Windows dayanikliligi (Bolum 12 FAZ 8): kullanici dili Turkce, sistem yereli
 * Rusca — dosya yollari Turkce/Kiril karakterlerle sorunsuz calismali.
 */
export async function run(t: T) {
  const { AccountPool } = await import("@hmx/providers");
  const { writeJson, readJson } = await import("@hmx/core");

  // 1) Turkce karakterli yol: ş, ı, ğ, İ
  const trDir = fs.mkdtempSync(path.join(os.tmpdir(), "hmx-şığü-İ-"));
  const pool = new AccountPool(path.join(trDir, "accounts"));
  const acc = pool.add({ providerId: "test-tr", label: "Kullanıcı ğüş", apiKey: "k" });
  t("i18n: Turkce yolda hesap kaydi", pool.pickNext("test-tr")?.id === acc.id);

  // 2) Kiril karakterli yol: Пользователь
  const ruDir = path.join(trDir, "Пользователь", "veri");
  fs.mkdirSync(ruDir, { recursive: true });
  const f = path.join(ruDir, "ayarlar.json");
  writeJson(f, { tema: "koyu", dizin: "Çalışma" });
  const back = readJson<any>(f);
  t("i18n: Kiril yolda JSON oku/yaz", back?.tema === "koyu" && back?.dizin === "Çalışma");

  // 3) Kiril + Turkce icerikli prompt rotasi bozulmaz (virgul = saglayici ayiraci oldugundan kullanilmaz)
  const { parsePromptRoute } = await import("@hmx/router");
  const known = [{ id: "flow-ai", kind: "video" as const }];
  const r = parsePromptRoute("@video:Flow AI dağ manzarası çiz Пользователь için", {}, known);
  t("i18n: unicode prompt rotasi", r.cleanPrompt.includes("dağ") && r.cleanPrompt.includes("Пользователь") && r.directives.video?.[0] === "flow-ai" && r.unknown.length === 0);
}
