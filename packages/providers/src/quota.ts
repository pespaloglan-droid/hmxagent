/**
 * Kota algilama (Bolum 2.2): saglayici config'indeki quotaIndicators metinleri
 * hata mesajinda veya sayfa govdesinde gorunurse kota dolmus sayilir.
 */
export const DEFAULT_QUOTA_INDICATORS = [
  "quota exceeded",
  "kota doldu",
  "rate limit",
  "usage limit reached",
  "too many requests",
  "429",
];

export class QuotaError extends Error {
  constructor(public providerId: string) {
    super(`${providerId}: kota doldu (baska hesap denenecek)`);
    this.name = "QuotaError";
  }
}

/** Hata metni veya sayfa metni kota gostergelerinden birini iceriyor mu? */
export function isQuotaError(errOrText: unknown, indicators: string[] = DEFAULT_QUOTA_INDICATORS): boolean {
  const text = (errOrText instanceof Error ? errOrText.message : String(errOrText)).toLowerCase();
  return indicators.some((i) => text.includes(i.toLowerCase()));
}
