# GÖREV 06 — RightInspector (contextual sağ panel) yeniden yazım

## Bağlam
Sağ panel sayfaya göre içerik gösterir — asla boş kutu değil. Veri uçları (mevcut):
- `GET /api/routing` → `{ order: {kind: string[]}, accounts: [...], circuits: [...], tokenSaver: {...} }`
- `GET /api/health` → `{ llm, ffmpeg, quota: {accounts, cooldown, error}, ... }`
Session store'dan aktif oturum okunabilir.

## Üretilecek dosya
`apps/web/src/components/RightInspector.tsx` — tamamen yeniden.

## Kontrat
```tsx
export function RightInspector(props: { page: string }): JSX.Element;
```

## Zorunlu içerik (sayfaya göre)
- **chat:** aktif oturum kartı (başlık, mesaj sayısı, model/agent rozetleri) +
  sağlayıcı durum listesi (hesap başına durum noktası) + token-saver kartı (tasarruf %).
- **providers:** fallback zinciri özeti (kind → ok işaretli id listesi) + açık devre kesici kartları.
- **diğerleri:** sistem sağlığı kartı (LLM, ffmpeg, hesap özeti) + son hatalar.
- Ortak: kartlar tasarım sisteminin `.card`'ı; her kartın başlığı + ince ayraç;
  15 sn'de bir sessiz yenileme (poll).

## Stil
280px, sakin bilgi yoğunluğu, rozetler küçük. Bağımlılık yok.
