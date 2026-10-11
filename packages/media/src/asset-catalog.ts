import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { paths, ensureDirs, writeJson } from "@hmx/core";

export type Asset = {
  id: string;
  type: "image" | "video" | "audio";
  provider: string;
  prompt: string;
  filePath: string;
  durationSec?: number;
  createdAt: string;
  sessionId?: string;
  tags: string[];
  status: "verified" | "missing";
  bytes?: number;
};

type Catalog = { version: 1; assets: Asset[] };

/**
 * JSON Varlik Katalogu: uretilen her medya burada kayitli olmak zorunda.
 * Kural: dosya dogrulanmadan "verified" yazilmaz.
 */
export class AssetCatalog {
  constructor(private file = paths.catalogFile) {
    ensureDirs();
  }

  private read(): Catalog {
    if (!fs.existsSync(this.file)) return { version: 1, assets: [] };
    try {
      return JSON.parse(fs.readFileSync(this.file, "utf8"));
    } catch {
      return { version: 1, assets: [] };
    }
  }

  private write(db: Catalog) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    writeJson(this.file, db);
  }

  register(input: Omit<Asset, "id" | "createdAt" | "status">): Asset {
    const stat = fs.existsSync(input.filePath)
      ? fs.statSync(input.filePath)
      : null;
    const asset: Asset = {
      ...input,
      id: `ast_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
      createdAt: new Date().toISOString(),
      status: stat && stat.size > 0 ? "verified" : "missing",
      bytes: stat?.size,
    };
    const db = this.read();
    db.assets.push(asset);
    this.write(db);
    return asset;
  }

  query(
    filter: Partial<
      Pick<Asset, "type" | "provider" | "sessionId" | "status">
    > & { tag?: string } = {},
  ): Asset[] {
    return this.read().assets.filter((a) => {
      if (filter.tag && !a.tags.includes(filter.tag)) return false;
      return Object.entries(filter).every(
        ([k, v]) => k === "tag" || v === undefined || (a as any)[k] === v,
      );
    });
  }

  /** Diskte kaybolan dosyalari missing olarak isaretle (dogrulama gecisi) */
  reverify(): { verified: number; missing: number } {
    const db = this.read();
    let verified = 0,
      missing = 0;
    for (const a of db.assets) {
      const ok = fs.existsSync(a.filePath) && fs.statSync(a.filePath).size > 0;
      a.status = ok ? "verified" : "missing";
      ok ? verified++ : missing++;
    }
    this.write(db);
    return { verified, missing };
  }
}
