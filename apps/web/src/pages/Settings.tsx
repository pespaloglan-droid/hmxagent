import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useUiStore } from "../stores/uiStore";

export function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.get("/api/settings").then(setSettings).catch(() => {}); }, []);
  if (!settings) return <div className="card muted">Yükleniyor…</div>;

  const hours = (settings.quotaCooldownMs ?? 21_600_000) / 3_600_000;

  async function save(next: any) {
    await api.post("/api/settings", next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h2 className="page-title">Settings</h2>
      <div className="card" style={{ maxWidth: 560 }}>
        <b>Kota cooldown süresi</b>
        <p className="muted" style={{ fontSize: 12 }}>Kotası dolan hesap bu süre boyunca atlanır (HMX_QUOTA_COOLDOWN_MS).</p>
        <input type="number" min={1} value={hours} style={{ width: 100 }}
          onChange={(e) => setSettings({ ...settings, quotaCooldownMs: Number(e.target.value) * 3_600_000 })} /> saat
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <b>Fallback zincirleri</b>
        <p className="muted" style={{ fontSize: 12 }}>Virgülle ayrılmış sağlayıcı sırası (boş = tier'a göre otomatik).</p>
        {["image", "video", "audio", "llm"].map((kind) => (
          <p key={kind}>
            <span className="badge dim">{kind}</span>{" "}
            <input style={{ width: "70%" }} value={settings.orders?.[kind] ?? ""}
              placeholder="örn. flow-ai,runway-web"
              onChange={(e) => setSettings({ ...settings, orders: { ...settings.orders, [kind]: e.target.value } })} />
          </p>
        ))}
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <b>Onay Modu (Approval Policy)</b>
        <p className="muted" style={{ fontSize: 12 }}>
          Strict: güvenli okuma dışında her şeyde sorar · Balanced: sadece yıkıcı eylemlerde sorar · Fast: gündelik işlerde hiç sormaz.
        </p>
        <select value={settings.approvalMode ?? "balanced"}
          onChange={(e) => setSettings({ ...settings, approvalMode: e.target.value })}>
          <option value="strict">Strict — her görevde onay</option>
          <option value="balanced">Balanced — sadece riskli işlerde</option>
          <option value="fast">Fast — minimum onay</option>
        </select>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <b>Kurulum Sihirbazı</b>
        <p className="muted" style={{ fontSize: 12 }}>LLM bağlantısı ve ilk hesap kurulumunu yeniden çalıştır.</p>
        <button className="btn ghost" onClick={() => useUiStore.getState().setWizardOpen(true)}>Sihirbazı Aç</button>
      </div>
      <button className="btn" onClick={() => save(settings)}>Kaydet</button>
      {saved && <span className="badge ok" style={{ marginLeft: 10 }}>Kaydedildi ✓</span>}
    </div>
  );
}
