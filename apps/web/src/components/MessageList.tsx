import { useState, type ReactNode } from "react";
import type { ChatMessage } from "../stores/schema";
import { Button, Icon } from "./ui";
function safeLink(url: string): boolean {
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}
/** Metin React düğümlerine ayrılır; HTML veya dangerouslySetInnerHTML kullanılmaz. */
function inline(text: string): ReactNode[] {
  const pattern =
    /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^\s)]+\))/g;
  const nodes: ReactNode[] = [];
  let from = 0;
  for (const match of text.matchAll(pattern)) {
    const i = match.index!;
    if (i > from) nodes.push(text.slice(from, i));
    const value = match[0];
    const key = String(i);
    if (value.startsWith("`"))
      nodes.push(<code key={key}>{value.slice(1, -1)}</code>);
    else if (value.startsWith("**"))
      nodes.push(<strong key={key}>{value.slice(2, -2)}</strong>);
    else if (value.startsWith("*"))
      nodes.push(<em key={key}>{value.slice(1, -1)}</em>);
    else {
      const link = value.match(/^\[([^\]]+)\]\((.+)\)$/)!;
      nodes.push(
        safeLink(link[2]) ? (
          <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer">
            {link[1]}
          </a>
        ) : (
          value
        ),
      );
    }
    from = i + value.length;
  }
  if (from < text.length) nodes.push(text.slice(from));
  return nodes;
}
function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}): JSX.Element {
  const [status, setStatus] = useState("");
  return (
    <div className="code-block">
      <div className="code-header">
        <span>{language || "Kod"}</span>
        <Button
          variant="secondary"
          onClick={() => {
            void navigator.clipboard
              .writeText(code)
              .then(() => setStatus("Kopyalandı"))
              .catch(() =>
                setStatus("Kopyalanamadı; kodu seçerek kopyalayın."),
              );
          }}
        >
          {status === "Kopyalandı" ? "Kopyalandı" : "Kopyala"}
        </Button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      {status && (
        <span className="hmx-sr" role="status">
          {status}
        </span>
      )}
    </div>
  );
}
export function MarkdownText({ text }: { text: string }): JSX.Element {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^\s*(`{3,})(.*)$/);
    if (fence) {
      const code: string[] = [];
      const language = fence[2].trim();
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1]))
        code.push(lines[i++]);
      out.push(
        <CodeBlock key={`c${i}`} language={language} code={code.join("\n")} />,
      );
      continue;
    }
    if (!lines[i].trim()) continue;
    const ordered = /^\s*\d+\.\s/.test(lines[i]);
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) {
      const items: ReactNode[] = [];
      const start = i;
      while (
        i < lines.length &&
        (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])
      ) {
        items.push(
          <li key={i}>
            {inline(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""))}
          </li>,
        );
        i++;
      }
      i--;
      out.push(
        ordered ? (
          <ol key={`l${start}`}>{items}</ol>
        ) : (
          <ul key={`l${start}`}>{items}</ul>
        ),
      );
      continue;
    }
    const paragraph = [lines[i]];
    const start = i;
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !/^\s*(?:`{3,}|[-*]\s|\d+\.\s)/.test(lines[i + 1])
    )
      paragraph.push(lines[++i]);
    out.push(<p key={`p${start}`}>{inline(paragraph.join("\n"))}</p>);
  }
  return <>{out}</>;
}
function dayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return date.toDateString() === now.toDateString()
    ? "Bugün"
    : date.toDateString() === yesterday.toDateString()
      ? "Dün"
      : date.toLocaleDateString("tr-TR", { dateStyle: "long" });
}
export function MessageList({
  messages,
  onRetry,
}: {
  messages: ChatMessage[];
  onRetry?: (messageId: string) => void;
}): JSX.Element {
  if (!messages.length)
    return (
      <div className="chat-empty">
        <img src="/branding/hmx-logo.webp" alt="HMX Agent logosu" />
        <h2>Bir hedefle başlayın.</h2>
        <p>
          Sohbet edin, bir görev verin veya <code>@video:flow-ai</code> gibi bir
          sağlayıcı yönlendirmesi kullanın. Ajanınız kararlarını ve sonuçlarını
          burada paylaşacak.
        </p>
      </div>
    );
  return (
    <div className="message-list">
      {messages.map((message, i) => {
        const showDay =
          i === 0 ||
          new Date(message.createdAt).toDateString() !==
            new Date(messages[i - 1].createdAt).toDateString();
        return (
          <div className="message-group" key={message.id}>
            {showDay && (
              <div className="day-divider">{dayLabel(message.createdAt)}</div>
            )}
            <article
              className={`message ${message.role} ${message.error ? "error" : ""}`}
              aria-label={
                message.role === "user" ? "Sizin mesajınız" : "Ajan mesajı"
              }
            >
              <div className="message-meta">
                <Icon name={message.role === "user" ? "file" : "layers"} />
                <strong>
                  {
                    {
                      user: "Siz",
                      assistant: "HMX Agent",
                      system: "Sistem",
                      tool: "Araç",
                    }[message.role]
                  }
                </strong>
                <time dateTime={new Date(message.createdAt).toISOString()}>
                  {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <MarkdownText text={message.content} />
              {message.streaming && (
                <span className="streaming-caret" aria-label="Yanıt yazılıyor">
                  ▌
                </span>
              )}
              {message.error && (
                <div className="message-error" role="alert">
                  <p>{message.error}</p>
                  {onRetry && (
                    <Button
                      variant="secondary"
                      icon="refresh"
                      onClick={() => onRetry(message.id)}
                    >
                      Tekrar dene
                    </Button>
                  )}
                </div>
              )}
            </article>
          </div>
        );
      })}
    </div>
  );
}
