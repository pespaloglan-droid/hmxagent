import React, { useEffect, useState } from "react";
import { api } from "../api";

/** Ilk-acilis kurulum sihirbazi (Bolum 10.6): LLM -> Chrome profili -> ilk hesap */
export function WizardPage({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [llm, setLlm] = useState({ baseUrl: "http://localhost:11434/v1", model: "qwen2.5:14b", apiKey: "" });
  const [llmMsg, setLlmMsg] = useState("");
  const [providers, setProviders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [form, setForm] = useState({ providerId: "", label: "", profileDir: "" });
  const [pendingLogin, setPendingLogin] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/api/providers").then(setProviders).catch(() => {});
    api.get("/api/chrome-profiles").then(setProfiles).catch(() => {});
  }, []);

  async function saveLlm() {
    setLlmMsg("");
    try {
      const r = await api.post("/api/models/test", { baseUrl: llm.baseUrl, model: llm.model, apiKey: llm.apiKey || undefined });
      await api.post("/api/settings", { llm: { baseUrl: llm.baseUrl, model: llm.model, ...(llm.apiKey ? { apiKey: llm.apiKey } : {}) } });
      setLlmMsg(`✅ Bağlı: ${r.reply}`);
      setTimeout(() => setStep(1), 800);
    } catch (e: any) {
      setLlmMsg(`❌ ${e.message} — yine de ilerleyebilirsin (sonra Models sayfasından düzelt).`);
    }
  }

  async function startLogin() {
    setMsg("");
    try {
      const r = await api.post("/api/accounts/login/start", { providerId: form.providerId, label: form.label || undefined, profileDir: form.profileDir });
      setPendingLogin(r.pendingId);
      setMsg(r.message);
    } catch (e: any) { setMsg(`❌ ${e.message}`); }
  }

  async function finishLogin() {
    if (!pendingLogin) return;
    try {
      await api.post("/api/accounts/login/finish", { pendingId: pendingLogin });
      setStep(2);
    } catch (e: any) { setMsg(`❌ ${e.message}`); }
  }

  return (
    <div style={{ maxWidth: 620, margin: "60px auto" }}>
      <h2 className="page-title">HMX Agent Kurulum Sihirbazı</h2>
      <p className="muted">Adım {step + 1} / 3</p>

      {step === 0 && (
        <div className="card">
          <b>1) LLM Endpoint</b>
          <p className="muted" style={{ fontSize: 12 }}>OpenAI-uyumlu endpoint (Ollama, OpenRouter, vLLM…)</p>
          <p><input style={{ width: "100%" }} value={llm.baseUrl} onChange={(e) => setLlm({ ...llm, baseUrl: e.target.value })} placeholder="Base URL" /></p>
          <p><input style={{ width: "100%" }} value={llm.model} onChange={(e) => setLlm({ ...llm, model: e.target.value })} placeholder="Model" /></p>
          <p><input style={{ width: "100%" }} type="password" value={llm.apiKey} onChange={(e) => setLlm({ ...llm, apiKey: e.target.value })} placeholder="API key (opsiyonel)" /></p>
          {llmMsg && <p>{llmMsg}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={saveLlm}>Test et ve Kaydet</button>
            <button className="btn ghost" onClick={() => setStep(1)}>Atla</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <b>2) İlk hesabını ekle</b>
          <p className="muted" style={{ fontSize: 12 }}>Web oturumlu sağlayıcı (Flow AI, ElevenLabs…) için Chrome profilini seç.</p>
          <p>
            <select value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}>
              <option value="">Sağlayıcı seç…</option>
              {providers.filter((p) => p.authMode === "browser-session").map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
            </select>{" "}
            <input placeholder="Etiket" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </p>
          {profiles.map((p) => (
            <p key={p.dir}>
              <label>
                <input type="radio" name="wprof" checked={form.profileDir === p.dir}
                  onChange={() => setForm({ ...form, profileDir: p.dir })} />{" "}
                {p.name}{p.email ? ` (${p.email})` : ""}
              </label>
            </p>
          ))}
          {msg && <p style={{ color: "var(--warn)" }}>{msg}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            {pendingLogin
              ? <button className="btn" onClick={finishLogin}>Giriş yaptım — Kaydet</button>
              : <button className="btn" disabled={!form.providerId || !form.profileDir} onClick={startLogin}>Chrome'u Aç ve Giriş Yap</button>}
            <button className="btn ghost" onClick={() => setStep(2)}>Atla</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <b>3) Hazır!</b>
          <p className="muted">Kurulum tamamlandı. Chat'ten görev verebilir, Providers & Accounts'tan daha fazla hesap ekleyebilirsin.</p>
          <button className="btn" onClick={onDone}>Panele Git</button>
        </div>
      )}
    </div>
  );
}
