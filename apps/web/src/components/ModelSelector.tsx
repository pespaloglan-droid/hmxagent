import { useResource, kindLabel, KINDS } from "./pageData";
interface RegisteredModel {
  id: string;
  label: string;
  source: string;
  kind: "llm" | "image" | "video" | "audio";
  available: boolean;
  reason?: string;
}
export function ModelSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}): JSX.Element {
  const models = useResource<{ registered: RegisteredModel[] }>("/api/models");
  const selected = value
    ? value.startsWith("llm:")
      ? value
      : `llm:${value}`
    : "";
  return (
    <div className="selector">
      <label className="hmx-sr" htmlFor="chat-model-select">
        Model seçimi
      </label>
      <select
        id="chat-model-select"
        className="sel-btn"
        value={selected}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={models.loading && !models.data}
        title="Yalnızca entegre ve erişilebilir LLM modelleri seçilebilir. Medya için @ yönlendirmesi kullanın."
      >
        <option value="">Varsayılan model</option>
        {KINDS.map((kind) => (
          <optgroup key={kind} label={kindLabel(kind)}>
            {models.data?.registered
              ?.filter((model) => model.kind === kind)
              .map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                  disabled={!model.available || kind !== "llm"}
                >
                  {model.label}
                  {!model.available
                    ? ` · pasif: ${model.reason ?? "kullanılamıyor"}`
                    : kind !== "llm"
                      ? " · @ ile yönlendirin"
                      : ""}
                </option>
              ))}
          </optgroup>
        ))}
        {selected &&
          !models.data?.registered?.some((model) => model.id === selected) && (
            <option value={selected} disabled>
              {value} · kayıtlı değil
            </option>
          )}
        {models.error && <option disabled>Model listesi alınamadı</option>}
      </select>
      {models.error && (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => void models.reload()}
        >
          Yeniden dene
        </button>
      )}
    </div>
  );
}
