# GÖREV 09 — Agent taban kontratı + registry yeniden bağlantısı (GERÇEK agentik sistemler)

## Bağlam
HMX Agent'ta agent seçici şu an sahte: "agentlar" sadece system prompt eki.
Kökten düzeltme: her agent gerçek bir sürücü (driver) olacak — kendi döngüsü, capability'leri
ve kullanılabilirlik kontrolü var. Mevcut `packages/agent-core/src/registry.ts`
(promptAddon'lu profiller) bu modelle değiştirilecek.

## Üretilecek dosyalar
1. `packages/agent-core/src/agents/base.ts` (yeni)
2. `packages/agent-core/src/registry.ts` (yeniden — eski promptAddon modelini kaldırır)

## base.ts kontratı (aynEN korunur)
```ts
import type { ChatMessage } from "@hmx/core";

export type AgentKind = "native" | "hermes" | "opencode-style";

export interface AgentDriver {
  readonly id: string;                 // "hmx-native" | "hermes-loop" | "opencode-agent" | custom
  readonly name: string;
  readonly kind: AgentKind;
  readonly description: string;
  readonly capabilities: string[];     // ["chat","tools","browser","media"]
  /** Kurulum/köprü hazır mı? UI pasif rozeti buna bakar */
  isAvailable(): Promise<boolean>;
  /** Streaming sohbet: token token async iterable */
  chat(messages: ChatMessage[], opts?: { model?: string }): AsyncIterable<string>;
}
```

## registry.ts kontratı
```ts
export class AgentRegistry {
  list(): AgentDriver[];                    // builtin driver'lar + ~/.hmx/agents.json'dan custom
  get(id: string): AgentDriver | null;
  register(driver: AgentDriver): void;      // runtime kayıt
  removeCustom(id: string): boolean;
}
```
- Builtin kayıt: `hmx-native` her zaman; `hermes-loop` ve `opencode-agent` GÖREV 10/11'den gelir
  (yoksa registry onları olmadan da derlenebilmeli — dynamic import ile dene).
- Custom profiller JSON'dan: basit chat-only driver'a sarılır (promptAddon'lu native).
- UI uyumluluğu: `/api/agents` endpoint'i registry.list()'i `{id,name,kind,description,capabilities,builtin,available}` olarak serialize eder (bu endpoint dashboard-api'de; sen sadece registry'yi yaz, serialize şeklini dokümante et).

## Kurallar
- TypeScript strict, bağımlılık yok, ESM.
- Eski `AgentProfile`/promptAddon export'ları KALDIRILIR — entegratör kullanımları günceller
  (server.ts, agent.ts). Geriye dönük shim YAZMA.
