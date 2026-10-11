import type { T } from "./run.js";

export async function run(t: T) {
  const { HMX_SYSTEM_PROMPT } = await import("@hmx/agent-core");
  t("prompt: dogrulama kurali var", HMX_SYSTEM_PROMPT.includes("HER EYLEMDEN SONRA DOGRULA"));
  t("prompt: sapma kilidi var", HMX_SYSTEM_PROMPT.includes("KONUDAN SAPMA YASAK"));
}
