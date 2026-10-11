# GÖREV 04 — ChatView yeniden yazım (ana çalışma alanı)

## Bağlam
HMX Agent chat ana görünümü. Backend uçları (hepsi mevcut, değiştirme):
- `POST /api/chat/smart {message, sessionId, model, agentId, dryRun|confirmed}` →
  `{mode:"chat"|"media"|"needs-approval", risk?, directives?, results?, reply?}`
- `POST /api/chat/stream {message, sessionId, model, agentId}` → SSE akışı,
  her blok `data: {"token":"..."}` veya `{"done":true}` veya `{"error":"..."}`
- `GET /api/assets?type=image|video|audio` → varlık listesi

Session store (zustand, mevcut — `apps/web/src/stores/sessionStore.ts`):
`sessions[id] = { id, title, selectedAgentId, selectedModelId, activeTab, draft, messages[], scrollOffset, updatedAt }`,
aksiyonlar: `setTab, updateDraft, appendMessage, updateMessage, setScroll`.

## Üretilecek dosya
`apps/web/src/components/ChatView.tsx` — mevcut dosyanın TAMAMEN yeniden yazımı.

## Kontrat
```tsx
export function ChatView(): JSX.Element;
```
İçinde MessageList (GÖREV 02), Composer (GÖREV 03), AgentSelector, ModelSelector kullanır.
Bu bileşenler yoksa named import ile bekle — entegratör bağlar.

## Zorunlu davranış
1. **Üst bar:** session başlığı + durum badge'i + sekmeler (Chat/Kod/Dosyalar/Görseller/Videolar/Sesler).
2. **Gönderme akışı:** optimistic user mesajı → `/api/chat/smart` dryRun →
   `needs-approval` ise inline onay kartı (modal DEĞİL) → `chat` ise `/api/chat/stream` ile
   streaming; `media` ise sonuçları mesaj olarak bas.
3. Hata: mesaj kaybolmaz, error flag + retry.
4. Scroll: streaming'de otomatik aşağı; scrollOffset store'a yazılır, mount'ta restore.
5. Chat dışı sekmeler: `/api/assets` ile kart grid (verified/eksik rozeti).
6. Oturum yoksa şık empty state + "Yeni Oturum" butonu (`createSession` store'dan).

## Stil
Tasarım sistemi (GÖREV 01) class'ları. Referans: premium enterprise dark UI (Linear/VS Code hissi).
