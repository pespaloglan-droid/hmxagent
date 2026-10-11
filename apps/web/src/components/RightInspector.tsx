import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useSessionStore } from "../stores/sessionStore";

/** Contextual sag panel: sayfaya gore icerik (bos kutu degil) */
export function RightInspector({ page }: { page: string }) {
  const [routing, setRouting] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    api.get("/api/routing").then(setRouting).catch(() => {});
    api.get("/api/health").then(setHealth).catch(() => {});
  }, [page]);

  if (page === "chat") return <ChatInspector routing={routing} health={health} />;
  if (page === "providers") return <ProvidersInspector routing={routing} />;
  return <StatusInspector health={health} routing={routing} />;
}

function ChatInspector({ routing, health }: any) {
  const activeId = useSessionStore((s) => s.activeSessionId);
  const session = useSessionStore((s) => (s.activeSessionId ? s.sessions[s.activeSessionId] : null));
  return (
    <>
      <div className="card">
        <b>Aktif Oturum</b>
        {session ? (
          <>
            <p style={{ marginBottom: 4 }}>{session.title}</p>
            <p className="muted" style={{ fontSize: 12 }}>
              {session.messages.length} mesaj · {session.activeTab} sekmesi
            </p>
            <p style={{ fontSize: 12 }}>
              {session.selectedAgentId && <span className="badge">{session.selectedAgentId}</span>}{" "}
              {session.selectedModelId && <span className="badge dim">{session.selectedModelId}</span>}
            </p>
          </>
        ) : (
          <p className="muted">Oturum seçili değil.</p>
        )}
      </div>
      <div className="card">
        <b>Sağlayıcı Durumu</b>
        {(routing?.accounts ?? []).slice(0, 5).map((a: any) => (
          <p key={a.id} style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
            <span className={`dot ${a.status === "active" ? "ok" : a.status === "cooldown" ? "warn" : "err"}`} />
            <span>{a.label}</span>
            <span className="muted">{a.provider}</span>
          </p>
        ))}
        {(routing?.accounts ?? []).length === 0 && <p className="muted" style={{ fontSize: 12 }}>Hesap yok.</p>}
      </div>
      <div className="card">
        <b>Token Saver</b>
        <p style={{ fontSize: 13 }}>
          <span className="badge ok">%{Math.round((routing?.tokenSaver?.savedRatio ?? 0) * 100)} tasarruf</span>
        </p>
        <p className="muted" style={{ fontSize: 11 }}>{routing?.tokenSaver?.compressedCount ?? 0} çıktı sıkıştırıldı</p>
      </div>
    </>
  );
}

function ProvidersInspector({ routing }: any) {
  const circuits = (routing?.circuits ?? []).filter((c: any) => c.open);
  return (
    <>
      <div className="card">
        <b>Zincir Özeti</b>
        {Object.entries(routing?.order ?? {}).map(([kind, order]: any) => (
          <p key={kind} style={{ fontSize: 12 }}>
            <span className="badge dim">{kind}</span>{" "}
            <span className="muted">{(order as string[]).join(" → ") || "—"}</span>
          </p>
        ))}
      </div>
      <div className="card">
        <b>Devre Kesici</b>
        {circuits.length === 0
          ? <p className="muted" style={{ fontSize: 12 }}>Açık devre yok ✓</p>
          : circuits.map((c: any) => <p key={c.id}><span className="badge err">{c.id}</span></p>)}
      </div>
    </>
  );
}

function StatusInspector({ health, routing }: any) {
  return (
    <div className="card">
      <b>Sistem Sağlığı</b>
      <p style={{ fontSize: 12 }}>LLM: {health ? <span className="badge ok">{health.llm.model}</span> : <span className="badge err">yok</span>}</p>
      <p style={{ fontSize: 12 }}>ffmpeg: {health?.ffmpeg ? <span className="badge ok">hazır</span> : <span className="badge err">yok</span>}</p>
      <p style={{ fontSize: 12 }}>Hesaplar: {health?.quota?.accounts ?? 0} · cooldown: {health?.quota?.cooldown ?? 0}</p>
    </div>
  );
}
