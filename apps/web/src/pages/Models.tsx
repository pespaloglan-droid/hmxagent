import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import {
  KINDS,
  assertOk,
  kindLabel,
  tierLabel,
  validHttpUrl,
  useAction,
  useResource,
  type ModelCatalog,
  type Settings,
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
  Toast,
} from "../components/ui";
export function ModelsPage(): JSX.Element {
  const settings = useResource<Settings>("/api/settings");
  const catalog = useResource<ModelCatalog>("/api/models");
  const action = useAction();
  const [form, setForm] = useState({ baseUrl: "", model: "", apiKey: "" });
  const [validation, setValidation] = useState<{ baseUrl?: string; model?: string }>({});
  const [reply, setReply] = useState("");
  const dirty = useRef(false);
  useEffect(() => {
    if (settings.data && !dirty.current)
      setForm({
        baseUrl: settings.data.llm?.baseUrl ?? "",
        model: settings.data.llm?.model ?? "",
        apiKey: "",
      });
  }, [settings.data]);
  const change = (key: keyof typeof form, value: string) => {
    dirty.current = true;
    setForm((old) => ({ ...old, [key]: value }));
    setReply("");
    setValidation({});
  };
  const validate = () => {
    const errors: typeof validation = {};
    if (!validHttpUrl(form.baseUrl.trim()))
      errors.baseUrl = "Kimlik bilgisi içermeyen geçerli bir HTTP(S) adresi girin.";
    if (!form.model.trim()) errors.model = "Model adı boş bırakılamaz.";
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };
  const save = () => {
    if (!validate()) return;
    void action.run("save", async () => {
      // Backend llm nesnesini yüzeysel birleştirir; var olan anahtarı korumak gerekir.
      const llm = {
        ...settings.data?.llm,
        baseUrl: form.baseUrl.trim(),
        model: form.model.trim(),
        ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
      };
      assertOk(await api.post<{ ok: boolean; error?: string }>("/api/settings", { llm }));
      dirty.current = false;
      setForm((old) => ({ ...old, apiKey: "" }));
      action.setNotice("Model ayarları kaydedildi.");
      await settings.reload();
      await catalog.reload();
    });
  };
  const test = () => {
    if (!validate()) return;
    void action.run("test", async () => {
      setReply("");
      const result = assertOk(
        await api.post<{ ok: boolean; reply: string; error?: string }>("/api/models/test", {
          baseUrl: form.baseUrl.trim(),
          model: form.model.trim(),
          ...(form.apiKey.trim() || settings.data?.llm?.apiKey
            ? { apiKey: form.apiKey.trim() || settings.data?.llm?.apiKey }
            : {}),
        }),
      );
      setReply(result.reply);
    });
  };
  return (
    <Page
      title="Modeller"
      description="OpenAI uyumlu bağlantınızı yapılandırın ve kayıtlı dil / medya modellerini inceleyin."
    >
      {settings.loading && !settings.data ? (
        <Skeleton />
      ) : settings.error ? (
        <ErrorState message={settings.error} retry={() => void settings.reload()} />
      ) : (
        <Card
          title="Dil modeli bağlantısı"
          description="Ollama, OpenRouter, vLLM veya OpenAI uyumlu bir servis."
        >
          {!settings.data?.llm?.model && (
            <Notice>
              Henüz kaydedilmiş bir model bağlantısı yok. Aşağıdaki formdan bağlantınızı ekleyin.
            </Notice>
          )}
          <form
            className="hmx-form"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            noValidate
          >
            <Field
              label="Servis adresi"
              hint="Örnek: http://localhost:11434/v1"
              error={validation.baseUrl}
            >
              <input
                type="url"
                value={form.baseUrl}
                onChange={(e) => change("baseUrl", e.target.value)}
                aria-invalid={!!validation.baseUrl}
                required
                disabled={!!action.busy}
              />
            </Field>
            <Field label="Model adı" hint="Örnek: qwen2.5:14b" error={validation.model}>
              <input
                value={form.model}
                onChange={(e) => change("model", e.target.value)}
                aria-invalid={!!validation.model}
                required
                disabled={!!action.busy}
              />
            </Field>
            <Field
              label="API anahtarı (isteğe bağlı)"
              hint="Boş bırakırsanız kayıtlı anahtar korunur. Anahtar gösterilmez. Bu backend sürümünde sohbet için HMX_LLM_API_KEY ortam değişkeni gerekir."
            >
              <input
                type="password"
                autoComplete="new-password"
                value={form.apiKey}
                onChange={(e) => change("apiKey", e.target.value)}
                disabled={!!action.busy}
              />
            </Field>
            <div className="hmx-actions">
              <Button
                type="submit"
                icon="check"
                busy={action.busy === "save"}
                disabled={!!action.busy}
              >
                Kaydet
              </Button>
              <Button
                variant="secondary"
                icon="play"
                busy={action.busy === "test"}
                disabled={!!action.busy}
                onClick={test}
              >
                Bağlantıyı test et
              </Button>
            </div>
          </form>
          {action.error && (
            <Notice tone="error">
              {action.error}
              <p>
                Bilgileri kontrol edip Kaydet veya Bağlantıyı test et düğmesini yeniden kullanın.
              </p>
            </Notice>
          )}
          {reply && <Notice tone="ok">Bağlantı doğrulandı: {reply}</Notice>}
        </Card>
      )}
      {catalog.loading && !catalog.data ? (
        <Skeleton rows={3} />
      ) : catalog.error ? (
        <ErrorState message={catalog.error} retry={() => void catalog.reload()} />
      ) : KINDS.every((kind) => !catalog.data?.[kind]?.length) ? (
        <Empty
          title="Kayıtlı model yok"
          description="Bir sağlayıcı ekleyin veya mevcut model kayıtlarını yenileyin."
          action={
            <Button variant="secondary" icon="refresh" onClick={() => void catalog.reload()}>
              Modelleri yenile
            </Button>
          }
        />
      ) : (
        <Card
          title="Kayıtlı modeller"
          description="Bu liste yapılandırılmış kayıtları gösterir; erişilebilirlik bağlantı testiyle doğrulanır."
          actions={
            <Button
              variant="secondary"
              icon="refresh"
              busy={catalog.loading}
              onClick={() => void catalog.reload()}
            >
              Yenile
            </Button>
          }
        >
          <div className="hmx-grid">
            {KINDS.map((kind) => (
              <div key={kind}>
                <h3>{kindLabel(kind)}</h3>
                {catalog.data?.[kind]?.length ? (
                  catalog.data[kind].map((entry) => (
                    <div className="hmx-tags" key={entry.id}>
                      <Badge>{entry.id}</Badge>
                      {entry.tier && <Badge>{tierLabel(entry.tier)}</Badge>}
                      {entry.provider && (
                        <span className="hmx-muted hmx-mono">{entry.provider}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p>Bu türde kayıt yok.</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      <Toast message={action.notice} onClose={() => action.setNotice("")} />
    </Page>
  );
}
