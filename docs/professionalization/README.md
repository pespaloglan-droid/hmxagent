# HMX Agent — GÖREV 01–15 entegrasyon paketi

Bu değişiklikler mevcut `feat/gorev-08-pages-polish` dalına eklenmiştir. PR #1 genişletilir; `main` otomatik birleştirilmez. Kullanıcının logo görseli uygulamaya ve masaüstü simgelerine eklenir. Referans kontrol merkezinin dört panel düzeni örnek alınır; örnekteki sahte CPU, RAM, kota, kullanıcı veya üretim sayaçları uygulamaya taşınmaz.

## Kapsam

| Görev | Uygulama                                                                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01    | Tasarım tokenları, eski sınıf uyumluluğu, erişilebilir focus/state, reduced-motion, responsive kabuk. `main.tsx` yeni CSS'i yükler. `theme.css` uyumluluk import'u olarak kalır.                                                     |
| 02    | Güvenli React markdown, gerçek stream caret'i, tarih/saat, kod kopyalama, korunmuş hata ve retry. HTML çalıştırılmaz; tehlikeli link protokolleri açılmaz.                                                                           |
| 03    | Kontrollü composer, otomatik yükseklik, Enter/Shift+Enter/IME, klavye ile @ sağlayıcı seçimi, vurgulu overlay, spinner, karakter uyarısı.                                                                                            |
| 04    | Store'a bağlı ChatView, optimistic mesaj, dry-run/inline onay, gerçek SSE, hatalı/yarım akış retry, oturumlar arası taslak/scroll, altı sekme ve katalogdan varlık listesi.                                                          |
| 05    | Oturum paneli: son mesaj/başlık arama, gün grupları, durum, model/ajan, F2/çift tık rename, klavye gezinme ve inline silme onayı.                                                                                                    |
| 06    | Inspector: oturum/hesap/token, provider zinciri/devreler, sistem/son yerel hatalar; sessiz 15 saniye polling.                                                                                                                        |
| 07    | Ctrl/⌘K native dialog; fuzzy subsequence (`prv` → Providers), mark, kategoriler/son kullanılan, klavye ve odak. Tema komutu geleceğe hazırlık olarak pasif.                                                                          |
| 08    | Yedi sayfa korunur; API ve export kontratları korunmuştur. Pipeline artık yeni jobs servisini kullanır; eski `/api/compose` hâlâ çalışır.                                                                                            |
| 09    | AgentDriver registry; zorunlu native, gerçek Hermes/OpenCode driverları, custom chat-only profiller, korunan builtin kimlikleri. Kaynak runtime'da dinamik opsiyonel yükleme, masaüstü bundle'da explicit builtin enjeksiyonu.       |
| 10    | Hermes tarzı gerçek XML araç döngüsü: read_file/list_dir, 50 tur sınırı, 5 turda hedef, bağlam sıkıştırma, iki aynı hatada durma, ledger ve gerçek final stream. Python Hermes köprüsü/kopyası değildir.                             |
| 11    | OpenAI function-calling döngüsü: plan/ask/allow, callback onayı, dört gerçek araç, trace/ledger, 30 tur, iki aynı hatada durma. **Tarayıcı kabiliyeti ilan edilmez**; aşağıdaki kapsam notuna bakın.                                 |
| 12    | 30 saniyelik ModelRegistry cache/invalidate; endpoint listesi ve dürüst unavailable fallback; hesap/env anahtarı tabanlı medya satırları. Yalnız kullanılabilir LLM satırları sohbet seçicisinde seçilir. Medya @ ile yönlendirilir. |
| 13    | JSONL logger: app/startup/crash/wizard/agent/renderer, log level, child meta, gizli meta alanlarının maskelenmesi, 5 MB + bir yedek rotasyonu, yazma hatası uygulamayı çökertmez. Ledger ve masaüstü crash/startup bağlantısı.       |
| 14    | FIFO JobQueue, varsayılan concurrency=2, atomik jobs.json, restart running→failed, cancel/AbortSignal, retry, durum paneli, gerçek router/FFmpeg/katalog handler'ları ve Hono jobRoutes.                                             |
| 15    | Üç politika kartı, quota 1–72 saat, zincir doğrulama/önizleme, LLM bağlantı testi, dirty state/toast, wizard, güvenli Electron dizin açma, iki onaylı yalnız yerel oturum sıfırlama.                                                 |

Orijinal görev dosyaları `prompts/` altında korunmuştur; Görev 08'in orijinal teslimi `docs/gorev-08/` altındadır.

## API ve çalışma biçimi

- Mevcut provider/account/model/asset/compose/log/settings/session/routing/health/Chrome login uçları kaldırılmadı. `/api/models` mevcut `llm/image/video/audio` gruplarını korur ve `registered` listesi ekler.
- `POST /api/jobs { kind, prompt, provider? }` → **202 ve doğrudan Job nesnesi**. Liste/detay ve `/:id/cancel`, `/:id/retry` vardır. Kuyruk `app.route('/api/jobs', jobRoutes(queue))` ile bağlanır. Compose job prompt'u `JSON.stringify({ clips, voiceover? })` biçimindedir. Tamamlanan işler katalogda kaydedilir.
- Sohbet medya istekleri yeni UI'da `queue:true` kullanır. Eski senkron smart medya isteği varsayılan olarak desteklenir.
- SSE bağlantısı kesilince AbortSignal LLM fetch, driver döngüsü ve araçlara da iletilir; yeni araç çağrıları devam etmez.
- SSE `data: {token}`, `data: {done}`, `data: {error}` ve araçlar için `data: {approval:{id,question}}` döner. `/api/approvals/:id` açık kullanıcı kararını alır; reddedilen/bağlantısı kesilen araç yazma işlemi çalıştırılmaz.
- Riskli stream isteği aynı mesaj ve oturum için dry-run'dan gelen tek kullanımlık, beş dakikalık `approvalId` ister. Görev onayı araç onayının yerine geçmez; write_file/run_command her modda ayrıca sorar.
- `/api/assets/:id/file` yalnız katalogda kayıtlı varlığı sunar; keyfi yol parametresi kabul etmez.
- Settings içindeki API anahtarı GET yanıtında dönmez; boş parola alanı kayıtlı anahtarı korur. Ayarlar kaydedilince LLM env varsayılanları/quota/fallback sıraları runtime'a uygulanır. Boş zincir eski env sırasını temizler.
- Önceden katalog API'sindeki `type:undefined` filtresi tüm satırları eliyordu. Bu da düzeltildi; genel katalog sorgusu artık kayıtları döndürür.
- Sunucu loopback `127.0.0.1` üzerinde dinler; dış web origin'lerinden mutating istekler reddedilir. Bu dashboard **uzak ağ servisi değildir**.

## Güvenlik ve dürüst kapsam sınırları

1. OpenCode'un prompt kontratında `browser` etiketi vardı; minimal araç setinde gerçek browser aracı tanımlanmadığı için gerçekte olmayan kabiliyet ilan edilmedi. Driver `['chat','tools']` sunar. **OpenCode sohbetinden genel tarayıcı otomasyonu bu pakette yoktur.** Provider tarafındaki mevcut gerçek Chrome login/üretim akışları korunur. Native driver doğrudan chat stream sunar; gerçek dosya/komut araç döngüleri Hermes/OpenCode'dadır. Medya router ayrı servis olarak çalışır.
2. `write_file` ve `run_command` açık araç onayı olmadan çalışmaz. Dosya araçları workspace/realpath/symlink kontrolü ve hassas yol engeli uygular. Ancak onaylanan shell bir OS sandbox değildir; aynı kullanıcının başka dosyalarına erişebilir. Parametreler ve bu uyarı onay kartında gösterilir. Secret/token/API key isimli ortam değişkenleri shell çocuğuna aktarılmaz.
3. İptal queued işi durdurur; running iş handler'ına AbortSignal iletilir (fetch/FFmpeg ve sahip olunan Chrome işlemi). Çalışan slot handler gerçekten bitene kadar serbest bırakılmaz. **Bir dış sağlayıcıda zaten başlamış üretimi veya ücretlendirmeyi geri alma garantisi yoktur.**
4. Logger meta içindeki anahtar/parola/token/cookie alanlarını maskeler. Serbest mesaj metni için genel bir DLP sistemi değildir; gizli değerleri log mesajına yazmayın. Settings/accounts JSON dosyaları özel dosya modu ile yazılır; Windows izinleri ayrıca işletim sistemi tarafından yönetilir.
5. Proxy havuzu/coğrafi rotasyon ve harici MCP server yönetimi backend'de mevcut değildir; ekranlar açıkça hazırlık durumu gösterir, sahte çalışan buton sunmaz.
6. Web tarayıcısı yerel dizin açamaz; dizin yolu clipboard'a kopyalanır ve bu açıkça bildirilir. Electron IPC yalnız kendi ana frame'inden sabit HMX_HOME dizinini açar; renderer keyfi yol veremez. Yerel reset yalnız session localStorage'ını siler; sunucu dosyalarını veya diğer storage kayıtlarını silmez.
7. Eski takip edilen `apps/desktop/out/*` derlenmiş çıktıları depodan çıkarıldı; kaynak ve build scriptleri esas alınır. Paketleme öncesinde aşağıdaki derleme adımları gerekir. Hazır Windows EXE yayınlanmamıştır.

## Toplu test/çalıştırma

Node >=20.3 (önerilen: 22+), pnpm ve gerçek compose testi için ffmpeg/ffprobe gerekir. OpenAI uyumlu gerçek endpoint yalnız manuel canlı kullanımda gerekir; otomatik backend testleri tamamen yerel fixture servisleri kullanır.

```bash
git fetch origin
git switch feat/gorev-08-pages-polish
pnpm install --frozen-lockfile
pnpm build
pnpm exec tsc -p apps/web/tsconfig.json
pnpm test
pnpm --filter @hmx/desktop build
node tests/e2e/desktop-smoke.mjs
# Chromium yolunu kendi sisteminizde değiştirin:
HMX_CHROMIUM=/usr/local/bin/chromium node tests/e2e/ui.mjs
pnpm dashboard
# Desktop:
pnpm --filter @hmx/desktop dev
```

PowerShell'de tarayıcı testinden önce `$env:HMX_CHROMIUM='C:\path\to\chrome.exe'` ayarlayın, sonra `node tests/e2e/ui.mjs` çalıştırın. Test çıktıları `.qa/` içine yazılır ve gitignore'dadır. Test fixture'larındaki sağlayıcı adları/görseller gerçek üretim sonucu olarak sunulmaz.

Güncel kanıt ve test sayıları [TEST-RAPORU.md](./TEST-RAPORU.md) içindedir. Yerel testler GitHub Actions check'i değildir. Canlı Chrome hesabı, ücretli sağlayıcı, gerçek uzak LLM kalitesi, Windows Electron GUI/installer için ayrı manuel kabul testi gerekir.
