import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const output = process.env.HMX_QA_DIR || path.join(root, ".qa");
fs.mkdirSync(output, { recursive: true });
const dist = path.join(root, "apps/web/dist");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
};
const host = http.createServer((req, res) => {
  if (req.url === "/__blank") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!doctype html><title>Fixture isolation</title>");
    return;
  }
  const name = path.resolve(
    dist,
    "." +
      decodeURIComponent(
        req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0],
      ),
  );
  if (!name.startsWith(dist + path.sep) || !fs.existsSync(name)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(name)] || "application/octet-stream",
  });
  res.end(fs.readFileSync(name));
});
await new Promise((resolve) => host.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${host.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.HMX_CHROMIUM || "/usr/local/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
page.setDefaultTimeout(4000);
const issues = [],
  results = [],
  requests = [];
page.on("pageerror", (e) => issues.push(e.message));
const providers = [
  {
    id: "flow-ai",
    kind: "video",
    authMode: "browser-session",
    tier: "free",
    circuitOpen: false,
  },
  {
    id: "elevenlabs-web",
    kind: "audio",
    authMode: "browser-session",
    tier: "subscription",
    circuitOpen: true,
  },
  {
    id: "openai-tts",
    kind: "audio",
    authMode: "api-key",
    tier: "cheap",
    circuitOpen: false,
  },
];
const accounts = [
  {
    id: "a1",
    label: "Kişisel Flow",
    provider: "flow-ai",
    profile: "Profile 1",
    status: "active",
    failCount: 0,
    cooldownRemainingMs: 0,
  },
  {
    id: "a2",
    label: "Seslendirme hesabı",
    provider: "elevenlabs-web",
    profile: "Default",
    status: "cooldown",
    failCount: 1,
    cooldownRemainingMs: 7200000,
    notes: "Kota yenilenmesi bekleniyor.",
  },
  {
    id: "a3",
    label: "Üretim API",
    provider: "openai-tts",
    hasApiKey: true,
    status: "error",
    failCount: 3,
    cooldownRemainingMs: 0,
  },
];
const health = {
  ok: true,
  version: "2.0.0",
  llm: { baseUrl: "http://localhost:11434/v1", model: "fixture-model" },
  ffmpeg: true,
  home: "C:\\Users\\tt\\.hmx",
  firstRun: false,
  quota: { accounts: 3, cooldown: 1, error: 1 },
};
let settings = {
  quotaCooldownMs: 21600000,
  orders: { video: "flow-ai" },
  approvalMode: "balanced",
  theme: "dark",
  llm: { baseUrl: health.llm.baseUrl, model: "fixture-model" },
  hasApiKey: true,
};
const models = {
  llm: [{ id: "fixture-model", provider: health.llm.baseUrl, available: true }],
  video: [{ id: "flow-ai", tier: "free", available: true }],
  audio: [
    { id: "openai-tts", tier: "cheap", available: false, reason: "hesap yok" },
  ],
  image: [],
  registered: [
    {
      id: "llm:fixture-model",
      label: "fixture-model",
      kind: "llm",
      source: "llm-endpoint",
      available: true,
    },
    {
      id: "media:flow-ai",
      label: "flow-ai",
      kind: "video",
      source: "media-provider",
      available: true,
    },
    {
      id: "media:openai-tts",
      label: "openai-tts",
      kind: "audio",
      source: "media-provider",
      available: false,
      reason: "hesap yok",
    },
  ],
};
const events = [
  {
    type: "goal",
    step: 1,
    summary: "Ürün tanıtımı için kısa bir video hazırla.",
    ts: new Date().toISOString(),
  },
  {
    type: "plan",
    step: 2,
    summary: "Üç sahne üret, seslendirmeyi hazırla ve klipleri birleştir.",
    ts: new Date().toISOString(),
  },
  {
    type: "error",
    step: 3,
    summary: "Ses sağlayıcısının kotası doldu. Yedek sağlayıcıya geçiliyor.",
    ts: new Date().toISOString(),
  },
  {
    type: "verify",
    step: 4,
    summary: "Çıktı ffprobe ile doğrulandı. Süre: 42 saniye.",
    ts: new Date().toISOString(),
  },
];
const assets = [
  {
    id: "v1",
    type: "video",
    provider: "flow-ai",
    filePath: "C:\\Users\\tt\\.hmx\\media\\sahne-01.mp4",
    status: "verified",
  },
  {
    id: "v2",
    type: "video",
    provider: "flow-ai",
    filePath: "C:\\Users\\tt\\.hmx\\media\\sahne-02.mp4",
    status: "verified",
  },
  {
    id: "a1",
    type: "audio",
    provider: "openai-tts",
    filePath: "C:\\Users\\tt\\.hmx\\media\\seslendirme.mp3",
    status: "verified",
  },
  {
    id: "v3",
    type: "video",
    provider: "flow-ai",
    filePath: "C:\\Users\\tt\\.hmx\\media\\eksik.mp4",
    status: "missing",
  },
];
const fixtures = {
  "/api/providers": providers,
  "/api/accounts": accounts,
  "/api/health": health,
  "/api/models": models,
  "/api/assets": assets,
  "/api/sessions": [
    {
      id: "session-001",
      title: "Ürün tanıtım videosu oluştur",
      steps: 8,
      errors: 1,
      lastTs: new Date().toISOString(),
    },
    {
      id: "session-002",
      title: "Haftalık raporu özetle",
      steps: 4,
      errors: 0,
      lastTs: new Date().toISOString(),
    },
  ],
  "/api/sessions/session-001": events,
  "/api/sessions/session-002": [],
  "/api/chrome-profiles": [
    { dir: "Default", name: "Kişisel profil", email: "fixture@example.com" },
  ],
  "/api/routing": {
    order: {
      video: ["flow-ai"],
      image: [],
      audio: ["elevenlabs-web", "openai-tts"],
      llm: [],
    },
    accounts,
    circuits: [{ id: "elevenlabs-web", open: true }],
    tokenSaver: {
      savedRatio: 0.36,
      compressedCount: 12,
      beforeTokens: 12000,
      afterTokens: 7680,
    },
  },
  "/api/logs": ["session-001.jsonl", "dashboard.log"],
  "/api/logs/session-001.jsonl": {
    lines: [
      ...events.map((e) => JSON.stringify(e)),
      "INFO · Medya kataloğu güncellendi.",
    ],
    total: 205,
  },
  "/api/logs/dashboard.log": {
    lines: ["INFO · Dashboard başlatıldı."],
    total: 1,
  },
  "/api/agents": [
    { id: "hmx-native", name: "HMX Native", kind: "native", available: true },
    { id: "hermes-loop", name: "Hermes Loop", kind: "hermes", available: true },
    {
      id: "opencode-agent",
      name: "OpenCode Agent",
      kind: "opencode-style",
      available: true,
    },
    { id: "offline", name: "Kapalı ajan", kind: "native", available: false },
  ],
};
let failure = [],
  mode = "normal",
  latency = 0,
  stream = "normal",
  jobs = [];
await page.route("**/api/**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  let body;
  try {
    body = request.postDataJSON();
  } catch {}
  requests.push({ url: url.pathname, method: request.method(), body });
  if (latency) await new Promise((r) => setTimeout(r, latency));
  if (failure.includes(url.pathname)) {
    await route.fulfill({
      status: 503,
      json: { error: "Fixture bağlantı hatası" },
    });
    return;
  }
  if (url.pathname === "/api/chat/stream") {
    const data =
      stream === "runtime"
        ? 'data: {"approval":{"id":"runtime-ticket","question":"write_file fixture.txt açık onayı"}}\r\n\r\ndata: {"token":"Onay bekliyor"}\r\n\r\ndata: {"done":true}\r\n\r\n'
        : stream === "error"
          ? 'data: {"token":"Kısmi yanıt"}\r\n\r\ndata: {"error":"Fixture akış hatası"}\r\n\r\n'
          : stream === "eof"
            ? 'data: {"token":"Kısmi EOF"}\r\n\r\n'
            : 'data: {"token":"Merhaba **tt**. "}\r\n\r\ndata: {"token":"Doğrulanmış sonuç."}\r\n\r\ndata: {"done":true}\r\n\r\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: data,
    });
    return;
  }
  let data;
  if (request.method() === "GET") {
    data =
      url.pathname === "/api/settings"
        ? settings
        : url.pathname === "/api/jobs"
          ? jobs
          : fixtures[url.pathname];
    if (url.pathname === "/api/assets" && url.searchParams.has("type"))
      data = assets.filter((a) => a.type === url.searchParams.get("type"));
    if (
      mode === "empty" &&
      [
        "/api/providers",
        "/api/accounts",
        "/api/assets",
        "/api/sessions",
        "/api/logs",
        "/api/jobs",
      ].includes(url.pathname)
    )
      data = [];
  } else if (url.pathname === "/api/chat/smart") {
    data = body.dryRun
      ? {
          ok: true,
          mode: body.message.includes("sil")
            ? "needs-approval"
            : body.message.includes("@")
              ? "media"
              : "chat",
          risk: "destructive",
          approvalId: "goal-ticket",
        }
      : {
          ok: true,
          mode: "media",
          results: [
            {
              ok: true,
              kind: "video",
              provider: "flow-ai",
              jobId: "job-media",
            },
          ],
        };
  } else if (url.pathname === "/api/settings") {
    settings = { ...settings, ...body, llm: { ...settings.llm, ...body.llm } };
    data = { ok: true };
  } else if (url.pathname === "/api/jobs") {
    const job = {
      id: "job-compose",
      kind: body.kind,
      prompt: body.prompt,
      status: "queued",
      createdAt: Date.now(),
    };
    jobs.push(job);
    data = job;
  } else if (/\/api\/jobs\/.+\/(cancel|retry)$/.test(url.pathname)) {
    const job = jobs.find((j) => url.pathname.includes(j.id));
    if (job)
      job.status = url.pathname.endsWith("/retry") ? "queued" : "cancelled";
    data = { ok: true, job };
  } else if (url.pathname === "/api/accounts/login/start")
    data = { ok: true, pendingId: "login-fixture" };
  else if (url.pathname === "/api/accounts/login/finish") data = { ok: true };
  else if (url.pathname === "/api/models/test")
    data = { ok: true, reply: "pong" };
  else data = { ok: true };
  if (request.method() === "GET" && mode === "empty") {
    if (["/api/health", "/api/settings"].includes(url.pathname)) data = null;
    if (url.pathname === "/api/models")
      data = { llm: [], image: [], video: [], audio: [], registered: [] };
  }
  if (data === undefined) {
    await route.fulfill({
      status: 404,
      json: { error: "Unknown fixture " + url.pathname },
    });
    return;
  }
  await route.fulfill({ status: 200, json: data });
});
const now = Date.now();
const seedSession = (id, title, at = now, messages = []) => ({
  id,
  title,
  updatedAt: at,
  selectedAgentId: "hmx-native",
  selectedModelId: "llm:fixture-model",
  activeTab: "chat",
  draft: "",
  messages,
  scrollOffset: 0,
});
const defaultSessions = {
  s1: seedSession("s1", "Ürün tanıtım kampanyası", now, [
    {
      id: "u0",
      role: "user",
      content: "Ürün kampanyası için plan hazırla.",
      createdAt: now - 120000,
    },
    {
      id: "a0",
      role: "assistant",
      content:
        "**Üretim planı**\n\n- Görselleri hazırlayın\n- Video kliplerini doğrulayın\n- Seslendirme ve birleştirme\n\n```ts\nconst verified = true;\n```",
      createdAt: now - 100000,
    },
  ]),
  s2: seedSession("s2", "Haftalık rapor", now - 86400000, [
    {
      id: "u2",
      role: "user",
      content: "benzersiz arama metni",
      createdAt: now - 86400000,
    },
  ]),
  s3: seedSession("s3", "Eski çalışma", now - 20 * 86400000),
};
let init = { page: "chat", sessions: defaultSessions };
await page.addInitScript(() => {
  window.__XSS__ = false;
});
async function open(name = "chat", sessions = defaultSessions, options = {}) {
  failure = [];
  mode = "normal";
  latency = 0;
  stream = "normal";
  requests.length = 0;
  jobs = [];
  await page.goto(base + "/__blank");
  await page.evaluate(
    ({ name, sessions }) => {
      localStorage.clear();
      localStorage.setItem(
        "hmx-agent-ui",
        JSON.stringify({
          state: { page: name, wizardOpen: false },
          version: 1,
        }),
      );
      localStorage.setItem(
        "hmx-agent-sessions",
        JSON.stringify({
          state: {
            sessions,
            activeSessionId: Object.keys(sessions)[0] ?? null,
          },
          version: 1,
        }),
      );
      localStorage.setItem("unrelated-fixture", "preserved");
    },
    { name, sessions },
  );
  failure = options.failure || [];
  mode = options.mode || "normal";
  latency = options.latency || 0;
  await page.goto(base);
  await page.waitForTimeout(180);
}
const click = (name) => page.getByRole("button", { name, exact: true }).click();
const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
    console.error("FAIL", name, String(error));
  }
};
const shot = async (name) => {
  if (name === "logs-mobile")
    fs.writeFileSync(
      path.join(output, "logs-layout.json"),
      JSON.stringify(
        await page.evaluate(() => ({
          height: innerHeight,
          html: document.documentElement.scrollHeight,
          body: document.body.scrollHeight,
          elements: [...document.querySelectorAll("body *")]
            .filter(
              (e) =>
                e.getBoundingClientRect().bottom > innerHeight &&
                getComputedStyle(e).display !== "none",
            )
            .map((e) => ({
              tag: e.tagName,
              cls: e.className,
              bottom: e.getBoundingClientRect().bottom,
              overflow: getComputedStyle(e).overflow,
              position: getComputedStyle(e).position,
            }))
            .slice(0, 35),
        })),
        null,
        2,
      ),
    );
  await page.screenshot({
    path: path.join(output, name + ".png"),
    fullPage: true,
  });
};
const navigate = async (name) => {
  if (
    await page
      .getByRole("button", { name: "Ana menüyü aç veya kapat" })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Ana menüyü aç veya kapat" })
      .click();
  await page
    .locator(".left-sidebar")
    .getByRole("button", { name, exact: true })
    .click();
  await page.waitForTimeout(150);
};
try {
  for (const route of [
    "chat",
    "sessions",
    "servers",
    "providers",
    "models",
    "pipeline",
    "logs",
    "settings",
  ]) {
    await check(`${route}: masaüstü tam uygulama ve logo`, async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await open(route);
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
      assert(
        await page
          .locator(".brand img")
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      );
      await shot(route + "-desktop");
      if (route === "chat") {
        let html = await page.content();
        html = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
          .replace(/<link[^>]*>/g, "");
        const css = fs
          .readdirSync(path.join(dist, "assets"))
          .filter((f) => f.endsWith(".css"))
          .map((f) => fs.readFileSync(path.join(dist, "assets", f), "utf8"))
          .join("\n");
        html = html
          .replace("</head>", `<style>${css}</style></head>`)
          .replace(
            /src="\/branding\/([^"]+)"/g,
            (_m, name) => `src="file://${dist}/branding/${name}"`,
          );
        fs.writeFileSync(path.join(output, "chat-static.html"), html);
      }
    });
    await check(`${route}: 390px mobil taşma yok`, async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await shot(route + "-mobile");
      assert(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= window.innerHeight,
        ),
        "Body yerine panel içi scroll kullanılmalı",
      );
      if (route === "logs") {
        await page
          .locator(".workspace-body")
          .evaluate((el) => (el.scrollTop = 520));
        await shot("logs-tail-mobile");
        await page
          .locator(".workspace-body")
          .evaluate((el) => (el.scrollTop = 0));
      }
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await check(
    "Composer: boş/busy, Shift+Enter, IME ve @ klavye seçimi",
    async () => {
      await open();
      const textarea = page.getByRole("combobox", { name: "Mesajınız" });
      assert(
        await page
          .getByRole("button", { name: "Gönder", exact: true })
          .isDisabled(),
      );
      await textarea.fill("@flow");
      await page.getByRole("option", { name: "@video:flow-ai" }).waitFor();
      await textarea.press("Enter");
      assert.equal(await textarea.inputValue(), "@video:flow-ai ");
      assert.equal(await page.locator(".composer-highlight mark").count(), 1);
      await textarea.press("Shift+Enter");
      assert((await textarea.inputValue()).includes("\n"));
      await textarea.fill("IME");
      await textarea.evaluate((el) =>
        el.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            isComposing: true,
          }),
        ),
      );
      assert.equal(
        requests.filter((r) => r.url === "/api/chat/smart").length,
        0,
      );
      await textarea.fill("x".repeat(2001));
      assert.match(
        await page.locator(".composer-warning").textContent(),
        /Uzun mesaj/,
      );
      await textarea.fill("merhaba");
      latency = 200;
      await textarea.press("Enter");
      assert(await textarea.isDisabled());
      await page
        .locator(".message-list")
        .getByText("Doğrulanmış sonuç.")
        .waitFor();
      assert.equal(await textarea.inputValue(), "");
    },
  );
  await check(
    "MessageList: markdown, tarih, kod kopyası ve güvenli HTML/link",
    async () => {
      await open("chat", {
        s1: seedSession("s1", "Markdown", now, [
          {
            id: "md",
            role: "assistant",
            createdAt: now,
            content:
              '**Kalın** *italik*\n\n- Bir\n- İki\n\n[Bağlantı](https://example.com) [Kötü](javascript:alert(1))\n\n<img src=x onerror="window.__XSS__=true">\n\n```js\nconsole.log(1);\n```',
          },
        ]),
      });
      assert.equal(await page.locator(".message p strong").count(), 1);
      assert.equal(await page.locator(".message em").count(), 1);
      assert.equal(await page.locator(".message li").count(), 2);
      assert.equal(
        await page.locator('.message a[href^="javascript:"]').count(),
        0,
      );
      assert.equal(await page.evaluate(() => window.__XSS__), false);
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"]);
      await click("Kopyala");
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        "console.log(1);",
      );
      assert(await page.getByText("Bugün", { exact: true }).count());
    },
  );
  await check(
    "Chat: SSE hata, kısmi çıktı, retry aynı kullanıcı ve EOF bildirimi",
    async () => {
      await open("chat", { s1: seedSession("s1", "Akış") });
      stream = "error";
      await page.getByRole("combobox", { name: "Mesajınız" }).fill("ilk istek");
      await click("Gönder");
      await page.getByText("Fixture akış hatası", { exact: true }).waitFor();
      assert(await page.getByText("Kısmi yanıt", { exact: true }).count());
      stream = "normal";
      await click("Tekrar dene");
      await page
        .locator(".message-list")
        .getByText("Doğrulanmış sonuç.")
        .waitFor();
      const messages = await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("hmx-agent-sessions")).state.sessions
            .s1.messages,
      );
      assert.equal(messages.filter((m) => m.role === "user").length, 1);
      assert.equal(messages.filter((m) => m.role === "assistant").length, 1);
      stream = "eof";
      await page
        .getByRole("combobox", { name: "Mesajınız" })
        .fill("ikinci istek");
      await click("Gönder");
      await page
        .getByText(
          "Akış tamamlanmadan bağlantı kapandı. Kısmi yanıt korunuyor.",
        )
        .waitFor();
    },
  );
  await check(
    "Chat: inline görev onayı, SSE ticket ve medya queue isteği",
    async () => {
      await open("chat", { s1: seedSession("s1", "Onay") });
      await page
        .getByRole("combobox", { name: "Mesajınız" })
        .fill("dosyayı sil");
      await click("Gönder");
      await page.locator(".approval-card").waitFor();
      await page.getByText("Görev onayı gerekiyor").waitFor();
      assert.equal(await page.getByRole("dialog").count(), 0);
      await shot("chat-approval");
      assert.equal(
        requests.filter((r) => r.url === "/api/chat/stream").length,
        0,
      );
      await click("Onayla");
      await page
        .locator(".message-list")
        .getByText("Doğrulanmış sonuç.")
        .waitFor();
      assert(
        requests.some(
          (r) =>
            r.url === "/api/chat/stream" && r.body.approvalId === "goal-ticket",
        ),
      );
      await page
        .getByRole("combobox", { name: "Mesajınız" })
        .fill("@video:flow-ai sahne üret");
      await click("Gönder");
      await page
        .locator(".message-list")
        .getByText(/iş kuyruğa alındı/)
        .waitFor();
      assert(
        requests.some(
          (r) => r.url === "/api/chat/smart" && r.body.queue === true,
        ),
      );
    },
  );
  await check(
    "Chat: oturumlar arası taslak, seçim, sekmeler ve gallery boş hali",
    async () => {
      await open();
      await page
        .getByRole("combobox", { name: "Mesajınız" })
        .fill("korunan taslak");
      await page
        .locator(".session-open")
        .filter({ hasText: "Haftalık rapor" })
        .click();
      assert.equal(
        await page.getByRole("combobox", { name: "Mesajınız" }).inputValue(),
        "",
      );
      await page
        .locator(".session-open")
        .filter({ hasText: "Ürün tanıtım kampanyası" })
        .click();
      assert.equal(
        await page.getByRole("combobox", { name: "Mesajınız" }).inputValue(),
        "korunan taslak",
      );
      await page.getByRole("tab", { name: "Görseller", exact: true }).click();
      await page.getByText("Bu sekmede henüz varlık yok").waitFor();
      assert.equal(await page.getByRole("tab").count(), 6);
      await page.getByRole("tab", { name: "Kod", exact: true }).click();
      assert(await page.getByText("const verified = true;").count());
    },
  );
  await check(
    "SessionPanel: son mesaj araması, rename, klavye ve inline delete",
    async () => {
      await open();
      const search = page.getByRole("searchbox", { name: "Oturumlarda ara" });
      await search.fill("benzersiz");
      assert.equal(await page.locator(".session-open").count(), 1);
      await search.fill("");
      await page.locator(".session-open").first().focus();
      await page.keyboard.press("F2");
      await page.getByLabel("Yeni oturum adı").fill("Yeni kampanya adı");
      await click("Kaydet");
      assert(
        await page
          .locator(".session-open")
          .filter({ hasText: "Yeni kampanya adı" })
          .count(),
      );
      await page.locator(".session-open").first().focus();
      await page.keyboard.press("ArrowDown");
      assert(
        await page
          .locator(".session-open")
          .nth(1)
          .evaluate((el) => el === document.activeElement),
      );
      await page.keyboard.press("Enter");
      await page
        .getByRole("button", {
          name: "Haftalık rapor oturumunu sil",
          exact: true,
        })
        .click();
      assert.equal(await page.getByRole("dialog").count(), 0);
      await page
        .locator(".session-confirm")
        .getByRole("button", { name: "Sil", exact: true })
        .click();
      assert.equal(await page.locator(".session-open").count(), 2);
    },
  );
  await check(
    "Palette: Ctrl+K, fuzzy prv, mark, recent ve Escape",
    async () => {
      await open();
      await page.keyboard.press("Control+k");
      const input = page.getByRole("combobox", { name: "Komut ara" });
      await input.fill("prv");
      assert.equal(
        await page.locator(".command-dialog").getByRole("option").count(),
        1,
      );
      assert.equal(await page.locator(".command-option mark").count(), 3);
      await page.keyboard.press("Enter");
      await page
        .getByRole("heading", { name: "Sağlayıcılar ve hesaplar" })
        .waitFor();
      assert.equal(await page.getByRole("dialog").count(), 0);
      assert(
        (
          await page.evaluate(() => localStorage.getItem("hmx-palette-recent"))
        ).includes("providers"),
      );
      await page.keyboard.press("Control+k");
      await page.getByText("Son kullanılan", { exact: true }).waitFor();
      await shot("palette-desktop");
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
    },
  );
  await check(
    "Providers: 5 sekme, kartlar, JSON validation ve browser login",
    async () => {
      await open("providers");
      assert.equal(await page.getByRole("tab").count(), 5);
      assert.equal(await page.locator(".hmx-provider").count(), 3);
      await click("Sağlayıcı ekle");
      await page.getByLabel("JSON yapılandırması").fill("{broken");
      await click("Sağlayıcıyı kaydet");
      assert(await page.getByText("Geçerli bir JSON nesnesi girin.").count());
      await page.getByRole("button", { name: "Pencereyi kapat" }).click();
      await page.getByRole("tab", { name: "Hesaplar", exact: true }).click();
      await click("Hesap ekle");
      await page
        .getByLabel("Sağlayıcı", { exact: true })
        .selectOption("flow-ai");
      await page.getByLabel("Hesap etiketi").fill("Fixture hesap");
      await page.getByRole("radio").check();
      await click("Chrome'u aç ve giriş yap");
      await page
        .getByRole("button", { name: "Giriş yaptım — Kaydet", exact: true })
        .waitFor();
      await click("Giriş yaptım — Kaydet");
      assert(requests.some((r) => r.url === "/api/accounts/login/finish"));
    },
  );
  await check("Providers: loading, empty ve error/retry", async () => {
    await open("providers");
    mode = "empty";
    await click("Yenile");
    await page.getByText("Sağlayıcı ağınızı kurun").waitFor();
    await shot("providers-empty");
    failure = ["/api/providers"];
    await click("Yenile");
    await page.getByText("Fixture bağlantı hatası", { exact: true }).waitFor();
    await shot("providers-error");
    failure = [];
    mode = "normal";
    await click("Yeniden dene");
    await page.locator(".hmx-provider").first().waitFor();
    await open("providers", defaultSessions, { latency: 700 });
    assert((await page.locator(".hmx-skeleton").count()) > 0);
    await shot("providers-loading");
    latency = 0;
    await page.locator(".hmx-provider").first().waitFor();
  });
  await check("Logs: arama, renkler, canlı takip ve duraklat", async () => {
    await open("logs");
    assert.equal(await page.locator(".hmx-log-row--error").count(), 1);
    assert.equal(await page.locator(".hmx-log-row--verify").count(), 1);
    await page.getByLabel("Satırlarda ara").fill("quota olmayan");
    assert.equal(await page.locator(".hmx-log-row").count(), 0);
    await page.getByLabel("Satırlarda ara").fill("");
    await click("Duraklat");
    assert(
      await page
        .getByRole("button", { name: "Canlı takibi aç", exact: true })
        .count(),
    );
  });
  await check(
    "Pipeline: doğrulanmış seçim, sıralama, Job 202 ve cancel/retry UI",
    async () => {
      await open("pipeline");
      const checkboxes = page.getByRole("checkbox");
      assert.equal(await checkboxes.count(), 4);
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await page
        .getByRole("button", { name: /klibi aşağı taşı/ })
        .first()
        .click();
      await click("Videoyu birleştir");
      await page.getByText(/İş kuyruğa eklendi:/).waitFor();
      const req = requests.find(
        (r) => r.url === "/api/jobs" && r.method === "POST",
      );
      assert.equal(req.body.kind, "compose");
      assert.equal(JSON.parse(req.body.prompt).clips[0], assets[1].filePath);
      await click("İşleri yenile");
      await page.getByText("Sırada", { exact: true }).waitFor();
      await click("İptal et");
      await page.getByText("İptal edildi", { exact: true }).waitFor();
      await click("Tekrar dene");
      await page.getByText("Sırada", { exact: true }).waitFor();
      await shot("pipeline-jobs");
    },
  );
  await check(
    "Settings: 3 policy, quota validation, secret mask ve saved toast",
    async () => {
      await open("settings");
      assert.equal(await page.getByRole("radio").count(), 3);
      const quota = page.getByLabel("Bekleme süresi (saat)");
      await quota.fill("73");
      await click("Ayarları kaydet");
      assert(
        await page
          .getByText("Bekleme süresi 1–72 saat arasında olmalı.")
          .count(),
      );
      await quota.fill("8");
      await page
        .getByLabel("API anahtarı (isteğe bağlı)")
        .fill("fixture-only-input");
      assert.equal(
        await page
          .getByLabel("API anahtarı (isteğe bağlı)")
          .getAttribute("type"),
        "password",
      );
      await click("Ayarları kaydet");
      await page.getByText("Ayarlar kaydedildi.", { exact: true }).waitFor();
      assert(
        requests.some(
          (r) =>
            r.url === "/api/settings" &&
            r.method === "POST" &&
            r.body.quotaCooldownMs === 8 * 3600000,
        ),
      );
      assert.equal(
        await page.getByLabel("API anahtarı (isteğe bağlı)").inputValue(),
        "",
      );
    },
  );
  await check(
    "Settings: yinelenen fallback ve error toast form değerlerini korur",
    async () => {
      await open("settings");
      await page.getByLabel("Video", { exact: true }).fill("flow-ai,flow-ai");
      await click("Ayarları kaydet");
      assert(
        await page
          .getByText("Aynı sağlayıcıyı zincirde bir kez kullanın.")
          .count(),
      );
      await page.getByLabel("Video", { exact: true }).fill("flow-ai");
      await page.getByLabel("Bekleme süresi (saat)").fill("9");
      failure = ["/api/settings"];
      await click("Ayarları kaydet");
      await page
        .getByText("İşlem başarısız: Fixture bağlantı hatası", { exact: true })
        .waitFor();
      assert.equal(
        await page.getByLabel("Bekleme süresi (saat)").inputValue(),
        "9",
      );
    },
  );
  await check(
    "Settings: iki onaylı reset sadece session state siler ve wizard açılır",
    async () => {
      await open("settings");
      await click("Yerel oturumları sıfırla");
      await click("Riski anladım — devam et");
      assert(
        await page
          .getByRole("button", { name: "Kalıcı olarak sıfırla" })
          .isDisabled(),
      );
      await page.getByLabel("İkinci onay").fill("OTURUMLARI SIFIRLA");
      await shot("settings-reset");
      await click("Kalıcı olarak sıfırla");
      assert.equal(
        await page.evaluate(() => localStorage.getItem("hmx-agent-sessions")),
        null,
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem("unrelated-fixture")),
        "preserved",
      );
      await click("Sihirbazı aç");
      assert.equal(await page.getByRole("dialog").count(), 1);
    },
  );
  await check(
    "Mobil: menü, oturum ve inspector erişilebilir; seçili son sekme görünür",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await open();
      await page
        .getByRole("button", { name: "Oturum panelini aç veya kapat" })
        .click();
      assert(await page.locator(".session-panel").isVisible());
      await page
        .getByRole("button", { name: "Oturum panelini aç veya kapat" })
        .click();
      await page
        .getByRole("button", { name: "Durum panelini aç veya kapat" })
        .click();
      assert(await page.locator(".right-inspector").isVisible());
      await page
        .getByRole("button", { name: "Durum panelini aç veya kapat" })
        .click();
      await navigate("Sağlayıcılar");
      await page
        .getByRole("tab", { name: "Etkinlik ve sağlık", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Sistem", exact: true })
        .waitFor();
      await shot("providers-health-mobile");
      assert(
        await page.getByRole("tab", { name: "Etkinlik ve sağlık" }).isVisible(),
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
    },
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  const resourcePaths = {
    sessions: ["/api/sessions"],
    servers: ["/api/health"],
    providers: ["/api/providers"],
    models: ["/api/models", "/api/settings"],
    pipeline: ["/api/assets"],
    logs: ["/api/logs"],
    settings: ["/api/settings"],
  };
  for (const [name, paths] of Object.entries(resourcePaths)) {
    await check(`${name}: ilk yüklemede skeleton`, async () => {
      await open(name, defaultSessions, { latency: 700 });
      assert((await page.locator(".workspace .hmx-skeleton").count()) > 0);
    });
    await check(`${name}: API hatası ve retry`, async () => {
      await open(name, defaultSessions, { failure: paths });
      assert((await page.locator(".workspace").getByRole("alert").count()) > 0);
      failure = [];
      for (let retry = 0; retry < paths.length; retry++) {
        const buttons = page
          .locator(".workspace")
          .getByRole("button", { name: "Yeniden dene", exact: true });
        if (await buttons.count()) await buttons.first().click();
        await page.waitForTimeout(150);
      }
      assert.equal(
        await page
          .locator(".workspace")
          .getByText("Fixture bağlantı hatası", { exact: true })
          .count(),
        0,
      );
    });
    await check(`${name}: boş kaynak ve aksiyon`, async () => {
      await open(name, defaultSessions, { mode: "empty" });
      assert((await page.locator(".workspace .hmx-empty").count()) > 0);
      assert((await page.locator(".workspace .hmx-empty button").count()) > 0);
    });
  }
  await check("Arayüz çalışma zamanı hatası yok", async () =>
    assert.deepEqual(issues, []),
  );
} finally {
  await browser.close();
  host.close();
}
fs.writeFileSync(
  path.join(output, "ui-results.json"),
  JSON.stringify(
    {
      results,
      issues,
      pass: results.filter((r) => r.ok).length,
      fail: results.filter((r) => !r.ok).length,
    },
    null,
    2,
  ),
);
console.log(
  `UI ${results.filter((r) => r.ok).length} PASS, ${results.filter((r) => !r.ok).length} FAIL`,
);
if (results.some((r) => !r.ok)) process.exitCode = 1;
