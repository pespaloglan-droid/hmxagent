import { useEffect, useState } from "react";
import { api } from "../api";
import { useUiStore } from "../stores/uiStore";
import { useAction, useResource, type Health } from "../components/pageData";
import {
  Badge,
  Button,
  Card,
  Empty,
  ErrorState,
  Field,
  Icon,
  Notice,
  Page,
  Skeleton,
} from "../components/ui";
export function ServersPage({ health }: { health: any }): JSX.Element {
  // Prop sınırı mevcut kontrata göre any; sayfa içindeki veriler tipli tutulur.
  const resource = useResource<Health>("/api/health", health as Health | null);
  const action = useAction();
  const [reply, setReply] = useState("");
  useEffect(() => {
    setReply("");
  }, [resource.data?.llm?.baseUrl, resource.data?.llm?.model]);
  const current = resource.data;
  const test = () =>
    action.run("test", async () => {
      setReply("");
      const result = await api.post<{ ok: boolean; reply?: string; error?: string }>(
        "/api/models/test",
        {},
      );
      if (!result.ok) throw new Error(result.error ?? "Dil modeli yanıt vermedi.");
      setReply(result.reply ?? "Bağlantı doğrulandı.");
    });
  return (
    <Page
      title="Sunucular"
      description="Dil modeli bağlantınızı ve yerel medya araçlarının durumunu tek noktadan kontrol edin."
      actions={
        <Button
          variant="secondary"
          icon="refresh"
          busy={resource.loading}
          onClick={() => void resource.reload()}
        >
          Durumu yenile
        </Button>
      }
    >
      {resource.loading && !current ? (
        <Skeleton />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={() => void resource.reload()} />
      ) : !current ? (
        <Empty
          icon="server"
          title="Sunucu bilgisi yok"
          description="Dashboard bağlantısını kontrol edin veya kurulum sihirbazını çalıştırın."
          action={
            <Button onClick={() => useUiStore.getState().setWizardOpen(true)}>Kurulumu aç</Button>
          }
        />
      ) : (
        <>
          <div className="hmx-grid">
            <Card
              title="Dil modeli bağlantısı"
              actions={
                <Badge tone={reply ? "ok" : "neutral"}>
                  {reply ? "Test başarılı" : "Yapılandırıldı"}
                </Badge>
              }
            >
              <div className="hmx-icon-tile">
                <Icon name="server" />
              </div>
              <dl className="hmx-detail">
                <div>
                  <dt>Adres</dt>
                  <dd className="hmx-mono">{current.llm?.baseUrl ?? "Tanımlanmamış"}</dd>
                </div>
                <div>
                  <dt>Model</dt>
                  <dd>{current.llm?.model ?? "Tanımlanmamış"}</dd>
                </div>
              </dl>
              <p>
                Yapılandırma bilgisi bağlantının çalıştığını kanıtlamaz. Test, modele kısa bir istek
                gönderir.
              </p>
              <div className="hmx-actions">
                <Button icon="play" busy={action.busy === "test"} onClick={() => void test()}>
                  Bağlantıyı test et
                </Button>
                <Button variant="secondary" onClick={() => useUiStore.getState().setPage("models")}>
                  Model ayarları
                </Button>
              </div>
            </Card>
            <Card
              title="Yerel servisler"
              actions={
                <Badge tone={current.ok ? "ok" : "error"}>
                  {current.ok ? "Dashboard hazır" : "Sorun var"}
                </Badge>
              }
            >
              <div className="hmx-icon-tile">
                <Icon name="layers" />
              </div>
              <dl className="hmx-detail">
                <div>
                  <dt>ffmpeg</dt>
                  <dd>
                    <Badge tone={current.ffmpeg ? "ok" : "error"}>
                      {current.ffmpeg ? "Kullanılabilir" : "Bulunamadı"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt>Sürüm</dt>
                  <dd>{current.version ?? "—"}</dd>
                </div>
              </dl>
              <Field label="Veri dizini">
                <input
                  readOnly
                  value={current.home ?? ""}
                  placeholder="Veri dizini tanımlanmamış"
                />
              </Field>
            </Card>
          </div>
          {action.error && (
            <Notice tone="error">
              {action.error}
              <div className="hmx-actions">
                <Button variant="secondary" busy={!!action.busy} onClick={() => void test()}>
                  Yeniden dene
                </Button>
              </div>
            </Notice>
          )}
          {reply && <Notice tone="ok">Model yanıt verdi: {reply}</Notice>}
          <Empty
            icon="link"
            title="MCP yönetimi henüz kullanılabilir değil"
            description="Mevcut backend harici MCP sunucularını yönetmek için bir uç sunmuyor. Bu alan hazırlık aşamasında."
            action={
              <Button
                variant="secondary"
                icon="settings"
                onClick={() => useUiStore.getState().setPage("settings")}
              >
                Mevcut ayarları aç
              </Button>
            }
          />
        </>
      )}
    </Page>
  );
}
