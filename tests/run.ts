/**
 * HMX test kosucusu: HMX_HOME'u gecici dizine sabitler (moduller import
 * edilmeden ONCE), sonra tum test dosyalarini sirayla calistirir.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.HMX_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "hmx-test-"));

export type T = (name: string, ok: boolean, extra?: string) => void;

let pass = 0, fail = 0;
const t: T = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`);
  ok ? pass++ : fail++;
};

const files = fs.readdirSync(import.meta.dirname)
  .filter((f) => f.endsWith(".test.ts"))
  .sort();

for (const f of files) {
  console.log(`\n--- ${f} ---`);
  const mod = await import(`./${f}`);
  await mod.run(t);
}

console.log(`\n=== ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
