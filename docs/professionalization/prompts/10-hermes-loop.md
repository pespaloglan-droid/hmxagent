# GÖREV 10 — Hermes Loop agent driver (hermes-loop.ts)

## Bağlam
GÖREV 09'daki `AgentDriver` kontratını implemente eden, Hermes Agent'ın turn-loop
deseninin TypeScript portu. Hermes (Python) şöyle çalışır: turn fazları (preflight →
API call → tool round → finalizer), iteration bütçesi (parent 500 / subagent 50),
her eylem sonrası doğrulama, 5 adımda goal reinjection, context overflow'da sıkıştırma.
HMX referansları: `packages/agent-core/src/ledger.ts` (TaskLedger),
`packages/agent-core/src/prompt.ts` (HMX_SYSTEM_PROMPT), `@hmx/core` LlmClient
(`chat` + `chatStream` mevcut).

## Üretilecek dosya
`packages/agent-core/src/agents/hermes-loop.ts`

## Kontrat
```ts
import type { AgentDriver } from "./base.js";

export class HermesLoopAgent implements AgentDriver {
  readonly id = "hermes-loop";
  readonly name = "Hermes Loop";
  readonly kind = "hermes" as const;
  readonly description = "Hermes tarzi plan->eylem->dogrulama dongusu (iteration butceli)";
  readonly capabilities = ["chat", "tools"];
  isAvailable(): Promise<boolean>;            // LLM endpoint'i yanit veriyorsa true
  chat(messages, opts?): AsyncIterable<string>;
}
```

## Zorunlu davranış (Hermes deseninin TS portu)
- Turn döngüsü: her turda LLM cevabı alınır; cevap `<tool_call>` içeriyorsa ayrıştırılır,
  HMX'in mevcut araçlarına (sadece okuma sınıfı: dosya okuma/listeleme) eşlenir, sonuç
  modele geri verilir, döngü devam eder. Tool yoksa cevap finalize edilir.
- **Iteration bütçesi:** varsayılan 50 tur; tükenince dur ve açıkça raporla.
- **Goal reinjection:** her 5 turda orijinal kullanıcı hedefi sisteme tekrar enjekte edilir.
- **Doğrulama:** her tool çağrısı sonrası sonuç kontrol edilir; aynı hata 2 kez üst üste → dur.
- Her adım TaskLedger'a yazılır (mevcut sınıfı kullan).
- Streaming: final cevap token token akar (`LlmClient.chatStream`).

## Kurallar
- Bağımlılık yok. `@hmx/core` dışı import yok (agent-core içi importlar serbest).
- Python kodu kopyalanmaz; desen portlanır. Üstte atıf yorumu: "Based on hermes-agent agent/turn loop (MIT)".
