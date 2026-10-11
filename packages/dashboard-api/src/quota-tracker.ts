import { AccountPool } from "@hmx/providers";
import { tokenSaverStats } from "@hmx/router";
import type { MediaRouter } from "@hmx/router";

/**
 * Kota takibi panel verisi (Bolum 6.3): hesap havuzundaki her hesabin
 * cooldown/failCount/lastUsedAt durumu + token-saver istatistikleri
 * /api/routing ve /api/health uclarindan panele akar.
 */
export function quotaSnapshot(router: MediaRouter) {
  const pool = new AccountPool();
  const now = Date.now();
  return {
    accounts: pool.listAll().map((a) => ({
      id: a.id,
      provider: a.providerId,
      label: a.label,
      status: a.status,
      failCount: a.failCount,
      cooldownRemainingMs: a.cooldownUntil ? Math.max(0, a.cooldownUntil - now) : 0,
      lastUsedAt: a.lastUsedAt ?? null,
      notes: a.notes ?? null,
    })),
    circuits: router.circuitSnapshot(),
    tokenSaver: tokenSaverStats.snapshot(),
  };
}
