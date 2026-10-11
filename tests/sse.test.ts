import type { T } from "./run.js";

export async function run(t: T) {
  const { parseSseTokens } = await import("@hmx/core");

  // OpenAI SSE akisi: token'lar sirayla cikmali, [DONE] durdurur
  const sse = [
    'data: {"choices":[{"delta":{"content":"Mer"}}]}',
    'data: {"choices":[{"delta":{"content":"haba"}}]}',
    'data: {"choices":[{"delta":{}}]}',
    'data: [DONE]',
    'data: {"choices":[{"delta":{"content":"GELMEMELI"}}]}',
  ].join("\n\n");
  t("sse: token akisi dogru", [...parseSseTokens(sse)].join("") === "Merhaba");

  // Yarim/bozuk blok patlatmaz
  t("sse: bozuk blok atlanir", [...parseSseTokens('data: {bozuk\n\ndata: {"choices":[{"delta":{"content":"ok"}}]}')].join("") === "ok");
}
