import React, { useEffect, useState } from "react";
import { api } from "../api";

const ICONS: Record<string, string> = {
  goal: "🎯", plan: "📋", action: "⚙️", verify: "✅", error: "❌", deliver: "🏁", note: "📝",
};

export function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [detail, setDetail] = useState<{ id: string; events: any[] } | null>(null);

  useEffect(() => {
    api.get("/api/sessions").then(setSessions).catch(() => {});
  }, []);

  async function open(id: string) {
    const events = await api.get(`/api/sessions/${id}`);
    setDetail({ id, events });
  }

  if (detail) {
    return (
      <div>
        <h2 className="page-title">
          <button className="btn sm ghost" onClick={() => setDetail(null)}>← Geri</button>{" "}
          Oturum: {detail.id}
        </h2>
        <div className="card">
          {detail.events.map((e, i) => (
            <div key={i} className="log-line" style={{ display: "flex", gap: 10 }}>
              <span>{ICONS[e.type] ?? "•"}</span>
              <span className="muted mono" style={{ flexShrink: 0 }}>#{e.step}</span>
              <span style={{ color: e.type === "error" ? "var(--err)" : undefined }}>{e.summary}</span>
              <span className="muted mono" style={{ marginLeft: "auto", flexShrink: 0 }}>{String(e.ts).slice(11, 19)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Sessions</h2>
      <div className="card">
        {sessions.length === 0 && <p className="muted">Henüz oturum yok.</p>}
        {sessions.length > 0 && (
          <table>
            <thead><tr><th>Oturum</th><th>Hedef</th><th>Adım</th><th>Hata</th><th>Son</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => open(s.id)}>
                  <td className="mono">{s.id}</td>
                  <td>{s.title.slice(0, 60)}</td>
                  <td>{s.steps}</td>
                  <td>{s.errors > 0 ? <span className="badge err">{s.errors}</span> : "0"}</td>
                  <td className="muted">{String(s.lastTs ?? "").slice(0, 19).replace("T", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
