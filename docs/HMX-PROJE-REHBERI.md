# HMX Agent — Proje Rehberi, Mevcut Durum ve Profesyonelleşme Planı

> Bu dosya üç iş görür: (1) projenin nasıl ve neden böyle yapıldığını anlatır,
> (2) profesyonel ürün standardına çıkmak için neyin, hangi dosyayla, nereden
> ekleneceğini tanımlar, (3) her dosyanın başka bir AI modeline (Claude Opus,
> GPT vb.) yazdırılması için hazır görev promptlarını listeler
> (`docs/ai-gorev-promptlari/` altında dosya dosya).

---

## BÖLÜM 1 — Proje nasıl yapıldı (mevcut mimari)

### 1.1 Kaynaklar ve ne alındı

| Kaynak | Ne alındı | Nereye |
|---|---|---|
| **Hermes Agent** (MIT, Python) | credential pool deseni → hesap havuzu; video/TTS provider sözleşmeleri → `VideoResult`/`TtsOptions`; plugin.yaml manifest şeması → provider JSON şeması; "kişilik tek dosyada" fikri → system prompt | `packages/providers`, `packages/agent-core` |
| **OpenCode** (MIT, TS) | Electron masaüstü deseni (electron-vite + electron-builder, main/preload ayrımı), TUI'da React-Ink yaklaşımı | `apps/desktop`, `apps/tui` |
| **Kimi Code** (MIT) | pnpm monorepo disiplini; LLM istemci soyutlaması (kosong); dosya-tabanlı JSON store (minidb); ajan çekirdeğinin UI'dan ayrı paket olması | `packages/core`, paket sınırları |
| **9router** | Token saver, tier fallback (subscription→cheap→free), kota takibi — **clean-room** (kod kopyalanmadı, davranış yeniden yazıldı) | `packages/router` |

### 1.2 Monorepo yapısı (pnpm workspaces)

```
hmx-agent/
├── packages/
│   ├── core/           # paths, .env yükleyici, LlmClient (+SSE streaming), JSON store
│   ├── agent-core/     # HMX_SYSTEM_PROMPT, TaskLedger (JSONL), HmxAgent,
│   │                   # approval policy (risk sınıflandırma), browser_task ajanı
│   ├── providers/      # AccountPool (~/.hmx/accounts), chrome.ts (gerçek Chrome,
│   │                   #   Chrome 136+ kısıtı için izole kopya + DevToolsActivePort),
│   │                   #   generic browser provider, API provider, kota algılama
│   ├── router/         # @-mention parser, MediaRouter (fallback+tier), CircuitBreaker,
│   │                   # token-saver (tekrar tekilleştirme + baş/son özeti + JSON budama)
│   ├── media/          # ffmpeg compose + ffprobe doğrulama, varlık kataloğu
│   └── dashboard-api/  # Hono HTTP sunucu, /api/* uçları, kota snapshot
├── apps/
│   ├── cli/            # `hmx` komutu (ince kabuk — mantık paketlerde)
│   ├── web/            # React 18 + Vite renderer (panel)
│   ├── desktop/        # Electron: child-process sunucu, tray, recovery, NSIS/portable
│   └── tui/            # Ink terminal UI
├── plugins/hmx-hermes-pack/  # Hermes'e HMX köprüsü (Python eklenti)
├── config/providers/   # flow-ai, elevenlabs-web, openai-tts (yerleşik config)
└── tests/              # 76 test, hepsi yeşil
```

### 1.3 Temel akışlar

- **Chat akışı:** UI → `POST /api/chat/smart` (dryRun: risk kararı) → safe ise `POST /api/chat/stream` (SSE, token token) → `@`-mention varsa medya rotası (router → provider → hesap havuzu → katalog). Onay kararı yalnızca `approval.ts`'deki policy'de.
- **Medya üretimi:** config'deki selektörlerle GenericBrowserProvider gerçek Chrome'u sürer; kota dolarsa hesap cooldown'a alınıp sonraki hesaba geçilir; indirilen dosya min-bayt doğrulanır; kataloğa yazılır.
- **Çoklu hesap:** `~/.hmx/accounts/<provider>/<hesap>.json`; seçim "en az kullanılan aktif hesap"; kota → 6 saat cooldown; 3 ardışık normal hata → error.
- **Kalıcılık:** UI state (mesajlar, draft, model, agent, sekme, scroll) zustand/persist ile localStorage'da; bozuk veri zod ile reddedilip sıfırlanır (crash yok).

---

## BÖLÜM 2 — Dürüst zayıflık listesi

1. **Agent seçici sahte:** mevcut "agentlar" (`hmx-fast`, `media-producer`…) sadece system prompt eki. Gerçek agentik sistemler (Hermes turn-loop, OpenCode tool-use döngüsü) entegre edilmedi. → BÖLÜM 3.2'de kökten çözüm.
2. **Model seçici yarım:** LLM `/models` listesini çekiyor ama medya sağlayıcılarıyla birleşik "kullanılabilir model" kavramı yok; entegre olmayan model seçilebiliyor.
3. **UI hâlâ "iyi demo" seviyesinde:** token-CSS sistemi var ama tipografi skalası, spacing ritmi, focus ring'ler, skeleton loading, toast sistemi, boş durum illüstrasyonları eksik; ikonlar emoji.
4. **İş kuyruğu yok:** uzun medya üretimleri HTTP isteğini bloklar; iptal/yeniden dene yok.
5. **Loglar canlı akmıyor:** Logs sayfası 3 sn polling yapıyor; WebSocket/SSE tail yok.
6. **TUI ve CLI, yeni akıllı chat'i kullanmıyor** (eski plan-onay döngüsünde kaldılar).
7. **E2E test yok:** birim/API testleri var; gerçek kullanıcı senaryosu (login→üret→birleştir) otomatik değil.

---

## BÖLÜM 3 — Profesyonelleşme planı (ne, hangi dosyayla, nereden)

### 3.1 Görsel arayüzü profesyonelleştirme

| Yapılacak | Dosya | Not |
|---|---|---|
| Gerçek tasarım sistemi (tipografi skalası, 4px spacing grid, elevation, focus ring, motion tokenları) | `apps/web/src/styles/design-system.css` (yeni, theme.css'in yerine geçer) | Emoji ikonlar → Lucide (inline SVG, bağımlılık yok) |
| ChatView premium yeniden yazım | `apps/web/src/components/ChatView.tsx` | Markdown render, kod bloğu kopyalama, mesaj aksiyonları, tarih ayraçları |
| MessageList + Composer ayrımı | `components/MessageList.tsx`, `components/Composer.tsx` | ChatView şişmesin diye |
| Session paneli + Inspector polish | `components/SessionPanel.tsx`, `components/RightInspector.tsx` | Bilgi yoğun ama sakin |
| Command Palette (fuzzy search) | `components/CommandPalette.tsx` | Son kullanılanlar + skorlama |
| Sayfa paketi polish | `pages/*.tsx` | Tutarlı kart/tablo/form desenleri |

### 3.2 Agent seçimi — GERÇEK agentik sistemler (kökten düzeltme)

Yeni kontrat: `packages/agent-core/src/agents/base.ts`

```ts
export interface AgentDriver {
  id: string;
  name: string;
  kind: "native" | "hermes" | "opencode-style";
  capabilities: string[];          // ["chat","tools","browser","media"]
  isAvailable(): Promise<boolean>; // köprü/kurulum kontrolü
  chat(messages, opts): AsyncIterable<string>;  // streaming token
}
```

| Agent sistemi | Dosya | Gerçeklik |
|---|---|---|
| **HMX Native** | `agents/hmx-native.ts` | Mevcut disiplinli döngü (plan/doğrula/goal-reinjection) |
| **Hermes Loop** | `agents/hermes-loop.ts` | Hermes'in turn-loop deseninin TS portu: plan→araç çağrısı→doğrulama→iteration bütçesi; `hmx-hermes-pack` üzerinden canlı Hermes köprüsü opsiyonel |
| **OpenCode-style** | `agents/opencode-agent.ts` | OpenCode'un tool-use döngüsü deseni: permission modes (ask/allow), tool call trace, session paylaşımı |

Registry (`agent-core/registry.ts`) artık prompt eki değil, **driver** döndürür; `isAvailable()` false ise UI'da "pasif" rozetiyle görünür, seçilemez. Seçici yalnızca registry'den beslenir — hardcode liste yok.

### 3.3 Model seçimi — yalnızca entegre modeller

`packages/providers/src/model-registry.ts` (yeni): kaynaklar = LLM endpoint `/models` + medya sağlayıcı config'lerinin `model` alanları. UI yalnızca buradan listeler; endpoint cevap vermiyorsa selector "kayıtlı tek model: <env modeli>"na düşer ve durum rozeti gösterir.

### 3.4 Altyapı iyileştirmeleri

| Yapılacak | Dosya |
|---|---|
| Structured logger (renderer+main+startup+crash+wizard+agent) | `packages/core/src/logger.ts` |
| İş kuyruğu (uzun üretimler: kuyruk, iptal, retry, panel izleme) | `packages/core/src/jobs.ts` + `/api/jobs` |
| Canlı log akışı (SSE tail) | `dashboard-api` `/api/logs/:name/stream` |
| CLI/TUI akıllı chat'e taşıma | `apps/cli`, `apps/tui` |

---

## BÖLÜM 4 — AI görev paketi nasıl kullanılır

1. `docs/ai-gorev-promptlari/` altındaki ilgili `.md` dosyasını aç.
2. İçindeki promptu **olduğu gibi** hedef AI'ya yapıştır (Claude Opus 5.5 / GPT vb.).
3. AI'ın ürettiği dosyayı(ları) al, bu projeyi çalıştıran ajanıma gönder.
4. Ben (Kimi) dosyayı analiz eder, kontrata uydurur, projeye entegre eder, testleri koştururum.

**Entegrasyon kuralları (her promptta da yazılı):**
- Export kontratı aynen korunur (isim, imza, dönüş tipi).
- Yeni npm bağımlılığı eklenmez (Lucide SVG'leri inline; UI bağımlılıksız kalır).
- TypeScript strict; `any` yalnızca sınır noktalarında.
- Türkçe UI metinleri; kod yorumları Türkçe.

### Görev dosyaları listesi

| # | Dosya | Üretilecek | Önerilen model |
|---|---|---|---|
| 01 | `promptlari/01-design-system.md` | `styles/design-system.css` | Opus/GPT |
| 02 | `02-message-list.md` | `components/MessageList.tsx` | Opus/GPT |
| 03 | `03-composer.md` | `components/Composer.tsx` | Opus/GPT |
| 04 | `04-chat-view.md` | `components/ChatView.tsx` (yeniden) | Opus/GPT |
| 05 | `05-session-panel.md` | `components/SessionPanel.tsx` (yeniden) | GPT |
| 06 | `06-right-inspector.md` | `components/RightInspector.tsx` (yeniden) | GPT |
| 07 | `07-command-palette.md` | `components/CommandPalette.tsx` (yeniden) | GPT |
| 08 | `08-pages-polish.md` | `pages/*.tsx` polish paketi | Opus/GPT |
| 09 | `09-agent-base.md` | `agents/base.ts` + registry bağlantısı | Opus |
| 10 | `10-hermes-loop.md` | `agents/hermes-loop.ts` | Opus |
| 11 | `11-opencode-agent.md` | `agents/opencode-agent.ts` | Opus |
| 12 | `12-model-registry.md` | `providers/src/model-registry.ts` | GPT |
| 13 | `13-logger.md` | `core/src/logger.ts` | GPT |
| 14 | `14-jobs-queue.md` | `core/src/jobs.ts` + `/api/jobs` | Opus |
| 15 | `15-settings-page.md` | `pages/Settings.tsx` (yeniden, approval mode dahil) | GPT |
