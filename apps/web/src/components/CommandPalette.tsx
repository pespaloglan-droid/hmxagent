import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useUiStore } from "../stores/uiStore";
import { useSessionStore } from "../stores/sessionStore";
import { Icon, type IconName } from "./ui";
interface Command {
  id: string;
  label: string;
  alias: string;
  category: string;
  icon: IconName;
  page?: string;
  action?: "new" | "wizard";
  disabled?: boolean;
}
const commands: Command[] = [
  {
    id: "chat",
    label: "Sohbet",
    alias: "Chat",
    category: "Sayfalar",
    icon: "file",
    page: "chat",
  },
  {
    id: "sessions",
    label: "Oturumlar",
    alias: "Sessions",
    category: "Sayfalar",
    icon: "layers",
    page: "sessions",
  },
  {
    id: "servers",
    label: "Sunucular",
    alias: "Servers",
    category: "Sayfalar",
    icon: "server",
    page: "servers",
  },
  {
    id: "providers",
    label: "Sağlayıcılar ve hesaplar",
    alias: "Providers Accounts",
    category: "Sayfalar",
    icon: "link",
    page: "providers",
  },
  {
    id: "models",
    label: "Modeller",
    alias: "Models",
    category: "Sayfalar",
    icon: "layers",
    page: "models",
  },
  {
    id: "pipeline",
    label: "Medya akışı",
    alias: "Pipeline",
    category: "Sayfalar",
    icon: "play",
    page: "pipeline",
  },
  {
    id: "logs",
    label: "Günlükler",
    alias: "Logs",
    category: "Sayfalar",
    icon: "file",
    page: "logs",
  },
  {
    id: "settings",
    label: "Ayarlar",
    alias: "Settings",
    category: "Sayfalar",
    icon: "settings",
    page: "settings",
  },
  {
    id: "new",
    label: "Yeni oturum",
    alias: "New Session",
    category: "Eylemler",
    icon: "plus",
    action: "new",
  },
  {
    id: "wizard",
    label: "Kurulum sihirbazı",
    alias: "Wizard",
    category: "Eylemler",
    icon: "settings",
    action: "wizard",
  },
  {
    id: "theme",
    label: "Koyu tema — şu anda etkin",
    alias: "Dark theme",
    category: "Sistem",
    icon: "check",
    disabled: true,
  },
];
const normalize = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ı/g, "i");
export function fuzzyMatch(
  query: string,
  text: string,
): { score: number; indices: number[] } | null {
  const needle = normalize(query.trim());
  const haystack = normalize(text);
  if (!needle) return { score: 0, indices: [] };
  let position = 0;
  let score = 0;
  const indices: number[] = [];
  for (const char of needle) {
    const i = haystack.indexOf(char, position);
    if (i < 0) return null;
    indices.push(i);
    score +=
      10 +
      (i === 0 ? 35 : haystack[i - 1] === " " ? 20 : 0) +
      (i === position ? 8 : 0) -
      (i - position);
    position = i + 1;
  }
  return { score, indices };
}
function highlight(text: string, indices: number[]): ReactNode {
  const selected = new Set(indices);
  return [...text].map((char, i) =>
    selected.has(i) ? <mark key={i}>{char}</mark> : <span key={i}>{char}</span>,
  );
}
function readRecent(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("hmx-palette-recent") ?? "[]",
    );
    return Array.isArray(value)
      ? value
          .filter(
            (x): x is string =>
              typeof x === "string" && commands.some((c) => c.id === x),
          )
          .slice(0, 8)
      : [];
  } catch {
    return [];
  }
}
export function CommandPalette(): JSX.Element | null {
  const open = useUiStore((s) => s.paletteOpen);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const state = useUiStore.getState();
        state.setPaletteOpen(!state.paletteOpen);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    setRecent(readRecent());
    dialog.current?.showModal();
    input.current?.focus();
    return () => dialog.current?.close();
  }, [open]);
  const matches = commands
    .flatMap((command) => {
      const main = fuzzyMatch(query, command.label);
      const alias = fuzzyMatch(query, command.alias);
      const best =
        main && (!alias || main.score >= alias.score)
          ? { ...main, label: command.label }
          : alias
            ? { ...alias, label: command.alias }
            : null;
      return best ? [{ command, ...best }] : [];
    })
    .sort((a, b) =>
      query.trim()
        ? b.score - a.score
        : (recent.includes(b.command.id)
            ? 100 - recent.indexOf(b.command.id)
            : 0) -
          (recent.includes(a.command.id)
            ? 100 - recent.indexOf(a.command.id)
            : 0),
    );
  const selectable = matches.filter((m) => !m.command.disabled);
  const chosen =
    selectable[Math.min(index, Math.max(0, selectable.length - 1))]?.command.id;
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [index, query]);
  const run = (command: Command) => {
    if (command.disabled) return;
    const next = [command.id, ...recent.filter((x) => x !== command.id)].slice(
      0,
      8,
    );
    try {
      localStorage.setItem("hmx-palette-recent", JSON.stringify(next));
    } catch {
      /* Depolama opsiyoneldir. */
    }
    setRecent(next);
    const ui = useUiStore.getState();
    ui.setPaletteOpen(false);
    if (command.page) ui.setPage(command.page);
    else if (command.action === "wizard") ui.setWizardOpen(true);
    else if (command.action === "new") {
      useSessionStore.getState().createSession();
      ui.setPage("chat");
    }
  };
  if (!open) return null;
  let previousCategory = "";
  return (
    <dialog
      ref={dialog}
      className="command-dialog palette"
      aria-label="Komut paleti"
      onCancel={(e) => {
        e.preventDefault();
        useUiStore.getState().setPaletteOpen(false);
      }}
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          (e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom)
        )
          useUiStore.getState().setPaletteOpen(false);
      }}
    >
      <div className="command-search">
        <Icon name="search" />
        <input
          ref={input}
          value={query}
          aria-label="Komut ara"
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={chosen ? `${id}-${chosen}` : undefined}
          placeholder="Sayfa, eylem veya komut ara…"
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              if (selectable.length)
                setIndex(
                  (old) =>
                    (old +
                      (e.key === "ArrowDown" ? 1 : -1) +
                      selectable.length) %
                    selectable.length,
                );
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const item = selectable.find((x) => x.command.id === chosen);
              if (item) run(item.command);
            }
          }}
        />
      </div>
      <div
        className="command-results"
        id={`${id}-list`}
        role="listbox"
        aria-label="Komut sonuçları"
      >
        {matches.map((match) => {
          const category =
            !query && recent.includes(match.command.id)
              ? "Son kullanılan"
              : match.command.category;
          const heading = category !== previousCategory;
          previousCategory = category;
          return (
            <div key={match.command.id}>
              {heading && <h2 className="command-category">{category}</h2>}
              <button
                type="button"
                className="command-option"
                ref={match.command.id === chosen ? selectedRef : undefined}
                id={`${id}-${match.command.id}`}
                role="option"
                aria-selected={match.command.id === chosen}
                disabled={match.command.disabled}
                tabIndex={-1}
                onMouseEnter={() => {
                  const i = selectable.findIndex(
                    (x) => x.command.id === match.command.id,
                  );
                  if (i >= 0) setIndex(i);
                }}
                onClick={() => run(match.command)}
              >
                <Icon name={match.command.icon} />
                <span>
                  {match.label === match.command.label ? (
                    highlight(match.command.label, match.indices)
                  ) : (
                    <>
                      {match.command.label}
                      <small className="muted">
                        {" "}
                        · {highlight(match.label, match.indices)}
                      </small>
                    </>
                  )}
                </span>
              </button>
            </div>
          );
        })}
        {!matches.length && (
          <div className="empty-state">
            Eşleşen komut yok. Başka bir arama deneyin.
          </div>
        )}
      </div>
      <div className="command-help">↑ ↓ gezin · Enter çalıştır · Esc kapat</div>
    </dialog>
  );
}
