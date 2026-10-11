import { Hono } from "hono";
import { serve } from "@hono/node-server";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { MediaRouter, parsePromptRoute } from "@hmx/router";
import { AssetCatalog, composeProject } from "@hmx/media";
import {
  loadProviderConfigs,
  saveProviderConfig,
  deleteProviderConfig,
  AccountPool,
  listChromeProfiles,
  launchRealChrome,
  ModelRegistry,
} from "@hmx/providers";
import {
  HmxAgent,
  AgentRegistry,
  HmxNativeDriver,
  createChatOnlyBackend,
  classifyMessageRisk,
  shouldRequireApproval,
  type ApprovalMode,
  OpenCodeAgent,
  HermesLoopAgent,
} from "@hmx/agent-core";
import type { ChatMessage } from "@hmx/core";
import {
  paths,
  ensureDirs,
  readJson,
  writeJson,
  HMX_HOME,
  JobQueue,
  getLogger,
} from "@hmx/core";
import { quotaSnapshot } from "./quota-tracker.js";
import { DASHBOARD_HTML } from "./html.js";
import { jobRoutes } from "./routes/jobs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// React renderer (apps/web) build'i varsa onu sun, yoksa eski tek-dosya HTML
const WEB_DIST_CANDIDATES = [
  process.env.HMX_WEB_DIST, // Electron paketinde resources/web-dist
  path.resolve(process.cwd(), "apps/web/dist"),
  path.resolve(__dirname, "../../../apps/web/dist"),
].filter(Boolean) as string[];
const WEB_DIST =
  WEB_DIST_CANDIDATES.find((d) => fs.existsSync(path.join(d, "index.html"))) ??
  null;

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

type Settings = {
  quotaCooldownMs: number;
  orders: { image?: string; video?: string; audio?: string; llm?: string };
  llm?: { baseUrl?: string; model?: string; apiKey?: string };
  approvalMode?: ApprovalMode;
  theme: "dark";
};
const SETTINGS_FILE = path.join(HMX_HOME, "settings.json");
const DEFAULT_SETTINGS: Settings = {
  quotaCooldownMs: 6 * 60 * 60 * 1000,
  orders: {},
  approvalMode: "balanced",
  theme: "dark",
};

function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(readJson<Settings>(SETTINGS_FILE) ?? {}) };
}

export function startDashboard(port?: number) {
  // Guvenli port: arguman -> .env -> varsayilan. NaN/asiri degerde 4173'e duser.
  const envPort = Number(process.env.HMX_DASHBOARD_PORT ?? process.env.PORT);
  const finalPort =
    Number.isInteger(port) && port! > 0 && port! < 65536
      ? port!
      : Number.isInteger(envPort) && envPort > 0 && envPort < 65536
        ? envPort
        : 4173;
  ensureDirs();
  const app = new Hono();
  // Yerel dashboard: harici bir web sayfası araç/onay API'sini tetikleyemez.
  app.use("/api/*", async (c, next) => {
    const origin = c.req.header("origin");
    if (origin && !["GET", "HEAD"].includes(c.req.method)) {
      try {
        if (
          !["localhost", "127.0.0.1", "[::1]"].includes(
            new URL(origin).hostname,
          )
        )
          return c.json({ error: "Harici origin reddedildi." }, 403);
      } catch {
        return c.json({ error: "Geçersiz origin." }, 403);
      }
    }
    return await next();
  });
  const router = new MediaRouter();
  const catalog = new AssetCatalog();
  const logger = getLogger("app");
  const modelsRegistry = new ModelRegistry();
  const applySettings = (settings: Settings) => {
    if (settings.llm?.baseUrl)
      process.env.HMX_LLM_BASE_URL = settings.llm.baseUrl;
    if (settings.llm?.model) process.env.HMX_LLM_MODEL = settings.llm.model;
    if (settings.llm?.apiKey !== undefined)
      process.env.HMX_LLM_API_KEY = settings.llm.apiKey;
    process.env.HMX_QUOTA_COOLDOWN_MS = String(settings.quotaCooldownMs);
    for (const kind of ["image", "video", "audio", "llm"] as const) {
      if (settings.orders[kind])
        process.env[`HMX_ORDER_${kind.toUpperCase()}`] = settings.orders[kind];
      else delete process.env[`HMX_ORDER_${kind.toUpperCase()}`];
    }
    modelsRegistry.invalidate();
  };
  if (fs.existsSync(SETTINGS_FILE)) applySettings(loadSettings());
  const queue = new JobQueue({
    handler: async (job, signal) => {
      signal.throwIfAborted();
      if (job.kind === "compose") {
        const input = JSON.parse(job.prompt) as {
          clips?: string[];
          voiceover?: string;
        };
        if (
          !Array.isArray(input.clips) ||
          !input.clips.length ||
          input.clips.some((x) => typeof x !== "string")
        )
          throw new Error("Compose işi geçerli clips dizisi gerektirir.");
        const out = path.join(paths.media, `composed-${job.id}.mp4`);
        await composeProject({
          clips: input.clips,
          voiceover: input.voiceover,
          out,
          signal,
        });
        signal.throwIfAborted();
        catalog.register({
          type: "video",
          provider: "ffmpeg",
          prompt: job.prompt,
          filePath: out,
          tags: ["compose", job.id],
        });
        return out;
      }
      const extension =
        job.kind === "audio" ? "mp3" : job.kind === "video" ? "mp4" : "png";
      const result = await router.generate(
        job.kind,
        {
          prompt: job.prompt,
          outputPath: path.join(
            paths.media,
            `${job.kind}-${job.id}.${extension}`,
          ),
          signal,
        },
        job.provider,
      );
      signal.throwIfAborted();
      if (!result.ok || !result.filePath)
        throw new Error(result.error ?? "Üretim başarısız.");
      catalog.register({
        type: job.kind,
        provider: result.provider ?? job.provider ?? "bilinmiyor",
        prompt: job.prompt,
        filePath: result.filePath,
        tags: [job.id],
      });
      return result.filePath;
    },
  });
  app.route("/api/jobs", jobRoutes(queue));
  app.onError((error, c) => {
    logger.error("API hatası", { error, path: c.req.path });
    return c.json({ ok: false, error: error.message }, 500);
  });
  const agents = new Map<string, HmxAgent>();
  const pendingLogins = new Map<
    string,
    { providerId: string; label?: string; profileDir: string; kill: () => void }
  >();

  // --- statik: React renderer veya fallback HTML ---
  app.get("/", (c) => {
    if (WEB_DIST)
      return c.html(fs.readFileSync(path.join(WEB_DIST, "index.html"), "utf8"));
    return c.html(DASHBOARD_HTML);
  });
  app.get("/branding/:name", (c) => {
    if (!WEB_DIST || !/^[a-zA-Z0-9._-]+$/.test(c.req.param("name")))
      return c.notFound();
    const file = path.join(WEB_DIST, "branding", c.req.param("name"));
    return fs.existsSync(file)
      ? c.body(fs.readFileSync(file) as any, 200, {
          "content-type":
            MIME[path.extname(file)] ?? "application/octet-stream",
        })
      : c.notFound();
  });
  app.get("/assets/*", (c) => {
    if (!WEB_DIST) return c.notFound();
    const rel = c.req.path.replace(/^\/+/, "");
    const file = path.join(WEB_DIST, rel);
    if (!file.startsWith(WEB_DIST) || !fs.existsSync(file)) return c.notFound();
    return c.body(fs.readFileSync(file) as any, 200, {
      "content-type": MIME[path.extname(file)] ?? "application/octet-stream",
    });
  });

  // --- saglayici paneli API ---
  app.get("/api/providers", (c) => c.json(router.list()));
  app.post("/api/providers", async (c) => {
    const cfg = await c.req.json();
    if (!cfg.id || !cfg.baseUrl || !cfg.kind || !cfg.authMode)
      return c.json(
        { ok: false, error: "id, baseUrl, kind, authMode zorunlu" },
        400,
      );
    saveProviderConfig(cfg);
    router.reload();
    modelsRegistry.invalidate();
    return c.json({ ok: true });
  });
  app.delete("/api/providers/:id", (c) => {
    deleteProviderConfig(c.req.param("id"));
    router.reload();
    modelsRegistry.invalidate();
    return c.json({ ok: true });
  });
  app.post("/api/providers/:id/test", async (c) => {
    const p = (router as any).providers.find(
      (x: any) => x.id === c.req.param("id"),
    );
    if (!p) return c.json({ ok: false, error: "saglayici yok" }, 404);
    const ok = await p.isAvailable();
    return c.json({ ok, status: ok ? "Connected" : "Error" });
  });

  // --- hesap havuzu (Bolum 2 + 6.3) ---
  app.get("/api/accounts", (c) => {
    const pool = new AccountPool();
    return c.json(
      pool.listAll().map((a) => ({
        id: a.id,
        provider: a.providerId,
        label: a.label,
        profile: a.profileDirectory ?? null,
        hasApiKey: !!a.apiKey,
        status: a.status,
        failCount: a.failCount,
        cooldownUntil: a.cooldownUntil ?? null,
        cooldownRemainingMs: a.cooldownUntil
          ? Math.max(0, a.cooldownUntil - Date.now())
          : 0,
        lastUsedAt: a.lastUsedAt ?? null,
        notes: a.notes ?? null,
      })),
    );
  });
  // API anahtarli hesap ekle
  app.post("/api/accounts", async (c) => {
    const body = await c.req.json();
    if (!body.providerId || (!body.apiKey && !body.profileDirectory)) {
      return c.json(
        {
          ok: false,
          error: "providerId + (apiKey veya profileDirectory) zorunlu",
        },
        400,
      );
    }
    const pool = new AccountPool();
    const acc = pool.add({
      providerId: body.providerId,
      label: body.label ?? "Hesap",
      apiKey: body.apiKey,
      profileDirectory: body.profileDirectory,
    });
    modelsRegistry.invalidate();
    return c.json({
      ok: true,
      account: { id: acc.id, provider: acc.providerId, label: acc.label },
    });
  });
  app.delete("/api/accounts/:providerId/:accountId", (c) => {
    const pool = new AccountPool();
    const ok = pool.remove(c.req.param("providerId"), c.req.param("accountId"));
    modelsRegistry.invalidate();
    return c.json({ ok });
  });
  // Chrome profil listesi (hesap ekleme modali icin)
  app.get("/api/chrome-profiles", (c) => {
    try {
      return c.json(listChromeProfiles());
    } catch (e) {
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
    }
  });
  // Panelden interaktif giris: 1) Chrome'u basli basina ac 2) kullanici girer 3) finish ile kaydet
  app.post("/api/accounts/login/start", async (c) => {
    const body = await c.req.json();
    const cfg = loadProviderConfigs().find((x) => x.id === body.providerId);
    if (!cfg) return c.json({ ok: false, error: "saglayici yok" }, 404);
    if (!body.profileDir)
      return c.json({ ok: false, error: "profileDir zorunlu" }, 400);
    try {
      const { ensureProfileCopy } = await import("@hmx/providers");
      ensureProfileCopy(body.profileDir);
      const { proc } = await launchRealChrome({
        url: cfg.baseUrl,
        profileDir: body.profileDir,
      });
      const pendingId = `login_${Date.now()}`;
      pendingLogins.set(pendingId, {
        providerId: body.providerId,
        label: body.label,
        profileDir: body.profileDir,
        kill: () => proc.kill("SIGTERM"),
      });
      return c.json({
        ok: true,
        pendingId,
        message: "Chrome acildi. Siteye giris yapin, sonra 'Kaydet' deyin.",
      });
    } catch (e) {
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
    }
  });
  app.post("/api/accounts/login/finish", async (c) => {
    const { pendingId } = await c.req.json();
    const pending = pendingLogins.get(pendingId);
    if (!pending)
      return c.json(
        { ok: false, error: "bekleyen giris yok (suresi dolmus olabilir)" },
        404,
      );
    pending.kill();
    pendingLogins.delete(pendingId);
    const pool = new AccountPool();
    const acc = pool.add({
      providerId: pending.providerId,
      label: pending.label ?? pending.profileDir,
      profileDirectory: pending.profileDir,
    });
    modelsRegistry.invalidate();
    return c.json({
      ok: true,
      account: { id: acc.id, provider: acc.providerId, label: acc.label },
    });
  });

  // --- oturumlar (gorev gunlukleri) ---
  app.get("/api/sessions", (c) => {
    const out: any[] = [];
    if (fs.existsSync(paths.logs)) {
      for (const f of fs
        .readdirSync(paths.logs)
        .filter((f) => f.endsWith(".jsonl"))) {
        const lines = fs
          .readFileSync(path.join(paths.logs, f), "utf8")
          .trim()
          .split("\n");
        const events = lines
          .map((l) => {
            try {
              return JSON.parse(l);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
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
    if (!fs.existsSync(f))
      return c.json({ ok: false, error: "oturum yok" }, 404);
    return c.json(
      fs
        .readFileSync(f, "utf8")
        .trim()
        .split("\n")
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    );
  });

  // --- model listesi (seciciler icin; sadece gercekten tanimli saglayicilar) ---
  app.get("/api/models", async (c) => {
    const registered = await modelsRegistry.list();
    const configs = loadProviderConfigs();
    const grouped = Object.fromEntries(
      ["llm", "image", "video", "audio"].map((kind) => [
        kind,
        registered
          .filter((r) => r.kind === kind)
          .map((row) => {
            const id = row.id.replace(/^(llm|media):/, "");
            const cfg = configs.find((p) => p.id === id);
            return {
              ...row,
              registryId: row.id,
              id,
              ...(row.kind === "llm"
                ? {
                    provider:
                      process.env.HMX_LLM_BASE_URL ??
                      "http://localhost:11434/v1",
                  }
                : { authMode: cfg?.authMode, tier: cfg?.tier ?? null }),
            };
          }),
      ]),
    );
    return c.json({ ...grouped, registered });
  });
  // LLM baglanti testi (Models sayfasi)
  app.post("/api/models/test", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const llm = new (await import("@hmx/core")).LlmClient({
      baseUrl:
        body.baseUrl ??
        process.env.HMX_LLM_BASE_URL ??
        "http://localhost:11434/v1",
      model: body.model ?? process.env.HMX_LLM_MODEL ?? "qwen2.5:14b",
      apiKey: body.apiKey ?? process.env.HMX_LLM_API_KEY,
    });
    try {
      const reply = await llm.chat([
        { role: "user", content: "ping (tek kelimeyle cevap ver: pong)" },
      ]);
      return c.json({ ok: true, reply: reply.slice(0, 100) });
    } catch (e) {
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        502,
      );
    }
  });

  // --- prompt yonlendirme onizleme (@image:... parse) ---
  app.post("/api/route-preview", async (c) => {
    const { prompt, uiSelection } = await c.req.json();
    const parsed = parsePromptRoute(
      prompt ?? "",
      uiSelection ?? {},
      loadProviderConfigs(),
    );
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
      policy:
        "preferred > tier (subscription -> cheap -> free) + circuit breaker (2 hata = 5 dk devre disi)",
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
      llm: {
        baseUrl: process.env.HMX_LLM_BASE_URL ?? "http://localhost:11434/v1",
        model: process.env.HMX_LLM_MODEL ?? "qwen2.5:14b",
      },
      ffmpeg: (() => {
        try {
          execSync("ffmpeg -version", { stdio: "ignore" });
          return true;
        } catch {
          return false;
        }
      })(),
      home: paths.home,
      firstRun: !fs.existsSync(SETTINGS_FILE),
      quota: {
        accounts: snap.accounts.length,
        cooldown: snap.accounts.filter((a) => a.status === "cooldown").length,
        error: snap.accounts.filter((a) => a.status === "error").length,
      },
      tokenSaver: snap.tokenSaver,
    });
  });

  // --- medya uretim ---
  app.post("/api/generate", async (c) => {
    const body = await c.req.json();
    const { kind, prompt, voiceId, aspectRatio, preferred } = body;
    if (!kind || !prompt)
      return c.json({ ok: false, error: "kind ve prompt zorunlu" }, 400);
    const ext = kind === "audio" ? "mp3" : kind === "video" ? "mp4" : "png";
    const out = path.join(paths.media, `${kind}-${Date.now()}.${ext}`);
    const result = await router.generate(
      kind,
      { prompt, outputPath: out, voiceId, aspectRatio },
      preferred,
    );
    if (!result.ok) return c.json(result, 502);
    const asset = catalog.register({
      type: kind,
      provider: result.provider!,
      prompt,
      filePath: result.filePath!,
      tags: body.tags ?? [],
    });
    return c.json({ ok: true, asset });
  });

  // --- katalog ---
  app.get("/api/assets", (c) =>
    c.json(catalog.query({ type: c.req.query("type") as any })),
  );
  app.get("/api/assets/:id/file", (c) => {
    const asset = catalog.query().find((item) => item.id === c.req.param("id"));
    if (!asset || !fs.existsSync(asset.filePath))
      return c.json({ error: "Varlık dosyası yok." }, 404);
    const ext = path.extname(asset.filePath).toLowerCase();
    const types: Record<string, string> = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };
    return new Response(
      Readable.toWeb(fs.createReadStream(asset.filePath)) as ReadableStream,
      {
        headers: {
          "content-type": types[ext] ?? "application/octet-stream",
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'none'; media-src 'self'; img-src 'self'; style-src 'unsafe-inline'",
          "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(path.basename(asset.filePath))}`,
        },
      },
    );
  });

  // --- birlestirme ---
  app.post("/api/compose", async (c) => {
    const body = await c.req.json();
    try {
      const out =
        body.out ?? path.join(paths.media, `composed-${Date.now()}.mp4`);
      const r = await composeProject({
        clips: body.clips,
        voiceover: body.voiceover,
        music: body.music,
        out,
      });
      return c.json({ ok: true, ...r });
    } catch (e) {
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
    }
  });

  const approvals = new Map<
    string,
    { sessionId: string; message: string; expires: number }
  >();
  const runtimeApprovals = new Map<
    string,
    {
      resolve: (approved: boolean) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  app.post("/api/approvals/:id", async (c) => {
    const pending = runtimeApprovals.get(c.req.param("id"));
    if (!pending)
      return c.json({ error: "Onay bulunamadı veya süresi doldu." }, 404);
    const body = await c.req.json();
    clearTimeout(pending.timer);
    runtimeApprovals.delete(c.req.param("id"));
    pending.resolve(body.approved === true);
    return c.json({ ok: true });
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
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
    }
  });
  app.post("/api/chat/step", async (c) => {
    const { sessionId, instruction } = await c.req.json();
    const agent = agents.get(sessionId);
    if (!agent)
      return c.json(
        {
          ok: false,
          error: "oturum bulunamadi (sunucu yeniden baslatilmis olabilir)",
        },
        404,
      );
    try {
      const reply = await agent.step(
        instruction ??
          "Plani uygula. Her adimdan sonra dogrulama yap ve <verification> raporu ile bitir.",
      );
      return c.json({ ok: true, reply });
    } catch (e) {
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
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
    const {
      message,
      sessionId: clientSid,
      model,
      agentId,
      confirmed,
      dryRun,
    } = body;
    if (!message) return c.json({ ok: false, error: "message zorunlu" }, 400);

    const settings = loadSettings();
    const mode: ApprovalMode = settings.approvalMode ?? "balanced";

    // @-mention: medya uretim rotasi
    const route = parsePromptRoute(message, {}, loadProviderConfigs());
    const hasMediaDirective = Object.keys(route.directives).length > 0;
    if (hasMediaDirective) {
      if (route.unknown.length > 0) {
        return c.json(
          {
            ok: false,
            error: `Bilinmeyen model: ${route.unknown.map((u) => u.name).join(", ")}`,
          },
          400,
        );
      }
      const needsApproval = shouldRequireApproval("moderate", mode);
      if (dryRun || (needsApproval && !confirmed)) {
        return c.json({
          ok: true,
          mode: needsApproval ? "needs-approval" : "media",
          risk: "moderate",
          directives: route.directives,
          cleanPrompt: route.cleanPrompt,
        });
      }
      const results: any[] = [];
      for (const [kind, ids] of Object.entries(route.directives)) {
        for (const pid of ids as string[]) {
          if (body.queue === true) {
            const job = queue.enqueue({
              kind: kind as "image" | "video" | "audio",
              prompt: route.cleanPrompt,
              provider: pid,
            });
            results.push({
              ok: true,
              kind,
              provider: pid,
              jobId: job.id,
              status: job.status,
            });
            continue;
          }
          const ext =
            kind === "audio" ? "mp3" : kind === "video" ? "mp4" : "png";
          const out = path.join(paths.media, `${kind}-${Date.now()}.${ext}`);
          const r = await router.generate(
            kind as any,
            { prompt: route.cleanPrompt, outputPath: out },
            pid,
          );
          if (r.ok)
            catalog.register({
              type: kind as any,
              provider: r.provider!,
              prompt: route.cleanPrompt,
              filePath: r.filePath!,
              tags: [],
            });
          results.push({ kind, provider: pid, ...r });
        }
      }
      return c.json({ ok: true, mode: "media", results });
    }

    // Risk siniflandirma -> policy
    const risk = classifyMessageRisk(message);
    if (dryRun) {
      for (const [id, ticket] of approvals)
        if (ticket.expires < Date.now()) approvals.delete(id);
      const needs = shouldRequireApproval(risk, mode);
      const approvalId = needs ? crypto.randomUUID() : undefined;
      if (approvalId)
        approvals.set(approvalId, {
          sessionId: clientSid ?? "",
          message,
          expires: Date.now() + 300000,
        });
      return c.json({
        ok: true,
        mode: needs ? "needs-approval" : "chat",
        risk,
        approvalMode: mode,
        approvalId,
      });
    }
    if (shouldRequireApproval(risk, mode) && !confirmed) {
      return c.json({
        ok: true,
        mode: "needs-approval",
        risk,
        approvalMode: mode,
      });
    }

    // Direkt sohbet (safe) veya onayli gorev
    const sid = clientSid || `chat_${Date.now()}`;

    await agentRegistry.ready;
    const selectedAgent = agentId || "hmx-native";
    if (!agentRegistry.get(selectedAgent))
      return c.json({ error: "Ajan bulunamadı." }, 400);
    // Her seçim gerçek driver ile yürür.
    if (selectedAgent) {
      const stream = driverChat(sid, selectedAgent, message, model);
      if (stream) {
        try {
          let reply = "";
          for await (const token of stream) reply += token;
          driverChatDone(sid, reply);
          return c.json({
            ok: true,
            mode: "chat",
            reply,
            sessionId: sid,
            model: model ?? null,
            agent: agentId,
          });
        } catch (e) {
          return c.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            502,
          );
        }
      }
    }

    // Varsayilan: oturum agent'i (HmxAgent) ile konus
    let agent = agents.get(sid);
    if (!agent) {
      agent = new HmxAgent();
      agents.set(sid, agent);
    }
    if (model) agent.setModel(String(model).replace(/^llm:/, ""));
    try {
      const reply = await agent.chat(message);
      return c.json({
        ok: true,
        mode: "chat",
        reply,
        sessionId: sid,
        model: agent.currentModel,
      });
    } catch (e) {
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        502,
      );
    }
  });

  /** Streaming sohbet (SSE): token token akar; basit mesajlarda onay yok */
  app.post("/api/chat/stream", async (c) => {
    const {
      message,
      sessionId: clientSid,
      model,
      agentId,
      approvalId,
    } = await c.req.json();
    if (!message) return c.json({ ok: false, error: "message zorunlu" }, 400);
    const sid = clientSid || `chat_${Date.now()}`;
    const risk = classifyMessageRisk(message);
    if (
      shouldRequireApproval(risk, loadSettings().approvalMode ?? "balanced")
    ) {
      const ticket =
        typeof approvalId === "string" ? approvals.get(approvalId) : undefined;
      if (
        !ticket ||
        ticket.sessionId !== (clientSid ?? "") ||
        ticket.message !== message ||
        ticket.expires < Date.now()
      )
        return c.json({ error: "Bu görev için geçerli onay gerekli." }, 403);
      approvals.delete(approvalId);
    }
    if (model) {
      const id = String(model).replace(/^llm:/, "");
      const available = await modelsRegistry.listAvailable();
      if (!available.some((m) => m.id === `llm:${id}`))
        return c.json({ error: "Seçilen LLM modeli kullanılamıyor." }, 400);
    }
    await agentRegistry.ready;
    if (agentId && !agentRegistry.get(agentId))
      return c.json({ error: "Seçilen ajan bulunamadı." }, 400);

    const { streamSSE } = await import("hono/streaming");

    const selectedAgent = agentId || "hmx-native";
    return streamSSE(c, async (stream) => {
      const controller = new AbortController();
      stream.onAbort(() => controller.abort());
      try {
        let reply = "";
        const confirm =
          selectedAgent === "opencode-agent"
            ? async (question: string) => {
                controller.signal.throwIfAborted();
                const id = crypto.randomUUID();
                const result = new Promise<boolean>((resolve) => {
                  const timer = setTimeout(() => {
                    runtimeApprovals.delete(id);
                    resolve(false);
                  }, 300000);
                  timer.unref();
                  runtimeApprovals.set(id, { resolve, timer });
                });
                stream.onAbort(() => {
                  const pending = runtimeApprovals.get(id);
                  if (pending) {
                    clearTimeout(pending.timer);
                    runtimeApprovals.delete(id);
                    pending.resolve(false);
                  }
                });
                await stream.writeSSE({
                  data: JSON.stringify({ approval: { id, question } }),
                });
                return result;
              }
            : undefined;
        const source = driverChat(
          sid,
          selectedAgent,
          message,
          model,
          confirm,
          controller.signal,
        );
        if (!source) throw new Error("Seçilen ajan bulunamadı.");
        for await (const token of source) {
          controller.signal.throwIfAborted();
          reply += token;
          await stream.writeSSE({ data: JSON.stringify({ token }) });
        }
        driverChatDone(sid, reply);
        await stream.writeSSE({
          data: JSON.stringify({
            done: true,
            sessionId: sid,
            agent: selectedAgent,
          }),
        });
      } catch (error) {
        if (!controller.signal.aborted)
          await stream.writeSSE({
            data: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          });
      }
    });
  });

  // --- agent registry (AgentSelector): gercek driver'lar, prompt shimi yok ---
  let agentRegistry = new AgentRegistry({
    nativeDriver: new HmxNativeDriver(),
    chatOnly: createChatOnlyBackend(),
    agentsFile: path.join(paths.home, "agents.json"),
    optionalDrivers: [new HermesLoopAgent(), new OpenCodeAgent()],
  });
  // driver tabanli oturumlar icin mesaj gecmisi (driver'lar stateless'tir)
  const driverHistories = new Map<string, ChatMessage[]>();

  function driverChat(
    sid: string,
    driverId: string,
    message: string,
    model?: string,
    confirm?: (question: string) => Promise<boolean>,
    signal?: AbortSignal,
  ): AsyncIterable<string> | null {
    const driver =
      driverId === "opencode-agent"
        ? new OpenCodeAgent({
            permissionMode:
              loadSettings().approvalMode === "fast" ? "allow" : "ask",
            confirm,
          })
        : agentRegistry.get(driverId);
    if (!driver) return null;
    const hist = driverHistories.get(sid) ?? [];
    if (hist.at(-1)?.role !== "user" || hist.at(-1)?.content !== message)
      hist.push({ role: "user", content: message });
    driverHistories.set(sid, hist);
    return driver.chat([...hist], {
      ...(model ? { model: String(model).replace(/^llm:/, "") } : {}),
      signal,
    });
  }

  function driverChatDone(sid: string, reply: string) {
    driverHistories.get(sid)?.push({ role: "assistant", content: reply });
  }

  app.get("/api/agents", async (c) => {
    await agentRegistry.ready;
    const list = await Promise.all(
      agentRegistry.list().map(async (d) => ({
        id: d.id,
        name: d.name,
        kind: d.kind,
        description: d.description,
        capabilities: d.capabilities,
        builtin: agentRegistry.isBuiltin(d.id),
        available: await d.isAvailable().catch(() => false),
      })),
    );
    return c.json(list);
  });
  app.post("/api/agents", async (c) => {
    const body = await c.req.json();
    if (
      typeof body.id !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(body.id) ||
      ["hmx-native", "hermes-loop", "opencode-agent"].includes(body.id) ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      (body.promptAddon !== undefined &&
        typeof body.promptAddon !== "string") ||
      (body.description !== undefined && typeof body.description !== "string")
    )
      return c.json(
        { ok: false, error: "Geçerli, ayrılmış olmayan id ve name gerekli." },
        400,
      );
    // Custom profil dosyaya yazilir; registry yeniden kurulur
    const file = path.join(paths.home, "agents.json");
    const document = readJson<any>(file) ?? [];
    const current = Array.isArray(document) ? document : document.agents;
    if (!Array.isArray(current))
      return c.json({ error: "agents.json bozuk; üzerine yazılmadı." }, 409);
    const updated = [
      ...current.filter((a: any) => a.id !== body.id),
      {
        id: body.id,
        name: body.name,
        description: body.description ?? "",
        promptAddon: body.promptAddon ?? "",
      },
    ];
    writeJson(
      file,
      Array.isArray(document) ? updated : { ...document, agents: updated },
    );
    agentRegistry = new AgentRegistry({
      nativeDriver: new HmxNativeDriver(),
      chatOnly: createChatOnlyBackend(),
      agentsFile: path.join(paths.home, "agents.json"),
      optionalDrivers: [new HermesLoopAgent(), new OpenCodeAgent()],
    });
    await agentRegistry.ready;
    return c.json({ ok: true });
  });
  app.delete("/api/agents/:id", (c) =>
    c.json({ ok: agentRegistry.removeCustom(c.req.param("id")) }),
  );

  // --- LLM model listesi (endpoint'ten canli) ---
  app.get("/api/llm/models", async (c) => {
    try {
      const { LlmClient } = await import("@hmx/core");
      const models = await LlmClient.fromEnv().listModels();
      return c.json({ ok: true, models });
    } catch (e) {
      return c.json({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        models: [],
      });
    }
  });

  // --- gunlukler (canli kuyruk) ---
  app.get("/api/logs", (c) => {
    if (!fs.existsSync(paths.logs)) return c.json([]);
    return c.json(
      fs
        .readdirSync(paths.logs)
        .filter((f) => f.endsWith(".jsonl") || f.endsWith(".log"))
        .sort()
        .reverse(),
    );
  });
  app.get("/api/logs/:name", (c) => {
    const name = c.req.param("name");
    if (name.includes("..") || name.includes("/") || name.includes("\\"))
      return c.json({ ok: false, error: "gecersiz ad" }, 400);
    const f = path.join(paths.logs, name);
    if (!fs.existsSync(f))
      return c.json({ ok: false, error: "dosya yok" }, 404);
    const tail = Math.min(Number(c.req.query("tail")) || 200, 2000);
    const lines = fs.readFileSync(f, "utf8").trim().split("\n");
    return c.json({ lines: lines.slice(-tail), total: lines.length });
  });

  // --- ayarlar ---
  app.get("/api/settings", (c) => {
    const settings = loadSettings();
    const { apiKey: _secret, ...llm } = settings.llm ?? {};
    return c.json({
      ...settings,
      llm: {
        baseUrl: process.env.HMX_LLM_BASE_URL ?? "http://localhost:11434/v1",
        model: process.env.HMX_LLM_MODEL ?? "qwen2.5:14b",
        ...llm,
      },
      hasApiKey: !!settings.llm?.apiKey || !!process.env.HMX_LLM_API_KEY,
    });
  });
  app.post("/api/settings", async (c) => {
    const body = await c.req.json();
    const previous = loadSettings();
    if (
      body.quotaCooldownMs !== undefined &&
      (!Number.isFinite(body.quotaCooldownMs) ||
        body.quotaCooldownMs < 3600000 ||
        body.quotaCooldownMs > 72 * 3600000)
    )
      return c.json({ error: "Bekleme süresi 1–72 saat olmalı." }, 400);
    if (
      body.approvalMode !== undefined &&
      !["strict", "balanced", "fast"].includes(body.approvalMode)
    )
      return c.json({ error: "Geçersiz onay modu." }, 400);
    if (body.llm?.baseUrl !== undefined) {
      try {
        const url = new URL(body.llm.baseUrl);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password
        )
          throw new Error();
      } catch {
        return c.json({ error: "Geçersiz LLM adresi." }, 400);
      }
    }
    if (
      body.llm?.model !== undefined &&
      (typeof body.llm.model !== "string" || !body.llm.model.trim())
    )
      return c.json({ error: "Model adı gerekli." }, 400);
    if (body.llm?.apiKey !== undefined && typeof body.llm.apiKey !== "string")
      return c.json({ error: "API anahtarı geçersiz." }, 400);
    if (
      body.orders !== undefined &&
      (!body.orders ||
        Array.isArray(body.orders) ||
        typeof body.orders !== "object" ||
        Object.entries(body.orders).some(
          ([kind, ids]) =>
            !["image", "video", "audio", "llm"].includes(kind) ||
            typeof ids !== "string" ||
            ids
              .split(",")
              .filter(Boolean)
              .some((id) => !/^[\w-]+$/.test(id.trim())) ||
            new Set(
              ids
                .split(",")
                .filter(Boolean)
                .map((id) => id.trim()),
            ).size !== ids.split(",").filter(Boolean).length,
        ))
    )
      return c.json({ error: "Geçersiz sağlayıcı sıralaması." }, 400);
    if (body.llm?.apiKey === "") delete body.llm.apiKey; // Boş alan kayıtlı anahtarı silmez.
    const merged = {
      ...previous,
      ...body,
      orders: { ...previous.orders, ...(body.orders ?? {}) },
      llm: { ...previous.llm, ...(body.llm ?? {}) },
    };
    writeJson(SETTINGS_FILE, merged);
    applySettings(merged);
    agentRegistry = new AgentRegistry({
      nativeDriver: new HmxNativeDriver(),
      chatOnly: createChatOnlyBackend(),
      agentsFile: path.join(paths.home, "agents.json"),
      optionalDrivers: [new HermesLoopAgent(), new OpenCodeAgent()],
    });
    // Driver geçmişleri korunur; yeni native driver güncel LLM ayarlarını kullanır.
    const { apiKey: _secret, ...llm } = merged.llm;
    getLogger("wizard").info("Ayarlar kaydedildi", {
      approvalMode: merged.approvalMode,
    });
    return c.json({
      ok: true,
      settings: { ...merged, llm, hasApiKey: !!merged.llm.apiKey },
    });
  });

  app.post("/api/client-logs", async (c) => {
    const body = (await c.req.json()) as {
      level?: string;
      msg?: string;
      meta?: Record<string, unknown>;
    };
    if (
      typeof body.msg !== "string" ||
      body.msg.length > 2000 ||
      !["debug", "info", "warn", "error"].includes(body.level ?? "")
    )
      return c.json({ error: "Geçersiz günlük." }, 400);
    getLogger("renderer")[body.level as "debug" | "info" | "warn" | "error"](
      body.msg,
      body.meta,
    );
    return c.json({ ok: true });
  });
  const server = serve({
    fetch: app.fetch,
    port: finalPort,
    hostname: "127.0.0.1",
  });
  getLogger("startup").info(
    `HMX Dashboard hazır: http://localhost:${finalPort}`,
  );
  console.log(`Veriler: ${paths.home}`);
  if (WEB_DIST) console.log(`UI: ${WEB_DIST}`);
  server.once("close", () => queue.close());
  return server;
}
