import React, { useEffect, useState } from "react";
import { api } from "../api";

export function LogsPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => { api.get("/api/logs").then(setFiles).catch(() => {}); }, []);

  // Canli kuyruk: secili dosya 3 sn'de bir yenilenir
  useEffect(() => {
    if (!active) return;
    const load = () => api.get(`/api/logs/${active}?tail=200`).then((r) => setLines(r.lines)).catch(() => {});
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, [active]);

  return (
    <div>
      <h2 className="page-title">Logs</h2>
      <div className="grid" style={{ gridTemplateColumns: "260px 1fr" }}>
        <div className="card" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {files.map((f) => (
            <div key={f} className="log-line mono" style={{ cursor: "pointer", color: active === f ? "var(--accent)" : undefined }}
              onClick={() => setActive(f)}>{f}</div>
          ))}
          {files.length === 0 && <p className="muted">Günlük yok.</p>}
        </div>
        <div className="card mono" style={{ maxHeight: "70vh", overflowY: "auto", fontSize: 12 }}>
          {!active && <p className="muted">Soldan dosya seç.</p>}
          {lines.map((l, i) => <div key={i} className="log-line">{l}</div>)}
        </div>
      </div>
    </div>
  );
}
