# GÖREV 12 — Model Registry (yalnızca entegre modeller seçilebilir)

## Bağlam
Model seçici şu an LLM endpoint'inden liste çekiyor ama medya sağlayıcılarıyla birleşik
"gerçekten kullanılabilir model" kavramı yok. Kökten çözüm: tek ModelRegistry.
Mevcutlar: `@hmx/core` LlmClient (`listModels()` mevcut), `@hmx/providers`
(`loadProviderConfigs()` → her config'te `id, kind, model?, endpoint?`).

## Üretilecek dosya
`packages/providers/src/model-registry.ts`

## Kontrat
```ts
export type RegisteredModel = {
  id: string;                  // "llm:qwen2.5:14b" | "media:flow-ai"
  label: string;
  source: "llm-endpoint" | "media-provider";
  kind: "llm" | "image" | "video" | "audio";
  available: boolean;          // endpoint yanit verdi mi / config var mi + hesap/anahtar var mi
  reason?: string;             // available=false ise neden (ornegin "hesap yok")
};

export class ModelRegistry {
  /** Canli tarama: LLM /models + medya config'leri; sonuc cache'lenir (30 sn TTL) */
  list(): Promise<RegisteredModel[]>;
  /** Sadece available=true olanlar */
  listAvailable(): Promise<RegisteredModel[]>;
  invalidate(): void;
}
```

## Zorunlu davranış
- LLM modelleri: `LlmClient.fromEnv().listModels()`; endpoint cevap vermezse env'deki tek
  model `available:false, reason:"endpoint erisilemiyor"` ile listelenir (sessiz düşüş YOK).
- Medya "modelleri": her provider config bir model satırı; available = sağlayıcının
  kullanılabilir hesabı var (AccountPool.pickNext) veya api-key env'i tanımlı.
- Sonuçlar UI'da kaynağa göre gruplanır (LLM / Görsel / Video / Ses).

## Kurallar
- Bağımlılık yok; `@hmx/core` ve `@hmx/providers` iç importları.
- `/api/models` ucu bunu kullanacak şekilde dokümante et (endpoint dashboard-api'de,
  sen sadece registry'yi yaz).
