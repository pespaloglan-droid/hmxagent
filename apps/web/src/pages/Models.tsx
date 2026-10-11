import React, { useEffect, useState } from "react";
import { api } from "../api";

export function ModelsPage() {
  const [settings, setSettings] = useState<any>({});
  const [form, setForm] = useState({ baseUrl: "", model: "", apiKey: "" });
  const [testResult, setTestResult] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/api/settings").then((s) => {
      setSettings(s);
      setForm({ baseUrl: s.llm?.baseUrl ?? "", model: s.llm?.model ?? "", apiKey: "" });
    }).catch(() => {});
  }, []);

  async function save() {
    await api.post("/api/settings", { llm: { baseUrl: form.baseUrl, model: form.model, ...(form.apiKey ? { apiKey: form.apiKey } : {}) } });
    setTestResult("Kaydedildi ✓");
  }

  async function test() {
    setBusy(true); setTestResult("");
    try {
      const r = await api.post("/api/models/test", { baseUrl: form.baseUrl || undefined, model: form.model || undefined, apiKey: form.apiKey || undefined });
      setTestResult(`✅ Bağlı: ${r.reply}`);
    } catch (e: any) {
      setTestResult(`❌ ${e.message}`);
    }
    setBusy(false);
  }

  return (
    <div>
      <h2 className="page-title">Models</h2>
      <div className="card" style={{ maxWidth: 560 }}>
        <b>LLM Endpoint (HMX_LLM_*)</b>
        <p className="muted" style={{ fontSize: 12 }}>OpenAI-uyumlu herhangi bir endpoint: Ollama, OpenRouter, vLLM…</p>
        <p><input style={{ width: "100%" }} placeholder="Base URL (örn. http://localhost:11434/v1)" value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} /></p>
        <p><input style={{ width: "100%" }} placeholder="Model (örn. qwen2.5:14b)" value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })} /></p>
        <p><input style={{ width: "100%" }} type="password" placeholder="API key (opsiyonel)" value={form.apiKey}
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })} /></p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={save}>Kaydet</button>
          <button className="btn ghost" onClick={test} disabled={busy}>{busy ? "…" : "Test"}</button>
        </div>
        {testResult && <p style={{ marginTop: 10 }}>{testResult}</p>}
      </div>
    </div>
  );
}
