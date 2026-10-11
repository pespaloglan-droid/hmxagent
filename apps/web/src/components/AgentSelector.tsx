import { useResource } from "./pageData";
interface AgentEntry {
  id: string;
  name: string;
  kind: string;
  available: boolean;
  description: string;
  capabilities: string[];
}
export function AgentSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}): JSX.Element {
  const agents = useResource<AgentEntry[]>("/api/agents");
  const chosen = agents.data?.find((a) => a.id === value);
  return (
    <div className="selector">
      <label className="hmx-sr" htmlFor="chat-agent-select">
        Ajan seçimi
      </label>
      <select
        id="chat-agent-select"
        className="sel-btn"
        value={value ?? ""}
        aria-invalid={!!value && (!chosen || !chosen.available)}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={agents.loading && !agents.data}
        title={chosen?.description ?? agents.error ?? "Ajan seçimi"}
      >
        <option value="">HMX Native · varsayılan</option>
        {["native", "hermes", "opencode-style"].map((kind) => (
          <optgroup
            key={kind}
            label={
              {
                native: "Yerleşik / özel",
                hermes: "Hermes döngüsü",
                "opencode-style": "OpenCode döngüsü",
              }[kind]
            }
          >
            {agents.data
              ?.filter((a) => a.kind === kind)
              .map((a) => (
                <option key={a.id} value={a.id} disabled={!a.available}>
                  {a.name}
                  {a.available ? "" : " · pasif"}
                </option>
              ))}
          </optgroup>
        ))}
        {agents.error && <option disabled>Ajan listesi alınamadı</option>}
        {value && !chosen && !agents.loading && (
          <option value={value} disabled>
            {value} · bulunamadı
          </option>
        )}
      </select>
      {agents.error && (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => void agents.reload()}
        >
          Yeniden dene
        </button>
      )}
    </div>
  );
}
