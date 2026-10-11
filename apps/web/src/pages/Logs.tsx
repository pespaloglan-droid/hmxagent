import { useEffect, useRef, useState } from "react";
import { segment, useResource } from "../components/pageData";
import { Badge, Button, Card, Empty, ErrorState, Field, Page, Skeleton } from "../components/ui";
interface LogTail {
  lines: string[];
  total: number;
}
function lineTone(line: string): "error" | "verify" | "neutral" {
  try {
    const entry = JSON.parse(line) as { type?: string; level?: string };
    if (entry.type === "error" || entry.level === "error" || entry.level === "fatal")
      return "error";
    if (entry.type === "verify") return "verify";
  } catch {
    /* Yapısız günlükler metin olarak sınıflandırılır. */
  }
  if (/\b(error|fatal)\b|\bhata\b/i.test(line)) return "error";
  if (/\bverify\b|\bverified\b|doğrulandı/i.test(line)) return "verify";
  return "neutral";
}
export function LogsPage(): JSX.Element {
  const files = useResource<string[]>("/api/logs");
  const [active, setActive] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [follow, setFollow] = useState(true);
  const [query, setQuery] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const tail = useResource<LogTail>(active ? `/api/logs/${segment(active)}?tail=200` : null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!files.data) return;
    if (active && files.data.includes(active)) return;
    setActive(files.data[0] ?? null);
  }, [files.data, active]);
  // Backend SSE sunmuyor: tamamlanan istekten sonra 3 saniye bekle, istekleri üst üste bindirme.
  useEffect(() => {
    if (!active || !live) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await tail.reload();
      if (!cancelled) timer = setTimeout(() => void poll(), 3000);
    };
    timer = setTimeout(() => void poll(), 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, live, tail.reload]);
  useEffect(() => {
    setLastUpdate(tail.data ? new Date() : null);
  }, [tail.data]);
  const lines = (tail.data?.lines ?? []).filter((line) =>
    line.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")),
  );
  useEffect(() => {
    if (follow && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [tail.data, follow, query]);
  const select = (file: string) => {
    setFollow(true);
    setActive(file);
  };
  return (
    <Page
      title="Günlükler"
      description="Son 200 satırı canlı takip edin; hata ve doğrulama kayıtlarını hızlıca ayırt edin."
      actions={
        <Button
          variant="secondary"
          icon="refresh"
          busy={files.loading}
          onClick={() => void files.reload()}
        >
          Dosyaları yenile
        </Button>
      }
    >
      {files.loading && !files.data ? (
        <Skeleton rows={5} />
      ) : files.error ? (
        <ErrorState message={files.error} retry={() => void files.reload()} />
      ) : !files.data?.length ? (
        <Empty
          icon="file"
          title="Henüz günlük kaydı yok"
          description="Ajan görevleri çalıştığında günlük dosyaları burada görünür. Kayıt listesini tekrar kontrol edebilirsiniz."
          action={
            <Button icon="refresh" variant="secondary" onClick={() => void files.reload()}>
              Günlükleri yenile
            </Button>
          }
        />
      ) : (
        <div className="hmx-split">
          <Card title="Dosyalar" actions={<Badge>{files.data.length}</Badge>}>
            <div className="hmx-log-files">
              {files.data.map((file) => (
                <button
                  type="button"
                  className="hmx-mono"
                  key={file}
                  aria-pressed={active === file}
                  onClick={() => select(file)}
                >
                  {file}
                </button>
              ))}
            </div>
          </Card>
          <Card
            title={active ?? "Günlük seçin"}
            description={
              live ? "Canlı takip · istekler arasında 3 saniye" : "Canlı takip duraklatıldı"
            }
          >
            <div className="hmx-actions">
              <Button
                variant="secondary"
                icon={live ? "pause" : "play"}
                aria-pressed={live}
                onClick={() => setLive((old) => !old)}
              >
                {live ? "Duraklat" : "Canlı takibi aç"}
              </Button>
              <Button
                variant="secondary"
                icon="down"
                aria-pressed={follow}
                onClick={() => setFollow((old) => !old)}
              >
                {follow ? "Sona takip açık" : "Sona takip kapalı"}
              </Button>
              <Button
                variant="secondary"
                icon="refresh"
                busy={tail.loading}
                onClick={() => void tail.reload()}
              >
                Yenile
              </Button>
            </div>
            <Field label="Satırlarda ara">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mesaj, seviye veya görev kimliği…"
              />
            </Field>
            <div className="hmx-tags">
              <Badge tone="error">Hata</Badge>
              <Badge tone="ok">Doğrulama</Badge>
              <span className="hmx-muted">
                {lines.length} / {tail.data?.total ?? 0} satır
                {lastUpdate ? ` · Son yanıt: ${lastUpdate.toLocaleTimeString("tr-TR")}` : ""}
              </span>
            </div>
            {tail.error && <ErrorState message={tail.error} retry={() => void tail.reload()} />}
            {tail.loading && !tail.data ? (
              <Skeleton rows={6} />
            ) : !tail.error && !tail.data?.lines.some((line) => line.trim()) ? (
              <Empty
                icon="file"
                title="Bu günlük henüz boş"
                description="Yeni kayıtlar geldikçe canlı kuyruk güncellenecek."
                action={
                  <Button variant="secondary" onClick={() => void tail.reload()}>
                    Kuyruğu yenile
                  </Button>
                }
              />
            ) : !tail.error && lines.length === 0 ? (
              <Empty
                icon="search"
                title="Eşleşen satır yok"
                description="Aramayı temizleyerek tüm son kayıtları görebilirsiniz."
                action={
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Aramayı temizle
                  </Button>
                }
              />
            ) : (
              tail.data && (
                <div
                  className="hmx-log-tail"
                  ref={box}
                  role="region"
                  aria-label="Günlük satırları"
                  tabIndex={0}
                  onScroll={() => {
                    const el = box.current;
                    if (el && el.scrollHeight - el.scrollTop - el.clientHeight > 48 && follow)
                      setFollow(false);
                  }}
                >
                  {lines.map((line, index) => {
                    const tone = lineTone(line);
                    return (
                      <div className={`hmx-log-row hmx-log-row--${tone}`} key={index}>
                        {tone !== "neutral" && (
                          <span className="hmx-sr">
                            {tone === "error" ? "Hata: " : "Doğrulama: "}
                          </span>
                        )}
                        {line}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}
