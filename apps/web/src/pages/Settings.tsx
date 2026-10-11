import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useUiStore } from "../stores/uiStore";
import {
  KINDS,
  assertOk,
  kindLabel,
  useAction,
  useResource,
  type Kind,
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
const defaultOrders: Record<Kind, string> = { image: "", video: "", audio: "", llm: "" };
export function SettingsPage(): JSX.Element {
  const settings = useResource<Settings>("/api/settings");
  const [hours, setHours] = useState("6");
  const [orders, setOrders] = useState(defaultOrders);
  const [mode, setMode] = useState<"strict" | "balanced" | "fast">("balanced");
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const action = useAction();
  useEffect(() => {
    if (!settings.data || dirtyRef.current) return;
    setHours(String((settings.data.quotaCooldownMs ?? 21_600_000) / 3_600_000));
    setOrders({ ...defaultOrders, ...settings.data.orders });
    setMode(settings.data.approvalMode ?? "balanced");
  }, [settings.data]);
  const changed = () => {
    dirtyRef.current = true;
    setDirty(true);
    setValidation({});
  };
  const save = () => {
    const errors: Record<string, string> = {};
    const value = Number(hours);
    if (
      !hours.trim() ||
      !Number.isFinite(value) ||
      value < 1 ||
      !Number.isSafeInteger(Math.round(value * 3_600_000))
    )
      errors.hours = "En az 1 saat olan geçerli bir sayı girin.";
    const normalized = { ...defaultOrders };
    for (const kind of KINDS) {
      const ids = orders[kind].trim() ? orders[kind].split(",").map((s) => s.trim()) : [];
      if (ids.some((id) => !/^[a-zA-Z0-9_-]+$/.test(id)))
        errors[kind] = "Kimlikleri virgülle ayırın; harf, rakam, tire ve alt çizgi kullanın.";
      else if (new Set(ids).size !== ids.length)
        errors[kind] = "Aynı sağlayıcıyı bir zincirde bir kez kullanın.";
      normalized[kind] = ids.join(",");
    }
    if (!["strict", "balanced", "fast"].includes(mode))
      errors.mode = "Geçerli bir onay modu seçin.";
    setValidation(errors);
    if (Object.keys(errors).length) return;
    void action.run("save", async () => {
      // Yalnızca bu formun alanları gönderilir; LLM ve diğer ayarlar korunur.
      assertOk(
        await api.post<{ ok: boolean; error?: string }>("/api/settings", {
          quotaCooldownMs: Math.round(value * 3_600_000),
          orders: normalized,
          approvalMode: mode,
        }),
      );
      dirtyRef.current = false;
      setDirty(false);
      setOrders(normalized);
      action.setNotice("Ayarlar kaydedildi.");
      await settings.reload();
    });
  };
  return (
    <Page
      title="Ayarlar"
      description="Kota beklemesini, yedek sağlayıcı sırasını ve ajanınızın onay politikasını düzenleyin."
    >
      {settings.loading && !settings.data ? (
        <Skeleton rows={5} />
      ) : settings.error ? (
        <ErrorState message={settings.error} retry={() => void settings.reload()} />
      ) : !settings.data ? (
        <Empty
          icon="settings"
          title="Ayarlar alınamadı"
          description="Kurulum sihirbazıyla bağlantınızı yapılandırın."
          action={
            <Button onClick={() => useUiStore.getState().setWizardOpen(true)}>Kurulumu aç</Button>
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
          <Notice>
            Mevcut backend bekleme süresini dosyaya kaydeder fakat hesap havuzuna uygulamaz. Ayrıca
            bir zinciri boşaltmak, çalışan sunucudaki önceki sıralamayı temizlemez. Bu davranışlar
            backend düzeltmesi gerektirir.
          </Notice>
          <Card
            title="Kota bekleme süresi"
            description="Kotası dolan hesabın yeniden kullanımdan önce bekleyeceği süre."
          >
            <Field
              label="Bekleme süresi (saat)"
              hint="Varsayılan: 6 saat. En az 1 saat girin."
              error={validation.hours}
            >
              <input
                type="number"
                min="1"
                step="any"
                inputMode="decimal"
                value={hours}
                disabled={!!action.busy}
                onChange={(e) => {
                  changed();
                  setHours(e.target.value);
                }}
                aria-invalid={!!validation.hours}
              />
            </Field>
          </Card>
          <Card
            title="Yedek sağlayıcı zincirleri"
            description="Virgülle ayrılmış sağlayıcı kimlikleri. Boş bırakırsanız otomatik tier sıralaması kullanılır."
          >
            <div className="hmx-grid">
              {KINDS.map((kind) => (
                <Field key={kind} label={kindLabel(kind)} error={validation[kind]}>
                  <input
                    value={orders[kind]}
                    disabled={!!action.busy}
                    placeholder="Örnek: flow-ai,runway-web"
                    aria-invalid={!!validation[kind]}
                    onChange={(e) => {
                      changed();
                      setOrders((old) => ({ ...old, [kind]: e.target.value }));
                    }}
                  />
                </Field>
              ))}
            </div>
          </Card>
          <Card
            title="Onay politikası"
            description="Hız ile kontrol arasındaki dengeyi seçin. Seçim, izin gereken eylemleri etkiler."
          >
            <Field label="Onay modu" error={validation.mode}>
              <select
                value={mode}
                disabled={!!action.busy}
                onChange={(e) => {
                  changed();
                  setMode(e.target.value as typeof mode);
                }}
              >
                <option value="strict">Sıkı — güvenli okuma dışındaki eylemlerde sor</option>
                <option value="balanced">Dengeli — yıkıcı eylemlerde sor</option>
                <option value="fast">Hızlı — günlük işlerde minimum onay</option>
              </select>
            </Field>
            {mode === "fast" && (
              <Notice>
                Hızlı mod daha az onay ister. Riskli veya hassas görevlerde Sıkı ya da Dengeli modu
                tercih edin.
              </Notice>
            )}
          </Card>
          {action.error && (
            <Notice tone="error">
              {action.error}
              <p>Değişiklikleriniz korunuyor. Yeniden kaydetmeyi deneyin.</p>
            </Notice>
          )}
          <div className="hmx-footer">
            <Badge tone={dirty ? "warn" : "neutral"}>
              {dirty ? "Kaydedilmemiş değişiklikler" : "Değişiklik yok"}
            </Badge>
            <Button type="submit" icon="check" busy={!!action.busy} disabled={!dirty}>
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
      <Toast message={action.notice} onClose={() => action.setNotice("")} />
    </Page>
  );
}
