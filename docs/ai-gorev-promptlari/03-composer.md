# GÖREV 03 — Composer bileşeni (premium chat input)

## Bağlam
HMX Agent chat composer'ı. Altında üç seçici olacak: AgentSelector, ModelSelector (mevcutlar,
props ile geliyor) ve gönder butonu. @-mention ile sağlayıcı yönlendirme destekleniyor:
kullanıcı `@image:Flow AI ...` yazar; `@` yazınca otomatik tamamlama açılır.

## Üretilecek dosya
`apps/web/src/components/Composer.tsx`

## Kontrat
```tsx
export function Composer(props: {
  draft: string;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  busy: boolean;
  agentSlot: React.ReactNode;   // AgentSelector buraya gelir
  modelSlot: React.ReactNode;   // ModelSelector buraya gelir
  mentionProviders: { id: string; kind: string }[];  // @ tamamlama kaynağı
}): JSX.Element;
```

## Zorunlu özellikler
- Otomatik büyüyen textarea (max 8 satır), Enter=gönder, Shift+Enter=yeni satır.
- `@` yazınca sağlayıcı otomatik tamamlama kutusu (kind ikonu + id, klavye ile gezinme ↑↓ Enter).
- Yazılan `@kind:Provider` tokenları input içinde mor vurgu (overlay tekniği veya
  contentEditable — basit ve sağlam olanı seç; state draft'ta kalır, controlled).
- Gönder butonu: busy'de spinner + disabled; draft boşken disabled.
- Karakter sayacı (2000 üstü uyarı) ve "kaydedildi" taslağı hissi (draft store'da tutuluyor,
  sen sadece göster).
- Görsel: floating card hissi, focus'ta accent ring, premium gölge.

## Kurallar
- Bağımlılık yok. Tasarım sistemi class'ları + minimal inline style.
- `onSend` çağrısı sonrası draft temizleme PARENT'ta yapılır — sen sadece çağır.
