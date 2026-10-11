import React, { useEffect } from "react";
import { api } from "./api";
import { useUiStore } from "./stores/uiStore";
import { useSessionStore } from "./stores/sessionStore";
import { SessionPanel } from "./components/SessionPanel";
import { ChatView } from "./components/ChatView";
import { RightInspector } from "./components/RightInspector";
import { CommandPalette } from "./components/CommandPalette";
import { SessionsPage } from "./pages/Sessions";
import { ServersPage } from "./pages/Servers";
import { ProvidersPage } from "./pages/Providers";
import { ModelsPage } from "./pages/Models";
import { PipelinePage } from "./pages/Pipeline";
import { LogsPage } from "./pages/Logs";
import { SettingsPage } from "./pages/Settings";
import { WizardPage } from "./pages/Wizard";

const NAV = [
  { id: "chat", icon: "💬", label: "Chat" },
  { id: "sessions", icon: "🗂", label: "Sessions" },
  { id: "servers", icon: "🖥", label: "Servers" },
  { id: "providers", icon: "🔌", label: "Providers" },
  { id: "models", icon: "🧠", label: "Models" },
  { id: "pipeline", icon: "🎬", label: "Pipeline" },
  { id: "logs", icon: "📜", label: "Logs" },
  { id: "settings", icon: "⚙️", label: "Settings" },
] as const;

export function App() {
  const page = useUiStore((s) => s.page);
  const setPage = useUiStore((s) => s.setPage);
  const wizardOpen = useUiStore((s) => s.wizardOpen);
  const setWizardOpen = useUiStore((s) => s.setWizardOpen);
  const [health, setHealth] = React.useState<any>(null);
  const createSession = useSessionStore((s) => s.createSession);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  // Ilk acilis: wizard (hash veya firstRun) + en az bir session olsun
  useEffect(() => {
    if (window.location.hash === "#/wizard") setWizardOpen(true);
    api.get("/api/health").then((h) => {
      setHealth(h);
      if (h.firstRun) setWizardOpen(true);
    }).catch(() => setHealth(null));
    if (!activeSessionId) createSession();
  }, []);

  return (
    <div className="app-shell">
      {/* Sol ince sidebar */}
      <aside className="left-sidebar">
        <div className="logo-mark">H</div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={page === n.id ? "active" : ""} title={n.label}
              onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 17 }}>{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sb-status" title={health ? `LLM: ${health.llm.model}` : "LLM bagli degil"}>
          <span className={`dot ${health ? "ok" : "err"}`} />
        </div>
      </aside>

      {/* Sol orta: session paneli (sadece chat sayfasinda) */}
      {page === "chat" && <SessionPanel />}

      {/* Orta ana calisma alani */}
      <main className="workspace">
        <div className="topbar">
          <button className="topbar-search" onClick={() => useUiStore.getState().setPaletteOpen(true)}>
            🔎 Ara veya komut çalıştır… <kbd>Ctrl K</kbd>
          </button>
        </div>
        <div className="workspace-body">
          {page === "chat" && <ChatView />}
          {page === "sessions" && <SessionsPage />}
          {page === "servers" && <ServersPage health={health} />}
          {page === "providers" && <ProvidersPage />}
          {page === "models" && <ModelsPage />}
          {page === "pipeline" && <PipelinePage />}
          {page === "logs" && <LogsPage />}
          {page === "settings" && <SettingsPage />}
        </div>
      </main>

      {/* Sag contextual inspector */}
      <aside className="right-inspector">
        <RightInspector page={page} />
      </aside>

      <CommandPalette />
      {wizardOpen && (
        <div className="modal-bg">
          <div className="modal" style={{ width: 560 }}>
            <WizardPage onDone={() => setWizardOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
