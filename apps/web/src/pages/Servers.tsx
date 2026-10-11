import React from "react";

export function ServersPage({ health }: { health: any }) {
  return (
    <div>
      <h2 className="page-title">Servers</h2>
      <div className="grid cols-2">
        <div className="card">
          <b>LLM Endpoint</b>
          <p className="mono muted">{health?.llm?.baseUrl ?? "—"}</p>
          <p>Model: <span className="badge">{health?.llm?.model ?? "—"}</span></p>
        </div>
        <div className="card">
          <b>Yerel Servisler</b>
          <p>ffmpeg: {health?.ffmpeg ? <span className="badge ok">hazır</span> : <span className="badge err">yok</span>}</p>
          <p>Veri dizini: <span className="mono muted">{health?.home ?? "—"}</span></p>
        </div>
      </div>
      <div className="card">
        <b>MCP Sunucuları</b> <span className="badge warn">yakında</span>
        <p className="muted">Harici MCP sunucuları bu sekmeden yönetilecek.</p>
      </div>
    </div>
  );
}
