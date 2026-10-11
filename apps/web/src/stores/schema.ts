import { z } from "zod";

/**
 * Persist edilen state'in semasi (root-cause fix: corrupt state -> crash).
 * Rehydrate sirasinda validate edilir; bozuksa null doner ve store sifir baslar
 * (zustand persist onRehydrateStorage bunu yedegiyle birlikte kullanir).
 */

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  createdAt: z.number(),
  streaming: z.boolean().optional(),
  error: z.string().optional(),
});

export const SessionTabSchema = z.enum(["chat", "code", "files", "images", "video", "audio"]);

export const SessionStateSchema = z.object({
  id: z.string(),
  title: z.string(),
  selectedAgentId: z.string().nullable(),
  selectedModelId: z.string().nullable(),
  activeTab: SessionTabSchema,
  draft: z.string(),
  messages: z.array(ChatMessageSchema),
  scrollOffset: z.number(),
  updatedAt: z.number(),
});

export const SessionsPersistSchema = z.object({
  sessions: z.record(z.string(), SessionStateSchema),
  activeSessionId: z.string().nullable(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type SessionTab = z.infer<typeof SessionTabSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
export type SessionsPersist = z.infer<typeof SessionsPersistSchema>;

/** Persist edilmis veriyi dogrular; gecersizse null (recovery: sifir basla) */
export function validateSessionsPersist(raw: unknown): SessionsPersist | null {
  const parsed = SessionsPersistSchema.safeParse(raw);
  if (!parsed.success) return null;
  // Tutarlilik: activeSessionId gercek bir session'a isaret etmeli
  const s = parsed.data;
  if (s.activeSessionId && !s.sessions[s.activeSessionId]) {
    return { ...s, activeSessionId: null };
  }
  return s;
}
