import fs from "node:fs";
import path from "node:path";

/**
 * Bagimliliksiz .env yukleyici.
 * Proje kokundeki .env dosyasini okur; process.env'de ZATEN tanimli olan
 * degiskenleri ezmez (sistem env'i onceliklidir).
 * Destekler: KEY=value, # yorum, tirnakli degerler.
 */
export function loadEnv(dir = process.cwd()) {
  const file = path.join(dir, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
