import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/** ~/.hmx kok dizini - tum runtime verisi burada */
export const HMX_HOME = process.env.HMX_HOME ?? path.join(os.homedir(), ".hmx");

export const paths = {
  home: HMX_HOME,
  sessions: path.join(HMX_HOME, "sessions"),
  chromeData: path.join(HMX_HOME, "chrome-data"),
  assets: path.join(HMX_HOME, "assets"),
  media: path.join(HMX_HOME, "media"),
  logs: path.join(HMX_HOME, "logs"),
  providersConfig: path.join(HMX_HOME, "providers"),
  accounts: path.join(HMX_HOME, "accounts"),
  catalogFile: path.join(HMX_HOME, "assets", "catalog.json"),
};

export function ensureDirs() {
  for (const p of Object.values(paths).filter((p) => !p.endsWith(".json"))) {
    fs.mkdirSync(p, { recursive: true });
  }
}
