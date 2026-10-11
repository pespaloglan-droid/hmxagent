import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useSessionStore } from "../stores/sessionStore";
import { AgentSelector } from "./AgentSelector";
import { ModelSelector } from "./ModelSelector";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "code", label: "Kod" },
  { id: "files", label: "Dosyalar" },
  { id: "images", label: "Görseller" },
  { id: "video", label: "Videolar" },
  { id: "audio", label: "Sesler" },
] as const;

/**
 * ChatView (root-cause fix'ler):
 *  - Enter -> mesaj ANINDA gonderilir (optimistic), streaming placeholder acilir
 *  - Basit mesajlarda onay YOK (server dryRun karari: safe -> direkt stream)
 *  - Onay sadece policy'nin istedigi durumlarda (inline, modal degil)
 *  - Hata: mesaj kaybolmaz, retry butonu gelir, oturum bozulmaz
 */
export function ChatView() {
  const store = useSessionStore();
  const session = store.activeSessionId ? store.sessions[store.activeSessionId] : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pendingApproval, setPendingApproval] = useState<{ text: string; risk: string } | null>(null);

  // Scroll restore + kaydet
  useEffect(() => {
    if (scrollRef.current && session) scrollRef.current.scrollTop = session.scrollOffset;
  }, [session?.id]);

  useEffect(() => {
    if (scrollRef.current && session?.messages.some((m) => m.streaming)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  if (!session) {
    return (
      <div className="empty-state">
        <h2>Bir oturum seç veya başlat</h2>
        <p className="muted">Soldan mevcut oturumu seçebilir veya yeni bir tane oluşturabilirsin.</p>
        <button className="btn" onClick={() => store.createSession()}>+ Yeni Oturum</button>
      </div>
    );
  }

  const send = async (text: string, confirmed = false) => {
    const sid = session.id;
    if (!text.trim()) return;
    store.updateDraft(sid, "");
    store.appendMessage(sid, { id: crypto.randomUUID(), role: "user", content: text, createdAt: Date.now() });

    // 1) Policy karari (dryRun: calistirmadan karar ver)
    let decision: any;
    try {
      decision = await api.post("/api/chat/smart", {
        message: text, sessionId: sid, model: session.selectedModelId, agentId: session.selectedAgentId,
        dryRun: true, confirmed,
      });
    } catch (e: any) {
      store.appendMessage(sid, { id: crypto.randomUUID(), role: "assistant", content: "", createdAt: Date.now(), error: e.message });
      return;
    }

    if (decision.mode === "needs-approval" && !confirmed) {
      setPendingApproval({ text, risk: decision.risk ?? "moderate" });
      return;
    }

    // 2) Medya rotasi
    if (decision.mode === "media") {
      const r = await api.post("/api/chat/smart", { message: text, sessionId: sid, model: session.selectedModelId, agentId: session.selectedAgentId, confirmed: true });
      const lines = (r.results ?? []).map((x: any) =>
        x.ok ? `✅ ${x.kind}: ${x.filePath} (${x.provider})` : `❌ ${x.kind}: ${x.error}`);
      store.appendMessage(sid, { id: crypto.randomUUID(), role: "assistant", content: lines.join("\n") || "Sonuç yok", createdAt: Date.now() });
      return;
    }

    // 3) Direkt streaming sohbet
    const msgId = crypto.randomUUID();
    store.appendMessage(sid, { id: msgId, role: "assistant", content: "", createdAt: Date.now(), streaming: true });
    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sid, model: session.selectedModelId, agentId: session.selectedAgentId }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const payload = JSON.parse(line.slice(5));
          if (payload.token) {
            const cur = useSessionStore.getState().sessions[sid]?.messages.find((m) => m.id === msgId);
            store.updateMessage(sid, msgId, { content: (cur?.content ?? "") + payload.token });
          }
          if (payload.error) throw new Error(payload.error);
        }
      }
      store.updateMessage(sid, msgId, { streaming: false });
    } catch (e: any) {
      store.updateMessage(sid, msgId, { streaming: false, error: e.message });
    }
  };

  return (
    <div className="chat-view">
      {/* Ust bar: session basligi + sekmeler */}
      <div className="chat-header">
        <b>{session.title}</b>
        <div className="chat-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={session.activeTab === t.id ? "active" : ""}
              onClick={() => store.setTab(session.id, t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {session.activeTab !== "chat" ? (
        <AssetGrid kind={session.activeTab} />
      ) : (
        <>
          <div className="chat-messages" ref={scrollRef}
            onScroll={(e) => store.setScroll(session.id, (e.target as HTMLDivElement).scrollTop)}>
            {session.messages.length === 0 && (
              <div className="empty-state">
                <h3>Ne yapmamı istersin?</h3>
                <p className="muted">Sohbet et, görev ver veya <span className="mono">@image:Flow AI …</span> ile medya üret.</p>
              </div>
            )}
            {session.messages.map((m) => (
              <div key={m.id} className={`msg ${m.role === "user" ? "user" : m.error ? "error" : "agent"}`}>
                {m.content}
                {m.streaming && <span className="streaming-caret">▌</span>}
                {m.error && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ color: "var(--err)" }}>Hata: {m.error}</span>{" "}
                    <button className="btn sm ghost" onClick={() => {
                      const lastUser = [...session.messages].reverse().find((x) => x.role === "user");
                      store.replaceMessages(session.id, session.messages.filter((x) => x.id !== m.id));
                      if (lastUser) void send(lastUser.content);
                    }}>↻ Tekrar dene</button>
                  </div>
                )}
              </div>
            ))}
            {pendingApproval && (
              <div className="msg agent">
                <b>⚠ Onay gerekiyor</b> <span className="badge warn">{pendingApproval.risk}</span>
                <p className="muted" style={{ fontSize: 12 }}>Bu işlem riskli olabilir. Devam edilsin mi?</p>
                <button className="btn sm" onClick={() => { const t = pendingApproval.text; setPendingApproval(null); void send(t, true); }}>Onayla</button>{" "}
                <button className="btn sm ghost" onClick={() => setPendingApproval(null)}>İptal</button>
              </div>
            )}
          </div>

          {/* Composer: ajan + model + mod secicileri */}
          <div className="composer">
            <textarea
              value={session.draft}
              onChange={(e) => store.updateDraft(session.id, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(session.draft); } }}
              placeholder="Mesaj yaz… (Enter gönder, Shift+Enter yeni satır)"
            />
            <div className="composer-bar">
              <AgentSelector value={session.selectedAgentId} onChange={(id) => store.setAgent(session.id, id)} />
              <ModelSelector value={session.selectedModelId} onChange={(id) => store.setModel(session.id, id)} />
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={() => void send(session.draft)}>Gönder ⏎</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Chat disi sekmeler: varlik katalogu filtresi (bos kutu degil) */
function AssetGrid({ kind }: { kind: string }) {
  const [assets, setAssets] = useState<any[]>([]);
  const typeMap: Record<string, string> = { images: "image", video: "video", audio: "audio" };
  useEffect(() => {
    const type = typeMap[kind];
    if (type) api.get(`/api/assets?type=${type}`).then(setAssets).catch(() => {});
    else setAssets([]);
  }, [kind]);
  if (!typeMap[kind]) {
    return <div className="empty-state"><p className="muted">{kind === "code" ? "Kod görünümü" : "Dosyalar"} — yakında.</p></div>;
  }
  return (
    <div className="chat-messages" style={{ padding: 16 }}>
      {assets.length === 0 && <div className="empty-state"><p className="muted">Bu türde varlık yok. Chat'ten @ ile üretebilirsin.</p></div>}
      <div className="grid cols-3">
        {assets.map((a) => (
          <div key={a.id} className="card">
            <span className={`badge ${a.status === "verified" ? "ok" : "err"}`}>{a.status === "verified" ? "✓" : "✗ eksik"}</span>
            <p style={{ fontSize: 12, margin: "8px 0 4px" }}>{a.prompt.slice(0, 80)}</p>
            <p className="muted mono" style={{ fontSize: 10 }}>{a.filePath}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
