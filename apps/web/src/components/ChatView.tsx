import { useEffect, useRef, useState } from "react";
import { api, apiStream } from "../api";
import { useSessionStore } from "../stores/sessionStore";
import { useUiStore } from "../stores/uiStore";
import type { SessionTab } from "../stores/schema";
import { AgentSelector } from "./AgentSelector";
import { ModelSelector } from "./ModelSelector";
import { MessageList, MarkdownText } from "./MessageList";
import { Composer } from "./Composer";
import {
  useResource,
  errorMessage,
  type Provider,
  type Asset,
} from "./pageData";
import { Badge, Button, Empty, ErrorState, Icon, Skeleton } from "./ui";
const TABS: { id: SessionTab; label: string }[] = [
  { id: "chat", label: "Sohbet" },
  { id: "code", label: "Kod" },
  { id: "files", label: "Dosyalar" },
  { id: "images", label: "Görseller" },
  { id: "video", label: "Videolar" },
  { id: "audio", label: "Sesler" },
];
interface Decision {
  mode: "chat" | "media" | "needs-approval";
  risk?: string;
  approvalId?: string;
  results?: {
    ok: boolean;
    kind: string;
    provider?: string;
    filePath?: string;
    error?: string;
    jobId?: string;
  }[];
  error?: string;
}
interface Pending {
  sessionId: string;
  text: string;
  messageId: string;
  risk: string;
  approvalId?: string;
  runtime?: boolean;
}
export function ChatView(): JSX.Element {
  const store = useSessionStore();
  const session = store.activeSessionId
    ? store.sessions[store.activeSessionId]
    : null;
  const providers = useResource<Provider[]>("/api/providers");
  const scroll = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const follow = useRef(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const viewId = session?.id;
  const tab = session?.activeTab;
  useEffect(() => {
    const field = scroll.current;
    if (field && viewId)
      field.scrollTop =
        useSessionStore.getState().sessions[viewId]?.scrollOffset ?? 0;
    follow.current = true;
    setPending(null);
    return () => {
      controller.current?.abort();
    };
  }, [viewId, tab]);
  useEffect(() => {
    if (follow.current && scroll.current)
      scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [session?.messages, pending]);
  const perform = async (text: string, retryId?: string, ticket?: string) => {
    const current = useSessionStore.getState();
    const sid = current.activeSessionId;
    const source = sid ? current.sessions[sid] : null;
    if (!sid || !source || locked.current || !text.trim()) return;
    locked.current = true;
    setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    const replyId = retryId ?? crypto.randomUUID();
    if (!retryId) {
      current.appendMessage(sid, {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      });
      current.updateDraft(sid, "");
      current.appendMessage(sid, {
        id: replyId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
      });
    } else
      current.updateMessage(sid, replyId, {
        content: "",
        error: undefined,
        streaming: true,
      });
    const request = {
      message: text,
      sessionId: sid,
      model: source.selectedModelId,
      agentId: source.selectedAgentId,
    };
    try {
      const decision = await api.post<Decision>("/api/chat/smart", {
        ...request,
        dryRun: true,
      });
      abort.signal.throwIfAborted();
      if (decision.error) throw new Error(decision.error);
      if (decision.mode === "needs-approval" && !ticket) {
        current.updateMessage(sid, replyId, {
          streaming: false,
          content: "Bu görev kullanıcı onayını bekliyor.",
        });
        setPending({
          sessionId: sid,
          text,
          messageId: replyId,
          risk: decision.risk ?? "moderate",
          approvalId: decision.approvalId,
        });
        return;
      }
      if (decision.mode === "media" || text.match(/@(image|video|audio):/)) {
        const result = await api.post<Decision>("/api/chat/smart", {
          ...request,
          confirmed: true,
          queue: true,
        });
        abort.signal.throwIfAborted();
        if (result.error) throw new Error(result.error);
        const content =
          result.results
            ?.map((item) =>
              item.ok
                ? item.jobId
                  ? `${item.kind}: iş kuyruğa alındı (${item.jobId}). Medya akışı ekranından takip edin.`
                  : `${item.kind}: ${item.filePath ?? "Üretim tamamlandı"} · ${item.provider ?? ""}`
                : `${item.kind}: ${item.error ?? "Üretim başarısız"}`,
            )
            .join("\n") || "Üretim sonucu alınamadı.";
        current.updateMessage(sid, replyId, {
          streaming: false,
          content,
          ...(result.results?.some((item) => !item.ok)
            ? {
                error:
                  "En az bir üretim başarısız oldu. Tekrar deneme tüm isteği yeniden çalıştırır.",
              }
            : {}),
        });
        return;
      }
      const response = await apiStream(
        "/api/chat/stream",
        { ...request, ...(ticket ? { approvalId: ticket } : {}) },
        abort.signal,
      );
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";
      let doneEvent = false;
      const dispatch = (block: string) => {
        const raw = block
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (!raw || raw === "[DONE]") return;
        const event = JSON.parse(raw) as {
          token?: string;
          done?: boolean;
          error?: string;
          approval?: { id: string; question: string };
        };
        if (event.error) throw new Error(event.error);
        if (event.token) {
          content += event.token;
          current.updateMessage(sid, replyId, { content });
        }
        if (
          event.approval &&
          useSessionStore.getState().activeSessionId === sid
        )
          setPending({
            sessionId: sid,
            text: event.approval.question,
            messageId: replyId,
            risk: "destructive",
            approvalId: event.approval.id,
            runtime: true,
          });
        if (event.done) doneEvent = true;
      };
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          buffer = buffer.replace(/\r\n/g, "\n");
          let end: number;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            dispatch(buffer.slice(0, end));
            buffer = buffer.slice(end + 2);
          }
        }
        buffer += decoder.decode();
        if (buffer.trim()) dispatch(buffer);
      } finally {
        reader.releaseLock();
      }
      if (!doneEvent)
        throw new Error(
          "Akış tamamlanmadan bağlantı kapandı. Kısmi yanıt korunuyor.",
        );
      current.updateMessage(sid, replyId, { streaming: false });
    } catch (error) {
      current.updateMessage(sid, replyId, {
        streaming: false,
        error: abort.signal.aborted
          ? "Görünüm değiştiği için bu istek durduruldu. Tekrar deneyebilirsiniz."
          : errorMessage(error),
      });
      void api
        .post("/api/client-logs", {
          level: "error",
          msg: "Chat isteği başarısız",
          meta: { sessionId: sid, reason: errorMessage(error) },
        })
        .catch(() => {});
    } finally {
      locked.current = false;
      setBusy(false);
      setPending((request) =>
        request?.runtime && request.sessionId === sid ? null : request,
      );
      if (controller.current === abort) controller.current = null;
    }
  };
  const retry = (id: string) => {
    if (!session || busy) return;
    const index = session.messages.findIndex((m) => m.id === id);
    const original = session.messages
      .slice(0, index)
      .reverse()
      .find((m) => m.role === "user");
    if (original) void perform(original.content, id);
  };
  const approve = async (allowed: boolean) => {
    if (!pending) return;
    const request = pending;
    setPending(null);
    if (request.runtime) {
      try {
        await api.post(
          `/api/approvals/${encodeURIComponent(request.approvalId ?? "")}`,
          { approved: allowed },
        );
      } catch (error) {
        useSessionStore
          .getState()
          .updateMessage(request.sessionId, request.messageId, {
            error: errorMessage(error),
          });
      }
    } else if (allowed)
      void perform(
        request.text,
        request.messageId,
        request.approvalId ?? "confirmed",
      );
    else
      useSessionStore
        .getState()
        .updateMessage(request.sessionId, request.messageId, {
          content: "Görev kullanıcı tarafından iptal edildi.",
          streaming: false,
        });
  };
  if (!session)
    return (
      <div className="chat-view">
        <Empty
          title="Bir çalışma oturumu başlatın"
          description="Sohbet, model seçimi ve taslağınız her oturum için ayrı saklanır."
          action={
            <Button icon="plus" onClick={() => store.createSession()}>
              Yeni oturum
            </Button>
          }
        />
      </div>
    );
  return (
    <div className="chat-view">
      <header className="chat-header">
        <div className="chat-heading">
          <Icon name="layers" />
          <h1>{session.title}</h1>
          <Badge tone={busy ? "warn" : "neutral"}>
            {busy ? "Çalışıyor" : "Hazır"}
          </Badge>
        </div>
        <div
          className="chat-tabs"
          role="tablist"
          aria-label="Çalışma alanı sekmeleri"
        >
          {TABS.map((item) => (
            <button
              type="button"
              key={item.id}
              role="tab"
              aria-selected={session.activeTab === item.id}
              className={session.activeTab === item.id ? "active" : ""}
              onClick={() => store.setTab(session.id, item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>
      <div
        className="chat-scroll"
        ref={scroll}
        onScroll={(e) => {
          const field = e.currentTarget;
          follow.current =
            field.scrollHeight - field.scrollTop - field.clientHeight < 80;
          store.setScroll(session.id, field.scrollTop);
        }}
      >
        {session.activeTab === "chat" ? (
          <MessageList messages={session.messages} onRetry={retry} />
        ) : (
          <AssetGrid kind={session.activeTab} />
        )}
        {pending?.sessionId === session.id && (
          <section className="card approval-card" aria-label="İşlem onayı">
            <h2>
              {pending.runtime
                ? "Araç işlemi için açık onay gerekiyor"
                : "Görev onayı gerekiyor"}
            </h2>
            <Badge tone="warn">
              {pending.risk === "destructive" ? "Yıkıcı işlem" : "Onay gerekli"}
            </Badge>
            <pre>{pending.text}</pre>
            <div className="hmx-actions">
              <Button icon="check" onClick={() => void approve(true)}>
                Onayla
              </Button>
              <Button variant="secondary" onClick={() => void approve(false)}>
                İptal
              </Button>
            </div>
          </section>
        )}
      </div>
      <Composer
        draft={session.draft}
        onDraftChange={(draft) => store.updateDraft(session.id, draft)}
        onSend={() => void perform(session.draft)}
        busy={busy || !!pending}
        agentSlot={
          <AgentSelector
            value={session.selectedAgentId}
            onChange={(id) => store.setAgent(session.id, id)}
          />
        }
        modelSlot={
          <ModelSelector
            value={session.selectedModelId}
            onChange={(id) => store.setModel(session.id, id)}
          />
        }
        mentionProviders={providers.data ?? []}
      />
    </div>
  );
}
function AssetGrid({ kind }: { kind: SessionTab }): JSX.Element {
  const type = (
    { images: "image", video: "video", audio: "audio" } as Partial<
      Record<SessionTab, string>
    >
  )[kind];
  const assets = useResource<Asset[]>(
    `/api/assets${type ? `?type=${type}` : ""}`,
  );
  const session = useSessionStore((s) =>
    s.activeSessionId ? s.sessions[s.activeSessionId] : null,
  );
  const codes =
    session?.messages.flatMap((m) =>
      [...m.content.matchAll(/```([\s\S]*?)```/g)].map(
        (match) => `\`\`\`${match[1]}\`\`\``,
      ),
    ) ?? [];
  if (kind === "code")
    return codes.length ? (
      <div className="asset-grid">
        {codes.map((code, i) => (
          <section className="card" key={i}>
            <MarkdownText text={code} />
          </section>
        ))}
      </div>
    ) : (
      <Empty
        title="Henüz kod bloğu yok"
        description="Sohbette üretilen kod blokları burada toplanır."
        action={
          <Button
            onClick={() =>
              session && useSessionStore.getState().setTab(session.id, "chat")
            }
          >
            Sohbete dön
          </Button>
        }
      />
    );
  if (assets.loading && !assets.data) return <Skeleton />;
  if (assets.error)
    return (
      <ErrorState message={assets.error} retry={() => void assets.reload()} />
    );
  if (!assets.data?.length)
    return (
      <Empty
        title="Bu sekmede henüz varlık yok"
        description="Medya ürettiğinizde doğrulanmış dosyalarınız burada görünür."
        action={
          <Button onClick={() => useUiStore.getState().setPage("pipeline")}>
            Medya akışını aç
          </Button>
        }
      />
    );
  return (
    <div className="asset-grid">
      {assets.data.map((asset) => (
        <article className="card asset-card" key={asset.id}>
          <div className="asset-placeholder">
            <Icon name="file" />
          </div>
          <h2>{asset.filePath.split(/[\\/]/).at(-1)}</h2>
          <p>{asset.provider}</p>
          <p className="mono">{asset.filePath}</p>
          <Badge tone={asset.status === "verified" ? "ok" : "error"}>
            {asset.status === "verified" ? "Doğrulandı" : "Dosya eksik"}
          </Badge>
          {asset.status === "verified" && (
            <p>
              <a
                href={`/api/assets/${encodeURIComponent(asset.id)}/file`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Dosyayı aç
              </a>
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
