import fs from "node:fs";
import path from "node:path";

/**
 * Kucuk dosya-tabanli JSON depolama deseni (kimi-code packages/minidb tarzi).
 * AccountPool, config ve ledger'in ortak depolama katmani.
 * Atomik yazim: once .tmp'e yaz, sonra rename (yarim dosya birakmaz).
 */
export function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, file);
}

export function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}
