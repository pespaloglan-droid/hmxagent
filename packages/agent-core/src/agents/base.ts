import type { ChatMessage } from "@hmx/core";

export type AgentKind = "native" | "hermes" | "opencode-style";

export interface AgentDriver {
  readonly id: string;                 // "hmx-native" | "hermes-loop" | "opencode-agent" | custom
  readonly name: string;
  readonly kind: AgentKind;
  readonly description: string;
  readonly capabilities: string[];     // ["chat","tools","browser","media"]
  /** Kurulum/köprü hazır mı? UI pasif rozeti buna bakar */
  isAvailable(): Promise<boolean>;
  /** Streaming sohbet: token token async iterable */
  chat(messages: ChatMessage[], opts?: { model?: string }): AsyncIterable<string>;
}
