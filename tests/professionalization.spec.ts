import { test } from "node:test";
import type { ChatMessage } from "@hmx/core";
import { strict as assert } from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
const home = fs.mkdtempSync(path.join(os.tmpdir(), "hmx-integration-"));
process.env.HMX_HOME = home;
process.env.HMX_CONFIG_DIR = path.join(home, "builtin");
process.env.HMX_WORKSPACE = path.join(home, "workspace");
fs.mkdirSync(process.env.HMX_CONFIG_DIR);
fs.mkdirSync(process.env.HMX_WORKSPACE);
process.env.HMX_LOG_LEVEL = "error";
const core = await import("@hmx/core");
const { JobQueue, getLogger, executeTool, LlmClient, paths } = core;
const { HermesLoopAgent, OpenCodeAgent } = await import("@hmx/agent-core");
const { ModelRegistry, saveProviderConfig } = await import("@hmx/providers");
const { startDashboard } = await import("@hmx/dashboard-api");
const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(fn: () => boolean | Promise<boolean>, timeout = 3000) {
  const start = Date.now();
  while (!(await fn())) {
    if (Date.now() - start > timeout)
      throw new Error("Test bekleme süresi doldu");
    await delay();
  }
}
async function collect(iterable: AsyncIterable<string>) {
  let result = "";
  for await (const token of iterable) result += token;
  return result;
}
function client(stub: Record<string, unknown>): InstanceType<typeof LlmClient> {
  return {
    ...stub,
    withModel() {
      return this;
    },
    async listModels() {
      return ["fixture-model"];
    },
  } as unknown as InstanceType<typeof LlmClient>;
}
function tool(name: string, args: unknown) {
  return {
    id: "call-1",
    type: "function" as const,
    function: { name, arguments: JSON.stringify(args) },
  };
}
async function listen(server: http.Server) {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return (server.address() as { port: number }).port;
}
function shutdown(server: http.Server) {
  server.closeAllConnections();
  return new Promise<void>((resolve) => server.close(() => resolve()));
}

await test("Profesyonelleştirme: yalıtılmış core, ajan ve gerçek HTTP entegrasyonu", async (t) => {
  try {
    await t.test(
      "Kuyruk FIFO, varsayılan 2 eşzamanlı iş, kopya snapshot ve dinleyici izolasyonu",
      async () => {
        const order: string[] = [];
        const release = new Map<string, () => void>();
        const queue = new JobQueue({
          storageFile: path.join(home, "q1.json"),
          handler: async (job) => {
            order.push(job.prompt);
            await new Promise<void>((resolve) =>
              release.set(job.prompt, resolve),
            );
            return `${home}/${job.prompt}.png`;
          },
        });
        queue.onChange(() => {
          throw new Error("dinleyici");
        });
        const a = queue.enqueue({ kind: "image", prompt: "a" });
        queue.enqueue({ kind: "image", prompt: "b" });
        queue.enqueue({ kind: "image", prompt: "c" });
        await until(() => order.length === 2);
        assert.deepEqual(order, ["a", "b"]);
        const copy = queue.get(a.id)!;
        copy.status = "failed";
        assert.equal(queue.get(a.id)!.status, "running");
        release.get("a")!();
        await until(() => order.length === 3);
        assert.deepEqual(order, ["a", "b", "c"]);
        release.get("b")!();
        release.get("c")!();
        await until(() => queue.list({ status: "done" }).length === 3);
        queue.close();
      },
    );
    await t.test(
      "İptal AbortSignal üretir; handler bitmeden slot veya retry açılmaz",
      async () => {
        let signal!: AbortSignal;
        let finish!: () => void;
        let runs = 0;
        const queue = new JobQueue({
          concurrency: 1,
          storageFile: path.join(home, "q2.json"),
          handler: async (_job, incoming) => {
            runs++;
            signal = incoming;
            await new Promise<void>((r) => (finish = r));
            return "out.png";
          },
        });
        const a = queue.enqueue({ kind: "image", prompt: "a" });
        const b = queue.enqueue({ kind: "image", prompt: "b" });
        await until(() => runs === 1);
        assert.equal(queue.cancel(a.id), true);
        assert.equal(signal.aborted, true);
        assert.equal(queue.retry(a.id), null);
        await delay();
        assert.equal(runs, 1);
        assert.equal(queue.cancel(b.id), true);
        finish();
        await until(() => !!queue.retry(a.id));
        await until(() => runs === 2);
        finish();
        await until(() => queue.get(a.id)?.status === "done");
        assert.equal(queue.get(b.id)?.status, "cancelled");
        queue.close();
      },
    );
    await t.test(
      "Senkron handler hatası failed olur ve tekrar denenebilir",
      async () => {
        let runs = 0;
        const queue = new JobQueue({
          storageFile: path.join(home, "q3.json"),
          handler: () => {
            if (++runs === 1) throw new Error("fixture error");
            return Promise.resolve("ok.png");
          },
        });
        const job = queue.enqueue({ kind: "image", prompt: "x" });
        await until(() => queue.get(job.id)?.status === "failed");
        assert.match(queue.get(job.id)!.error!, /fixture/);
        assert.ok(queue.retry(job.id));
        await until(() => queue.get(job.id)?.status === "done");
        queue.close();
      },
    );
    await t.test("Restart running→failed; bozuk depolama korunur", async () => {
      const file = path.join(home, "restart.json");
      fs.writeFileSync(
        file,
        JSON.stringify([
          {
            id: "r",
            kind: "video",
            prompt: "x",
            status: "running",
            createdAt: 1,
          },
        ]),
      );
      const queue = new JobQueue({
        storageFile: file,
        handler: async () => "unused",
      });
      assert.equal(queue.get("r")?.status, "failed");
      assert.equal(queue.get("r")?.error, "sunucu yeniden basladi");
      queue.close();
      fs.writeFileSync(file, "{broken");
      assert.throws(
        () =>
          new JobQueue({ storageFile: file, handler: async () => "unused" }),
        /bozuk/,
      );
      assert.equal(fs.readFileSync(file, "utf8"), "{broken");
    });
    await t.test(
      "JSONL: seviye, child meta, gizleme, döngü, rezerv alanlar ve 5 MB rotasyon",
      () => {
        process.env.HMX_LOG_LEVEL = "warn";
        const log = getLogger("wizard").child({
          service: "fixture",
          apiKey: "not-a-real-key",
        });
        log.info("filtered");
        const meta: Record<string, unknown> = {
          token: "not-a-real-token",
          channel: "fake",
          level: "fake",
          big: 3n,
        };
        meta.self = meta;
        log.warn("visible", meta);
        const file = path.join(paths.logs, "wizard.log");
        const row = JSON.parse(
          fs.readFileSync(file, "utf8").trim().split("\n").at(-1)!,
        );
        assert.equal(row.channel, "wizard");
        assert.equal(row.level, "warn");
        assert.equal(row.service, "fixture");
        assert.equal(row.token, "[GİZLENDİ]");
        assert.equal(row.apiKey, "[GİZLENDİ]");
        assert.equal(row.big, "3");
        fs.writeFileSync(file, "x".repeat(5 * 1024 * 1024));
        log.error("rotated");
        assert.ok(fs.existsSync(file + ".1"));
        assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).msg, "rotated");
        process.env.HMX_LOG_LEVEL = "error";
      },
    );
    await t.test(
      "Dosya araçları gerçek okur/yazar; ../, dış symlink ve .env reddedilir",
      async () => {
        const workspace = process.env.HMX_WORKSPACE!;
        fs.writeFileSync(path.join(workspace, "readme.txt"), "fixture content");
        fs.writeFileSync(path.join(workspace, ".env"), "secret");
        assert.equal(
          await executeTool("read_file", { path: "readme.txt" }, workspace),
          "fixture content",
        );
        assert.match(
          await executeTool("list_dir", { path: "." }, workspace),
          /readme/,
        );
        await executeTool(
          "write_file",
          { path: "output.txt", content: "safe" },
          workspace,
        );
        assert.equal(
          fs.readFileSync(path.join(workspace, "output.txt"), "utf8"),
          "safe",
        );
        await assert.rejects(
          executeTool("read_file", { path: "../q1.json" }, workspace),
          /dışında/,
        );
        await assert.rejects(
          executeTool("read_file", { path: ".env" }, workspace),
          /Hassas/,
        );
        fs.symlinkSync(home, path.join(workspace, "outside"));
        await assert.rejects(
          executeTool("read_file", { path: "outside/q1.json" }, workspace),
          /Sembolik/,
        );
        fs.symlinkSync(
          path.join(workspace, ".env"),
          path.join(workspace, "alias"),
        );
        await assert.rejects(
          executeTool("read_file", { path: "alias" }, workspace),
          /Hassas/,
        );
      },
    );
    await t.test(
      "Hermes XML gerçek araç döngüsü ve gerçek chatStream çıkışı",
      async () => {
        let turns = 0;
        let streamCalls = 0;
        const llm = client({
          async chat(messages: ChatMessage[]) {
            turns++;
            if (turns === 1)
              return '<tool_call>{"name":"read_file","arguments":{"path":"readme.txt"}}</tool_call>';
            assert.ok(
              messages.some((m) => m.content.includes("fixture content")),
            );
            return "draft";
          },
          async chatStream(_messages: unknown, onToken: (s: string) => void) {
            streamCalls++;
            onToken("Gerçek ");
            onToken("sonuç");
            return "Gerçek sonuç";
          },
        });
        assert.equal(
          await collect(
            new HermesLoopAgent({
              llm,
              workspace: process.env.HMX_WORKSPACE,
            }).chat([{ role: "user", content: "Dosyayı oku" }]),
          ),
          "Gerçek sonuç",
        );
        assert.equal(turns, 2);
        assert.equal(streamCalls, 1);
      },
    );
    await t.test(
      "Hermes tekrarlı hata ve iterasyon bütçesinde durur",
      async () => {
        let calls = 0;
        const broken = client({
          async chat() {
            calls++;
            return '<tool_call>{"name":"write_file","arguments":{"path":"denied"}}</tool_call>';
          },
        });
        assert.match(
          await collect(new HermesLoopAgent({ llm: broken }).chat([])),
          /iki kez/,
        );
        assert.equal(calls, 2);
        const loop = client({
          async chat() {
            return '<tool_call>{"name":"list_dir","arguments":{"path":"."}}</tool_call>';
          },
        });
        assert.match(
          await collect(
            new HermesLoopAgent({
              llm: loop,
              maxIterations: 2,
              workspace: process.env.HMX_WORKSPACE,
            }).chat([]),
          ),
          /bütçesi \(2 tur\)/,
        );
      },
    );
    await t.test(
      "Hermes 5 turda hedef hatırlatır; bağlam taşmasına bir kez toparlanır",
      async () => {
        let calls = 0;
        let reminder = false;
        const llm = client({
          async chat(messages: ChatMessage[]) {
            calls++;
            if (calls === 1) throw new Error("context overflow");
            reminder ||= messages.some((m) =>
              m.content.includes("HEDEF HATIRLATMA"),
            );
            return '<tool_call>{"name":"list_dir","arguments":{"path":"."}}</tool_call>';
          },
        });
        await collect(
          new HermesLoopAgent({
            llm,
            maxIterations: 7,
            workspace: process.env.HMX_WORKSPACE,
          }).chat([{ role: "user", content: "fixture goal" }]),
        );
        assert.equal(reminder, true);
        assert.equal(calls, 7);
      },
    );
    await t.test(
      "OpenCode onaysız write_file çalıştırmaz (allow dahil)",
      async () => {
        const llm = client({
          async completion() {
            return {
              content: "",
              toolCalls: [
                tool("write_file", { path: "denied.txt", content: "no" }),
              ],
            };
          },
        });
        const agent = new OpenCodeAgent({
          llm,
          workspace: process.env.HMX_WORKSPACE,
          permissionMode: "allow",
        });
        assert.match(await collect(agent.chat([])), /onayı verilmedi/);
        assert.equal(
          fs.existsSync(path.join(process.env.HMX_WORKSPACE!, "denied.txt")),
          false,
        );
        assert.equal(agent.getTrace()[0].ok, false);
      },
    );
    await t.test(
      "OpenCode onaylı write_file, gerçek tool response ve iz kopyası",
      async () => {
        let calls = 0;
        let confirmations = 0;
        const llm = client({
          async completion(messages: ChatMessage[]) {
            if (++calls === 1)
              return {
                content: "",
                toolCalls: [
                  tool("write_file", { path: "allowed.txt", content: "yes" }),
                ],
              };
            assert.ok(
              messages.some(
                (m) => m.role === "tool" && m.tool_call_id === "call-1",
              ),
            );
            return { content: "draft", toolCalls: [] };
          },
          async chatStream(_messages: unknown, cb: (s: string) => void) {
            cb("Doğrulandı");
            return "Doğrulandı";
          },
        });
        const agent = new OpenCodeAgent({
          llm,
          workspace: process.env.HMX_WORKSPACE,
          confirm: async (question) => {
            confirmations++;
            assert.match(question, /allowed.txt/);
            return true;
          },
        });
        assert.equal(await collect(agent.chat([])), "Doğrulandı");
        assert.equal(confirmations, 1);
        assert.equal(
          fs.readFileSync(
            path.join(process.env.HMX_WORKSPACE!, "allowed.txt"),
            "utf8",
          ),
          "yes",
        );
        agent.getTrace()[0].ok = false;
        assert.equal(agent.getTrace()[0].ok, true);
      },
    );
    await t.test(
      "OpenCode plan araçsızdır; tekrarlı hata ve tur bütçesi sınırları",
      async () => {
        const plan = client({
          async completion() {
            throw new Error("plan çağırmamalı");
          },
          async chatStream(_m: unknown, cb: (s: string) => void) {
            cb("Plan");
            return "Plan";
          },
        });
        assert.equal(
          await collect(
            new OpenCodeAgent({ llm: plan, permissionMode: "plan" }).chat([]),
          ),
          "Plan",
        );
        const bad = client({
          async completion() {
            return { content: "", toolCalls: [tool("unknown", {})] };
          },
        });
        assert.match(
          await collect(new OpenCodeAgent({ llm: bad }).chat([])),
          /iki kez/,
        );
        const loop = client({
          async completion() {
            return {
              content: "",
              toolCalls: [tool("list_dir", { path: "." })],
            };
          },
        });
        assert.match(
          await collect(
            new OpenCodeAgent({
              llm: loop,
              workspace: process.env.HMX_WORKSPACE,
              maxIterations: 2,
            }).chat([]),
          ),
          /bütçesi \(2 tur\)/,
        );
      },
    );
    // Tamamen yerel OpenAI uyumlu fixture; gerçek/ücretli sağlayıcı kullanılmaz.
    let modelRequests = 0;
    let modelsOffline = false;
    let llmAbortObserved = false;
    const fixture = http.createServer(async (req, res) => {
      if (req.url === "/v1/models") {
        modelRequests++;
        res.writeHead(modelsOffline ? 503 : 200, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ data: [{ id: "fixture-model" }] }));
        return;
      }
      if (req.url === "/media") {
        res.writeHead(200, { "Content-Type": "application/octet-stream" });
        res.end(Buffer.alloc(2048, 1));
        return;
      }
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || "{}");
      if (body.stream) {
        if (
          body.messages?.some(
            (m: { content: string }) => m.content === "CANCEL_STREAM",
          )
        ) {
          res.writeHead(200, { "Content-Type": "text/event-stream" });
          res.write(
            'data: {"choices":[{"delta":{"content":"cancel fixture"}}]}\n\n',
          );
          res.on("close", () => {
            llmAbortObserved = true;
          });
          return;
        }
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        res.write(
          'data: {"choices":[{"delta":{"content":"Gerçek "}}]}\r\n\r\n',
        );
        setTimeout(
          () =>
            res.end(
              'data: {"choices":[{"delta":{"content":"akış"}}]}\r\n\r\ndata: [DONE]\r\n\r\n',
            ),
          5,
        );
        return;
      }
      const last = body.messages?.at(-1);
      const wantsWrite =
        body.tools &&
        last?.role === "user" &&
        last.content.includes("API_WRITE");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          choices: [
            {
              message: wantsWrite
                ? {
                    content: "",
                    tool_calls: [
                      tool("write_file", {
                        path: "api-written.txt",
                        content: "approved fixture",
                      }),
                    ],
                  }
                : { content: "fixture draft" },
            },
          ],
        }),
      );
    });
    const fixturePort = await listen(fixture);
    process.env.HMX_LLM_BASE_URL = `http://127.0.0.1:${fixturePort}/v1`;
    process.env.HMX_LLM_MODEL = "fixture-model";
    process.env.HMX_LLM_API_KEY = "fixture-only-key";
    process.env.HMX_FIXTURE_KEY = "fixture-only-media-key";
    saveProviderConfig({
      id: "fixture-media",
      kind: "image",
      authMode: "api-key",
      baseUrl: `http://127.0.0.1:${fixturePort}`,
      endpoint: `http://127.0.0.1:${fixturePort}/media`,
      apiKeyEnv: "HMX_FIXTURE_KEY",
      tier: "free",
    });
    await t.test(
      "ModelRegistry cache, invalidate ve unavailable fallback dürüstlüğü",
      async () => {
        const registry = new ModelRegistry();
        const first = await registry.list();
        assert.ok(
          first.some((m) => m.id === "llm:fixture-model" && m.available),
        );
        assert.ok(
          first.some((m) => m.id === "media:fixture-media" && m.available),
        );
        const n = modelRequests;
        first[0].available = false;
        await registry.list();
        assert.equal(modelRequests, n);
        modelsOffline = true;
        registry.invalidate();
        const offline = await registry.list();
        assert.equal(offline.find((m) => m.kind === "llm")!.available, false);
        assert.equal(
          offline.find((m) => m.kind === "llm")!.reason,
          "endpoint erisilemiyor",
        );
        modelsOffline = false;
      },
    );
    const reserve = http.createServer();
    const apiPort = await listen(reserve);
    await shutdown(reserve);
    const server = startDashboard(apiPort) as http.Server;
    const base = `http://127.0.0.1:${apiPort}`;
    async function api(url: string, body?: unknown, headers = {}) {
      const response = await fetch(
        base + url,
        body === undefined
          ? undefined
          : {
              method: "POST",
              headers: { "Content-Type": "application/json", ...headers },
              body: JSON.stringify(body),
            },
      );
      return { response, data: (await response.json()) as any };
    }
    try {
      await t.test(
        "Gerçek HTTP: kayıtlı üç builtin ve geriye uyumlu model kataloğu",
        async () => {
          const agents = (await api("/api/agents")).data;
          assert.deepEqual(
            agents.map((a: any) => a.id),
            ["hmx-native", "hermes-loop", "opencode-agent"],
          );
          assert.ok(agents.every((a: any) => a.available));
          const models = (await api("/api/models")).data;
          assert.ok(models.llm.length);
          assert.ok(models.image.length);
          assert.ok(models.registered.length);
        },
      );
      await t.test(
        "Settings anahtarı gizler/korur, quota ve boş zincir gerçekten uygulanır",
        async () => {
          let result = await api("/api/settings", {
            quotaCooldownMs: 7200000,
            orders: { image: "fixture-media" },
            llm: {
              baseUrl: process.env.HMX_LLM_BASE_URL,
              model: "fixture-model",
              apiKey: "new-fixture-key",
            },
          });
          assert.equal(result.response.status, 200);
          assert.equal(
            JSON.stringify(result.data).includes("new-fixture-key"),
            false,
          );
          assert.equal(process.env.HMX_QUOTA_COOLDOWN_MS, "7200000");
          assert.equal(process.env.HMX_ORDER_IMAGE, "fixture-media");
          result = await api("/api/settings", {
            orders: { image: "" },
            llm: { apiKey: "" },
          });
          assert.equal(result.response.status, 200);
          assert.equal(process.env.HMX_ORDER_IMAGE, undefined);
          assert.equal(process.env.HMX_LLM_API_KEY, "new-fixture-key");
          const settings = (await api("/api/settings")).data;
          assert.equal(settings.hasApiKey, true);
          assert.equal(settings.llm.apiKey, undefined);
        },
      );
      await t.test(
        "API doğrulama: quota, URL kimlik bilgisi, yinelenen zincir, builtin gölgeleme ve origin",
        async () => {
          assert.equal(
            (await api("/api/settings", { quotaCooldownMs: 0 })).response
              .status,
            400,
          );
          assert.equal(
            (
              await api("/api/settings", {
                llm: { baseUrl: "https://user:pass@example.com" },
              })
            ).response.status,
            400,
          );
          assert.equal(
            (await api("/api/settings", { orders: { video: "x,x" } })).response
              .status,
            400,
          );
          assert.equal(
            (await api("/api/agents", { id: "hmx-native", name: "fake" }))
              .response.status,
            400,
          );
          assert.equal(
            (await api("/api/settings", {}, { Origin: "https://evil.invalid" }))
              .response.status,
            403,
          );
        },
      );
      await t.test(
        "SSE: canlı token/done, unavailable model ve tek kullanımlık görev onayı",
        async () => {
          let res = await fetch(base + "/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "merhaba",
              sessionId: "safe",
              model: "llm:fixture-model",
            }),
          });
          assert.equal(res.status, 200);
          const text = await res.text();
          assert.match(text, /Gerçek /);
          assert.match(text, /"done":true/);
          res = await fetch(base + "/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "merhaba", model: "no-model" }),
          });
          assert.equal(res.status, 400);
          const payload = { message: "Dosyayı sil", sessionId: "ticket" };
          assert.equal(
            (await api("/api/chat/stream", payload)).response.status,
            403,
          );
          const dry = (
            await api("/api/chat/smart", { ...payload, dryRun: true })
          ).data;
          assert.ok(dry.approvalId);
          res = await fetch(base + "/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, approvalId: dry.approvalId }),
          });
          assert.match(await res.text(), /"done":true/);
          assert.equal(
            (
              await api("/api/chat/stream", {
                ...payload,
                approvalId: dry.approvalId,
              })
            ).response.status,
            403,
          );
        },
      );
      await t.test(
        "SSE bağlantısı kesilince gerçek upstream LLM akışı iptal olur",
        async () => {
          const response = await fetch(base + "/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "CANCEL_STREAM",
              sessionId: "cancel-stream",
            }),
          });
          const reader = response.body!.getReader();
          await reader.read();
          await reader.cancel();
          await until(() => llmAbortObserved);
        },
      );
      await t.test(
        "Runtime araç onayı gerçek HTTP/SSE ile yazmadan önce bekler",
        async () => {
          const response = await fetch(base + "/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "API_WRITE",
              sessionId: "runtime",
              agentId: "opencode-agent",
            }),
          });
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let text = "";
          while (!text.includes('"approval"')) {
            const chunk = await reader.read();
            assert.equal(chunk.done, false);
            text += decoder.decode(chunk.value);
          }
          const event = JSON.parse(
            text
              .split("\n")
              .find((line) => line.startsWith("data:"))!
              .slice(5),
          );
          assert.equal(
            fs.existsSync(
              path.join(process.env.HMX_WORKSPACE!, "api-written.txt"),
            ),
            false,
          );
          const approved = await api(`/api/approvals/${event.approval.id}`, {
            approved: true,
          });
          assert.equal(approved.response.status, 200);
          for (;;) {
            const chunk = await reader.read();
            if (chunk.done) break;
            text += decoder.decode(chunk.value);
          }
          assert.match(text, /"done":true/);
          assert.equal(
            fs.readFileSync(
              path.join(process.env.HMX_WORKSPACE!, "api-written.txt"),
              "utf8",
            ),
            "approved fixture",
          );
        },
      );
      await t.test(
        "Job API 202→done gerçek fixture dosyası/katalog; failed retry; filtre doğrulama",
        async () => {
          const created = await api("/api/jobs", {
            kind: "image",
            prompt: "fixture",
            provider: "fixture-media",
          });
          assert.equal(created.response.status, 202);
          const id = created.data.id;
          assert.ok(id);
          await until(
            async () => (await api(`/api/jobs/${id}`)).data.status === "done",
          );
          const job = (await api(`/api/jobs/${id}`)).data;
          assert.equal(fs.statSync(job.resultPath).size, 2048);
          const assets = (await api("/api/assets")).data;
          assert.ok(assets.some((a: any) => a.filePath === job.resultPath));
          const asset = assets.find((a: any) => a.filePath === job.resultPath);
          const file = await fetch(base + `/api/assets/${asset.id}/file`);
          assert.equal((await file.arrayBuffer()).byteLength, 2048);
          const bad = (
            await api("/api/jobs", { kind: "compose", prompt: "invalid json" })
          ).data;
          await until(
            async () =>
              (await api(`/api/jobs/${bad.id}`)).data.status === "failed",
          );
          assert.equal(
            (await api(`/api/jobs/${bad.id}/retry`, {})).response.status,
            202,
          );
          assert.equal(
            (await api("/api/jobs?status=invalid")).response.status,
            400,
          );
          assert.equal(
            (await api("/api/jobs", { kind: "wrong", prompt: "x" })).response
              .status,
            400,
          );
        },
      );
      await t.test(
        "Compose işi gerçek yerel FFmpeg ve ffprobe ile tamamlanır",
        async () => {
          const { execFileSync } = await import("node:child_process");
          const clip = path.join(home, "local-clip.mp4");
          execFileSync(
            "ffmpeg",
            [
              "-y",
              "-f",
              "lavfi",
              "-i",
              "color=c=blue:s=160x90:r=12:d=1",
              "-c:v",
              "libx264",
              "-pix_fmt",
              "yuv420p",
              clip,
            ],
            { stdio: "ignore" },
          );
          const created = await api("/api/jobs", {
            kind: "compose",
            prompt: JSON.stringify({ clips: [clip, clip] }),
          });
          assert.equal(created.response.status, 202);
          await until(
            async () =>
              (await api(`/api/jobs/${created.data.id}`)).data.status ===
              "done",
            10000,
          );
          const job = (await api(`/api/jobs/${created.data.id}`)).data;
          const { probe } = await import("@hmx/media");
          const info = await probe(job.resultPath);
          assert.equal(info.durationSec, 2);
          assert.ok(info.streams);
          assert.ok(
            (await api("/api/assets")).data.some(
              (asset: { filePath: string }) =>
                asset.filePath === job.resultPath,
            ),
          );
        },
      );
    } finally {
      await shutdown(server);
      await shutdown(fixture);
    }
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
