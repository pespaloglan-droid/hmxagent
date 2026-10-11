# GÖREV 08 — Sayfa paketi polish (Sessions, Servers, Providers, Models, Pipeline, Logs, Settings)

## Bağlam
`apps/web/src/pages/` altındaki sayfalar çalışıyor ama görsel olarak "demo" seviyesinde.
Tasarım sistemi (GÖREV 01 çıktısı `styles/design-system.css`) mevcut kabul et.
Mevcut API uçları DEĞİŞMEZ: /api/providers, /api/accounts, /api/models, /api/assets,
/api/compose, /api/logs, /api/settings, /api/sessions, /api/routing, /api/health,
/api/chrome-profiles, /api/accounts/login/start|finish, /api/models/test.

## Üretilecek dosyalar
`apps/web/src/pages/` altında: `Sessions.tsx`, `Servers.tsx`, `Providers.tsx`,
`Models.tsx`, `Pipeline.tsx`, `Logs.tsx`, `Settings.tsx` — her biri yeniden.

## Kontrat
Her sayfa aynı export adını korur: `export function XxxPage(): JSX.Element`.
`ServersPage` prop alır: `{ health: any }`. `SettingsPage` wizard açmak için
`useUiStore.getState().setWizardOpen(true)` çağırır (uiStore mevcut).

## Her sayfa için zorunlu
- Başlık + kısa açıklama satırı.
- Loading (skeleton), empty (illüstratif metin + aksiyon butonu), error (retry'li) halleri.
- Tutarlı kart/tablo/form desenleri; ikon yerine Lucide tarzı inline SVG.
- Providers: 5 sekme korunur (Providers/Accounts/Token Routing/Proxies/Activity & Health);
  kartlar daha premium (hover lift, tier/kind rozetleri, hesap sayısı, test butonu spinner'lı).
- Logs: canlı kuyruk + satır renklendirme (error kırmızı, verify yeşil) + arama.
- Settings: form validasyonu + kaydedildi toast'ı.
- Türkçe UI metinleri.

## Kurallar
- Bağımlılık yok; fetch için mevcut `../api` helper'ı (`api.get/post/del`).
- İş mantığı sayfada kalabilir ama tekrar eden desenler için küçük yardımcı component'ler
  (`components/ui.tsx` gibi) çıkarılabilir.
