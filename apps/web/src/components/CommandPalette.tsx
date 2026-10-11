import React, { useEffect, useRef, useState } from "react";
import { useUiStore } from "../stores/uiStore";
import { useSessionStore } from "../stores/sessionStore";

const COMMANDS = [
  { id: "chat", label: "💬 Chat'e git", page: "chat" },
  { id: "sessions", label: "🗂 Sessions", page: "sessions" },
  { id: "providers", label: "🔌 Providers & Accounts", page: "providers" },
  { id: "models", label: "🧠 Models", page: "models" },
  { id: "pipeline", label: "🎬 Pipeline", page: "pipeline" },
  { id: "logs", label: "📜 Logs", page: "logs" },
  { id: "settings", label: "⚙️ Settings", page: "settings" },
  { id: "wizard", label: "🪄 Kurulum Sihirbazını aç", wizard: true },
  { id: "new", label: "➕ Yeni Oturum", newSession: true },
];

/** Ctrl/Cmd+K command palette */
export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const setPage = useUiStore((s) => s.setPage);
  const setWizardOpen = useUiStore((s) => s.setWizardOpen);
  const createSession = useSessionStore((s) => s.createSession);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => { if (open) { setQuery(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  if (!open) return null;
  const filtered = COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  const run = (c: (typeof COMMANDS)[number]) => {
    setOpen(false);
    if ("wizard" in c) setWizardOpen(true);
    else if ("newSession" in c) { createSession(); setPage("chat"); }
    else if (c.page) setPage(c.page);
  };

  return (
    <div className="modal-bg" onClick={() => setOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input ref={inputRef} placeholder="Komut ara… (Esc kapat)" value={query}
          onChange={(e) => { setQuery(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel(Math.min(sel + 1, filtered.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel(Math.max(sel - 1, 0)); }
            if (e.key === "Enter" && filtered[sel]) run(filtered[sel]);
          }} />
        <div style={{ maxHeight: 300, overflowY: "auto", marginTop: 6 }}>
          {filtered.map((c, i) => (
            <div key={c.id} className={`sel-item ${i === sel ? "active" : ""}`}
              onMouseEnter={() => setSel(i)} onClick={() => run(c)}>{c.label}</div>
          ))}
          {filtered.length === 0 && <div className="muted" style={{ padding: 10 }}>Eşleşen komut yok.</div>}
        </div>
      </div>
    </div>
  );
}
