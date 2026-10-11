# GÖREV 11 — OpenCode-style agent driver (opencode-agent.ts)

## Bağlam
GÖREV 09'daki `AgentDriver` kontratını implemente eden, OpenCode'un agentik deseninin
TypeScript portu. OpenCode deseni: LLM tool-calling döngüsü + permission modları
(plan/ask/allow) + tool çağrı izi (trace) + permission gerektiren araçlarda durma.
HMX referansları: `packages/agent-core/src/approval.ts` (RiskLevel/ApprovalMode,
shouldRequireApproval), `packages/agent-core/src/ledger.ts`, `@hmx/core` LlmClient.

## Üretilecek dosya
`packages/agent-core/src/agents/opencode-agent.ts`

## Kontrat
```ts
import type { AgentDriver } from "./base.js";

export class OpenCodeAgent implements AgentDriver {
  readonly id = "opencode-agent";
  readonly name = "OpenCode Agent";
  readonly kind = "opencode-style" as const;
  readonly description = "Tool-calling dongusu + permission modlari (OpenCode deseni)";
  readonly capabilities = ["chat", "tools", "browser"];
  constructor(opts?: { permissionMode?: "plan" | "ask" | "allow" });
  isAvailable(): Promise<boolean>;
  chat(messages, opts?): AsyncIterable<string>;
  /** Son calistirmanin tool izi (UI trace paneli icin) */
  getTrace(): { tool: string; ok: boolean; at: number }[];
}
```

## Zorunlu davranış
- OpenAI function-calling şeklinde araç döngüsü: LLM tool_call üretir → permission kontrolü
  (`plan`: hiçbir mutasyon yok, sadece plan metni; `ask`: moderate/destructive araçlarda
  onay callback'i; `allow`: yalnızca destructive'te sor) → araç çalışır → sonuç modele döner.
- Onay callback'i constructor'a `confirm?: (question: string) => Promise<boolean>` ile verilir;
  yoksa destructive araçlar reddedilir (güvenli varsayılan).
- Araç seti minimal başlar: read_file, list_dir, write_file (destructive), run_command (destructive).
- Her tool çağrısı trace'e ve ledger'a yazılır.
- İterasyon limiti 30; aynı hata 2 kez → dur ve kök neden raporla.

## Kurallar
- Bağımlılık yok. Atıf yorumu: "Based on opencode-dev agent loop (MIT)".
- Permission kararları `shouldRequireApproval`'ı (approval.ts) kullanır — kendi policy YAZMA.
