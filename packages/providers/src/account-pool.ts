import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { paths, ensureDirs, readJson, writeJson, listJsonFiles } from "@hmx/core";

// Based on hermes-agent/agent/credential_pool.py (MIT) — round-robin + hata sayaci
// deseni; kota dolunca cooldown'a alma HMX'e ozel genisletmedir (Bolum 2).

export interface PooledAccount {
  id: string;               // benzersiz id (orn. "flow-ai-1")
  providerId: string;       // "flow-ai"
  label: string;            // kullanici etiketi: "Kisisel Gmail", "Is hesabi"
  profileDirectory?: string;// Chrome profil adi (web oturumlu saglayicilar icin)
  apiKey?: string;          // API'li saglayicilar icin
  status: "active" | "cooldown" | "error";
  failCount: number;
  cooldownUntil?: number;   // epoch ms — kota dolunca 6 saat
  lastUsedAt?: number;
  notes?: string;
}

/** Kota cooldown suresi: HMX_QUOTA_COOLDOWN_MS env'i ile ezilebilir, varsayilan 6 saat */
export function quotaCooldownMs(): number {
  const v = Number(process.env.HMX_QUOTA_COOLDOWN_MS);
  return Number.isFinite(v) && v > 0 ? v : 6 * 60 * 60 * 1000;
}

/**
 * Hesap Havuzu: web oturumlari (Chrome profili) ve API anahtarlari icin
 * tek birlesik kayit. Hesaplar JSON dosyalarinda durur:
 *   ~/.hmx/accounts/<providerId>/<accountId>.json
 *
 * Secim kurali (Bolum 2.1): status==="active" VE cooldown'u gecmis hesaplar
 * arasindan lastUsedAt artan sirayla ILKI (en az kullanilan = adil dagilim).
 */
export class AccountPool {
  constructor(private rootDir: string = paths.accounts) {
    ensureDirs();
  }

  private dir(providerId: string) {
    return path.join(this.rootDir, providerId);
  }

  private file(providerId: string, accountId: string) {
    return path.join(this.dir(providerId), `${accountId}.json`);
  }

  list(providerId: string): PooledAccount[] {
    const out: PooledAccount[] = [];
    for (const f of listJsonFiles(this.dir(providerId))) {
      const acc = readJson<PooledAccount>(f);
      if (acc) out.push(acc);
    }
    return out.sort((a, b) => (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0));
  }

  listAll(): PooledAccount[] {
    const out: PooledAccount[] = [];
    try {
      for (const d of fs.readdirSync(this.rootDir)) {
        out.push(...this.list(d));
      }
    } catch { /* kok dizin henuz yok */ }
    return out;
  }

  add(acc: Omit<PooledAccount, "id" | "status" | "failCount"> & Partial<Pick<PooledAccount, "id">>): PooledAccount {
    const full: PooledAccount = {
      status: "active",
      failCount: 0,
      ...acc,
      id: acc.id ?? `${acc.providerId}-${crypto.randomBytes(3).toString("hex")}`,
    };
    writeJson(this.file(full.providerId, full.id), full);
    return full;
  }

  remove(providerId: string, accountId: string): boolean {
    try {
      fs.unlinkSync(this.file(providerId, accountId));
      return true;
    } catch {
      return false;
    }
  }

  private save(acc: PooledAccount) {
    writeJson(this.file(acc.providerId, acc.id), acc);
  }

  /** Kullanilabilir ilk hesap: aktif + cooldown'u gecmis + exclude disinda + en az kullanilan */
  pickNext(providerId: string, exclude?: Set<string>): PooledAccount | null {
    const now = Date.now();
    const usable = this.list(providerId).filter((a) => {
      if (a.status === "error") return false;
      if (a.status === "cooldown" && (a.cooldownUntil ?? 0) > now) return false;
      if (exclude?.has(a.id)) return false;
      return true;
    });
    return usable[0] ?? null;
  }

  /** Kota hatasi -> cooldown (varsayilan 6 saat); normal hata -> failCount++, 3'te "error" */
  reportFailure(acc: PooledAccount, isQuota: boolean, error: string): void {
    if (isQuota) {
      acc.status = "cooldown";
      acc.cooldownUntil = Date.now() + quotaCooldownMs();
      acc.notes = `kota: ${error.slice(0, 200)}`;
    } else {
      acc.failCount++;
      if (acc.failCount >= 3) {
        acc.status = "error";
        acc.notes = `3 ardisik hata: ${error.slice(0, 200)}`;
      }
    }
    this.save(acc);
  }

  /** Basari: failCount sifirla, cooldown kaldir, lastUsedAt guncelle */
  reportSuccess(acc: PooledAccount): void {
    acc.status = "active";
    acc.failCount = 0;
    delete acc.cooldownUntil;
    acc.lastUsedAt = Date.now();
    this.save(acc);
  }
}
