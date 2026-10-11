import type { T } from "./run.js";

export async function run(t: T) {
  const { compressToolResult, tokenSaverStats } = await import("@hmx/router");

  // 1) Sentetik tekrarli log -> en az %20 sikistirma (Bolum 6.1 / FAZ 3 kabul kriteri)
  const noisy = Array.from({ length: 200 }, (_, i) =>
    i % 3 === 0 ? "GET /api/data 200 OK" : `satir ${i} detay ${"x".repeat(40)}`).join("\n");
  const r = compressToolResult(noisy);
  t("token-saver: tekrarli log >= %20 sikisir", r.savedRatio >= 0.2, `(%${(r.savedRatio * 100).toFixed(0)})`);

  // 2) Tekrarlayan satirlar tekillestirilir
  const dup = Array.from({ length: 60 }, () => "ayni hata satiri").join("\n");
  const r2 = compressToolResult(dup);
  t("token-saver: tekrarlar isaretlenir", r2.text.includes("similar lines omitted"));

  // 3) JSON compact + derinlik budama
  const deep = JSON.stringify(JSON.parse("{\"a\":{\"b\":{\"c\":{\"d\":{\"e\":{\"f\":{\"g\":{\"h\":1}}}}}}}}"), null, 2);
  const r3 = compressToolResult(deep);
  t("token-saver: JSON budanir ve sikisir", !r3.text.includes("\n") && r3.text.includes("{...}"));

  // 4) Istatistik panele akar
  t("token-saver: istatistik toplanir", tokenSaverStats.snapshot().compressedCount >= 3);
}
