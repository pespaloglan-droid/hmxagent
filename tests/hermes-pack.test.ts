import fs from "node:fs";
import path from "node:path";
import type { T } from "./run.js";

/**
 * hmx-hermes-pack yapisal dogrulama (FAZ 8).
 * Canli Hermes testi Hermes kurulumu gerektirir; burada eklentinin
 * Hermes sozlesmesine (register + ctx.register_tool + manifest) uydugu dogrulanir.
 */
export async function run(t: T) {
  const dir = path.resolve(import.meta.dirname, "../plugins/hmx-hermes-pack");

  const yaml = fs.readFileSync(path.join(dir, "plugin.yaml"), "utf8");
  t("hermes-pack: manifest alanlari tam", ["name:", "version:", "description:", "kind:"].every((k) => yaml.includes(k)));

  const src = fs.readFileSync(path.join(dir, "__init__.py"), "utf8");
  t("hermes-pack: register(ctx) + register_tool sozlesmesi", src.includes("def register(ctx") && src.includes("ctx.register_tool"));

  // check_fn var: dashboard ayakta degilse arac gizlenir (Hermes service-gated deseni)
  t("hermes-pack: check_fn erisilebilirlik kapisi", src.includes("check_fn=_hmx_reachable"));
}
