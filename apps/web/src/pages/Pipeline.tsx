import React, { useEffect, useState } from "react";
import { api } from "../api";

export function PipelinePage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [voiceover, setVoiceover] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/api/assets").then(setAssets).catch(() => {});
  useEffect(load, []);

  const toggle = (filePath: string) =>
    setSelected((s) => s.includes(filePath) ? s.filter((x) => x !== filePath) : [...s, filePath]);

  async function compose() {
    setBusy(true); setResult("");
    try {
      const clips = selected.filter((p) => assets.find((a) => a.filePath === p)?.type === "video");
      const r = await api.post("/api/compose", { clips, voiceover: voiceover || undefined });
      setResult(`✅ ${r.out} (${r.durationSec} sn, ffprobe doğrulandı)`);
    } catch (e: any) {
      setResult(`❌ ${e.message}`);
    }
    setBusy(false);
  }

  return (
    <div>
      <h2 className="page-title">Pipeline</h2>
      <div className="card">
        <b>Varlık Kataloğu</b> <span className="muted">(birleştirilecek klipleri seç)</span>
        <table>
          <thead><tr><th></th><th>Tür</th><th>Sağlayıcı</th><th>Dosya</th><th>Durum</th></tr></thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => a.status === "verified" && toggle(a.filePath)}>
                <td>{a.status === "verified" && <input type="checkbox" readOnly checked={selected.includes(a.filePath)} />}</td>
                <td><span className="badge dim">{a.type}</span></td>
                <td className="mono">{a.provider}</td>
                <td className="mono muted" style={{ fontSize: 11 }}>{a.filePath}</td>
                <td>{a.status === "verified" ? <span className="badge ok">✓ doğrulandı</span> : <span className="badge err">✗ eksik</span>}</td>
              </tr>
            ))}
            {assets.length === 0 && <tr><td colSpan={5} className="muted">Katalog boş. Önce üretim yapın.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card">
        <b>Birleştir (ffmpeg concat + amix)</b>
        <p>
          <input style={{ width: "100%" }} placeholder="Seslendirme dosyası (opsiyonel, mp3/wav yolu)"
            value={voiceover} onChange={(e) => setVoiceover(e.target.value)} />
        </p>
        <button className="btn" onClick={compose} disabled={busy || selected.length === 0}>
          {busy ? "Birleştiriliyor…" : `Birleştir (${selected.length} klip)`}
        </button>
        {result && <p style={{ marginTop: 10 }}>{result}</p>}
      </div>
    </div>
  );
}
