import { useEffect, useState } from "react";
import { api } from "../api";
import { useUiStore } from "../stores/uiStore";
import {
  assertOk,
  kindLabel,
  statusLabel,
  useAction,
  useResource,
  type Asset,
} from "../components/pageData";
import {
  Badge,
  Button,
  Card,
  Empty,
  ErrorState,
  Field,
  Notice,
  Page,
  Skeleton,
  Table,
} from "../components/ui";
export function PipelinePage(): JSX.Element {
  const assets = useResource<Asset[]>("/api/assets");
  const [selected, setSelected] = useState<string[]>([]);
  const [voiceover, setVoiceover] = useState("");
  const [result, setResult] = useState<{ out: string; durationSec: number } | null>(null);
  const action = useAction();
  useEffect(() => {
    if (assets.data)
      setSelected((old) =>
        old.filter((file) =>
          assets.data?.some(
            (a) => a.filePath === file && a.type === "video" && a.status === "verified",
          ),
        ),
      );
  }, [assets.data]);
  const toggle = (file: string) => {
    setResult(null);
    setSelected((old) => (old.includes(file) ? old.filter((x) => x !== file) : [...old, file]));
  };
  const move = (index: number, offset: number) => {
    setResult(null);
    setSelected((old) => {
      const next = [...old];
      const target = index + offset;
      if (target < 0 || target >= next.length) return old;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const compose = () =>
    action.run("compose", async () => {
      setResult(null);
      const clips = selected.filter((file) =>
        assets.data?.some(
          (a) => a.filePath === file && a.type === "video" && a.status === "verified",
        ),
      );
      if (!clips.length || clips.length !== selected.length)
        throw new Error(
          "Yalnızca doğrulanmış video klipleri birleştirilebilir. Kataloğu yenileyin.",
        );
      if (voiceover.trim() && !/\.(mp3|wav)$/i.test(voiceover.trim()))
        throw new Error("Seslendirme için .mp3 veya .wav dosya yolu girin.");
      setResult(
        assertOk(
          await api.post<{ ok: boolean; out: string; durationSec: number; error?: string }>(
            "/api/compose",
            { clips, ...(voiceover.trim() ? { voiceover: voiceover.trim() } : {}) },
          ),
        ),
      );
    });
  return (
    <Page
      title="Medya akışı"
      description="Doğrulanmış kliplerinizi seçin, sıralayın ve tek bir video olarak birleştirin."
      actions={
        <Button
          icon="refresh"
          variant="secondary"
          busy={assets.loading}
          disabled={!!action.busy}
          onClick={() => void assets.reload()}
        >
          Kataloğu yenile
        </Button>
      }
    >
      {assets.loading && !assets.data ? (
        <Skeleton rows={5} />
      ) : assets.error ? (
        <ErrorState message={assets.error} retry={() => void assets.reload()} />
      ) : !assets.data?.length ? (
        <Empty
          title="Kataloğunuz üretim bekliyor"
          description="Önce ajanla bir medya üretimi yapın. Doğrulanmış dosyalarınız burada listelenir."
          action={
            <Button icon="plus" onClick={() => useUiStore.getState().setPage("chat")}>
              Üretime başla
            </Button>
          }
        />
      ) : (
        <Card
          title="Varlık kataloğu"
          description="Sadece doğrulanmış videolar seçilebilir; görsel ve ses kayıtları bilgi amaçlı gösterilir."
          actions={<Badge>{assets.data.length} varlık</Badge>}
        >
          <Table label="Medya varlıkları">
            <thead>
              <tr>
                <th scope="col">Seçim</th>
                <th scope="col">Tür</th>
                <th scope="col">Sağlayıcı</th>
                <th scope="col">Dosya</th>
                <th scope="col">Durum</th>
              </tr>
            </thead>
            <tbody>
              {assets.data.map((a) => (
                <tr key={a.id}>
                  <td>
                    <label className="hmx-checkbox">
                      <input
                        type="checkbox"
                        aria-label={`${a.filePath} klibini seç`}
                        disabled={!!action.busy || a.status !== "verified" || a.type !== "video"}
                        checked={selected.includes(a.filePath)}
                        onChange={() => toggle(a.filePath)}
                      />
                    </label>
                  </td>
                  <td>
                    <Badge>{kindLabel(a.type)}</Badge>
                  </td>
                  <td className="hmx-mono">{a.provider}</td>
                  <td className="hmx-mono">{a.filePath}</td>
                  <td>
                    <Badge tone={a.status === "verified" ? "ok" : "warn"}>
                      {statusLabel(a.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      <Card
        title="Birleştirme planı"
        description="Klipler aşağıdaki sırayla birleştirilir. Çıktı ffprobe ile doğrulanır."
      >
        {selected.length === 0 ? (
          <p>Başlamak için katalogdan en az bir doğrulanmış video seçin.</p>
        ) : (
          <ol className="hmx-sequence">
            {selected.map((file, index) => (
              <li key={file}>
                <Badge>{index + 1}</Badge>
                <span className="hmx-mono">{file}</span>
                <div className="hmx-actions">
                  <Button
                    variant="secondary"
                    icon="up"
                    aria-label={`${index + 1}. klibi yukarı taşı`}
                    disabled={index === 0 || !!action.busy}
                    onClick={() => move(index, -1)}
                  >
                    Yukarı
                  </Button>
                  <Button
                    variant="secondary"
                    icon="down"
                    aria-label={`${index + 1}. klibi aşağı taşı`}
                    disabled={index === selected.length - 1 || !!action.busy}
                    onClick={() => move(index, 1)}
                  >
                    Aşağı
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <form
          className="hmx-form"
          onSubmit={(e) => {
            e.preventDefault();
            void compose();
          }}
        >
          <Field
            label="Seslendirme dosyası (isteğe bağlı)"
            hint="Sunucuda bulunan bir .mp3 veya .wav dosyasının yolunu girin; bu alan dosya yüklemez."
          >
            <input
              value={voiceover}
              disabled={!!action.busy}
              onChange={(e) => {
                setVoiceover(e.target.value);
                setResult(null);
              }}
              placeholder="/medya/seslendirme.wav"
            />
          </Field>
          <div className="hmx-footer">
            <span className="hmx-muted">{selected.length} klip seçildi</span>
            <Button
              type="submit"
              icon="play"
              busy={!!action.busy}
              disabled={!selected.length || !!assets.error || assets.loading}
            >
              Videoyu birleştir
            </Button>
          </div>
        </form>
      </Card>
      {action.error && (
        <Notice tone="error">
          {action.error}
          <div className="hmx-actions">
            <Button variant="secondary" busy={!!action.busy} onClick={() => void compose()}>
              Yeniden dene
            </Button>
          </div>
        </Notice>
      )}
      {result && (
        <Notice tone="ok">
          <strong>Video hazır ve doğrulandı.</strong>
          <p className="hmx-mono">{result.out}</p>
          <span>{result.durationSec} saniye · ffprobe doğrulaması başarılı</span>
        </Notice>
      )}
    </Page>
  );
}
