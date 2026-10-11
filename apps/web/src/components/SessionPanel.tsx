import React, { useState } from "react";
import { useSessionStore } from "../stores/sessionStore";

/** Sol orta panel: session listesi + arama + yeni oturum + durum badge'leri */
export function SessionPanel() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeId = useSessionStore((s) => s.activeSessionId);
  const { createSession, setActiveSession, removeSession, renameSession } = useSessionStore();
  const [query, setQuery] = useState("");

  const list = Object.values(sessions)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <aside className="session-panel">
      <div style={{ padding: "12px 12px 8px" }}>
        <input placeholder="Oturum ara…" value={query} onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%" }} />
      </div>
      <div style={{ padding: "0 12px 10px" }}>
        <button className="btn" style={{ width: "100%" }} onClick={() => createSession()}>+ Yeni Oturum</button>
      </div>
      <div className="session-list">
        {list.map((s) => {
          const lastMsg = s.messages.at(-1);
          const hasError = s.messages.some((m) => m.error);
          const streaming = s.messages.some((m) => m.streaming);
          return (
            <div key={s.id}
              className={`session-item ${s.id === activeId ? "active" : ""}`}
              onClick={() => setActiveSession(s.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className={`dot ${streaming ? "warn" : hasError ? "err" : "ok"}`} />
                <b style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  onDoubleClick={() => {
                    const t = prompt("Oturum adı:", s.title);
                    if (t) renameSession(s.id, t);
                  }}>{s.title}</b>
                <button className="icon-btn" title="Sil" onClick={(e) => { e.stopPropagation(); removeSession(s.id); }}>×</button>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 3, display: "flex", gap: 6 }}>
                <span>{s.messages.length} mesaj</span>
                {s.selectedModelId && <span>· {s.selectedModelId}</span>}
                {s.selectedAgentId && <span>· {s.selectedAgentId}</span>}
              </div>
              {lastMsg && (
                <div className="muted" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lastMsg.content.slice(0, 60)}
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="muted" style={{ padding: 16, fontSize: 12, textAlign: "center" }}>
            {query ? "Eşleşen oturum yok." : "Henüz oturum yok. \"Yeni Oturum\" ile başla."}
          </div>
        )}
      </div>
    </aside>
  );
}
