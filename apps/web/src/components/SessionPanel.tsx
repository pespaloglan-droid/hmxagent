import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "../stores/sessionStore";
import { Button, Icon } from "./ui";
function relative(ts: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  return minutes < 1
    ? "Şimdi"
    : minutes < 60
      ? `${minutes} dk önce`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)} sa önce`
        : `${Math.floor(minutes / 1440)} gün önce`;
}
function group(ts: number): string {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return ts >= today
    ? "Bugün"
    : ts >= monday.getTime()
      ? "Bu hafta"
      : "Daha eski";
}
export function SessionPanel(): JSX.Element {
  const store = useSessionStore();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  const list = Object.values(store.sessions)
    .filter((s) =>
      `${s.title} ${s.messages.at(-1)?.content ?? ""}`
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR")),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const rename = () => {
    if (editing && title.trim()) {
      store.renameSession(editing, title.trim().slice(0, 120));
      setEditing(null);
    }
  };
  return (
    <aside className="session-panel" aria-label="Çalışma oturumları">
      <header>
        <div className="session-line">
          <h2>Oturumlar</h2>
          <span className="badge dim">
            {Object.keys(store.sessions).length}
          </span>
        </div>
        <input
          type="search"
          aria-label="Oturumlarda ara"
          placeholder="Başlık veya son mesaj…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button icon="plus" onClick={() => store.createSession()}>
          Yeni oturum
        </Button>
      </header>
      <div className="session-list">
        {list.map((session, index) => {
          const previous = list[index - 1];
          const status = session.messages.some((m) => m.streaming)
            ? "warn"
            : session.messages.some((m) => m.error)
              ? "err"
              : "ok";
          return (
            <div key={session.id}>
              {(!previous ||
                group(previous.updatedAt) !== group(session.updatedAt)) && (
                <h3 className="session-group-title">
                  {group(session.updatedAt)}
                </h3>
              )}
              <div
                className={`session-row ${session.id === store.activeSessionId ? "active" : ""}`}
              >
                {editing === session.id ? (
                  <form
                    className="session-rename"
                    onSubmit={(e) => {
                      e.preventDefault();
                      rename();
                    }}
                  >
                    <input
                      aria-label="Yeni oturum adı"
                      autoFocus
                      maxLength={120}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditing(null);
                      }}
                    />
                    <Button
                      variant="secondary"
                      disabled={!title.trim()}
                      type="submit"
                    >
                      Kaydet
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="session-open"
                    ref={(node) => {
                      refs.current[session.id] = node;
                    }}
                    aria-current={
                      store.activeSessionId === session.id ? "true" : undefined
                    }
                    onClick={() => store.setActiveSession(session.id)}
                    onDoubleClick={() => {
                      setEditing(session.id);
                      setTitle(session.title);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                        const next =
                          (index +
                            (e.key === "ArrowDown" ? 1 : -1) +
                            list.length) %
                          list.length;
                        refs.current[list[next].id]?.focus();
                      }
                      if (e.key === "F2") {
                        e.preventDefault();
                        setEditing(session.id);
                        setTitle(session.title);
                      }
                    }}
                  >
                    <span className="session-line">
                      <span
                        className={`dot ${status}`}
                        aria-label={
                          status === "warn"
                            ? "Çalışıyor"
                            : status === "err"
                              ? "Hata var"
                              : "Hazır"
                        }
                      />
                      <strong>{session.title}</strong>
                    </span>
                    <span className="session-preview">
                      {session.messages.at(-1)?.content ||
                        "İlk mesajınızı bekliyor"}
                    </span>
                    <span className="session-meta">
                      <span>{relative(session.updatedAt)}</span>
                      {session.selectedModelId && (
                        <span>
                          {session.selectedModelId.replace(/^llm:/, "")}
                        </span>
                      )}
                      {session.selectedAgentId && (
                        <span>{session.selectedAgentId}</span>
                      )}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="session-delete"
                  aria-label={`${session.title} oturumunu sil`}
                  onClick={() => setDeleting(session.id)}
                >
                  <Icon name="trash" />
                </button>
                {deleting === session.id && (
                  <div className="session-confirm">
                    <span>Emin misiniz?</span>
                    <Button
                      variant="danger"
                      onClick={() => {
                        store.removeSession(session.id);
                        setDeleting(null);
                      }}
                    >
                      Sil
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setDeleting(null)}
                    >
                      Vazgeç
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {!list.length && (
          <div className="empty-state">
            <Icon name="layers" />
            <h3>{query ? "Eşleşen oturum yok" : "Henüz oturum yok"}</h3>
            <p>
              {query
                ? "Başka bir arama deneyin."
                : "İlk göreviniz için yeni bir oturum açın."}
            </p>
            <Button
              variant="secondary"
              onClick={() => (query ? setQuery("") : store.createSession())}
            >
              {query ? "Aramayı temizle" : "Oturum oluştur"}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
