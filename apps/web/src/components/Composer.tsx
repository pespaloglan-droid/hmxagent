import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, Icon } from "./ui";
export function Composer({
  draft,
  onDraftChange,
  onSend,
  busy,
  agentSlot,
  modelSlot,
  mentionProviders,
}: {
  draft: string;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  busy: boolean;
  agentSlot: ReactNode;
  modelSlot: ReactNode;
  mentionProviders: { id: string; kind: string }[];
}): JSX.Element {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(draft.length);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [focused, setFocused] = useState(false);
  const id = useId();
  const match = draft.slice(0, cursor).match(/(?:^|\s)@([^\s@]*)$/);
  const needle = match?.[1].toLocaleLowerCase("tr-TR") ?? "";
  const options = mentionProviders
    .filter((p) =>
      `${p.kind}:${p.id}`.toLocaleLowerCase("tr-TR").includes(needle),
    )
    .slice(0, 8);
  const open = focused && !!match && !dismissed && options.length > 0;
  const selected = Math.min(index, Math.max(0, options.length - 1));
  useEffect(() => {
    const field = textarea.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(208, Math.max(60, field.scrollHeight))}px`;
    if (overlay.current) overlay.current.scrollTop = field.scrollTop;
  }, [draft]);
  const pick = (provider: { id: string; kind: string }) => {
    if (!match) return;
    const start = cursor - needle.length - 1;
    const token = `@${provider.kind}:${provider.id} `;
    onDraftChange(draft.slice(0, start) + token + draft.slice(cursor));
    setDismissed(true);
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(
        start + token.length,
        start + token.length,
      );
      setCursor(start + token.length);
    });
  };
  const fragments = draft.split(/(@(?:image|video|audio|llm):[\w.-]+)/g);
  return (
    <div className="composer">
      <div className="composer-card">
        {open && (
          <div
            className="composer-mentions"
            id={`${id}-options`}
            role="listbox"
            aria-label="Sağlayıcı yönlendirmeleri"
          >
            {options.map((p, i) => (
              <button
                type="button"
                key={p.id}
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={i === selected}
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
              >
                <Icon name="link" />
                <span>
                  @{p.kind}:{p.id}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="composer-input">
          <div className="composer-highlight" aria-hidden="true" ref={overlay}>
            {fragments.map((part, i) =>
              part.startsWith("@") ? <mark key={i}>{part}</mark> : part,
            )}
            {draft.endsWith("\n") ? "\u200b" : ""}
          </div>
          <textarea
            ref={textarea}
            aria-label="Mesajınız"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? `${id}-options` : undefined}
            aria-activedescendant={
              open ? `${id}-option-${selected}` : undefined
            }
            value={draft}
            disabled={busy}
            rows={2}
            placeholder="Mesajınızı yazın… @ ile sağlayıcı seçin"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => {
              onDraftChange(e.target.value);
              setCursor(e.target.selectionStart);
              setIndex(0);
              setDismissed(false);
            }}
            onSelect={(e) => setCursor(e.currentTarget.selectionStart)}
            onScroll={() => {
              if (overlay.current && textarea.current)
                overlay.current.scrollTop = textarea.current.scrollTop;
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (
                open &&
                ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)
              ) {
                e.preventDefault();
                if (e.key === "Escape") setDismissed(true);
                else if (e.key === "Enter") pick(options[selected]);
                else
                  setIndex(
                    (old) =>
                      (old +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        options.length) %
                      options.length,
                  );
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!busy && draft.trim()) onSend();
              }
            }}
          />
        </div>
        <div className="composer-footer">
          {agentSlot}
          {modelSlot}
          <Button
            icon="play"
            className="composer-send"
            busy={busy}
            disabled={busy || !draft.trim()}
            onClick={onSend}
          >
            Gönder
          </Button>
        </div>
      </div>
      <div className="composer-hint">
        <span>
          Enter gönderir · Shift+Enter yeni satır · Taslak bu cihazda saklanır
        </span>
        <span
          role={draft.length > 2000 ? "status" : undefined}
          className={draft.length > 2000 ? "composer-warning" : ""}
        >
          {draft.length} karakter{draft.length > 2000 ? " · Uzun mesaj" : ""}
        </span>
      </div>
    </div>
  );
}
