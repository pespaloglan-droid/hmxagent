import { Hono } from "hono";
import { serve } from "@hono/node-server";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { MediaRouter, parsePromptRoute } from "@hmx/router";
import { AssetCatalog, composeProject } from "@hmx/media";
import {
  loadProviderConfigs, saveProviderConfig, deleteProviderConfig,
  AccountPool, listChromeProfiles, launchRealChrome,
} from "@hmx/providers";
import { HmxAgent, AgentRegistry, HmxNativeDriver, createChatOnlyBackend, classifyMessageRisk, shouldRequireApproval, type ApprovalMode } from "@hmx/agent-core";
import type { ChatMessage } from "@hmx/core";
import { paths, ensureDirs, readJson, writeJson, HMX_HOME } from "@hmx/core";
import { quotaSnapshot } from "./quota-tracker.js";
import { DASHBOARD_HTML } from "./html.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// React renderer (apps/web) build'i varsa onu sun, yoksa eski tek-dosya HTML
const WEB_DIST_CANDIDATES = [
  process.env.HMX_WEB_DIST, // Electron paketinde resources/web-dist
  path.resolve(process.cwd(), "apps/web/dist"),
  path.resolve(__dirname, "../../../apps/web/dist"),
].filter(Boolean) as string[];
const WEB_DIST = WEB_DIST_CANDIDATES.find((d) => fs.existsSync(path.join(d, "index.html"))) ?? null;

const MIME: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".woff2": "font/woff2", ".ico": "image/x-icon",
};

type Settings = {
  quotaCooldownMs: number;
  orders: { image?: string; video?: string; audio?: string; llm?: string };
  llm?: { baseUrl?: string; model?: string; apiKey?: string };
  approvalMode?: ApprovalMode;
  theme: "dark";
};
const SETTINGS_FILE = path.join(HMX_HOME, "settings.json");
const DEFAULT_SETTINGS: Settings = { quotaCooldownMs: 6 * 60 * 60 * 1000, orders: {}, approvalMode: "balanced", theme: "dark" };

function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(readJson<Settings>(SETTINGS_FILE) ?? {}) };
}

export function startDashboard(port?: number) {
  // Guvenli port: arguman -> .env -> varsayilan. NaN/asiri degerde 4173'e duser.
  const envPort = Number(process.env.HMX_DASHBOARD_PORT ?? process.env.PORT);
  const finalPort =
    Number.isInteger(port) && port! > 0 && port! < 65536 ? port!
    : Number.isInteger(envPort) && envPort > 0 && envPort < 65536 ? envPort
    : 4173;
  ensureDirs();
  const app = new Hono();
  const router = new MediaRouter();
  const catalog = new AssetCatalog();
  const agents = new Map<string, HmxAgent>();
  const pendingLogins = new Map<string, { providerId: string; label?: string; profileDir: string; kill: () => void }>();

  // --- statik: React renderer veya fallback HTML ---
  app.get("/", (c) => {
    if (WEB_DIST) return c.html(fs.readFileSync(path.join(WEB_DIST, "index.html"), "utf8"));
    return c.html(DASHBOARD_HTML);
  });
  app.get("/assets/*", (c) => {
    if (!WEB_DIST) return c.notFound();
    const rel = c.req.path.replace(/^\/+/, "");
    const file = path.join(WEB_DIST, rel);
    if (!file.startsWith(WEB_DIST) || !fs.existsSync(file)) return c.notFound();
    return c.body(fs.readFileSync(file) as any, 200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
  });

  // --- saglayici paneli API ---
  app.get("/api/providers", (c) => c.json(router.list()));
  app.post("/api/providers", async (c) => {
    const cfg = await c.req.json();
    if (!cfg.id || !cfg.baseUrl || !cfg.kind || !cfg.authMode) return c.json({ ok: false, error: "id, baseUrl, kind, authMode zorunlu" }, 400);
    saveProviderConfig(cfg);
    router.reload();
    return c.json({ ok: true });
  });
  app.delete("/api/providers/:id", (c) => {
    deleteProviderConfig(c.req.param("id"));
    router.reload();
    return c.json({ ok: true });
  });
  app.post("/api/providers/:id/test", async (c) => {
    const p = (router as any).providers.find((x: any) => x.id === c.req.param("id"));
    if (!p) return c.json({ ok: false, error: "saglayici yok" }, 404);
    const ok = await p.isAvailable();
    return c.json({ ok, status: ok ? "Connected" : "Error" });
  });

  // --- hesap havuzu (Bolum 2 + 6.3) ---
  app.get("/api/accounts", (c) => {
    const pool = new AccountPool();
    return c.json(pool.listAll().map((a) => ({
      id: a.id,
      provider: a.providerId,
      label: a.label,
      profile: a.profileDirectory ?? null,
      hasApiKey: !!a.apiKey,
      status: a.status,
      failCount: a.failCount,
      cooldownUntil: a.cooldownUntil ?? null,
      cooldownRemainingMs: a.cooldownUntil ? Math.max(0, a.cooldownUntil - Date.now()) : 0,
      lastUsedAt: a.lastUsedAt ?? null,
      notes: a.notes ?? null,
    })));
  });
  // API anahtarli hesap ekle
  app.post("/api/accounts", async (c) => {
    const body = await c.req.json();
    if (!body.providerId || (!body.apiKey && !body.profileDirectory)) {
      return c.json({ ok: false, error: "providerId + (apiKey veya profileDirectory) zorunlu" }, 400);
    }
    const pool = new AccountPool();
    const acc = pool.add({ providerId: body.providerId, label: body.label ?? "Hesap", apiKey: body.apiKey, profileDirectory: body.profileDirectory });
    return c.json({ ok: true, account: { id: acc.id, provider: acc.providerId, label: acc.label } });
  });
  app.delete("/api/accounts/:providerId/:accountId", (c) => {
    const pool = new AccountPool();
    return c.json({ ok: pool.remove(c.req.param("providerId"), c.req.param("accountId")) });
  });
  // Chrome profil listesi (hesap ekleme modali icin)
  app.get("/api/chrome-profiles", (c) => {
    try {
      return c.json(listChromeProfiles());
    } catch (e) {
      return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
  // Panelden interaktif giris: 1) Chrome'u basli basina ac 2) kullanici girer 3) finish ile kaydet
  app.post("/api/accounts/login/start", async (c) => {
    const body = await c.req.json();
    const cfg = loadProviderConfigs().find((x) => x.id === body.providerId);
    if (!cfg) return c.json({ ok: false, error: "saglayici yok" }, 404);
    if (!body.profileDir) return c.json({ ok: false, error: "profileDir zorunlu" }, 400);
    try {
      const { ensureProfileCopy } = await import("@hmx/providers");
      ensureProfileCopy(body.profileDir);
      const { proc } = await launchRealChrome({ url: cfg.baseUrl, profileDir: body.profileDir });
      const pendingId = `login_${Date.now()}`;
      pendingLogins.set(pendingId, { providerId: body.providerId, label: body.label, profileDir: body.profileDir, kill: () => proc.kill("SIGTERM") });
      return c.json({ ok: true, pendingId, message: "Chrome acildi. Siteye giris yapin, sonra 'Kaydet' deyin." });
    } catch (e) {
      return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
  app.post("/api/accounts/login/finish", async (c) => {
    const { pendingId } = await c.req.json();
    const pending = pendingLogins.get(pendingId);
    if (!pending) return c.json({ ok: false, error: "bekleyen giris yok (suresi dolmus olabilir)" }, 404);
    pending.kill();
    pendingLogins.delete(pendingId);
    const pool = new AccountPool();
    const acc = pool.add({ providerId: pending.providerId, label: pending.label ?? pending.profileDir, profileDirectory: pending.profileDir });
    return c.json({ ok: true, account: { id: acc.id, provider: acc.providerId, label: acc.label } });
  });

  // --- oturumlar (gorev gunlukleri) ---
  app.get("/api/sessions", (c) => {
    const out: any[] = [];
    if (fs.existsSync(paths.logs)) {
      for (const f of fs.readdirSync(paths.logs).filter((f) => f.endsWith(".jsonl"))) {
        const lines = fs.readFileSync(path.join(paths.logs, f), "utf8").trim().split("\n");
        const events = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        const goal = events.find((e: any) => e.type === "goal");
        out.push({
          id: f.replace(".jsonl", ""),
          title: goal?.summary ?? "(hedefsiz oturum)",
          steps: events.length,
          errors: events.filter((e: any) => e.type === "error").length,
          lastTs: events.at(-1)?.ts,
        });
      }
    }
    out.sort((a, b) => String(b.lastTs).localeCompare(String(a.lastTs)));
    return c.json(out);
  });
  app.get("/api/sessions/:id", (c) => {
    const f = path.join(paths.logs, `${c.req.param("id")}.jsonl`);
    if (!fs.existsSync(f)) return c.json({ ok: false, error: "oturum yok" }, 404);
    return c.json(fs.readFileSync(f, "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
  });

  // --- model listesi (seciciler icin; sadece gercekten tanimli saglayicilar) ---
  app.get("/api/models", (c) => {
    const cfgs = loadProviderConfigs();
    return c.json({
      llm: [{ id: process.env.HMX_LLM_MODEL ?? "qwen2.5:14b", provider: process.env.HMX_LLM_BASE_URL ?? "ollama" }],
      image: cfgs.filter((x) => x.kind === "image").map((x) => ({ id: x.id, authMode: x.authMode, tier: x.tier ?? null })),
      video: cfgs.filter((x) => x.kind === "video").map((x) => ({ id: x.id, authMode: x.authMode, tier: x.tier ?? null })),
      audio: cfgs.filter((x) => x.kind === "audio").map((x) => ({ id: x.id, authMode: x.authMode, tier: x.tier ?? null })),
    });
  });
  // LLM baglanti testi (Models sayfasi)
  app.post("/api/models/test", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const llm = new (await import("@hmx/core")).LlmClient({
      baseUrl: body.baseUrl ?? process.env.HMX_LLM_BASE_URL ?? "http://localhost:11434/v1",
      model: body.model ?? process.env.HMX_LLM_MODEL ?? "qwen2.5:14b",
      apiKey: body.apiKey ?? process.env.HMX_LLM_API_KEY,
    });
    try {
      const reply = await llm.chat([{ role: "user", content: "ping (tek kelimeyle cevap ver: pong)" }]);
      return c.json({ ok: true, reply: reply.slice(0, 100) });
    } catch (e) {
      return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502);
    }
  });

  // --- prompt yonlendirme onizleme (@image:... parse) ---
  app.post("/api/route-preview", async (c) => {
    const { prompt, uiSelection } = await c.req.json();
    const parsed = parsePromptRoute(prompt ?? "", uiSelection ?? {}, loadProviderConfigs());
    return c.json(parsed);
  });

  // --- yonlendirme politikasi + kota takibi (Bolum 6.3) ---
  app.get("/api/routing", (c) => {
    const snap = quotaSnapshot(router);
    return c.json({
      order: {
        video: router.orderFor("video"),
        image: router.orderFor("image"),
        audio: router.orderFor("audio"),
        llm: router.orderFor("llm"),
      },
      policy: "preferred > tier (subscription -> cheap -> free) + circuit breaker (2 hata = 5 dk devre disi)",
      accounts: snap.accounts,
      circuits: snap.circuits,
      tokenSaver: snap.tokenSaver,
    });
  });

  // --- saglik durumu ---
  app.get("/api/health", (c) => {
    const snap = quotaSnapshot(router);
    return c.json({
      ok: true,
      version: "2.0.0",
      llm: { baseUrl: process.env.HMX_LLM_BASE_URL ?? "http://localhost:11434/v1", model: process.env.HMX_LLM_MODEL ?? "qwen2.5:14b" },
      ffmpeg: (() => { try { execSync("ffmpeg -version", { stdio: "ignore" }); return true; } catch { return false; } })(),
      home: paths.home,
      firstRun: !fs.existsSync(SETTINGS_FILE),
      quota: { accounts: snap.accounts.length, cooldown: snap.accounts.filter((a) => a.status === "cooldown").length, error: snap.accounts.filter((a) => a.status === "error").length },
      tokenSaver: snap.tokenSaver,
    });
  });

  // --- medya uretim ---
  app.post("/api/generate", async (c) => {
    const body = await c.req.json();
    const { kind, prompt, voiceId, aspectRatio, preferred } = body;
    if (!kind || !prompt) return c.json({ ok: false, error: "kind ve prompt zorunlu" }, 400);
    const ext = kind === "audio" ? "mp3" : kind === "video" ? "mp4" : "png";
    const out = path.join(paths.media, `${kind}-${Date.now()}.${ext}`);
    const result = await router.generate(kind, { prompt, outputPath: out, voiceId, aspectRatio }, preferred);
    if (!result.ok) return c.json(result, 502);
    const asset = catalog.register({ type: kind, provider: result.provider!, prompt, filePath: result.filePath!, tags: body.tags ?? [] });
    return c.json({ ok: true, asset });
  });

  // --- katalog ---
  app.get("/api/assets", (c) => c.json(catalog.query({ type: c.req.query("type") as any })));

  // --- birlestirme ---
  app.post("/api/compose", async (c) => {
    const body = await c.req.json();
    try {
      const out = body.out ?? path.join(paths.media, `composed-${Date.now()}.mp4`);
      const r = await composeProject({ clips: body.clips, voiceover: body.voiceover, music: body.music, out });
      return c.json({ ok: true, ...r });
    } catch (e) {
      return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });

  // --- agent chat (plan-onay dongusu, coklu oturum) ---
  app.post("/api/chat", async (c) => {
    const { message } = await c.req.json();
    try {
      const agent = new HmxAgent();
      const { goal, plan } = await agent.startTask(message);
      agents.set(agent.sessionId, agent);
      return c.json({ ok: true, goal, plan, sessionId: agent.sessionId });
    } catch (e) {
      return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
  app.post("/api/chat/step", async (c) => {
    const { sessionId, instruction } = await c.req.json();
    const agent = agents.get(sessionId);
    if (!agent) return c.json({ ok: false, error: "oturum bulunamadi (sunucu yeniden baslatilmis olabilir)" }, 404);
    try {
      const reply = await agent.step(instruction ?? "Plani uygula. Her adimdan sonra dogrulama yap ve <verification> raporu ile bitir.");
      return c.json({ ok: true, reply });
    } catch (e) {
      return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });

  /**
   * Akilli chat (root-cause fix): her mesaji gorev saymaz.
   *  - @-mention -> medya uretim rotasi (approvalMode'a gore onay)
   *  - safe mesaj (sohbet/soru) -> direkt cevap, ONAY YOK
   *  - moderate/destructive -> approvalMode politikasi (strict/balanced/fast)
   */
  app.post("/api/chat/smart", async (c) => {
    const body = await c.req.json();
    const { message, sessionId: clientSid, model, agentId, confirmed, dryRun } = body;
    if (!message) return c.json({ ok: false, error: "message zorunlu" }, 400);

    const settings = loadSettings();
    const mode: ApprovalMode = settings.approvalMode ?? "balanced";

    // @-mention: medya uretim rotasi
    const route = parsePromptRoute(message, {}, loadProviderConfigs());
    const hasMediaDirective = Object.keys(route.directives).length > 0;
    if (hasMediaDirective) {
      if (route.unknown.length > 0) {
        return c.json({ ok: false, error: `Bilinmeyen model: ${route.unknown.map((u) => u.name).join(", ")}` }, 400);
      }
      const needsApproval = shouldRequireApproval("moderate", mode);
      if (dryRun || (needsApproval && !confirmed)) {
        return c.json({ ok: true, mode: needsApproval ? "needs-approval" : "media", risk: "moderate", directives: route.directives, cleanPrompt: route.cleanPrompt });
      }
      const results: any[] = [];
      for (const [kind, ids] of Object.entries(route.directives)) {
        for (const pid of ids as string[]) {
          const ext = kind === "audio" ? "mp3" : kind === "video" ? "mp4" : "png";
          const out = path.join(paths.media, `${kind}-${Date.now()}.${ext}`);
          const r = await router.generate(kind as any, { prompt: route.cleanPrompt, outputPath: out }, pid);
          if (r.ok) catalog.register({ type: kind as any, provider: r.provider!, prompt: route.cleanPrompt, filePath: r.filePath!, tags: [] });
          results.push({ kind, provider: pid, ...r });
        }
      }
      return c.json({ ok: true, mode: "media", results });
    }

    // Risk siniflandirma -> policy
    const risk = classifyMessageRisk(message);
    if (dryRun) {
      return c.json({ ok: true, mode: shouldRequireApproval(risk, mode) ? "needs-approval" : "chat", risk, approvalMode: mode });
    }
    if (shouldRequireApproval(risk, mode) && !confirmed) {
      return c.json({ ok: true, mode: "needs-approval", risk, approvalMode: mode });
    }

    // Direkt sohbet (safe) veya onayli gorev
    const sid = clientSid || `chat_${Date.now()}`;

    // Secili bir driver varsa (native disi) o kullanilir
    if (agentId) {
      const stream = driverChat(sid, agentId, message, model);
      if (stream) {
        try {
          let reply = "";
          for await (const token of stream) reply += token;
          driverChatDone(sid, reply);
          return c.json({ ok: true, mode: "chat", reply, sessionId: sid, model: model ?? null, agent: agentId });
        } catch (e) {
          return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502);
        }
      }
    }

    // Varsayilan: oturum agent'i (HmxAgent) ile konus
    let agent = agents.get(sid);
    if (!agent) {
      agent = new HmxAgent();
      agents.set(sid, agent);
    }
    if (model) agent.setModel(model);
    try {
      const reply = await agent.chat(message);
      return c.json({ ok: true, mode: "chat", reply, sessionId: sid, model: agent.currentModel });
    } catch (e) {
      return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502);
    }
  });

  /** Streaming sohbet (SSE): token token akar; basit mesajlarda onay yok */
  app.post("/api/chat/stream", async (c) => {
    const { message, sessionId: clientSid, model, agentId } = await c.req.json();
    if (!message) return c.json({ ok: false, error: "message zorunlu" }, 400);
    const sid = clientSid || `chat_${Date.now()}`;

    const { streamSSE } = await import("hono/streaming");

    // Secili driver (native disi) varsa driver uzerinden ak
    if (agentId) {
      const driverStream = driverChat(sid, agentId, message, model);
      if (driverStream) {
        return streamSSE(c, async (stream) => {
          try {
            let reply = "";
            for await (const token of driverStream) {
              reply += token;
              await stream.writeSSE({ data: JSON.stringify({ token }) });
            }
            driverChatDone(sid, reply);
            await stream.writeSSE({ data: JSON.stringify({ done: true, sessionId: sid, agent: agentId }) });
          } catch (e) {
            await stream.writeSSE({ data: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) });
          }
        });
      }
    }

    let agent = agents.get(sid);
    if (!agent) {
      agent = new HmxAgent();
      agents.set(sid, agent);
    }
    if (model) agent.setModel(model);

    return streamSSE(c, async (stream) => {
      try {
        await agent.chat(message, (token) => {
          void stream.writeSSE({ data: JSON.stringify({ token }) });
        });
        await stream.writeSSE({ data: JSON.stringify({ done: true, sessionId: sid, model: agent!.currentModel }) });
      } catch (e) {
        await stream.writeSSE({ data: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) });
      }
    });
  });

  // --- agent registry (AgentSelector): gercek driver'lar, prompt shimi yok ---
  let agentRegistry = new AgentRegistry({
    nativeDriver: new HmxNativeDriver(),
    chatOnly: createChatOnlyBackend(),
  });
  // driver tabanli oturumlar icin mesaj gecmisi (driver'lar stateless'tir)
  const driverHistories = new Map<string, ChatMessage[]>();

  function driverChat(sid: string, driverId: string, message: string, model?: string): AsyncIterable<string> | null {
    const driver = agentRegistry.get(driverId);
    if (!driver || driver.id === "hmx-native") return null;
    const hist = driverHistories.get(sid) ?? [];
    hist.push({ role: "user", content: message });
    driverHistories.set(sid, hist);
    return driver.chat([...hist], model ? { model } : undefined);
  }

  function driverChatDone(sid: string, reply: string) {
    driverHistories.get(sid)?.push({ role: "assistant", content: reply });
  }

  app.get("/api/agents", async (c) => {
    await agentRegistry.ready;
    const list = await Promise.all(agentRegistry.list().map(async (d) => ({
      id: d.id, name: d.name, kind: d.kind, description: d.description,
      capabilities: d.capabilities,
      builtin: agentRegistry.isBuiltin(d.id),
      available: await d.isAvailable().catch(() => false),
    })));
    return c.json(list);
  });
  app.post("/api/agents", async (c) => {
    const body = await c.req.json();
    if (!body.id || !body.name) return c.json({ ok: false, error: "id ve name zorunlu" }, 400);
    // Custom profil dosyaya yazilir; registry yeniden kurulur
    const file = path.join(paths.home, "agents.json");
    const current = readJson<any[]>(file) ?? [];
    writeJson(file, [...current.filter((a: any) => a.id !== body.id), {
      id: body.id, name: body.name, description: body.description ?? "", promptAddon: body.promptAddon ?? "",
    }]);
    agentRegistry = new AgentRegistry({ nativeDriver: new HmxNativeDriver(), chatOnly: createChatOnlyBackend() });
    await agentRegistry.ready;
    return c.json({ ok: true });
  });
  app.delete("/api/agents/:id", (c) => c.json({ ok: agentRegistry.removeCustom(c.req.param("id")) }));

  // --- LLM model listesi (endpoint'ten canli) ---
  app.get("/api/llm/models", async (c) => {
    try {
      const { LlmClient } = await import("@hmx/core");
      const models = await LlmClient.fromEnv().listModels();
      return c.json({ ok: true, models });
    } catch (e) {
      return c.json({ ok: false, error: e instanceof Error ? e.message : String(e), models: [] });
    }
  });

  // --- gunlukler (canli kuyruk) ---
  app.get("/api/logs", (c) => {
    if (!fs.existsSync(paths.logs)) return c.json([]);
    return c.json(fs.readdirSync(paths.logs).filter((f) => f.endsWith(".jsonl") || f.endsWith(".log")).sort().reverse());
  });
  app.get("/api/logs/:name", (c) => {
    const name = c.req.param("name");
    if (name.includes("..") || name.includes("/") || name.includes("\\")) return c.json({ ok: false, error: "gecersiz ad" }, 400);
    const f = path.join(paths.logs, name);
    if (!fs.existsSync(f)) return c.json({ ok: false, error: "dosya yok" }, 404);
    const tail = Math.min(Number(c.req.query("tail")) || 200, 2000);
    const lines = fs.readFileSync(f, "utf8").trim().split("\n");
    return c.json({ lines: lines.slice(-tail), total: lines.length });
  });

  // --- ayarlar ---
  app.get("/api/settings", (c) => c.json(loadSettings()));
  app.post("/api/settings", async (c) => {
    const body = await c.req.json();
    const merged = { ...loadSettings(), ...body, orders: { ...loadSettings().orders, ...(body.orders ?? {}) } };
    writeJson(SETTINGS_FILE, merged);
    // LLM ayarlari + fallback zincirleri ortama da yansitilir (bu surec icin)
    if (merged.llm?.baseUrl) process.env.HMX_LLM_BASE_URL = merged.llm.baseUrl;
    if (merged.llm?.model) process.env.HMX_LLM_MODEL = merged.llm.model;
    for (const kind of ["image", "video", "audio", "llm"] as const) {
      const v = merged.orders[kind];
      if (v) process.env[`HMX_ORDER_${kind.toUpperCase()}`] = v;
    }
    return c.json({ ok: true, settings: merged });
  });

  const server = serve({ fetch: app.fetch, port: finalPort });
  console.log(`\nHMX Dashboard calisiyor: http://localhost:${finalPort}`);
  console.log(`Veriler: ${paths.home}`);
  if (WEB_DIST) console.log(`UI: ${WEB_DIST}`);
  return server;
}
