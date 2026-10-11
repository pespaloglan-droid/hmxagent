import { useEffect, useId, useRef, useState } from "react";
import { api } from "../api";
import { useUiStore } from "../stores/uiStore";
import {
  KINDS,
  assertOk,
  kindLabel,
  segment,
  statusLabel,
  tierLabel,
  useAction,
  useResource,
  validHttpUrl,
  type Account,
  type ChromeProfile,
  type Health,
  type Provider,
  type Routing,
} from "../components/pageData";
import {
  Badge,
  Button,
  Card,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Icon,
  Notice,
  Page,
  Skeleton,
  Table,
  Toast,
} from "../components/ui";
// Sekme kimlikleri korunur, kullanıcıya görünen etiketler Türkçedir.
const TABS = [
  ["Providers", "Sağlayıcılar"],
  ["Accounts", "Hesaplar"],
  ["Token Routing", "Token yönlendirme"],
  ["Proxies", "Proxy'ler"],
  ["Activity & Health", "Etkinlik ve sağlık"],
] as const;
type Tab = (typeof TABS)[number][0];
export function ProvidersPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>("Providers");
  const [locked, setLocked] = useState(false);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tablist = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reveal = () => {
      const strip = tablist.current;
      const button = buttons.current[TABS.findIndex(([key]) => key === tab)];
      if (!strip || !button) return;
      const left = button.offsetLeft - strip.offsetLeft;
      if (left < strip.scrollLeft) strip.scrollLeft = left;
      else if (left + button.offsetWidth > strip.scrollLeft + strip.clientWidth)
        strip.scrollLeft = left + button.offsetWidth - strip.clientWidth;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    if (tablist.current) observer.observe(tablist.current);
    return () => observer.disconnect();
  }, [tab]);
  return (
    <Page
      title="Sağlayıcılar ve hesaplar"
      description="Bağlantılarınızı yönetin, hesap havuzunu izleyin ve üretim rotalarını kontrol edin."
    >
      <div ref={tablist} className="hmx-tabs" role="tablist" aria-label="Sağlayıcı yönetimi">
        {TABS.map(([key, label], index) => (
          <button
            key={key}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel`}
            role="tab"
            aria-selected={tab === key}
            disabled={locked && tab !== key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              if (locked) return;
              let next: number | null = null;
              if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
              if (event.key === "ArrowLeft") next = (index + TABS.length - 1) % TABS.length;
              if (event.key === "Home") next = 0;
              if (event.key === "End") next = TABS.length - 1;
              if (next !== null) {
                event.preventDefault();
                setTab(TABS[next][0]);
                buttons.current[next]?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${TABS.findIndex(([key]) => key === tab)}`}
        className="hmx-form"
      >
        {tab === "Providers" && <ProvidersTab onLock={setLocked} />}
        {tab === "Accounts" && <AccountsTab onLock={setLocked} />}
        {tab === "Token Routing" && <RoutingTab />}
        {tab === "Proxies" && (
          <Empty
            icon="link"
            title="Proxy yönetimi hazırlık aşamasında"
            description="Mevcut API proxy havuzu veya coğrafi rotasyon sağlamıyor. Bu sekmede henüz ekleme ya da düzenleme yapılamaz."
            action={
              <Button variant="secondary" onClick={() => setTab("Providers")}>
                Sağlayıcılara dön
              </Button>
            }
          />
        )}
        {tab === "Activity & Health" && <HealthTab />}
      </div>
    </Page>
  );
}
function DeleteDialog({
  label,
  busy,
  error,
  onClose,
  onDelete,
}: {
  label: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onDelete: () => void;
}): JSX.Element {
  return (
    <Dialog title="Kaydı sil" busy={busy} onClose={onClose}>
      <p>
        <strong>{label}</strong> kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="hmx-actions">
        <Button variant="danger" icon="trash" busy={busy} onClick={onDelete}>
          Evet, sil
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Vazgeç
        </Button>
      </div>
    </Dialog>
  );
}
function ProvidersTab({ onLock }: { onLock: (locked: boolean) => void }): JSX.Element {
  const providers = useResource<Provider[]>("/api/providers");
  const accounts = useResource<Account[]>("/api/accounts");
  const action = useAction();
  const [adding, setAdding] = useState(false);
  const [json, setJson] = useState("");
  const [validation, setValidation] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  useEffect(() => {
    onLock(!!action.busy || adding || !!deleting);
    return () => onLock(false);
  }, [action.busy, adding, deleting, onLock]);
  const reload = async () => {
    await Promise.all([providers.reload(), accounts.reload()]);
  };
  const add = () => {
    setValidation("");
    let cfg: unknown;
    try {
      cfg = JSON.parse(json);
    } catch {
      setValidation("Geçerli bir JSON nesnesi girin.");
      return;
    }
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
      setValidation("Yapılandırma bir JSON nesnesi olmalı.");
      return;
    }
    const object = cfg as Record<string, unknown>;
    if (typeof object.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(object.id)) {
      setValidation("Kimlik yalnızca harf, rakam, alt çizgi ve tire içerebilir.");
      return;
    }
    if (providers.data?.some((p) => p.id === object.id)) {
      setValidation("Bu kimlik zaten var. Farklı bir kimlik kullanın.");
      return;
    }
    if (
      !KINDS.includes(object.kind as Provider["kind"]) ||
      !["api-key", "browser-session"].includes(String(object.authMode))
    ) {
      setValidation("kind: image/video/audio/llm; authMode: api-key/browser-session olmalı.");
      return;
    }
    if (typeof object.baseUrl !== "string" || !validHttpUrl(object.baseUrl)) {
      setValidation("baseUrl geçerli bir HTTP(S) adresi olmalı.");
      return;
    }
    void action.run("add", async () => {
      assertOk(await api.post<{ ok: boolean; error?: string }>("/api/providers", object));
      setAdding(false);
      setJson("");
      action.setNotice("Sağlayıcı eklendi.");
      await reload();
    });
  };
  const test = (id: string) =>
    action.run(`test:${id}`, async () => {
      const result = await api.post<{ ok: boolean; error?: string }>(
        `/api/providers/${segment(id)}/test`,
        {},
      );
      setResults((old) => ({ ...old, [id]: result.ok }));
      if (!result.ok) throw new Error(result.error ?? `${id}: oturum veya anahtar kullanılamıyor.`);
      action.setNotice(`${id}: bağlantı testi başarılı.`);
    });
  const remove = () => {
    if (!deleting) return;
    const target = deleting;
    void action.run("delete", async () => {
      assertOk(await api.del<{ ok: boolean; error?: string }>(`/api/providers/${segment(target)}`));
      setDeleting(null);
      action.setNotice("Sağlayıcı silindi.");
      await reload();
    });
  };
  const error = providers.error || accounts.error;
  return (
    <>
      <div className="hmx-footer">
        <span className="hmx-muted">
          {providers.data?.length ?? 0} sağlayıcı · {accounts.data?.length ?? 0} hesap
        </span>
        <div className="hmx-actions">
          <Button
            variant="secondary"
            icon="refresh"
            disabled={!!action.busy}
            busy={providers.loading || accounts.loading}
            onClick={() => void reload()}
          >
            Yenile
          </Button>
          <Button
            icon="plus"
            disabled={!!action.busy}
            onClick={() => {
              action.clearError();
              setValidation("");
              setAdding(true);
            }}
          >
            Sağlayıcı ekle
          </Button>
        </div>
      </div>
      {action.error && !adding && (
        <Notice tone="error">
          {action.error}
          <p>Testi veya silme işlemini yeniden deneyebilirsiniz.</p>
        </Notice>
      )}
      {(providers.loading && !providers.data) || (accounts.loading && !accounts.data) ? (
        <Skeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} retry={() => void reload()} />
      ) : !providers.data?.length ? (
        <Empty
          icon="link"
          title="Sağlayıcı ağınızı kurun"
          description="İlk sağlayıcınızı JSON yapılandırmasıyla ekleyin. Hesaplar ve yedek rotalar bu kayıtlar üzerinden çalışır."
          action={
            <Button icon="plus" onClick={() => setAdding(true)}>
              İlk sağlayıcıyı ekle
            </Button>
          }
        />
      ) : (
        <div className="hmx-grid">
          {providers.data.map((p) => (
            <Card className="hmx-provider" key={p.id}>
              <div className="hmx-icon-tile">
                <Icon name={p.authMode === "api-key" ? "server" : "link"} />
              </div>
              <div className="hmx-provider-top">
                <h2>{p.id}</h2>
                <Badge tone={p.circuitOpen ? "error" : "neutral"}>
                  {p.circuitOpen ? "Devre açık" : "Devre kapalı"}
                </Badge>
              </div>
              <div className="hmx-tags">
                <Badge>{kindLabel(p.kind)}</Badge>
                <Badge>{tierLabel(p.tier)}</Badge>
                <Badge>{p.authMode === "api-key" ? "API anahtarı" : "Tarayıcı oturumu"}</Badge>
              </div>
              <p>{accounts.data?.filter((a) => a.provider === p.id).length ?? 0} bağlı hesap</p>
              {results[p.id] !== undefined && (
                <p>
                  <Badge tone={results[p.id] ? "ok" : "error"}>
                    {results[p.id] ? "Test başarılı" : "Test başarısız"}
                  </Badge>
                </p>
              )}
              <div className="hmx-actions">
                <Button
                  variant="secondary"
                  icon="play"
                  busy={action.busy === `test:${p.id}`}
                  disabled={!!action.busy}
                  onClick={() => void test(p.id)}
                >
                  Test et
                </Button>
                <Button
                  variant="danger"
                  icon="trash"
                  disabled={!!action.busy}
                  aria-label={`${p.id} sağlayıcısını sil`}
                  onClick={() => {
                    action.clearError();
                    setDeleting(p.id);
                  }}
                >
                  Sil
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {adding && (
        <Dialog title="Sağlayıcı ekle" busy={!!action.busy} onClose={() => setAdding(false)}>
          <form
            className="hmx-form"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <Field
              label="JSON yapılandırması"
              hint="Zorunlu alanlar: id, kind, authMode, baseUrl. Mevcut selector, kota ve tier alanlarını da ekleyebilirsiniz."
              error={validation}
            >
              <textarea
                className="hmx-mono"
                value={json}
                onChange={(e) => {
                  setJson(e.target.value);
                  setValidation("");
                }}
                disabled={!!action.busy}
                placeholder={
                  '{\n  "id": "ornek-video",\n  "kind": "video",\n  "authMode": "browser-session",\n  "baseUrl": "https://example.com",\n  "tier": "free"\n}'
                }
              />
            </Field>
            {action.error && <Notice tone="error">{action.error}</Notice>}
            <Button type="submit" icon="check" busy={!!action.busy}>
              Sağlayıcıyı kaydet
            </Button>
          </form>
        </Dialog>
      )}
      {deleting && (
        <DeleteDialog
          error={action.error}
          label={deleting}
          busy={!!action.busy}
          onClose={() => setDeleting(null)}
          onDelete={remove}
        />
      )}
      <Toast message={action.notice} onClose={() => action.setNotice("")} />
    </>
  );
}
const blankAccount = { providerId: "", label: "", profileDir: "", apiKey: "" };
function AccountsTab({ onLock }: { onLock: (locked: boolean) => void }): JSX.Element {
  const accounts = useResource<Account[]>("/api/accounts");
  const providers = useResource<Provider[]>("/api/providers");
  const [adding, setAdding] = useState(false);
  const profiles = useResource<ChromeProfile[]>(adding ? "/api/chrome-profiles" : null);
  const [form, setForm] = useState(blankAccount);
  const [pending, setPending] = useState<string | null>(null);
  const [validation, setValidation] = useState("");
  const [deleting, setDeleting] = useState<Account | null>(null);
  const action = useAction();
  const selected = providers.data?.find((p) => p.id === form.providerId);
  useEffect(() => {
    onLock(!!action.busy || !!pending || adding || !!deleting);
    return () => onLock(false);
  }, [action.busy, pending, adding, deleting, onLock]);
  const reload = async () => {
    await Promise.all([accounts.reload(), providers.reload()]);
  };
  const reset = () => {
    setPending(null);
    setAdding(false);
    setForm(blankAccount);
  };
  const save = () => {
    setValidation("");
    if (!selected) {
      setValidation("Bir sağlayıcı seçin.");
      return;
    }
    if (!form.label.trim()) {
      setValidation("Hesap için bir etiket girin.");
      return;
    }
    if (selected.authMode === "api-key" ? !form.apiKey.trim() : !form.profileDir) {
      setValidation(
        selected.authMode === "api-key" ? "API anahtarını girin." : "Bir Chrome profili seçin.",
      );
      return;
    }
    void action.run("save", async () => {
      if (selected.authMode === "api-key") {
        assertOk(
          await api.post<{ ok: boolean; error?: string }>("/api/accounts", {
            providerId: form.providerId,
            label: form.label.trim(),
            apiKey: form.apiKey.trim(),
          }),
        );
        reset();
        action.setNotice("Hesap eklendi.");
        await accounts.reload();
      } else {
        const result = assertOk(
          await api.post<{ ok: boolean; pendingId: string; error?: string }>(
            "/api/accounts/login/start",
            { providerId: form.providerId, label: form.label.trim(), profileDir: form.profileDir },
          ),
        );
        setPending(result.pendingId);
      }
    });
  };
  const finish = () => {
    if (!pending) return;
    void action.run("finish", async () => {
      assertOk(
        await api.post<{ ok: boolean; error?: string }>("/api/accounts/login/finish", {
          pendingId: pending,
        }),
      );
      reset();
      action.setNotice("Tarayıcı hesabı kaydedildi.");
      await accounts.reload();
    });
  };
  const remove = () => {
    if (!deleting) return;
    const target = deleting;
    void action.run("delete", async () => {
      assertOk(
        await api.del<{ ok: boolean; error?: string }>(
          `/api/accounts/${segment(target.provider)}/${segment(target.id)}`,
        ),
      );
      setDeleting(null);
      action.setNotice("Hesap silindi.");
      await accounts.reload();
    });
  };
  const error = accounts.error || providers.error;
  return (
    <>
      <div className="hmx-footer">
        <span className="hmx-muted">Hesap havuzu · kota ve oturum durumu</span>
        <div className="hmx-actions">
          <Button
            variant="secondary"
            icon="refresh"
            busy={accounts.loading || providers.loading}
            disabled={!!action.busy}
            onClick={() => void reload()}
          >
            Yenile
          </Button>
          <Button
            icon="plus"
            disabled={!!action.busy}
            onClick={() => {
              setValidation("");
              action.clearError();
              setAdding(true);
            }}
          >
            Hesap ekle
          </Button>
        </div>
      </div>
      {action.error && !adding && (
        <Notice tone="error">
          {action.error}
          <p>Silme işlemini yeniden deneyebilirsiniz.</p>
        </Notice>
      )}
      {(accounts.loading && !accounts.data) || (providers.loading && !providers.data) ? (
        <Skeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} retry={() => void reload()} />
      ) : !accounts.data?.length ? (
        <Empty
          title="Hesap havuzunuz boş"
          description="Tarayıcı profili veya API anahtarı ekleyerek sağlayıcılarınıza erişim tanımlayın."
          action={
            <Button icon="plus" onClick={() => setAdding(true)}>
              İlk hesabı ekle
            </Button>
          }
        />
      ) : (
        <Card title="Hesap havuzu" actions={<Badge>{accounts.data.length} hesap</Badge>}>
          <Table label="Sağlayıcı hesapları">
            <thead>
              <tr>
                <th scope="col">Hesap</th>
                <th scope="col">Sağlayıcı</th>
                <th scope="col">Kimlik türü</th>
                <th scope="col">Durum</th>
                <th scope="col">Bekleme</th>
                <th scope="col">Hata</th>
                <th scope="col">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {accounts.data.map((a) => (
                <tr key={`${a.provider}:${a.id}`}>
                  <td>
                    <strong>{a.label}</strong>
                  </td>
                  <td className="hmx-mono">{a.provider}</td>
                  <td>{a.profile ?? (a.hasApiKey ? "API anahtarı" : "—")}</td>
                  <td>
                    <Badge
                      tone={
                        a.status === "active" ? "ok" : a.status === "cooldown" ? "warn" : "error"
                      }
                    >
                      {statusLabel(a.status)}
                    </Badge>
                  </td>
                  <td>
                    {a.cooldownRemainingMs > 0
                      ? `${(a.cooldownRemainingMs / 3_600_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sa`
                      : "—"}
                  </td>
                  <td>{a.failCount}</td>
                  <td>
                    <Button
                      variant="danger"
                      icon="trash"
                      disabled={!!action.busy}
                      aria-label={`${a.label} hesabını sil`}
                      onClick={() => {
                        action.clearError();
                        setDeleting(a);
                      }}
                    >
                      Sil
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      {adding && (
        <Dialog
          title={pending ? "Tarayıcı girişini tamamla" : "Hesap ekle"}
          busy={!!action.busy}
          onClose={() => setAdding(false)}
        >
          {pending ? (
            <div className="hmx-form">
              <Notice>
                Chrome açıldı. Sağlayıcının sayfasında giriş yapın, ardından aşağıdaki düğmeyle
                hesabı havuza kaydedin.
              </Notice>
              <p>
                Backend giriş iptal ucu sağlamıyor. Pencereyi kapatsanız da bekleyen işlem korunur;
                Hesap ekle düğmesiyle tekrar açabilirsiniz.
              </p>
              {action.error && <Notice tone="error">{action.error}</Notice>}
              <Button icon="check" busy={!!action.busy} onClick={finish}>
                Giriş yaptım — Kaydet
              </Button>
            </div>
          ) : (
            <form
              className="hmx-form"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              {providers.error && (
                <ErrorState message={providers.error} retry={() => void providers.reload()} />
              )}
              {!providers.data?.length && (
                <Notice>Önce Sağlayıcılar sekmesinden bir sağlayıcı ekleyin.</Notice>
              )}
              <Field label="Sağlayıcı">
                <select
                  value={form.providerId}
                  disabled={!!action.busy}
                  onChange={(e) => {
                    setForm((old) => ({
                      ...old,
                      providerId: e.target.value,
                      apiKey: "",
                      profileDir: "",
                    }));
                    setValidation("");
                  }}
                >
                  <option value="">Sağlayıcı seçin</option>
                  {providers.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} · {p.authMode === "api-key" ? "API anahtarı" : "Tarayıcı"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hesap etiketi">
                <input
                  value={form.label}
                  disabled={!!action.busy}
                  onChange={(e) => setForm((old) => ({ ...old, label: e.target.value }))}
                  placeholder="Örnek: Kişisel hesabım"
                />
              </Field>
              {selected?.authMode === "api-key" ? (
                <Field label="API anahtarı">
                  <input
                    type="password"
                    autoComplete="new-password"
                    disabled={!!action.busy}
                    value={form.apiKey}
                    onChange={(e) => setForm((old) => ({ ...old, apiKey: e.target.value }))}
                  />
                </Field>
              ) : selected ? (
                <div className="hmx-form">
                  <strong>Chrome profili</strong>
                  {profiles.loading && !profiles.data ? (
                    <Skeleton rows={2} />
                  ) : profiles.error ? (
                    <ErrorState message={profiles.error} retry={() => void profiles.reload()} />
                  ) : !profiles.data?.length ? (
                    <Empty
                      icon="server"
                      title="Chrome profili bulunamadı"
                      description="Sunucunun çalıştığı bilgisayarda Chrome profili oluşturup tekrar deneyin."
                      action={
                        <Button variant="secondary" onClick={() => void profiles.reload()}>
                          Profilleri yenile
                        </Button>
                      }
                    />
                  ) : (
                    profiles.data.map((profile) => (
                      <label className="hmx-radio" key={profile.dir}>
                        <input
                          type="radio"
                          name="chrome-profile"
                          disabled={!!action.busy}
                          checked={form.profileDir === profile.dir}
                          onChange={() => setForm((old) => ({ ...old, profileDir: profile.dir }))}
                        />
                        <span>
                          {profile.name}
                          {profile.email ? ` · ${profile.email}` : ""}
                          <br />
                          <span className="hmx-muted hmx-mono">{profile.dir}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              ) : null}
              {validation && <Notice tone="error">{validation}</Notice>}
              {action.error && <Notice tone="error">{action.error}</Notice>}
              <Button
                type="submit"
                icon={selected?.authMode === "api-key" ? "check" : "link"}
                busy={!!action.busy}
                disabled={!providers.data?.length}
              >
                {selected?.authMode === "api-key" ? "Hesabı kaydet" : "Chrome'u aç ve giriş yap"}
              </Button>
            </form>
          )}
        </Dialog>
      )}
      {deleting && (
        <DeleteDialog
          error={action.error}
          label={deleting.label}
          busy={!!action.busy}
          onClose={() => setDeleting(null)}
          onDelete={remove}
        />
      )}
      <Toast message={action.notice} onClose={() => action.setNotice("")} />
    </>
  );
}
function RoutingTab(): JSX.Element {
  const routing = useResource<Routing>("/api/routing");
  const data = routing.data;
  const ts = data?.tokenSaver;
  if (routing.loading && !data) return <Skeleton />;
  if (routing.error)
    return <ErrorState message={routing.error} retry={() => void routing.reload()} />;
  if (!data || KINDS.every((kind) => !data.order[kind]?.length))
    return (
      <Empty
        title="Yönlendirme zinciri boş"
        description="Bir sağlayıcı eklediğinizde türlere göre yedek rotalar burada görünür."
        action={
          <Button onClick={() => useUiStore.getState().setPage("settings")}>
            Yönlendirme ayarlarını aç
          </Button>
        }
      />
    );
  return (
    <>
      <Card
        title="Yedek sağlayıcı zincirleri"
        description="Öncelik: tercih edilen sağlayıcı → abonelik → ekonomik → ücretsiz."
        actions={
          <Button
            icon="refresh"
            variant="secondary"
            busy={routing.loading}
            onClick={() => void routing.reload()}
          >
            Yenile
          </Button>
        }
      >
        {KINDS.map((kind) => (
          <div className="hmx-route" key={kind}>
            <strong>{kindLabel(kind)}</strong>
            {data.order[kind]?.length ? (
              data.order[kind].map((id, i) => (
                <span className="hmx-actions" key={id}>
                  {i > 0 && <span aria-hidden="true">→</span>}
                  <Badge>{id}</Badge>
                </span>
              ))
            ) : (
              <span className="hmx-muted">Sağlayıcı tanımlanmamış</span>
            )}
          </div>
        ))}
        <p>Devre kesici, art arda hatalarda sağlayıcıyı geçici olarak rotadan çıkarır.</p>
      </Card>
      <Card
        title="Token tasarrufu"
        description="Sunucunun mevcut oturum için bildirdiği sıkıştırma istatistikleri."
      >
        <div className="hmx-grid">
          <div>
            <span className="hmx-muted">Tasarruf oranı</span>
            <div className="hmx-stat">%{Math.round((ts?.savedRatio ?? 0) * 100)}</div>
          </div>
          <div>
            <span className="hmx-muted">Sıkıştırılan çıktı</span>
            <div className="hmx-stat">{ts?.compressedCount ?? 0}</div>
          </div>
          <div>
            <span className="hmx-muted">Token değişimi</span>
            <p>
              {ts?.beforeTokens ?? 0} → {ts?.afterTokens ?? 0}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
function HealthTab(): JSX.Element {
  const health = useResource<Health>("/api/health");
  const routing = useResource<Routing>("/api/routing");
  const reload = async () => {
    await Promise.all([health.reload(), routing.reload()]);
  };
  if ((health.loading && !health.data) || (routing.loading && !routing.data)) return <Skeleton />;
  if (health.error || routing.error)
    return <ErrorState message={health.error || routing.error} retry={() => void reload()} />;
  if (!health.data || !routing.data)
    return (
      <Empty
        title="Sağlık verisi yok"
        description="Dashboard durumunu yeniden sorgulayın."
        action={
          <Button icon="refresh" onClick={() => void reload()}>
            Yeniden kontrol et
          </Button>
        }
      />
    );
  const bad = routing.data.accounts.filter((a) => a.status !== "active");
  const circuits = routing.data.circuits.filter((c) => c.open);
  return (
    <>
      <div className="hmx-actions">
        <Button
          icon="refresh"
          variant="secondary"
          busy={health.loading || routing.loading}
          onClick={() => void reload()}
        >
          Durumu yenile
        </Button>
      </div>
      <div className="hmx-grid">
        <Card title="Sistem">
          <p>
            Dashboard:{" "}
            <Badge tone={health.data.ok ? "ok" : "error"}>
              {health.data.ok ? "Hazır" : "Hata"}
            </Badge>
          </p>
          <p>
            ffmpeg:{" "}
            <Badge tone={health.data.ffmpeg ? "ok" : "error"}>
              {health.data.ffmpeg ? "Kullanılabilir" : "Bulunamadı"}
            </Badge>
          </p>
          <p>LLM: yapılandırma mevcut; bağlantıyı Modeller sayfasında test edin.</p>
        </Card>
        <Card title="Hesap durumu">
          <div className="hmx-stat">{health.data.quota?.accounts ?? 0}</div>
          <p>
            {health.data.quota?.cooldown ?? 0} beklemede · {health.data.quota?.error ?? 0} hatalı
          </p>
        </Card>
        <Card title="Devre kesici">
          <div className="hmx-stat">{circuits.length}</div>
          <p>Açık devre · geçici olarak atlanan sağlayıcı</p>
          {circuits.map((c) => (
            <Badge tone="error" key={c.id}>
              {c.id}
            </Badge>
          ))}
        </Card>
      </div>
      {bad.length ? (
        <Card title="Dikkat gerektiren hesaplar">
          <Table label="Sorunlu hesaplar">
            <thead>
              <tr>
                <th scope="col">Hesap</th>
                <th scope="col">Sağlayıcı</th>
                <th scope="col">Durum</th>
                <th scope="col">Not</th>
              </tr>
            </thead>
            <tbody>
              {bad.map((a) => (
                <tr key={`${a.provider}:${a.id}`}>
                  <td>{a.label}</td>
                  <td className="hmx-mono">{a.provider}</td>
                  <td>
                    <Badge tone={a.status === "cooldown" ? "warn" : "error"}>
                      {statusLabel(a.status)}
                    </Badge>
                  </td>
                  <td>{a.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <Notice tone="ok">
          Dikkat gerektiren hesap kaydı yok. Bu, tüm sağlayıcı bağlantılarının test edildiği
          anlamına gelmez.
        </Notice>
      )}
    </>
  );
}
