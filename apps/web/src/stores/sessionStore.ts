import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  validateSessionsPersist,
  type ChatMessage,
  type SessionState,
  type SessionTab,
} from "./schema";

/**
 * Session Store (root-cause fix: route degisiminde state kaybi).
 * Session state route'tan BAGIMSIZ yasar; persist middleware localStorage'a yazar.
 * Her session: messages, draft, selectedModel, selectedAgent, activeTab, scrollOffset.
 * Corrupt persist -> validateSessionsPersist null -> sifir basla (crash yok).
 */

interface SessionStore {
  sessions: Record<string, SessionState>;
  activeSessionId: string | null;
  createSession: () => string;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  updateDraft: (id: string, draft: string) => void;
  setModel: (id: string, modelId: string | null) => void;
  setAgent: (id: string, agentId: string | null) => void;
  setTab: (id: string, tab: SessionTab) => void;
  setScroll: (id: string, scrollOffset: number) => void;
  appendMessage: (id: string, msg: ChatMessage) => void;
  updateMessage: (id: string, msgId: string, patch: Partial<ChatMessage>) => void;
  replaceMessages: (id: string, messages: ChatMessage[]) => void;
}

function patchSession(
  state: { sessions: Record<string, SessionState> },
  id: string,
  patch: Partial<SessionState>,
) {
  const s = state.sessions[id];
  if (!s) return state;
  return { sessions: { ...state.sessions, [id]: { ...s, ...patch, updatedAt: Date.now() } } };
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessions: {},
      activeSessionId: null,
      createSession: () => {
        const id = crypto.randomUUID();
        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: {
              id,
              title: "Yeni Oturum",
              selectedAgentId: null,
              selectedModelId: null,
              activeTab: "chat" as const,
              draft: "",
              messages: [],
              scrollOffset: 0,
              updatedAt: Date.now(),
            },
          },
          activeSessionId: id,
        }));
        return id;
      },
      removeSession: (id) =>
        set((state) => {
          const sessions = { ...state.sessions };
          delete sessions[id];
          const activeSessionId = state.activeSessionId === id
            ? Object.keys(sessions).sort((a, b) => sessions[b].updatedAt - sessions[a].updatedAt)[0] ?? null
            : state.activeSessionId;
          return { sessions, activeSessionId };
        }),
      setActiveSession: (id) => set({ activeSessionId: id }),
      renameSession: (id, title) => set((s) => patchSession(s, id, { title })),
      updateDraft: (id, draft) => set((s) => patchSession(s, id, { draft })),
      setModel: (id, modelId) => set((s) => patchSession(s, id, { selectedModelId: modelId })),
      setAgent: (id, agentId) => set((s) => patchSession(s, id, { selectedAgentId: agentId })),
      setTab: (id, tab) => set((s) => patchSession(s, id, { activeTab: tab })),
      setScroll: (id, scrollOffset) => set((s) => patchSession(s, id, { scrollOffset })),
      appendMessage: (id, msg) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          return patchSession(s, id, {
            messages: [...cur.messages, msg],
            title: cur.title === "Yeni Oturum" && msg.role === "user"
              ? msg.content.slice(0, 40) || cur.title
              : cur.title,
          });
        }),
      updateMessage: (id, msgId, patch) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          return patchSession(s, id, {
            messages: cur.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
          });
        }),
      replaceMessages: (id, messages) => set((s) => patchSession(s, id, { messages })),
    }),
    {
      name: "hmx-agent-sessions",
      version: 1,
      // Rehydrate validation: bozuk veri geri yuklenmez, crash olmaz (StartupRecovery)
      merge: (persisted, current) => {
        const valid = validateSessionsPersist(persisted);
        if (!valid) {
          console.warn("[hmx] corrupt session state sifirlaniyor (yedek: localStorage 'hmx-agent-sessions')");
          return current;
        }
        return { ...current, ...valid };
      },
    },
  ),
);
