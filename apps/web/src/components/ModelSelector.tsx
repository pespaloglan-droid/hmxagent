import React, { useEffect, useState } from "react";
import { api } from "../api";

/**
 * Model secici: LLM endpoint'inden canli liste (GET /models), session override.
 * Global default + session-specific mantigi: value=null ise global default kullanilir.
 */
export function ModelSelector({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const [models, setModels] = useState<string[]>([]);
  const [globalDefault, setGlobalDefault] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/health").then((h) => setGlobalDefault(h.llm.model)).catch(() => {});
    api.get("/api/llm/models")
      .then((r) => { if (r.ok) setModels(r.models); else setErr(r.error ?? "liste alinamadi"); })
      .catch((e) => setErr(e.message));
  }, []);

  const shown = value ?? globalDefault;

  return (
    <select className="sel-btn" value={value ?? ""} title="Model sec (session'a ozel)"
      onChange={(e) => onChange(e.target.value || null)}>
      <option value="">🧠 {globalDefault || "model"} (global)</option>
      {models.filter((m) => m !== globalDefault).map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
      {models.length === 0 && <option disabled>{err ? "liste yok: endpoint?" : "liste yükleniyor…"}</option>}
    </select>
  );
}
