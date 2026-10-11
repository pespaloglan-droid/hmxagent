import { useEffect, useState } from "react";
import { useUiStore } from "./stores/uiStore";
import { useSessionStore } from "./stores/sessionStore";
import { useResource, type Health } from "./components/pageData";
import { SessionPanel } from "./components/SessionPanel";
import { ChatView } from "./components/ChatView";
import { RightInspector } from "./components/RightInspector";
import { CommandPalette } from "./components/CommandPalette";
import { Badge, Button, Dialog, Icon, type IconName } from "./components/ui";
import { SessionsPage } from "./pages/Sessions";
import { ServersPage } from "./pages/Servers";
import { ProvidersPage } from "./pages/Providers";
import { ModelsPage } from "./pages/Models";
import { PipelinePage } from "./pages/Pipeline";
import { LogsPage } from "./pages/Logs";
import { SettingsPage } from "./pages/Settings";
import { WizardPage } from "./pages/Wizard";
const NAV: { id: string; icon: IconName; label: string }[] = [
  { id: "chat", icon: "file", label: "Sohbet" },
  { id: "sessions", icon: "layers", label: "Oturumlar" },
  { id: "servers", icon: "server", label: "Sunucular" },
  { id: "providers", icon: "link", label: "Sağlayıcılar" },
  { id: "models", icon: "layers", label: "Modeller" },
  { id: "pipeline", icon: "play", label: "Medya akışı" },
  { id: "logs", icon: "file", label: "Günlükler" },
  { id: "settings", icon: "settings", label: "Ayarlar" },
];
export function App(): JSX.Element {
  const ui = useUiStore();
  const health = useResource<Health>("/api/health");
  const [menu, setMenu] = useState(false);
  const [sessions, setSessions] = useState(false);
  const [inspector, setInspector] = useState(false);
  useEffect(() => {
    const store = useSessionStore.getState();
    if (!store.activeSessionId) store.createSession();
    if (window.location.hash === "#/wizard")
      useUiStore.getState().setWizardOpen(true);
  }, []);
  useEffect(() => {
    if (health.data?.firstRun) useUiStore.getState().setWizardOpen(true);
  }, [health.data?.firstRun]);
  useEffect(() => {
    setMenu(false);
    setSessions(false);
    setInspector(false);
  }, [ui.page]);
  return (
    <div
      className="app-shell"
      data-page={ui.page}
      data-menu-open={menu}
      data-sessions-open={sessions}
      data-inspector-open={inspector}
    >
      <header className="app-topbar">
        <Button
          className="shell-toggle menu-toggle"
          variant="secondary"
          icon="layers"
          aria-label="Ana menüyü aç veya kapat"
          aria-pressed={menu}
          onClick={() => setMenu((v) => !v)}
        >
          Menü
        </Button>
        <div className="brand">
          <img src="/branding/hmx-mark.webp" alt="HMX" />
          <strong>HMX Agent</strong>
        </div>
        <button
          type="button"
          className="app-search"
          onClick={() => ui.setPaletteOpen(true)}
        >
          <Icon name="search" />
          <span>Model, sağlayıcı veya komut ara…</span>
          <kbd>Ctrl / ⌘ K</kbd>
        </button>
        <div className="app-status">
          <span
            className={`dot ${health.data?.ok ? "ok" : health.loading ? "warn" : "err"}`}
          />
          {health.data?.ok
            ? "Dashboard hazır"
            : health.loading
              ? "Bağlanıyor"
              : "Bağlantı yok"}
        </div>
        {ui.page === "chat" && (
          <Button
            className="shell-toggle session-toggle"
            variant="secondary"
            icon="file"
            aria-label="Oturum panelini aç veya kapat"
            aria-pressed={sessions}
            onClick={() => setSessions((v) => !v)}
          >
            Oturumlar
          </Button>
        )}
        <Button
          className="shell-toggle inspector-toggle"
          variant="secondary"
          icon="settings"
          aria-label="Durum panelini aç veya kapat"
          aria-pressed={inspector}
          onClick={() => setInspector((v) => !v)}
        >
          Durum
        </Button>
      </header>
      <aside className="left-sidebar" aria-label="Ana menü">
        <nav>
          {NAV.map((item) => (
            <button
              type="button"
              key={item.id}
              className={ui.page === item.id ? "active" : ""}
              aria-current={ui.page === item.id ? "page" : undefined}
              onClick={() => {
                ui.setPage(item.id);
                setMenu(false);
              }}
            >
              <Icon name={item.icon} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sb-status">
          <Badge tone={health.data?.ok ? "ok" : "warn"}>
            HMX {health.data?.version ?? ""}
          </Badge>
          <span className="muted">Yerel kontrol merkezi</span>
        </div>
      </aside>
      {ui.page === "chat" && <SessionPanel />}
      <main className="workspace">
        <div className="workspace-body">
          {ui.page === "chat" && <ChatView />}
          {ui.page === "sessions" && <SessionsPage />}
          {ui.page === "servers" && <ServersPage health={health.data} />}
          {ui.page === "providers" && <ProvidersPage />}
          {ui.page === "models" && <ModelsPage />}
          {ui.page === "pipeline" && <PipelinePage />}
          {ui.page === "logs" && <LogsPage />}
          {ui.page === "settings" && <SettingsPage />}
        </div>
      </main>
      <aside className="right-inspector" aria-label="Durum paneli">
        <RightInspector page={ui.page} />
      </aside>
      <CommandPalette />
      {ui.wizardOpen && (
        <Dialog
          title="Kurulum sihirbazı"
          onClose={() => ui.setWizardOpen(false)}
        >
          <WizardPage onDone={() => ui.setWizardOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}
