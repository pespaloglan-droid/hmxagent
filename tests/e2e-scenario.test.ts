import type { T } from "./run.js";

/**
 * Uctan uca senaryo (ag olmadan, sahte saglayici ile):
 * config ekle -> registry yukle -> hesap ekle -> kota rotasyonu -> temizlik.
 */
export async function run(t: T) {
  const { saveProviderConfig, loadProviderConfigs, deleteProviderConfig, AccountPool } = await import("@hmx/providers");

  // 1) Panelden site ekleme akisi: config yaz -> yukle -> sil
  saveProviderConfig({
    id: "e2e-site", kind: "image", authMode: "api-key",
    baseUrl: "https://example.invalid", endpoint: "https://example.invalid/api",
    tier: "cheap", quotaIndicators: ["e2e-kota-doldu"],
  });
  const loaded = loadProviderConfigs().find((c) => c.id === "e2e-site");
  t("e2e: yazilan config yuklenir", loaded?.tier === "cheap" && loaded.quotaIndicators?.[0] === "e2e-kota-doldu");
  deleteProviderConfig("e2e-site");
  t("e2e: silinen config listeden duser", !loadProviderConfigs().some((c) => c.id === "e2e-site"));

  // 2) Coklu hesap + kota rotasyonu akisi (kabul kriteri 4)
  const pool = new AccountPool();
  const h1 = pool.add({ providerId: "e2e-prov", label: "Hesap 1", apiKey: "k1" });
  const h2 = pool.add({ providerId: "e2e-prov", label: "Hesap 2", apiKey: "k2" });
  const h3 = pool.add({ providerId: "e2e-prov", label: "Hesap 3", apiKey: "k3" });
  pool.reportSuccess(h1);
  pool.reportFailure(h2, true, "e2e-kota-doldu"); // kota -> cooldown
  const picked = pool.pickNext("e2e-prov");
  t("e2e: kota dolan hesap atlanir", picked?.id === h3.id || picked?.id === h1.id && picked?.id !== h2.id);
  const h2after = pool.list("e2e-prov").find((x) => x.id === h2.id)!;
  t("e2e: cooldown rozeti verisi hazir", h2after.status === "cooldown" && (h2after.cooldownUntil ?? 0) > Date.now());

  // 3) Temizlik
  t("e2e: hesap silme", pool.remove("e2e-prov", h1.id) && pool.remove("e2e-prov", h2.id) && pool.remove("e2e-prov", h3.id));
}
