import type { T } from "./run.js";

export async function run(t: T) {
  const { AccountPool } = await import("@hmx/providers");

  const pool = new AccountPool();

  // 1) ekleme + tek hesap secimi
  const a1 = pool.add({ providerId: "test-prov", label: "Hesap 1", apiKey: "k1" });
  t("pool: eklenen hesap secilebilir", pool.pickNext("test-prov")?.id === a1.id);

  // 2) adil dagilim: en az kullanilan (lastUsedAt en eski) once gelir
  const a2 = pool.add({ providerId: "test-prov", label: "Hesap 2", apiKey: "k2" });
  pool.reportSuccess(a2); // a2 kullanildi -> siradaki secim a1 olmali
  t("pool: en az kullanilan hesap once secilir", pool.pickNext("test-prov")?.id === a1.id);

  // 3) kota hatasi -> cooldown + secim disi
  pool.reportFailure(a1, true, "quota exceeded");
  const afterQuota = pool.list("test-prov").find((x) => x.id === a1.id)!;
  t("pool: kota hatasi cooldown'a alir (6sa)", afterQuota.status === "cooldown" && !!afterQuota.cooldownUntil && afterQuota.cooldownUntil > Date.now());
  t("pool: cooldown'daki hesap secilmez", pool.pickNext("test-prov")?.id === a2.id);

  // 4) 3 normal hata -> status error; tum hesaplar kullanilmazsa null
  const pool2 = new AccountPool();
  const b = pool2.add({ providerId: "test-fail", label: "Hata hesabi", apiKey: "k" });
  pool2.reportFailure(b, false, "boom");
  pool2.reportFailure(b, false, "boom");
  pool2.reportFailure(b, false, "boom");
  const afterFail = pool2.list("test-fail")[0]!;
  t("pool: 3 ardisik hata status=error yapar", afterFail.status === "error" && afterFail.failCount === 3);
  t("pool: kullanilabilir hesap kalmayinca null", pool2.pickNext("test-fail") === null && pool.pickNext("test-prov", new Set([a2.id])) === null);
}
