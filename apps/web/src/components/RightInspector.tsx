import { useEffect } from "react";
import { useSessionStore } from "../stores/sessionStore";
import {
  useResource,
  kindLabel,
  statusLabel,
  KINDS,
  type Health,
  type Routing,
} from "./pageData";
import { Badge, Button, ErrorState, Icon, Skeleton } from "./ui";
export function RightInspector({ page }: { page: string }): JSX.Element {
  const health = useResource<Health>("/api/health");
  const routing = useResource<Routing>("/api/routing");
  const sessions = useSessionStore((s) => s.sessions);
  const active = useSessionStore((s) => s.activeSessionId);
  const session = active ? sessions[active] : null;
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      await Promise.all([health.reload(), routing.reload()]);
      if (alive) timer = setTimeout(() => void refresh(), 15000);
    };
    void refresh();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [page, health.reload, routing.reload]);
  const errors = Object.values(sessions)
    .flatMap((s) =>
      s.messages
        .filter((m) => m.error)
        .map((m) => ({ ...m, session: s.title })),
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);
  const accounts = routing.data?.accounts ?? [];
  const circuits = routing.data?.circuits.filter((c) => c.open) ?? [];
  return (
    <div className="inspector" aria-label="Bağlam ve sistem durumu">
      {(health.error || routing.error) && (
        <ErrorState
          message={health.error || routing.error}
          retry={() => {
            void health.reload();
            void routing.reload();
          }}
        />
      )}
      {(health.loading && !health.data) ||
      (routing.loading && !routing.data) ? (
        <Skeleton rows={3} />
      ) : (
        <>
          {page === "chat" && (
            <>
              <section className="card">
                <h3>Aktif oturum</h3>
                {session ? (
                  <>
                    <strong>{session.title}</strong>
                    <p className="muted">
                      {session.messages.length} mesaj ·{" "}
                      {session.activeTab === "chat" ? "Sohbet" : "Varlıklar"}
                    </p>
                    <div className="hmx-tags">
                      <Badge>{session.selectedAgentId ?? "HMX Native"}</Badge>
                      <Badge>
                        {session.selectedModelId?.replace(/^llm:/, "") ??
                          health.data?.llm?.model ??
                          "Varsayılan model"}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="muted">
                    Bir oturum seçin veya yeni oturum başlatın.
                  </p>
                )}
              </section>
              <section className="card">
                <h3>Hesap durumu</h3>
                {accounts.length ? (
                  accounts.map((account) => (
                    <div
                      className="inspector-row"
                      key={`${account.provider}:${account.id}`}
                    >
                      <span
                        className={`dot ${account.status === "active" ? "ok" : account.status === "cooldown" ? "warn" : "err"}`}
                      />
                      <span>{account.label}</span>
                      <Badge
                        tone={
                          account.status === "active"
                            ? "ok"
                            : account.status === "cooldown"
                              ? "warn"
                              : "error"
                        }
                      >
                        {statusLabel(account.status)}
                      </Badge>
                      <span className="muted">{account.provider}</span>
                    </div>
                  ))
                ) : (
                  <p className="muted">Henüz hesap tanımlanmamış.</p>
                )}
              </section>
              <section className="card">
                <h3>Token tasarrufu</h3>
                <span className="hmx-stat">
                  %
                  {Math.round(
                    (routing.data?.tokenSaver?.savedRatio ?? 0) * 100,
                  )}
                </span>
                <p className="muted">
                  {routing.data?.tokenSaver?.compressedCount ?? 0} çıktı
                  sıkıştırıldı
                </p>
              </section>
            </>
          )}
          {page === "providers" ? (
            <>
              <section className="card">
                <h3>Yedek rota özeti</h3>
                {KINDS.map((kind) => (
                  <div key={kind}>
                    <strong>{kindLabel(kind)}</strong>
                    <p>
                      {routing.data?.order[kind]?.length
                        ? routing.data.order[kind].join(" → ")
                        : "Sağlayıcı yok"}
                    </p>
                  </div>
                ))}
              </section>
              <section className="card">
                <h3>Açık devreler</h3>
                {circuits.length ? (
                  circuits.map((c) => (
                    <p key={c.id}>
                      <Badge tone="error">{c.id}</Badge>
                    </p>
                  ))
                ) : (
                  <p>
                    <Icon name="check" /> Açık devre yok.
                  </p>
                )}
              </section>
            </>
          ) : (
            page !== "chat" && (
              <section className="card">
                <h3>Sistem sağlığı</h3>
                <p>
                  Dashboard:{" "}
                  <Badge tone={health.data?.ok ? "ok" : "error"}>
                    {health.data?.ok ? "Hazır" : "Veri yok"}
                  </Badge>
                </p>
                <p>
                  LLM: <span>{health.data?.llm?.model ?? "Tanımlanmamış"}</span>
                </p>
                <p className="muted">
                  Model bağlantısını Modeller ekranında test edin.
                </p>
                <p>
                  ffmpeg:{" "}
                  <Badge tone={health.data?.ffmpeg ? "ok" : "warn"}>
                    {health.data?.ffmpeg ? "Kullanılabilir" : "Bulunamadı"}
                  </Badge>
                </p>
                <p>
                  {health.data?.quota?.accounts ?? 0} hesap ·{" "}
                  {health.data?.quota?.cooldown ?? 0} beklemede ·{" "}
                  {health.data?.quota?.error ?? 0} hata
                </p>
              </section>
            )
          )}
          {page !== "chat" && (
            <section className="card">
              <h3>Son yerel oturum hataları</h3>
              {errors.length ? (
                <ul className="inspector-errors">
                  {errors.map((error) => (
                    <li key={error.id}>
                      <strong>{error.session}</strong>
                      <p>{error.error}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Kayıtlı yerel oturumlarda hata yok.</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
