import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MediaProvider, ProviderConfig } from "./types.js";
import { GenericBrowserProvider } from "./generic.js";
import { ApiMediaProvider } from "./api/api-provider.js";
import { paths, ensureDirs } from "@hmx/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Builtin config dizini: 1) env, 2) calisma dizini (exe/dagitim icin), 3) modul-relative (dev)
const BUILTIN_CONFIG_DIR =
  process.env.HMX_CONFIG_DIR ??
  (fs.existsSync(path.resolve(process.cwd(), "config/providers"))
    ? path.resolve(process.cwd(), "config/providers")
    : path.resolve(__dirname, "../../../config/providers"));

/** Geriye donuk uyumluluk: eski config'lerdeki "generateButton" = spec'teki "submitButton" */
function normalizeSelectors(cfg: ProviderConfig): ProviderConfig {
  if (cfg.selectors?.generateButton && !cfg.selectors.submitButton) {
    cfg.selectors.submitButton = cfg.selectors.generateButton;
  }
  return cfg;
}

function validateConfig(cfg: ProviderConfig, file: string): boolean {
  if (!cfg.id || !cfg.baseUrl || !cfg.kind || !cfg.authMode) {
    console.warn(`Gecersiz provider config ${file}: id, baseUrl, kind, authMode zorunlu`);
    return false;
  }
  for (const envName of cfg.requiresEnv ?? []) {
    if (!process.env[envName]) {
      console.warn(`[${cfg.id}] requiresEnv eksik: ${envName} (saglayici calismayabilir)`);
    }
  }
  return true;
}

/** config JSON'larini yukler: once builtin (repo), sonra kullanici (~/.hmx/providers) */
export function loadProviderConfigs(): ProviderConfig[] {
  ensureDirs();
  const out: ProviderConfig[] = [];
  const seen = new Set<string>();
  // kullanici config'i builtin'i ezer -> once kullaniciyi oku
  for (const dir of [paths.providersConfig, BUILTIN_CONFIG_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      try {
        const cfg = normalizeSelectors(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as ProviderConfig);
        if (!validateConfig(cfg, f)) continue;
        if (!seen.has(cfg.id)) {
          seen.add(cfg.id);
          out.push(cfg);
        }
      } catch (e) {
        console.warn(`Gecersiz provider config ${f}:`, e);
      }
    }
  }
  return out;
}

export function buildProvider(cfg: ProviderConfig): MediaProvider {
  if (cfg.authMode === "browser-session") {
    return new GenericBrowserProvider(cfg.id, cfg.kind, cfg);
  }
  return new ApiMediaProvider(cfg);
}

export function loadAllProviders(): MediaProvider[] {
  return loadProviderConfigs().map(buildProvider);
}

/** Panelden yeni site ekleme: JSON config'i ~/.hmx/providers/ altina yazar */
export function saveProviderConfig(cfg: ProviderConfig) {
  ensureDirs();
  fs.writeFileSync(
    path.join(paths.providersConfig, `${cfg.id}.json`),
    JSON.stringify(cfg, null, 2),
  );
}

export function deleteProviderConfig(id: string) {
  const p = path.join(paths.providersConfig, `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
