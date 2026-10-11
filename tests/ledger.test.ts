import fs from "node:fs";
import type { T } from "./run.js";

export async function run(t: T) {
  const { TaskLedger } = await import("@hmx/agent-core");

  const l = new TaskLedger();
  l.log("goal", "test hedefi");
  for (let i = 0; i < 4; i++) l.log("action", `adim ${i}`);
  t("ledger: 5. adimda hedef hatirlatma tetiklenir", l.shouldReinjectGoal());
  t("ledger: JSONL dosyasi olustu", fs.existsSync(l.getFile()));
}
