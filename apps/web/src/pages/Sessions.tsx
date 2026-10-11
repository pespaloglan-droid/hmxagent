import { useState } from "react";
import { useUiStore } from "../stores/uiStore";
import {
  dateLabel,
  segment,
  useResource,
  type SessionEvent,
  type SessionSummary,
} from "../components/pageData";
import {
  Badge,
  Button,
  Card,
  Empty,
  ErrorState,
  Field,
  Icon,
  Page,
  Skeleton,
  Table,
  type IconName,
} from "../components/ui";
const labels: Record<string, string> = {
  goal: "Hedef",
  plan: "Plan",
  action: "Eylem",
  verify: "Doğrulama",
  error: "Hata",
  deliver: "Teslim",
  note: "Not",
};
const icons: Record<string, IconName> = {
  goal: "layers",
  plan: "file",
  action: "play",
  verify: "check",
  error: "alert",
  deliver: "check",
  note: "file",
};
export function SessionsPage(): JSX.Element {
  const sessions = useResource<SessionSummary[]>("/api/sessions");
  const [selected, setSelected] = useState<string | null>(null);
  const events = useResource<SessionEvent[]>(
    selected ? `/api/sessions/${segment(selected)}` : null,
  );
  const [query, setQuery] = useState("");
  const items = (sessions.data ?? []).filter((s) =>
    `${s.id} ${s.title}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <Page
      title={selected ? "Oturum ayrıntısı" : "Oturumlar"}
      description={
        selected
          ? "Hedeften teslimata tüm adımları, doğrulamaları ve hataları takip edin."
          : "Ajanın görev geçmişini inceleyin; her kararın ve sonucun izini sürün."
      }
      actions={
        selected ? (
          <Button variant="secondary" icon="arrow" onClick={() => setSelected(null)}>
            Oturumlara dön
          </Button>
        ) : (
          <Button
            variant="secondary"
            icon="refresh"
            busy={sessions.loading}
            onClick={() => void sessions.reload()}
          >
            Yenile
          </Button>
        )
      }
    >
      {selected ? (
        <>
          <Card
            title={sessions.data?.find((s) => s.id === selected)?.title ?? "Görev günlüğü"}
            description={selected}
          >
            {events.loading && events.data === null ? (
              <Skeleton />
            ) : events.error ? (
              <ErrorState message={events.error} retry={() => void events.reload()} />
            ) : (events.data?.length ?? 0) === 0 ? (
              <Empty
                title="Henüz bir adım kaydedilmemiş"
                description="Görev çalıştıkça plan, eylem ve doğrulama kayıtları burada görünecek."
                action={
                  <Button icon="refresh" variant="secondary" onClick={() => void events.reload()}>
                    Günlüğü yenile
                  </Button>
                }
              />
            ) : (
              <ol className="hmx-timeline">
                {events.data?.map((e, i) => (
                  <li
                    key={`${e.step}-${i}`}
                    className={
                      e.type === "error" ? "is-error" : e.type === "verify" ? "is-verify" : ""
                    }
                  >
                    <Icon name={icons[e.type] ?? "file"} />
                    <div>
                      <div className="hmx-tags">
                        <Badge
                          tone={
                            e.type === "error" ? "error" : e.type === "verify" ? "ok" : "neutral"
                          }
                        >
                          {labels[e.type] ?? e.type}
                        </Badge>
                        <span className="hmx-muted hmx-mono">Adım {e.step}</span>
                      </div>
                      <span>{e.summary}</span>
                    </div>
                    <time dateTime={e.ts}>{dateLabel(e.ts)}</time>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </>
      ) : (
        <>
          <Field label="Oturum ara">
            <input
              className="hmx-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hedef veya oturum kimliği…"
            />
          </Field>
          {sessions.loading && sessions.data === null ? (
            <Skeleton rows={5} />
          ) : sessions.error ? (
            <ErrorState message={sessions.error} retry={() => void sessions.reload()} />
          ) : (sessions.data?.length ?? 0) === 0 ? (
            <Empty
              title="İlk görevinizle başlayın"
              description="Ajanla çalıştığınızda görev geçmişiniz burada düzenli bir günlüğe dönüşür."
              action={
                <Button icon="plus" onClick={() => useUiStore.getState().setPage("chat")}>
                  Sohbete git
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <Empty
              icon="search"
              title="Eşleşen oturum yok"
              description="Başka bir hedef veya kimlik deneyin."
              action={
                <Button variant="secondary" onClick={() => setQuery("")}>
                  Aramayı temizle
                </Button>
              }
            />
          ) : (
            <Card title="Görev geçmişi" actions={<Badge>{items.length} oturum</Badge>}>
              <Table label="Oturum listesi">
                <thead>
                  <tr>
                    <th scope="col">Hedef / oturum</th>
                    <th scope="col">Adım</th>
                    <th scope="col">Hata</th>
                    <th scope="col">Son etkinlik</th>
                    <th scope="col">Ayrıntı</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.title}</strong>
                        <div className="hmx-muted hmx-mono">{s.id}</div>
                      </td>
                      <td>{s.steps}</td>
                      <td>
                        <Badge tone={s.errors > 0 ? "error" : "ok"}>
                          {s.errors > 0 ? `${s.errors} hata` : "Hata yok"}
                        </Badge>
                      </td>
                      <td>{dateLabel(s.lastTs)}</td>
                      <td>
                        <Button
                          variant="secondary"
                          aria-label={`${s.title} oturumunu incele`}
                          onClick={() => setSelected(s.id)}
                        >
                          İncele
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </Page>
  );
}
