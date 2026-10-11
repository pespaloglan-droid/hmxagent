import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import "../styles/pages.css";
export type IconName =
  | "refresh"
  | "plus"
  | "search"
  | "server"
  | "layers"
  | "check"
  | "alert"
  | "arrow"
  | "play"
  | "pause"
  | "trash"
  | "file"
  | "settings"
  | "link"
  | "close"
  | "up"
  | "down";
const paths: Record<IconName, ReactNode> = {
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6 8a7 7 0 0 1 12-2l2 3M4 15l2 3a7 7 0 0 0 12-2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="3" width="18" height="7" rx="2" />
      <rect x="3" y="14" width="18" height="7" rx="2" />
      <path d="M7 6.5h.01M7 17.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  alert: (
    <>
      <path d="m12 3 10 18H2L12 3ZM12 9v4M12 17h.01" />
    </>
  ),
  arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
  play: <path d="m8 4 12 8-12 8V4Z" />,
  pause: <path d="M8 4v16M16 4v16" />,
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H5v20h14V7l-5-5ZM14 2v6h5M8 12h8M8 16h6" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="9" cy="18" r="2" />
    </>
  ),
  link: (
    <>
      <path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  up: <path d="m6 14 6-6 6 6" />,
  down: <path d="m6 10 6 6 6-6" />,
};
export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}): JSX.Element {
  return (
    <svg
      className={`hmx-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Button({
  children,
  icon,
  busy = false,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName;
  busy?: boolean;
  variant?: "primary" | "secondary" | "danger";
}): JSX.Element {
  return (
    <button
      type="button"
      {...props}
      className={`hmx-button hmx-button--${variant} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      {busy ? (
        <span className="hmx-spinner" aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} />
      )}
      <span>{children}</span>
    </button>
  );
}
export function Page({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="hmx-page" aria-label={title}>
      <header className="hmx-page-header">
        <div>
          <span className="hmx-eyebrow">HMX / KONTROL MERKEZİ</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions && <div className="hmx-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
export function Card({
  title,
  description,
  children,
  className = "",
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}): JSX.Element {
  return (
    <section className={`hmx-card ${className}`}>
      {(title || actions) && (
        <header className="hmx-card-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "error";
}): JSX.Element {
  return <span className={`hmx-badge hmx-badge--${tone}`}>{children}</span>;
}
export function Skeleton({ rows = 4 }: { rows?: number }): JSX.Element {
  return (
    <div
      className="hmx-card hmx-skeleton"
      role="status"
      aria-label="Yükleniyor"
    >
      <span className="hmx-sr">Yükleniyor…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div className="hmx-skeleton-line" key={i} />
      ))}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
  icon = "layers",
}: {
  title: string;
  description: string;
  action: ReactNode;
  icon?: IconName;
}): JSX.Element {
  return (
    <div className="hmx-empty">
      <div className="hmx-empty-symbol">
        <Icon name={icon} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "ok" | "error";
}): JSX.Element {
  return (
    <div
      className={`hmx-notice hmx-notice--${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon
        name={tone === "error" ? "alert" : tone === "ok" ? "check" : "file"}
      />
      <div>{children}</div>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}): JSX.Element {
  return (
    <Notice tone="error">
      <strong>Veriler alınamadı.</strong>
      <p>{message}</p>
      <Button variant="secondary" icon="refresh" onClick={retry}>
        Yeniden dene
      </Button>
    </Notice>
  );
}
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}): JSX.Element {
  const id = useId();
  const control = isValidElement<Record<string, unknown>>(children)
    ? children
    : null;
  const inputId =
    typeof control?.props.id === "string" ? control.props.id : `${id}-input`;
  const describedBy =
    [
      control?.props["aria-describedby"],
      hint ? `${id}-hint` : null,
      error ? `${id}-error` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="hmx-field">
      <label htmlFor={inputId}>{label}</label>
      {control
        ? cloneElement(control, {
            id: inputId,
            "aria-describedby": describedBy,
            "aria-invalid": error ? true : control.props["aria-invalid"],
          })
        : children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small id={`${id}-error`} className="hmx-field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
export function Table({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}): JSX.Element {
  return (
    <div>
      <p className="hmx-table-hint">
        Tüm sütunları görmek için tabloyu yana kaydırın.
      </p>
      <div
        className="hmx-table-wrap"
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        <table className="hmx-table">{children}</table>
      </div>
    </div>
  );
}
export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}): JSX.Element | null {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => close.current(), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  return message ? (
    <div
      className={`hmx-toast ${message.startsWith("İşlem başarısız") ? "hmx-toast-error" : ""}`}
      role="status"
    >
      <Icon name={message.startsWith("İşlem başarısız") ? "alert" : "check"} />
      <span>{message}</span>
      <button type="button" aria-label="Bildirimi kapat" onClick={onClose}>
        <Icon name="close" />
      </button>
    </div>
  ) : null;
}
/** Native dialog: odak tuzağı, Escape, arka planın inert olması ve odak dönüşü. */
export function Dialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="hmx-dialog"
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <Button
          variant="secondary"
          disabled={busy}
          aria-label="Pencereyi kapat"
          onClick={onClose}
          icon="close"
        >
          Kapat
        </Button>
      </header>
      {children}
    </dialog>
  );
}
