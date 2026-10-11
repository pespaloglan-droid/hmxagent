import type { T } from "./run.js";

export async function run(t: T) {
  const { CircuitBreaker } = await import("@hmx/router");

  const cb = new CircuitBreaker(2, 50); // test icin 50ms cooldown
  t("circuit: baslangicta kapali", !cb.isOpen("p1"));
  cb.recordFailure("p1");
  t("circuit: tek hata devreyi acmaz", !cb.isOpen("p1"));
  cb.recordFailure("p1");
  t("circuit: 2 ardisik hata devreyi acar", cb.isOpen("p1"));
  await new Promise((r) => setTimeout(r, 60));
  t("circuit: cooldown sonrasi kapanir", !cb.isOpen("p1"));
  cb.recordFailure("p2");
  cb.recordSuccess("p2");
  cb.recordFailure("p2");
  t("circuit: basari sayaci sifirlar", !cb.isOpen("p2"));
}
