#!/usr/bin/env node
import { loadEnv } from "@hmx/core";
loadEnv(); // .env dosyasini her seyden once yukle

import { Command } from "commander";
import path from "node:path";
import fs from "node:fs";
import readline from "node:readline";
import { HmxAgent, runBrowserTask } from "@hmx/agent-core";
import { MediaRouter, compressToolResult } from "@hmx/router";
import { AssetCatalog, composeProject } from "@hmx/media";
import { loadProviderConfigs, saveProviderConfig, deleteProviderConfig, GenericBrowserProvider, AccountPool } from "@hmx/providers";
import { paths, ensureDirs } from "@hmx/core";

const program = new Command();
program.name("hmx").description("HMX Agent - disiplinli kisisel AI agent").version("1.0.0");

const ask = (q: string): Promise<string> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a.trim()); }));
};

// ---------- chat ----------
program.command("chat").description("HMX Agent ile konus (plan-onay-dogrulama dongusu)").action(async () => {
  const agent = new HmxAgent();
  console.log(`HMX Agent hazir. Oturum: ${agent.sessionId}`);
  console.log(`Gorev gunlugu: ${agent.getLedgerFile()}\n(cikis: "exit")\n`);
  while (true) {
    const input = await ask("sen> ");
    if (["exit", "quit", "cikis"].includes(input.toLowerCase())) break;
    if (!input) continue;
    try {
      const { goal, plan } = await agent.startTask(input);
      console.log(`\n== HEDEF ==\n${goal}\n\n== PLAN ==\n${plan}\n`);
      const ok = await ask("Plani onayliyor musun? (e/h) ");
      if (ok.toLowerCase() !== "e") { console.log("Iptal edildi."); continue; }
      const reply = await agent.step("Plani uygula. Her adimdan sonra dogrulama yap ve <verification> raporu ile bitir.");
      console.log(`\nhmx> ${reply}\n`);
    } catch (e) {
      console.error(`\n[HMX DURDU] ${e instanceof Error ? e.message : e}\n`);
    }
  }
});

// ---------- generate ----------
program.command("generate")
  .description("Medya uret (router + fallback + katalog kaydi)")
  .requiredOption("-k, --kind <kind>", "image | video | audio")
  .requiredOption("-p, --prompt <prompt>", "uretim promptu / seslendirilecek metin")
  .option("-o, --out <file>", "cikti dosyasi")
  .option("--voice <voiceId>", "ses id (audio)")
  .option("--aspect <ratio>", "16:9 | 9:16 | 1:1")
  .option("--yes", "prompt onayini atla")
  .action(async (opts) => {
    ensureDirs();
    // Kural: uretim oncesi prompt onayi
    if (!opts.yes) {
      console.log(`\nUretim istegi:\n  tur: ${opts.kind}\n  prompt: ${opts.prompt}\n`);
      const ok = await ask("Onayliyor musun? (e/h) ");
      if (ok.toLowerCase() !== "e") { console.log("Iptal."); return; }
    }
    const ext = opts.kind === "audio" ? "mp3" : opts.kind === "video" ? "mp4" : "png";
    const out = opts.out ?? path.join(paths.media, `${opts.kind}-${Date.now()}.${ext}`);
    const router = new MediaRouter();
    const result = await router.generate(opts.kind, {
      prompt: opts.prompt, outputPath: out, voiceId: opts.voice, aspectRatio: opts.aspect,
    });
    if (!result.ok) { console.error(`\nBASARISIZ:\n${result.error}`); process.exit(1); }

    const catalog = new AssetCatalog();
    const asset = catalog.register({
      type: opts.kind, provider: result.provider!, prompt: opts.prompt,
      filePath: result.filePath!, tags: [],
    });
    console.log(`\nOK -> ${result.filePath} (${result.meta?.bytes} bayt) [${result.provider}]`);
    console.log(`Katalog kaydi: ${asset.id} (${asset.status})`);
  });

// ---------- compose ----------
program.command("compose")
  .description("Klipleri + sesi birlestir (FFmpeg)")
  .requiredOption("-c, --clips <files...>", "video dosyalari (sirayla)")
  .option("-v, --voiceover <file>", "seslendirme")
  .option("-m, --music <file>", "fon muzigi")
  .requiredOption("-o, --out <file>", "cikti mp4")
  .action(async (opts) => {
    const r = await composeProject({ clips: opts.clips, voiceover: opts.voiceover, music: opts.music, out: opts.out });
    console.log(`OK -> ${r.out} (${r.durationSec} sn, ffprobe dogrulandi)`);
  });

// ---------- catalog ----------
const catalogCmd = program.command("catalog").description("Varlik katalogu");
catalogCmd.command("list")
  .option("--type <type>", "image|video|audio")
  .option("--provider <id>")
  .action((opts) => {
    const rows = new AssetCatalog().query({ type: opts.type, provider: opts.provider });
    if (rows.length === 0) return console.log("Katalog bos.");
    for (const a of rows) {
      console.log(`${a.status === "verified" ? "OK" : "!!"} ${a.id}  ${a.type.padEnd(5)}  ${a.provider.padEnd(16)}  ${a.filePath}`);
    }
  });
catalogCmd.command("reverify").description("Diskteki dosyalari yeniden dogrula").action(() => {
  const r = new AssetCatalog().reverify();
  console.log(`verified: ${r.verified}, missing: ${r.missing}`);
});

// ---------- providers (panel) ----------
const prov = program.command("providers").description("Saglayici paneli");
prov.command("list").action(async () => {
  const router = new MediaRouter();
  for (const p of router.list()) {
    console.log(`${p.circuitOpen ? "[DEVRE DISI]" : "[aktif]     "} ${p.id.padEnd(18)} ${p.kind.padEnd(6)} ${p.authMode}`);
  }
});
prov.command("add")
  .description("Yeni site ekle: hmx providers add <dosya.json> veya argumansiz calistir (sihirbaz)")
  .argument("[file]", "hazir JSON config dosyasi")
  .action(async (file) => {
    if (file) {
      // Paneldeki "Saglayici Ekle" ile ayni is: JSON config'i havuza yaz (Bolum 3.1)
      const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!cfg.id || !cfg.baseUrl || !cfg.kind || !cfg.authMode) {
        console.error("Gecersiz config: id, baseUrl, kind, authMode zorunlu"); process.exit(1);
      }
      saveProviderConfig(cfg);
      console.log(`Eklendi: ${cfg.id} (${cfg.kind}). ${cfg.authMode === "browser-session" ? `Giris icin: hmx login ${cfg.id}` : ""}`);
      return;
    }
    const id = await ask("Saglayici id (ornegin runway-web): ");
    const kind = await ask("Tur (image/video/audio): ");
    const baseUrl = await ask("Site URL: ");
    const promptInput = await ask("Prompt kutusu selector (CSS): ");
    const submitButton = await ask("Uret butonu selector: ");
    const resultItem = await ask("Sonuc ogesi selector: ");
    const downloadButton = await ask("Indir butonu selector: ");
    const failUrl = await ask("Giris sayfasi URL parcasi (ornegin 'login'): ");
    saveProviderConfig({
      id, kind: kind as any, authMode: "browser-session", baseUrl,
      loginCheck: { failUrlContains: failUrl },
      selectors: { promptInput, submitButton, resultItem, downloadButton },
      timeouts: { generateMs: 300_000 },
    });
    console.log(`Eklendi: ${id}. Giris icin: hmx login ${id}`);
  });
prov.command("remove").argument("<id>").action((id) => { deleteProviderConfig(id); console.log(`Silindi: ${id}`); });

// ---------- accounts (hesap havuzu: web oturumlari + API anahtarlari) ----------
const pool = new AccountPool();
const acc = program.command("accounts").description("Hesap havuzu (coklu hesap + kota rotasyonu)");
acc.command("list").option("--provider <id>", "tek saglayiciya filtrele").action((opts) => {
  const rows = opts.provider ? pool.list(opts.provider) : pool.listAll();
  if (rows.length === 0) return console.log("Havuz bos. Eklemek icin: hmx login <saglayici>  veya  hmx accounts add-key");
  for (const a of rows) {
    const cd = a.status === "cooldown" && a.cooldownUntil
      ? `cooldown ${(Math.max(0, a.cooldownUntil - Date.now()) / 3_600_000).toFixed(1)}sa`
      : a.status;
    console.log(`${a.providerId.padEnd(18)} ${a.id.padEnd(24)} ${a.label.padEnd(28)} ${cd}`);
  }
});
acc.command("add-key")
  .description("API'li saglayiciya anahtarli hesap ekle")
  .requiredOption("--provider <id>", "saglayici id")
  .requiredOption("--key <apiKey>", "API anahtari")
  .option("--label <label>", "etiket", "API anahtari")
  .action((opts) => {
    const a = pool.add({ providerId: opts.provider, label: opts.label, apiKey: opts.key });
    console.log(`Eklendi: ${a.id} (${a.providerId})`);
  });
acc.command("remove").argument("<providerId>").argument("<accountId>").action((providerId, accountId) => {
  console.log(pool.remove(providerId, accountId) ? `Silindi: ${accountId}` : "Bulunamadi");
});

program.command("login")
  .description("API'siz saglayiciya giris yap (tarayici acilir, oturum havuza kaydedilir)")
  .argument("<id>")
  .option("--label <label>", "hesap etiketi (ornegin 'Is hesabi')")
  .action(async (id, opts) => {
    const cfg = loadProviderConfigs().find((c) => c.id === id);
    if (!cfg) { console.error(`Bilinmeyen saglayici: ${id}`); process.exit(1); }
    await new GenericBrowserProvider(cfg.id, cfg.kind, cfg).interactiveLogin(opts.label);
  });

// ---------- browse (genel tarayici ajan) ----------
program.command("browse")
  .description("Kendi Chrome profilinle bir sitede dogal dil gorevi yap")
  .argument("<url>", "hedef site")
  .argument("<task>", "gorev (ornegin 'son videonun basligini ... yap')")
  .option("--max-steps <n>", "adim limiti", "30")
  .action(async (url, task, opts) => {
    const result = await runBrowserTask(
      {
        url, task,
        maxSteps: Number(opts.maxSteps) || 30,
        confirm: async (q) => (await ask(`${q} `)).toLowerCase() === "e",
      },
      { compress: (raw) => compressToolResult(raw) },
    );
    console.log(result.ok
      ? `\nOK (${result.steps} adim): ${result.summary}`
      : `\nDURDU (${result.steps} adim): ${result.error}`);
    console.log(`Gorev gunlugu: ${result.ledgerFile}`);
    if (!result.ok) process.exit(1);
  });

// ---------- dashboard ----------
program.command("dashboard")
  .description("Web panelini baslat (varsayilan: http://localhost:4173)")
  .option("-p, --port <port>", "port numarasi (bos birakilirsa .env'deki HMX_DASHBOARD_PORT, o da yoksa 4173)")
  .action(async (opts) => {
    const { startDashboard } = await import("@hmx/dashboard-api");
    startDashboard(opts.port ? Number(opts.port) : undefined);
  });

// ---------- tui ----------
program.command("tui").description("Terminal arayuzu (Ink)").action(async () => {
  const { spawn } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const here = path.dirname(fileURLToPath(import.meta.url));
  const tuiEntry = fs.existsSync(path.resolve(process.cwd(), "apps/tui/src/index.tsx"))
    ? path.resolve(process.cwd(), "apps/tui/src/index.tsx")
    : path.resolve(here, "../../tui/src/index.tsx");
  const child = spawn("npx", ["tsx", tuiEntry], { stdio: "inherit", shell: process.platform === "win32" });
  child.on("exit", (code) => process.exit(code ?? 0));
});

program.parse();
