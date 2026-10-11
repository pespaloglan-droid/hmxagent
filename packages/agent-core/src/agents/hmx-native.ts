import { LlmClient, type ChatMessage } from "@hmx/core";
import { HMX_SYSTEM_PROMPT } from "../prompt.js";
import type { AgentDriver } from "./base.js";
import type { ChatOnlyBackend } from "../registry.js";

/** LlmClient.chatStream (callback) -> AsyncIterable adaptor (dahili kuyruk) */
async function* streamChat(llm: LlmClient, messages: ChatMessage[]): AsyncIterable<string> {
  const queue: string[] = [];
  let done = false;
  let error: unknown = null;
  let notify: (() => void) | null = null;

  const run = llm.chatStream(messages, (token) => {
    queue.push(token);
    notify?.();
  }).then(() => { done = true; notify?.(); })
    .catch((e) => { error = e; done = true; notify?.(); });

  while (!done || queue.length > 0) {
    if (queue.length > 0) {
      yield queue.shift()!;
      continue;
    }
    await new Promise<void>((resolve) => { notify = resolve; });
  }
  await run; // hata varsa burada firlat
  if (error) throw error;
}

/**
 * HMX Native driver: mevcut disiplinli dongunun (system prompt + ledger)
 * AgentDriver kontratina sarilmis hali. Registry'nin zorunlu cekirdek uyesi.
 */
export class HmxNativeDriver implements AgentDriver {
  readonly id = "hmx-native";
  readonly name = "HMX Agent";
  readonly kind = "native" as const;
  readonly description = "Disiplinli, dogrulama odakli yerlesik ajan (plan-onay-dogrulama)";
  readonly capabilities = ["chat", "tools", "browser", "media"];

  constructor(private readonly llm: LlmClient = LlmClient.fromEnv()) {}

  async isAvailable(): Promise<boolean> {
    try {
      await this.llm.listModels();
      return true;
    } catch {
      return false;
    }
  }

  chat(messages: ChatMessage[], opts?: { model?: string }): AsyncIterable<string> {
    const llm = opts?.model ? this.llm.withModel(opts.model) : this.llm;
    const withPrompt = messages[0]?.role === "system"
      ? messages
      : [{ role: "system" as const, content: HMX_SYSTEM_PROMPT }, ...messages];
    return streamChat(llm, withPrompt);
  }
}

/** Custom (kullanici tanimli) profillerin sarildigi chat-only backend */
export function createChatOnlyBackend(llm: LlmClient = LlmClient.fromEnv()): ChatOnlyBackend {
  return {
    isAvailable: () => new HmxNativeDriver(llm).isAvailable(),
    chat: (messages, opts) => streamChat(opts?.model ? llm.withModel(opts.model) : llm, messages),
  };
}
