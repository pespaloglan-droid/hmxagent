import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useUiStore } from "../stores/uiStore";
import { useSessionStore } from "../stores/sessionStore";
import {
  KINDS,
  assertOk,
  kindLabel,
  useAction,
  useResource,
  validHttpUrl,
  type Kind,
  type Settings,
  type Health,
} from "../components/pageData";
import {
  Badge,
  Button,
  Card,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Notice,
  Page,
  Skeleton,
  Toast,
} from "../components/ui";
const emptyOrders: Record<Kind, string> = {
  image: "",
  video: "",
  audio: "",
  llm: "",
};
const policies = [
  {
    id: "strict",
    title: "Sıkı",
    description:
      "Güvenli sohbet ve okuma dışında göreve başlamadan onay ister.",
    example: "Örnek: medya üretimi için önce sorar.",
  },
  {
    id: "balanced",
    title: "Dengeli",
    description:
      "Gündelik görevler akıcıdır; yıkıcı işlemler için açık onay ister.",
    example: "Örnek: dosya silme veya komut çalıştırma için sorar.",
  },
  {
    id: "fast",
    title: "Hızlı",
    description:
      "Gündelik işlerde minimum onay; yıkıcı işlemler yine onay gerektirir.",
    example: "Örnek: sohbet beklemeden akar, shell komutu yine sorulur.",
  },
] as const;
export function SettingsPage(): JSX.Element {
  const resource = useResource<Settings>("/api/settings");
  const health = useResource<Health>("/api/health");
  const action = useAction();
  const [hours, setHours] = useState("6");
  const [mode, setMode] = useState<"strict" | "balanced" | "fast">("balanced");
  const [orders, setOrders] = useState(emptyOrders);
  const [llm, setLlm] = useState({ baseUrl: "", model: "", apiKey: "" });
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tested, setTested] = useState("");
  const [reset, setReset] = useState<1 | 2 | null>(null);
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    if (resource.data && !dirtyRef.current) {
      setHours(String(resource.data.quotaCooldownMs / 3600000));
      setOrders({ ...emptyOrders, ...resource.data.orders });
      setMode(resource.data.approvalMode ?? "balanced");
      setLlm({
        baseUrl: resource.data.llm?.baseUrl ?? health.data?.llm?.baseUrl ?? "",
        model: resource.data.llm?.model ?? health.data?.llm?.model ?? "",
        apiKey: "",
      });
    }
  }, [resource.data, health.data]);
  const changed = () => {
    dirtyRef.current = true;
    setDirty(true);
    setErrors({});
    setTested("");
  };
  const validate = (onlyLlm = false): boolean => {
    const next: Record<string, string> = {};
    if (!validHttpUrl(llm.baseUrl.trim()))
      next.baseUrl =
        "Geçerli ve kimlik bilgisi içermeyen HTTP(S) adresi girin.";
    if (!llm.model.trim()) next.model = "Model adı gerekli.";
    if (!onlyLlm) {
      if (
        !hours.trim() ||
        !Number.isFinite(Number(hours)) ||
        Number(hours) < 1 ||
        Number(hours) > 72
      )
        next.hours = "Bekleme süresi 1–72 saat arasında olmalı.";
      for (const kind of KINDS) {
        const ids = orders[kind].trim()
          ? orders[kind].split(",").map((id) => id.trim())
          : [];
        if (ids.some((id) => !/^[a-zA-Z0-9_-]+$/.test(id)))
          next[kind] =
            "Kimlikleri virgülle ayırın; boş veya geçersiz kimlik kullanmayın.";
        if (new Set(ids).size !== ids.length)
          next[kind] = "Aynı sağlayıcıyı zincirde bir kez kullanın.";
      }
    }
    setErrors(next);
    return !Object.keys(next).length;
  };
  const save = () => {
    if (!validate()) return;
    void action.run("save", async () => {
      const nextOrders = Object.fromEntries(
        KINDS.map((kind) => [
          kind,
          orders[kind]
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
            .join(","),
        ]),
      ) as Record<Kind, string>;
      assertOk(
        await api.post<{ ok: boolean; error?: string }>("/api/settings", {
          quotaCooldownMs: Math.round(Number(hours) * 3600000),
          orders: nextOrders,
          approvalMode: mode,
          llm: {
            baseUrl: llm.baseUrl.trim(),
            model: llm.model.trim(),
            ...(llm.apiKey.trim() ? { apiKey: llm.apiKey.trim() } : {}),
          },
        }),
      );
      dirtyRef.current = false;
      setDirty(false);
      setOrders(nextOrders);
      setLlm((old) => ({ ...old, apiKey: "" }));
      action.setNotice("Ayarlar kaydedildi.");
      await resource.reload();
    });
  };
  const test = () => {
    if (!validate(true)) return;
    void action.run("test", async () => {
      const result = assertOk(
        await api.post<{ ok: boolean; reply: string; error?: string }>(
          "/api/models/test",
          {
            baseUrl: llm.baseUrl.trim(),
            model: llm.model.trim(),
            ...(llm.apiKey.trim() ? { apiKey: llm.apiKey.trim() } : {}),
          },
        ),
      );
      setTested(result.reply);
    });
  };
  const openDirectory = () =>
    action.run("open", async () => {
      if (window.hmxAPI?.openDataDir) {
        assertOk(await window.hmxAPI.openDataDir());
        action.setNotice("Veri dizini açıldı.");
      } else {
        if (!health.data?.home)
          throw new Error("Veri dizini bilgisi alınamadı.");
        await navigator.clipboard.writeText(health.data.home);
        action.setNotice("Tarayıcı yerel dizin açamaz; dizin yolu kopyalandı.");
      }
    });
  const resetSessions = () => {
    useSessionStore.setState({ sessions: {}, activeSessionId: null });
    useSessionStore.persist.clearStorage();
    setReset(null);
    setConfirmation("");
    action.setNotice(
      "Bu cihazdaki yerel oturum state'i sıfırlandı. Sunucu dosyaları korunuyor.",
    );
  };
  return (
    <Page
      title="Ayarlar"
      description="Onay politikasını, üretim rotalarını ve model bağlantınızı tek noktadan yapılandırın."
    >
      {resource.loading && !resource.data ? (
        <Skeleton rows={5} />
      ) : resource.error ? (
        <ErrorState
          message={resource.error}
          retry={() => void resource.reload()}
        />
      ) : !resource.data ? (
        <Empty
          title="Ayarlar henüz hazır değil"
          description="Kurulum sihirbazıyla başlayın veya ayarları yeniden sorgulayın."
          action={
            <Button onClick={() => useUiStore.getState().setWizardOpen(true)}>
              Kurulumu aç
            </Button>
          }
        />
      ) : (
        <form
          className="hmx-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          noValidate
        >
          <Card
            title="Onay modu"
            description="Araç düzeyindeki yıkıcı eylemler her modda ayrıca açık onay gerektirir."
          >
            <div
              className="settings-policy"
              role="radiogroup"
              aria-label="Onay modu"
            >
              {policies.map((policy) => (
                <button
                  type="button"
                  role="radio"
                  key={policy.id}
                  aria-checked={mode === policy.id}
                  className="policy-option"
                  disabled={!!action.busy}
                  onClick={() => {
                    changed();
                    setMode(policy.id);
                  }}
                >
                  <strong>{policy.title}</strong>
                  <span>{policy.description}</span>
                  <small>{policy.example}</small>
                  {mode === policy.id && <Badge tone="ok">Seçili</Badge>}
                </button>
              ))}
            </div>
          </Card>
          <Card
            title="Kota bekleme süresi"
            description="Kotası dolan hesabın yeniden kullanılmadan önce bekleyeceği süre."
          >
            <Field
              label="Bekleme süresi (saat)"
              hint="1–72 saat. Varsayılan: 6 saat."
              error={errors.hours}
            >
              <input
                type="number"
                min={1}
                max={72}
                step="any"
                value={hours}
                disabled={!!action.busy}
                onChange={(e) => {
                  changed();
                  setHours(e.target.value);
                }}
              />
            </Field>
          </Card>
          <Card
            title="Yedek sağlayıcı zincirleri"
            description="Boş bırakılan zincirler otomatik tier sıralamasını kullanır."
          >
            <div className="hmx-grid">
              {KINDS.map((kind) => (
                <div key={kind}>
                  <Field label={kindLabel(kind)} error={errors[kind]}>
                    <input
                      value={orders[kind]}
                      disabled={!!action.busy}
                      placeholder="flow-ai,runway-web"
                      onChange={(e) => {
                        changed();
                        setOrders((old) => ({
                          ...old,
                          [kind]: e.target.value,
                        }));
                      }}
                    />
                  </Field>
                  <div className="settings-chain">
                    {orders[kind]
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean)
                      .map((id, i) => (
                        <span key={`${id}-${i}`}>
                          {i > 0 && <span aria-hidden="true"> → </span>}
                          <Badge>{id}</Badge>
                        </span>
                      ))}
                    {!orders[kind].trim() && <Badge>Otomatik sıralama</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card
            title="LLM bağlantısı"
            description="OpenAI uyumlu servis. Test geçici form değerlerini kullanır; Kaydet varsayılanları günceller."
          >
            <div className="hmx-form">
              <Field label="Servis adresi" error={errors.baseUrl}>
                <input
                  type="url"
                  value={llm.baseUrl}
                  disabled={!!action.busy}
                  onChange={(e) => {
                    changed();
                    setLlm((old) => ({ ...old, baseUrl: e.target.value }));
                  }}
                />
              </Field>
              <Field label="Model adı" error={errors.model}>
                <input
                  value={llm.model}
                  disabled={!!action.busy}
                  onChange={(e) => {
                    changed();
                    setLlm((old) => ({ ...old, model: e.target.value }));
                  }}
                />
              </Field>
              <Field
                label="API anahtarı (isteğe bağlı)"
                hint="Boş bırakılırsa kayıtlı anahtar korunur; anahtar bu arayüze geri gönderilmez."
              >
                <input
                  type="password"
                  autoComplete="new-password"
                  value={llm.apiKey}
                  disabled={!!action.busy}
                  onChange={(e) => {
                    changed();
                    setLlm((old) => ({ ...old, apiKey: e.target.value }));
                  }}
                />
              </Field>
              <div className="hmx-actions">
                <Button
                  variant="secondary"
                  icon="play"
                  busy={action.busy === "test"}
                  disabled={!!action.busy}
                  onClick={test}
                >
                  Test et
                </Button>
                {tested && <Badge tone="ok">Bağlı: {tested}</Badge>}
              </div>
            </div>
          </Card>
          {action.error && (
            <Notice tone="error">
              {action.error}
              <p>Form değerleri korunuyor; işlemi yeniden deneyebilirsiniz.</p>
            </Notice>
          )}
          <div className="hmx-footer">
            <Badge tone={dirty ? "warn" : "neutral"}>
              {dirty ? "Kaydedilmemiş değişiklikler" : "Değişiklik yok"}
            </Badge>
            <Button
              type="submit"
              icon="check"
              busy={action.busy === "save"}
              disabled={!dirty || !!action.busy}
            >
              Ayarları kaydet
            </Button>
          </div>
        </form>
      )}
      <Card
        title="Kurulum sihirbazı"
        description="LLM bağlantısı ve ilk hesap kurulumunu yeniden çalıştırın."
      >
        <Button
          variant="secondary"
          icon="settings"
          onClick={() => useUiStore.getState().setWizardOpen(true)}
        >
          Sihirbazı aç
        </Button>
      </Card>
      <Card
        title="Tehlikeli bölge"
        className="danger-zone"
        description="Yerel oturum sıfırlama yalnızca bu cihazın tarayıcı state'ini siler; ~/.hmx içindeki dosyaları silmez."
      >
        <p className="hmx-mono">
          {health.data?.home ?? "Veri dizini yükleniyor…"}
        </p>
        <div className="hmx-actions">
          <Button
            variant="secondary"
            icon="file"
            busy={action.busy === "open"}
            onClick={() => void openDirectory()}
          >
            Veri dizinini aç
          </Button>
          <Button
            variant="danger"
            icon="trash"
            onClick={() => {
              setReset(1);
              setConfirmation("");
            }}
          >
            Yerel oturumları sıfırla
          </Button>
        </div>
      </Card>
      {reset && (
        <Dialog title="Yerel oturumları sıfırla" onClose={() => setReset(null)}>
          {reset === 1 ? (
            <>
              <Notice tone="error">
                Bu cihazdaki tüm mesajlar, taslaklar ve oturum seçimleri
                silinecek. Bu işlem geri alınamaz.
              </Notice>
              <div className="hmx-actions">
                <Button variant="danger" onClick={() => setReset(2)}>
                  Riski anladım — devam et
                </Button>
                <Button variant="secondary" onClick={() => setReset(null)}>
                  Vazgeç
                </Button>
              </div>
            </>
          ) : (
            <div className="hmx-form">
              <Field
                label="İkinci onay"
                hint="Devam etmek için OTURUMLARI SIFIRLA yazın."
              >
                <input
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Button
                variant="danger"
                disabled={confirmation !== "OTURUMLARI SIFIRLA"}
                onClick={resetSessions}
              >
                Kalıcı olarak sıfırla
              </Button>
            </div>
          )}
        </Dialog>
      )}
      <Toast
        message={
          action.notice ||
          (action.error ? `İşlem başarısız: ${action.error}` : "")
        }
        onClose={() => {
          action.setNotice("");
          action.clearError();
        }}
      />
    </Page>
  );
}
