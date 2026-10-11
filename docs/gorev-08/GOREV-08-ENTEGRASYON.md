> **Güncelleme:** Bu belge ilk GÖREV 08 tesliminin tarihsel kaydıdır. Güncel tüm paket, backend düzeltmeleri ve test sonucu için [profesyonelleştirme raporunu](../professionalization/README.md) okuyun. Kota bekleme ayarının uygulanmaması, boş zincirin temizlenmemesi ve kayıtlı LLM anahtarının uygulanmaması bu yeni pakette düzeltildi.

# HMX — GÖREV 08: Sayfa polish paketi

## Hedef sürüm

- Repo: https://github.com/pespaloglan-droid/hmxagent
- Dal: `main`
- Baz commit: `baebaf395bed069db8318f54e27d7fc622087e52`
- Paket: 7 yeniden yazılmış sayfa, 2 ortak yardımcı dosyası, 1 kapsamı izole CSS dosyası.
- GitHub entegrasyonu `feat/gorev-08-pages-polish` dalı ve `main` hedefli Pull Request üzerinden yapılır; doğrudan `main` değişikliği yoktur. Backend, App, store'lar, api helper'ı, package.json ve lockfile değiştirilmedi.
- Referans projelerden kod ya da bağımlılık taşınmadı. Mevcut HMX kaynak kodu ve gerçek backend alanları esas alındı.

## Dosyalar

```text
apps/web/src/
├── pages/
│   ├── Sessions.tsx
│   ├── Servers.tsx
│   ├── Providers.tsx
│   ├── Models.tsx
│   ├── Pipeline.tsx
│   ├── Logs.tsx
│   └── Settings.tsx
├── components/
│   ├── ui.tsx
│   └── pageData.ts
└── styles/
    └── pages.css
```

Sayfaların dış export adları korunur ve dönüş tipi `JSX.Element` olarak açıkça yazılır. `ServersPage({ health }: { health: any })` kontratı aynıdır. Settings sihirbazı `useUiStore.getState().setWizardOpen(true)` kullanır. Tüm ağ çağrıları mevcut `../api` üzerinden yürür.

## Uygulama

GitHub Pull Request birleştirildiğinde kaynak değişiklikleri doğrudan repoya uygulanır. Aşağıdaki adımlar yalnızca ayrı ZIP/patch teslimini elle uygulamak içindir; PR entegrasyonundan sonra yeniden uygulamayın.

### Manuel uygulama — iki alternatiften yalnızca birini kullanın

### A. Dosyaları kopyalayın

Önce yerel değişikliklerinizi commit edin veya yedekleyin. ZIP içindeki `apps/` ağacını mevcut projenizin köküne kopyalayın. Yedi mevcut sayfanın üzerine yazılması beklenir; üç yardımcı dosya da mutlaka kopyalanmalıdır.

`pages.css` ortak UI dosyasından otomatik import edilir. App.tsx veya main.tsx için ek import gerekmez. Yeni npm bağımlılığı yoktur.

### B. Patch uygulayın

Dosyaları kopyalamak yerine, temiz baz sürümün bulunduğu proje kökünde:

```bash
git apply --check gorev-08-pages-polish.patch
git apply gorev-08-pages-polish.patch
```

Farklı bir commit üzerinde patch kontrolü başarısız olursa zorlamayın; mevcut değişikliklerle birleştirin. Dosya kopyalama ile patch'i birlikte uygulamayın.

### Yerel doğrulama

Mevcut proje bağımlılıkları kurulu olduktan sonra:

```bash
pnpm exec tsc --project apps/web/tsconfig.json --noEmit
pnpm --filter @hmx/web build
```

Ardından normal dashboard başlatma akışını kullanın. Bu paket canlı sağlayıcılara giriş yapmaz veya hesabınıza ait verileri değiştirmez; ilk canlı kontroller sizin yerel ortamınızda yapılmalıdır.

## Tasarım sistemiyle ilişki

İncelenen baz sürümde `styles/design-system.css` bulunmuyor; `theme.css` var. GÖREV 01 dosyasını varsayarak olmayan token adları uydurulmadı. `pages.css`, `hmx-` önekiyle yalnızca bu sayfaları ve dialog'ları biçimlendirir; mevcut `--bg`, `--bg-panel`, `--bg-hover`, `--border`, `--text`, `--accent`, `--ok`, `--warn`, `--err` değişkenlerini tüketir. İkincil metin için `--text-secondary` varsa kullanılır; mevcut koyu temada okunabilir bir fallback sağlanır.

GÖREV 01 sonradan eklendiğinde ortak tokenları bu değişkenlere eşleyin. Bu paket global tema dosyasını değiştirmez. Sayfaların mobil düzeni test edildi; mevcut App sidebar/inspector kabuğunun mobil yeniden tasarımı bu görevin kapsamı dışındadır.

## Sayfa davranışları

- **Sessions:** Aranabilir görev tablosu, klavye ile açılabilen ayrıntı aksiyonları, olay zaman çizelgesi, hata/doğrulama ayrımı. Hızlı seçim değişikliklerinde eski cevaplar yeni ayrıntıyı ezmez.
- **Servers:** Sağlık verisi, LLM yapılandırması, açık bağlantı testi ve ffmpeg durumu. `/api/health` cevabı LLM'nin çalıştığının kanıtı gibi sunulmaz.
- **Providers:** Beş sekmenin kimlikleri korunur; görünür etiketler Türkçedir. Sağlayıcı kartları hover lift, tür/tier rozetleri, hesap sayısı ve spinner'lı test içerir. JSON doğrulama, silme onayı, hesap ekleme, API anahtarı ve Chrome `start/finish` akışları korunur. Sekmelerde ok tuşu/Home/End desteği ve dar ekranlarda aktif sekmenin görünür kalması vardır.
- **Models:** Kayıtlı katalog, URL/model validasyonu, bağlantı testi, kaydetme toast'ı. API anahtarı boş bırakıldığında backend'in yüzeysel LLM birleştirmesi nedeniyle mevcut anahtarın silinmesi önlenir; kayıtlı anahtar forma yazılmaz.
- **Pipeline:** Yalnızca doğrulanmış video seçimi. Klip sırası yukarı/aşağı aksiyonlarıyla ayarlanır ve aynı sıra `/api/compose` gövdesine gönderilir. İsteğe bağlı seslendirme sunucudaki MP3/WAV yoludur, upload değildir.
- **Logs:** Son 200 satır; tamamlanan istekten sonra 3 saniye bekleyen çakışmasız polling. Duraklatma, yeniden başlatma, manuel yenileme, satır arama, hata/doğrulama renkleri ve kapatılabilir sona takip. Kullanıcı yukarı kaydırdığında sona takip kapanır. Ağ hatasında son başarılı satırlar korunur.
- **Settings:** Bekleme süresi, zincir kimlikleri ve tekrar eden sağlayıcı validasyonu; yalnızca formun alanları gönderilir, LLM ayarları ezilmez. Kaydedilmemiş değişiklik rozeti ve kaydedildi toast'ı. Onay modları korunur.

Tüm veri alanlarında skeleton, boş/varsayılan durum ve yeniden denenebilir hata akışı vardır. Proxy/MCP yönetimi için olmayan API işlemleri veya sahte loading durumları eklenmedi. Dialog'lar native `dialog` ile odak sınırı, Escape ve odak dönüşünü kullanır. Bildirimler ekran okuyucuya aktarılır; form açıklamaları label yerine `aria-describedby` üzerinden ilişkilendirilir. Tablolar sayfayı taşırmadan kendi bölgelerinde yana kaydırılır. Hareket azaltma tercihi korunur.

## Mevcut backend sınırlamaları — değiştirilmedi

1. **SSE log akışı yok:** `/api/logs/:name/stream` baz sürümde yok. Canlı takip mevcut `/api/logs/:name?tail=200` ile polling yapar; SSE diye sunulmaz.
2. **Kota bekleme süresi:** `/api/settings` değeri dosyaya yazar; AccountPool ise `HMX_QUOTA_COOLDOWN_MS` ortam değişkenini okur. Mevcut API bu alanı havuza uygulamaz. UI kaydedildi bilgisi dosya kaydını ifade eder. Gerçek bekleme süresi için backend düzeltmesi veya ortam değişkeni gerekir.
3. **Boş fallback zinciri:** Settings handler yalnızca dolu değerleri `HMX_ORDER_*` değişkenlerine yazar; boşaltırken eski değeri temizlemez. Çalışan sunucuda eski sıra kalabilir. Backend'in boş değerde ortam değişkenini kaldırması ayrıca çözülmelidir.
4. **LLM anahtarının kullanımı:** Models sayfası kayıtlı/yeni anahtarı test gövdesine gönderir. Mevcut settings handler anahtarı `HMX_LLM_API_KEY` değişkenine yansıtmaz; sohbet istemcisinin anahtarı ortamdan okuması ayrı backend konusu olarak kalır. Test başarılı diye sohbetin anahtar yapılandırmasının düzeldiği varsayılmaz.
5. **Bekleyen Chrome girişini iptal etmek:** Backend iptal ucu sunmuyor. Dialog kapansa da bekleyen kimlik korunur; Hesap ekle ile yeniden açılır. Kaydet tamamlanmadan farklı sekmeye geçiş engellenir. Chrome penceresi `finish` ile kapanır. Sayfa yenilemesi/uygulamadan ayrılma sonrasında tarayıcı işlemini kullanıcı yerel olarak yönetmelidir.
6. **Proxy/MCP yönetimi:** Bu yönetimler için API bulunmuyor; sekmeler/sunucu alanı durum açıklaması ve mevcut yönetim ekranına dönüş aksiyonu sunar.

## Teslim doğrulaması

Detaylar bu klasördeki `GOREV-08-TEST-RAPORU.md` ve `dogrulama/sonuclar.json` içindedir. Gerçek Chrome profilleriniz, LLM servisiniz veya üretim hesaplarınızla canlı uçtan uca test yapılmadı.
