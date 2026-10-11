# GÖREV 01 — Tasarım Sistemi (design-system.css)

## Bağlam
HMX Agent: Electron + React 18 + TypeScript masaüstü "AI Agent Control Center". Mevcut tema
`apps/web/src/theme.css` içinde basit CSS değişkenleriyle yazılı; yetersiz (tipografi skalası,
spacing ritmi, focus ring, motion tokenları yok; ikonlar emoji).

## Üretilecek dosya
`apps/web/src/styles/design-system.css` — mevcut `theme.css`'in YERİNE geçecek tam tasarım sistemi.

## Zorunlu içerik
1. **Renk tokenları:** koyu mor tema. Mevcut palet korunur ama genişletilir:
   `--bg:#0d0a1a`, `--bg-panel:#151129`, `--bg-hover:#1d1840`, `--accent:#7c5cff`,
   `--ok:#3ddc97`, `--warn:#ffb020`, `--err:#ff5470`, `--border:#262052` +
   elevation gölgeleri (`--shadow-1/2/3`), focus ring (`--ring: 0 0 0 3px rgba(124,92,255,.35)`).
2. **Tipografi skalası:** `--text-xs/sm/base/lg/xl/2xl` + font-weight tokenları + Satoshi/Segoe UI stack.
3. **Spacing:** 4px grid (`--space-1` … `--space-12`).
4. **Motion:** `--dur-fast:120ms`, `--dur-base:200ms`, easing tokenları; `prefers-reduced-motion` saygısı.
5. **Bileşen sınıfları:** `.card`, `.btn` (+`.btn-sm`,`.btn-ghost`,`.btn-danger`), `.badge`
   (+ok/warn/err/dim), `.input`, `.table`, `.tabs`, `.sidebar`, `.modal`, `.palette`,
   `.tooltip`, `.skeleton` (loading shimmer), `.toast`, `.empty-state`.
6. **State'ler eksiksiz:** hover, focus-visible, active, disabled, selected, loading — her
   interaktif sınıf için.
7. Scrollbar stillemesi (ince, tema uyumlu).

## Kurallar
- Saf CSS (preprocessor yok). CSS custom properties + utility class'lar.
- Mevcut sınıf adları (`.card`, `.btn`, `.badge`…) korunur — geriye uyumlu, ama görsel kalite
  belirgin şekilde yükselir.
- Piksel-perfect premium his: yumuşak gölgeler, 12px radius, zarif border'lar, iyi kontrast.

## Kabul kriteri
Dosya tek başına `index.html`'e bağlanınca mevcut tüm sayfalar bozulmadan daha premium görünür.
