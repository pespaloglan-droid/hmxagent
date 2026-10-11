import { useEffect } from "react";
import { api } from "../api";
import { useAction, useResource, assertOk, dateLabel } from "./pageData";
import { Badge, Button, Card, Empty, ErrorState, Notice, Skeleton } from "./ui";
interface Job {
  id: string;
  kind: string;
  prompt: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  error?: string;
  resultPath?: string;
  createdAt: number;
}
const labels = {
  queued: "Sırada",
  running: "Çalışıyor",
  done: "Tamamlandı",
  failed: "Hata",
  cancelled: "İptal edildi",
};
export function JobsPanel(): JSX.Element {
  const jobs = useResource<Job[]>("/api/jobs");
  const action = useAction();
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await jobs.reload();
      if (alive) timer = setTimeout(() => void poll(), 3000);
    };
    timer = setTimeout(() => void poll(), 3000);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [jobs.reload]);
  const mutate = (id: string, operation: "cancel" | "retry") =>
    action.run(id, async () => {
      assertOk(
        await api.post<{ ok: boolean; error?: string }>(
          `/api/jobs/${encodeURIComponent(id)}/${operation}`,
          {},
        ),
      );
      await jobs.reload();
    });
  return (
    <Card
      title="İş kuyruğu"
      description="Üretim ve birleştirme işleri arka planda çalışır. Durum 3 saniyede bir yenilenir."
      actions={
        <Button
          variant="secondary"
          icon="refresh"
          busy={jobs.loading}
          onClick={() => void jobs.reload()}
        >
          İşleri yenile
        </Button>
      }
    >
      {jobs.error && (
        <ErrorState message={jobs.error} retry={() => void jobs.reload()} />
      )}
      {action.error && <Notice tone="error">{action.error}</Notice>}
      {jobs.loading && !jobs.data ? (
        <Skeleton rows={3} />
      ) : !jobs.error && !jobs.data?.length ? (
        <Empty
          title="Kuyruk boş"
          description="Sohbette medya üretimi başlatın veya katalogdan klipleri birleştirin."
          action={
            <Button variant="secondary" onClick={() => void jobs.reload()}>
              Kuyruğu yenile
            </Button>
          }
        />
      ) : (
        <div className="jobs-grid">
          {jobs.data?.map((job) => (
            <div className="job-line" key={job.id}>
              <div>
                <strong>
                  {job.kind === "compose"
                    ? "Video birleştirme"
                    : job.kind === "video"
                      ? "Video üretimi"
                      : job.kind === "audio"
                        ? "Ses üretimi"
                        : "Görsel üretimi"}
                </strong>
                <p className="hmx-mono">{job.id}</p>
                <p className="hmx-muted">{dateLabel(job.createdAt)}</p>
                {job.error && <p className="hmx-field-error">{job.error}</p>}
                {job.resultPath && <p className="hmx-mono">{job.resultPath}</p>}
              </div>
              <Badge
                tone={
                  job.status === "done"
                    ? "ok"
                    : job.status === "failed"
                      ? "error"
                      : job.status === "running"
                        ? "warn"
                        : "neutral"
                }
              >
                {labels[job.status]}
              </Badge>
              {["queued", "running"].includes(job.status) && (
                <Button
                  variant="danger"
                  busy={action.busy === job.id}
                  disabled={!!action.busy}
                  onClick={() => void mutate(job.id, "cancel")}
                >
                  İptal et
                </Button>
              )}
              {["failed", "cancelled"].includes(job.status) && (
                <Button
                  variant="secondary"
                  busy={action.busy === job.id}
                  disabled={!!action.busy}
                  onClick={() => void mutate(job.id, "retry")}
                >
                  Tekrar dene
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
