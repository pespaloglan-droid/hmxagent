/**
 * LLM istemcisi: OpenAI-uyumlu herhangi bir endpoint ile calisir
 * (OpenRouter, Ollama, OpenAI, vLLM...). Bagimliliksiz, fetch tabanli.
 * Desen: kimi-code packages/kosong (tek arayuz, base_url/api_key/model uclusu).
 */
export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};
export type ToolDefinition = {
  type: "function";
  function: { name: string; description: string; parameters: unknown };
};
export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

export type LlmConfig = {
  baseUrl: string; // ornegin https://openrouter.ai/api/v1 veya http://localhost:11434/v1
  apiKey?: string; // Ollama icin gerekmez
  model: string;
};

/**
 * OpenAI SSE satirlarini ayristirir. "data: {...}\n\n" bloklari gelir,
 * [DONE] ile biter. Saf fonksiyon — birim testi icin disari aktarilir.
 */
export function* parseSseTokens(chunk: string): Generator<string> {
  for (const line of chunk.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("data:")) continue;
    const payload = t.slice(5).trim();
    if (payload === "[DONE]") return;
    try {
      const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
      if (typeof delta === "string") yield delta;
    } catch {
      /* yarim blok: sonraki chunk'ta tamamlanir; atla */
    }
  }
}

export class LlmClient {
  constructor(private cfg: LlmConfig) {}

  static fromEnv(): LlmClient {
    const baseUrl = process.env.HMX_LLM_BASE_URL ?? "http://localhost:11434/v1";
    const model = process.env.HMX_LLM_MODEL ?? "qwen2.5:14b";
    const apiKey = process.env.HMX_LLM_API_KEY;
    return new LlmClient({ baseUrl, apiKey, model });
  }

  /** Session seviyesinde model override'i (kural: model degisince session bozulmaz) */
  withModel(model: string): LlmClient {
    return new LlmClient({ ...this.cfg, model });
  }

  get model() {
    return this.cfg.model;
  }
  get baseUrl() {
    return this.cfg.baseUrl;
  }

  async completion(
    messages: ChatMessage[],
    opts?: { tools?: ToolDefinition[]; signal?: AbortSignal },
  ): Promise<{ content: string; toolCalls: ToolCall[] }> {
    const res = await fetch(
      `${this.cfg.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.cfg.apiKey
            ? { authorization: `Bearer ${this.cfg.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages,
          temperature: 0.2,
          ...(opts?.tools?.length
            ? { tools: opts.tools, tool_choice: "auto" }
            : {}),
        }),
        signal: opts?.signal
          ? AbortSignal.any([opts.signal, AbortSignal.timeout(60000)])
          : AbortSignal.timeout(60000),
      },
    );
    if (!res.ok) throw new Error(`LLM isteği başarısız: HTTP ${res.status}`);
    const data = (await res.json()) as {
      choices?: {
        message?: { content?: string | null; tool_calls?: ToolCall[] };
      }[];
    };
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error("LLM cevabı geçersiz: choices/message yok.");
    return {
      content: message.content ?? "",
      toolCalls: message.tool_calls ?? [],
    };
  }

  async chat(
    messages: ChatMessage[],
    opts?: { signal?: AbortSignal },
  ): Promise<string> {
    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      signal: opts?.signal
        ? AbortSignal.any([opts.signal, AbortSignal.timeout(60000)])
        : AbortSignal.timeout(60000),
      headers: {
        "content-type": "application/json",
        ...(this.cfg.apiKey
          ? { authorization: `Bearer ${this.cfg.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        model: this.cfg.model,
        messages,
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      throw new Error(
        `LLM istegi basarisiz: ${res.status} ${await res.text()}`,
      );
    }
    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content ?? "";
  }

  /** Streaming chat: her token icin onToken cagrilir, tam metin dondurulur */
  async chatStream(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    opts?: { signal?: AbortSignal },
  ): Promise<string> {
    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      signal: opts?.signal
        ? AbortSignal.any([opts.signal, AbortSignal.timeout(60000)])
        : AbortSignal.timeout(60000),
      headers: {
        "content-type": "application/json",
        ...(this.cfg.apiKey
          ? { authorization: `Bearer ${this.cfg.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        model: this.cfg.model,
        messages,
        temperature: 0.2,
        stream: true,
      }),
    });
    if (!res.ok) {
      throw new Error(
        `LLM stream istegi basarisiz: ${res.status} ${await res.text()}`,
      );
    }
    if (!res.body) throw new Error("LLM stream govdesi yok");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let pending = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      pending = pending.replace(/\r\n/g, "\n");
      // SSE bloklari \n\n ile ayrilir; yarim kalan son blok bekletilir
      const lastBreak = pending.lastIndexOf("\n\n");
      if (lastBreak < 0) continue;
      const ready = pending.slice(0, lastBreak);
      pending = pending.slice(lastBreak + 2);
      for (const token of parseSseTokens(ready)) {
        full += token;
        onToken(token);
      }
    }
    if (pending.trim()) {
      for (const token of parseSseTokens(pending)) {
        full += token;
        onToken(token);
      }
    }
    return full;
  }

  /** Endpoint'in bildigi modelleri listeler (OpenAI GET /models) */
  async listModels(): Promise<string[]> {
    const res = await fetch(`${this.cfg.baseUrl}/models`, {
      signal: AbortSignal.timeout(8000),
      headers: this.cfg.apiKey
        ? { authorization: `Bearer ${this.cfg.apiKey}` }
        : {},
    });
    if (!res.ok) throw new Error(`Model listesi alinamadi: HTTP ${res.status}`);
    const data = (await res.json()) as any;
    return (data.data ?? [])
      .map((m: any) => m.id)
      .filter(Boolean)
      .sort();
  }
}
