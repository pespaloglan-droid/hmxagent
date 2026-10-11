import { LlmClient, type ChatMessage } from "@hmx/core";
export async function* streamTokens(
  llm: LlmClient,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncIterable<string> {
  const tokens: string[] = [];
  let finished = false;
  let failure: unknown;
  let wake: (() => void) | undefined;
  const task = llm
    .chatStream(
      messages,
      (token) => {
        tokens.push(token);
        wake?.();
      },
      { signal },
    )
    .catch((error: unknown) => {
      failure = error;
    })
    .finally(() => {
      finished = true;
      wake?.();
    });
  while (!finished || tokens.length) {
    if (tokens.length) yield tokens.shift()!;
    else
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
  }
  await task;
  if (failure) throw failure;
}
export function compact(messages: ChatMessage[]): ChatMessage[] {
  // Function-calling çiftleri korunur: araç sonuçları hiçbir zaman tek başına bırakılmaz.
  const systems = messages.filter((m) => m.role === "system").slice(0, 3);
  const turns = messages.filter((m) => m.role !== "system");
  let index = Math.max(0, turns.length - 10);
  while (index > 0 && turns[index]?.role === "tool") index--;
  return [
    ...systems,
    ...turns
      .slice(index)
      .map((m) => ({ ...m, content: m.content.slice(0, 12000) })),
  ];
}
