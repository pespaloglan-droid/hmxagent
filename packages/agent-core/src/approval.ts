/**
 * Approval Policy katmani (root-cause fix): onay karari UI'dan cikarilip
 * tek bir policy fonksiyonuna toplandi.
 *
 * Risk seviyeleri:
 *  - safe: okuma, sohbet, analiz — HICBIR modda onay istemez
 *  - moderate: dis etkisi olmayan yazma (yeni dosya, medya uretimi)
 *  - destructive: silme, uzerine yazma, odeme, gonderme, toplu degisiklik
 */
export type RiskLevel = "safe" | "moderate" | "destructive";
export type ApprovalMode = "strict" | "balanced" | "fast";

export function shouldRequireApproval(risk: RiskLevel, mode: ApprovalMode): boolean {
  if (risk === "safe") return false;         // sohbet/okuma: hicbir modda onay yok
  if (risk === "destructive") return true;   // yikici: her modda sor
  return mode === "strict";                  // moderate: sadece strict'te sor
}

const TASK_MARKERS = [
  "oluştur", "olustur", "üret", "uret", "yap", "kur", "yükle", "yukle",
  "değiştir", "degistir", "düzenle", "duzenle", "güncelle", "guncelle",
  "çiz", "ciz", "hazırla", "hazirla", "derle", "build", "generate", "create",
];

const DESTRUCTIVE_MARKERS = [
  "sil", "delete", "remove", "kaldır", "kaldir", "sıfırla", "sifirla", "reset",
  "üzerine yaz", "overwrite", "deploy", "öde", "ode", "pay", "gönder", "gonder", "send",
];

/**
 * Mesajin risk seviyesini siniflandirir.
 * Kural: sohbet/soru = safe (direkt cevap), gorev = moderate, yikici = destructive.
 * Eslesme KELIME bazlidir — substring degil ("nasilsin" icindeki "sil" tetiklemez).
 */
export function classifyMessageRisk(message: string): RiskLevel {
  const m = message.toLowerCase();
  const words = new Set(m.split(/[^a-zçğıiöşü]+/).filter(Boolean));
  const has = (marker: string) =>
    marker.includes(" ") ? m.includes(marker) : words.has(marker);
  if (DESTRUCTIVE_MARKERS.some(has)) return "destructive";
  if (TASK_MARKERS.some(has)) return "moderate";
  return "safe";
}
