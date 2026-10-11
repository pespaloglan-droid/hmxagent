import React, { useEffect, useState } from "react";
import { api } from "../api";

const TABS = ["Providers", "Accounts", "Token Routing", "Proxies", "Activity & Health"] as const;

export function ProvidersPage() {
  const [tab, setTab] = useState<string>("Providers");
  return (
    <div>
      <h2 className="page-title">Providers & Accounts</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === "Providers" && <ProvidersTab />}
      {tab === "Accounts" && <AccountsTab />}
      {tab === "Token Routing" && <RoutingTab />}
      {tab === "Proxies" && (
        <div className="card"><b>Proxy Yönetimi</b> <span className="badge warn">yakında</span>
          <p className="muted">Proxy havuzu ve coğrafi rotasyon bu sekmede olacak.</p></div>
      )}
      {tab === "Activity & Health" && <HealthTab />}
    </div>
  );
}

function ProvidersTab() {
  const [providers, setProviders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [json, setJson] = useState("");
  const [err, setErr] = useState("");
  const [testing, setTesting] = useState<string | null>(null);

  const load = () => {
    api.get("/api/providers").then(setProviders).catch(() => {});
    api.get("/api/accounts").then(setAccounts).catch(() => {});
  };
  useEffect(load, []);

  async function addProvider() {
    setErr("");
    try {
      const cfg = JSON.parse(json);
      await api.post("/api/providers", cfg);
      setShowAdd(false); setJson(""); load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function test(id: string) {
    setTesting(id);
    try {
      const r = await api.post(`/api/providers/${id}/test`, {});
      alert(r.ok ? "✅ Bağlantı OK" : "❌ Oturum/anahtar yok");
    } catch (e: any) { alert("Hata: " + e.message); }
    setTesting(null);
  }

  return (
    <>
      <div className="grid cols-3">
        {providers.map((p) => (
          <div key={p.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>{p.id}</b>
              {p.circuitOpen ? <span className="badge err">devre dışı</span> : <span className="badge ok">aktif</span>}
            </div>
            <p>
              <span className="badge dim">{p.kind}</span>{" "}
              <span className="badge dim">{p.tier}</span>{" "}
              <span className="badge dim">{p.authMode}</span>
            </p>
            <p className="muted">{accounts.filter((a) => a.provider === p.id).length} hesap</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn sm ghost" disabled={testing === p.id} onClick={() => test(p.id)}>
                {testing === p.id ? "…" : "Test"}
              </button>
              <button className="btn sm danger" onClick={() => api.del(`/api/providers/${p.id}`).then(load)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn" onClick={() => setShowAdd(true)}>+ Sağlayıcı Ekle</button>
      {showAdd && (
        <div className="modal-bg" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sağlayıcı Ekle (JSON config)</h3>
            <p className="muted" style={{ fontSize: 12 }}>
              Şema: id, kind (image/video/audio/llm), authMode, baseUrl, selectors, quotaIndicators, tier…
            </p>
            <textarea style={{ width: "100%", minHeight: 180 }} className="mono" value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder={'{\n  "id": "runway-web",\n  "kind": "video",\n  "authMode": "browser-session",\n  "baseUrl": "https://..."\n}'} />
            {err && <p style={{ color: "var(--err)" }}>{err}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={addProvider}>Kaydet</button>
              <button className="btn ghost" onClick={() => setShowAdd(false)}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AccountsTab() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [form, setForm] = useState({ providerId: "", label: "", profileDir: "", apiKey: "" });
  const [pendingLogin, setPendingLogin] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => api.get("/api/accounts").then(setAccounts).catch(() => {});
  useEffect(() => {
    load();
    api.get("/api/providers").then(setProviders).catch(() => {});
  }, []);

  const openAdd = () => {
    setShowAdd(true); setMsg("");
    api.get("/api/chrome-profiles").then(setProfiles).catch(() => setProfiles([]));
  };

  async function save() {
    setMsg("");
    try {
      if (form.apiKey) {
        await api.post("/api/accounts", { providerId: form.providerId, label: form.label, apiKey: form.apiKey });
      } else if (form.profileDir) {
        // Tarayici oturumu: Chrome acilir, kullanici girer, sonra "Kaydet" ile havuza yazilir
        const r = await api.post("/api/accounts/login/start", { providerId: form.providerId, label: form.label, profileDir: form.profileDir });
        setPendingLogin(r.pendingId);
        setMsg(r.message);
        return;
      } else {
        setMsg("API anahtarı veya Chrome profili seçmelisin."); return;
      }
      setShowAdd(false); setForm({ providerId: "", label: "", profileDir: "", apiKey: "" }); load();
    } catch (e: any) { setMsg(e.message); }
  }

  async function finishLogin() {
    if (!pendingLogin) return;
    try {
      await api.post("/api/accounts/login/finish", { pendingId: pendingLogin });
      setPendingLogin(null); setShowAdd(false);
      setForm({ providerId: "", label: "", profileDir: "", apiKey: "" });
      load();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <>
      <div className="card">
        <table>
          <thead><tr><th>Etiket</th><th>Sağlayıcı</th><th>Profil/Key</th><th>Durum</th><th>Cooldown</th><th>Hata</th><th></th></tr></thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.label}</td>
                <td className="mono">{a.provider}</td>
                <td className="muted">{a.profile ?? (a.hasApiKey ? "API key" : "—")}</td>
                <td>
                  {a.status === "active" && <span className="badge ok">Aktif</span>}
                  {a.status === "cooldown" && <span className="badge warn">Cooldown</span>}
                  {a.status === "error" && <span className="badge err">Hata</span>}
                </td>
                <td className="muted">{a.cooldownRemainingMs > 0 ? `${(a.cooldownRemainingMs / 3_600_000).toFixed(1)} sa` : "—"}</td>
                <td>{a.failCount > 0 ? a.failCount : "—"}</td>
                <td><button className="btn sm danger" onClick={() => api.del(`/api/accounts/${a.provider}/${a.id}`).then(load)}>Sil</button></td>
              </tr>
            ))}
            {accounts.length === 0 && <tr><td colSpan={7} className="muted">Hesap yok.</td></tr>}
          </tbody>
        </table>
      </div>
      <button className="btn" onClick={openAdd}>+ Hesap Ekle</button>
      {showAdd && (
        <div className="modal-bg" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Hesap Ekle</h3>
            <p>
              <select value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}>
                <option value="">Sağlayıcı seç…</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.id} ({p.authMode})</option>)}
              </select>{" "}
              <input placeholder="Etiket (örn. Kişisel Gmail)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </p>
            {providers.find((p) => p.id === form.providerId)?.authMode === "api-key" ? (
              <p><input style={{ width: "100%" }} type="password" placeholder="API anahtarı" value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })} /></p>
            ) : form.providerId ? (
              <div>
                <p className="muted" style={{ fontSize: 12 }}>Chrome profili seç:</p>
                {profiles.map((p) => (
                  <p key={p.dir}>
                    <label>
                      <input type="radio" name="prof" checked={form.profileDir === p.dir}
                        onChange={() => setForm({ ...form, profileDir: p.dir })} />{" "}
                      {p.name}{p.email ? ` (${p.email})` : ""} <span className="muted mono">{p.dir}</span>
                    </label>
                  </p>
                ))}
                {profiles.length === 0 && <p className="muted">Chrome profili bulunamadı.</p>}
              </div>
            ) : null}
            {msg && <p style={{ color: "var(--warn)" }}>{msg}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {pendingLogin
                ? <button className="btn" onClick={finishLogin}>Giriş yaptım — Kaydet</button>
                : <button className="btn" onClick={save}>{form.apiKey ? "Kaydet" : "Chrome'u Aç ve Giriş Yap"}</button>}
              <button className="btn ghost" onClick={() => { setShowAdd(false); setPendingLogin(null); }}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RoutingTab() {
  const [routing, setRouting] = useState<any>(null);
  useEffect(() => { api.get("/api/routing").then(setRouting).catch(() => {}); }, []);
  if (!routing) return <div className="card muted">Yükleniyor…</div>;
  const ts = routing.tokenSaver;
  return (
    <>
      <div className="card">
        <b>Tier zincirleri</b> <span className="muted">(subscription → cheap → free)</span>
        {Object.entries(routing.order).map(([kind, order]: any) => (
          <p key={kind}>
            <span className="badge dim">{kind}</span>{" "}
            {(order as string[]).map((id, i) => (
              <span key={id}>
                <span className="badge">{id}</span>{i < order.length - 1 && <span className="muted"> → </span>}
              </span>
            ))}
            {order.length === 0 && <span className="muted">(sağlayıcı yok)</span>}
          </p>
        ))}
        <p className="muted" style={{ fontSize: 12 }}>{routing.policy}</p>
      </div>
      <div className="card">
        <b>Token Saver</b>
        <p>Bu oturum: <span className="badge ok">%{Math.round((ts?.savedRatio ?? 0) * 100)} tasarruf</span></p>
        <p className="muted">{ts?.compressedCount ?? 0} çıktı sıkıştırıldı · {ts?.beforeTokens ?? 0} → {ts?.afterTokens ?? 0} token</p>
      </div>
    </>
  );
}

function HealthTab() {
  const [health, setHealth] = useState<any>(null);
  const [routing, setRouting] = useState<any>(null);
  useEffect(() => {
    api.get("/api/health").then(setHealth).catch(() => {});
    api.get("/api/routing").then(setRouting).catch(() => {});
  }, []);
  const bad = (routing?.accounts ?? []).filter((a: any) => a.status !== "active");
  return (
    <>
      <div className="grid cols-3">
        <div className="card"><b>Sistem</b>
          <p>LLM: {health ? <span className="badge ok">bağlı</span> : <span className="badge err">yok</span>}</p>
          <p>ffmpeg: {health?.ffmpeg ? <span className="badge ok">hazır</span> : <span className="badge err">yok</span>}</p>
        </div>
        <div className="card"><b>Hesaplar</b>
          <p>{health?.quota?.accounts ?? 0} toplam · <span style={{ color: "var(--warn)" }}>{health?.quota?.cooldown ?? 0} cooldown</span> · <span style={{ color: "var(--err)" }}>{health?.quota?.error ?? 0} hata</span></p>
        </div>
        <div className="card"><b>Devre kesici</b>
          {(routing?.circuits ?? []).filter((c: any) => c.open).length === 0
            ? <p className="muted">Açık devre yok.</p>
            : routing.circuits.filter((c: any) => c.open).map((c: any) => <p key={c.id}><span className="badge err">{c.id}</span></p>)}
        </div>
      </div>
      {bad.length > 0 && (
        <div className="card">
          <b>Dikkat gerektiren hesaplar</b>
          <table>
            <thead><tr><th>Hesap</th><th>Sağlayıcı</th><th>Durum</th><th>Not</th></tr></thead>
            <tbody>
              {bad.map((a: any) => (
                <tr key={a.id}><td>{a.label}</td><td className="mono">{a.provider}</td>
                  <td><span className={`badge ${a.status === "cooldown" ? "warn" : "err"}`}>{a.status}</span></td>
                  <td className="muted">{a.notes ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
