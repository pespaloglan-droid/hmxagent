import React, { useEffect, useState } from "react";

/** Searchable + kategorili agent secici (aktif/pasif badge, favoriler, son kullanilanlar) */
export function AgentSelector({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem("hmx-fav-agents") ?? "[]"));
  const [recent, setRecent] = useState<string[]>(() => JSON.parse(localStorage.getItem("hmx-recent-agents") ?? "[]"));

  useEffect(() => {
    import("../api").then(({ api }) => api.get("/api/agents").then(setAgents).catch(() => {}));
  }, []);

  const active = agents.find((a) => a.id === value);

  function pick(id: string) {
    onChange(id);
    const next = [id, ...recent.filter((r) => r !== id)].slice(0, 5);
    setRecent(next);
    localStorage.setItem("hmx-recent-agents", JSON.stringify(next));
    setOpen(false);
  }

  function toggleFav(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("hmx-fav-agents", JSON.stringify(next));
  }

  const filtered = agents.filter((a) =>
    (a.name + a.id + (a.kind ?? "")).toLowerCase().includes(query.toLowerCase()));
  const KIND_LABELS: Record<string, string> = { native: "Yerleşik", hermes: "Hermes", "opencode-style": "OpenCode" };
  const cats = ["fav", "recent", "native", "hermes", "opencode-style"] as const;
  const byCat = (c: string) =>
    c === "fav" ? filtered.filter((a) => favorites.includes(a.id))
    : c === "recent" ? filtered.filter((a) => recent.includes(a.id)).sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id))
    : filtered.filter((a) => a.kind === c && !favorites.includes(a.id) && !recent.includes(a.id));

  return (
    <div style={{ position: "relative" }}>
      <button className="sel-btn" onClick={() => setOpen(!open)} title="Ajan sec">
        🤖 {active?.name ?? "Ajan: varsayılan"} ▾
      </button>
      {open && (
        <div className="sel-pop" onMouseLeave={() => setOpen(false)}>
          <input autoFocus placeholder="Ajan ara…" value={query} onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }} />
          {cats.map((c) => {
            const items = byCat(c);
            if (items.length === 0) return null;
            return (
              <div key={c}>
                <div className="sel-cat">{c === "fav" ? "⭐ Favoriler" : c === "recent" ? "🕘 Son kullanılan" : KIND_LABELS[c] ?? c}</div>
                {items.map((a) => (
                  <div key={a.id} className={`sel-item ${value === a.id ? "active" : ""}`} onClick={() => a.available && pick(a.id)}>
                    <span>{a.name}</span>
                    <span className="badge dim" style={{ fontSize: 10 }}>{a.kind}</span>
                    <span className={`badge ${a.available ? "ok" : "err"}`} style={{ fontSize: 10 }}>{a.available ? "aktif" : "pasif"}</span>
                    <span style={{ marginLeft: "auto", cursor: "pointer" }} onClick={(e) => toggleFav(a.id, e)}>
                      {favorites.includes(a.id) ? "★" : "☆"}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="muted" style={{ padding: 8 }}>Eşleşen ajan yok.</div>}
        </div>
      )}
    </div>
  );
}
