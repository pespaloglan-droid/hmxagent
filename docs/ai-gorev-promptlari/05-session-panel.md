# GÖREV 05 — SessionPanel yeniden yazım

## Bağlam
Sol orta panel: oturum listesi. Store: `apps/web/src/stores/sessionStore.ts`
(`sessions`, `activeSessionId`, `createSession`, `setActiveSession`, `removeSession`, `renameSession`).
Her session: `{ id, title, selectedAgentId, selectedModelId, activeTab, draft, messages[], updatedAt }`.

## Üretilecek dosya
`apps/web/src/components/SessionPanel.tsx` — tamamen yeniden.

## Kontrat
```tsx
export function SessionPanel(): JSX.Element;
```

## Zorunlu özellikler
- Üstte arama kutusu (başlık + son mesaj içinde filtreler) + "+ Yeni Oturum" butonu.
- Her satır: durum noktası (streaming=sarı / hata=kırmızı / normal=yeşil), başlık
  (çift tıkla yeniden adlandır), son mesaj önizlemesi (1 satır), göreli zaman
  ("5 dk önce"), bağlı model/agent rozeti varsa küçük.
- Hover'da silme butonu (×) — onay: küçük inline "Emin misin?" (modal değil).
- Gruplama: Bugün / Bu hafta / Daha eski.
- Boş liste: zarif empty state.
- Klavye: ↑↓ ile listede gezinme, Enter ile açma (opsiyonel ama tercih edilir).

## Stil
Tasarım sistemi class'ları (GÖREV 01). 250px genişlik, panel zemin rengi, ince border.
