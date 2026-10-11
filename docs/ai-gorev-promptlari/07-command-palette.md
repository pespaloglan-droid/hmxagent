# GÖREV 07 — CommandPalette yeniden yazım (fuzzy search)

## Bağlam
Ctrl/Cmd+K komut paleti. UI store: `apps/web/src/stores/uiStore.ts`
(`paletteOpen, setPaletteOpen, setPage, setWizardOpen`).
Session store: `createSession`. Mevcut komutlar: sayfa geçişleri, wizard açma, yeni oturum.

## Üretilecek dosya
`apps/web/src/components/CommandPalette.tsx` — tamamen yeniden.

## Kontrat
```tsx
export function CommandPalette(): JSX.Element | null;
```

## Zorunlu özellikler
- **Fuzzy search:** bağımlılıksız skorlayıcı yaz (harf sırası eşleşmesi + başlangıç bonusu;
  örn. "prv" → "Providers" üstte). Eşleşen harfler <mark> ile vurgulanır.
- Komutlar: sayfalar + "Yeni Oturum" + "Kurulum Sihirbazı" + "Koyu tema" (gelecek).
- Son kullanılan komutlar üstte (localStorage `hmx-palette-recent`).
- Klavye: ↑↓ gezinme, Enter çalıştır, Esc kapat; backdrop tıklaması kapatır.
- Komutlar kategorili gruplanır (Sayfalar / Eylemler / Sistem) — başlıklarla.
- Açılış animasyonu: 120ms fade+scale (reduced-motion saygılı).

## Stil
Merkezde floating panel (üstten ~15vh), 560px, kalın gölge, tasarım sistemi tokenları.
