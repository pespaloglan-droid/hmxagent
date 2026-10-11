# GÖREV 02 — MessageList bileşeni

## Bağlam
HMX Agent web renderer'ı (React 18 + TS, bağımlılıksız — yeni npm paketi YOK).
Mesaj tipi şeması (apps/web/src/stores/schema.ts ile birebir aynı):

```ts
type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: number;
  streaming?: boolean;
  error?: string;
};
```

## Üretilecek dosya
`apps/web/src/components/MessageList.tsx`

## Kontrat (aynEN korunur)
```tsx
export function MessageList(props: {
  messages: ChatMessage[];
  onRetry?: (messageId: string) => void;
}): JSX.Element;
```

## Zorunlu özellikler
- Mesaj balonları: user sağda mor, assistant solda panel zeminli, tool/system soluk.
- **Basit Markdown render:** kod blokları (```), inline code, kalın/italik, liste, link —
  bağımlılıksız mini renderer yaz (güvenlik: HTML enjekte ETME, sadece escape + desen).
- Kod bloğunda "Kopyala" butonu (navigator.clipboard).
- Streaming mesajda yanıp sönen caret (▌).
- Hata mesajlarında kırmızı çerçeve + "↻ Tekrar dene" butonu (`onRetry` çağırır).
- Tarih ayraçları: gün değişince "Bugün/Dün/tarih" başlığı.
- Saat rozetleri (HH:mm, muted).
- Boş liste → zarif empty state (ölü ekran değil).

## Stil
Tasarım sistemi class'larını kullan (GÖREV 01): `.card`, `.btn-sm`, `.badge` vb.
Inline style minimum. Animasyonlar 120-200ms, abartısız.
