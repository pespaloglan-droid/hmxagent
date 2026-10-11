import type { T } from "./run.js";

export async function run(t: T) {
  const { shouldRequireApproval, classifyMessageRisk } = await import("@hmx/agent-core");

  // Policy matrisi (9 kombinasyon)
  t("approval: safe hicbir modda onay istemez",
    !shouldRequireApproval("safe", "strict") && !shouldRequireApproval("safe", "balanced") && !shouldRequireApproval("safe", "fast"));
  t("approval: strict moderate'de sorar", shouldRequireApproval("moderate", "strict"));
  t("approval: balanced/fast moderate'de sormaz",
    !shouldRequireApproval("moderate", "balanced") && !shouldRequireApproval("moderate", "fast"));
  t("approval: destructive her modda sorar",
    shouldRequireApproval("destructive", "strict") && shouldRequireApproval("destructive", "balanced") && shouldRequireApproval("destructive", "fast"));

  // Risk siniflandirma
  t("risk: 'selam' safe", classifyMessageRisk("selam, nasilsin?") === "safe");
  t("risk: 'video uret' moderate", classifyMessageRisk("bana bir intro videosu üret") === "moderate");
  t("risk: 'dosyayi sil' destructive", classifyMessageRisk("gecici dosyalari sil") === "destructive");
}
