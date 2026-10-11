# GÖREV 15 — SettingsPage yeniden yazım

## Bağlam
`apps/web/src/pages/Settings.tsx` yeniden yazılacak. Backend:
- `GET /api/settings` → `{ quotaCooldownMs, orders: {image?,video?,audio?,llm?}, llm?, approvalMode?, theme }`
- `POST /api/settings` (partial merge) — aynı nesne geri döner.
- `approvalMode`: "strict" | "balanced" | "fast" (backend'de mevcut, approval.ts).
- Wizard tetikleme: `useUiStore.getState().setWizardOpen(true)` (uiStore mevcut).

## Üretilecek dosya
`apps/web/src/pages/Settings.tsx` — tamamen yeniden.

## Kontrat
```tsx
export function SettingsPage(): JSX.Element;
```

## Zorunlu bölümler
1. **Onay Modu:** 3 kart (Strict/Balanced/Fast) — her kartta açıklama + örnek; seçili kart accent çerçeveli.
2. **Kota cooldown:** saat inputu (validation: 1-72).
3. **Fallback zincirleri:** kind başına virgüllü liste; zincir önizlemesi (rozetler → ok işaretleri).
4. **LLM endpoint:** baseUrl + model + apiKey; "Test Et" butonu (`POST /api/models/test`) sonuç rozetiyle.
5. **Kurulum Sihirbazı:** "Sihirbazı Aç" butonu.
6. **Tehlikeli bölge:** "~/.hmx veri dizinini aç" + "Tüm oturum state'ini sıfırla" (localStorage temizleme, çift onay).

## Zorunlu UX
- Kaydet → başarı/hata toast'ı (kendi mini toast'unu yaz, bağımlılık yok).
- Değişiklik varsa "Kaydedilmemiş değişiklikler" göstergesi.
- Loading skeleton + error hali.

## Stil
Tasarım sistemi (GÖREV 01). Türkçe metinler.
