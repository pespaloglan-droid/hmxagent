/** Electron'ı açmaz: gerçek paketlenmiş CJS server'ı Node ile sınar. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const home = fs.mkdtempSync(path.join(os.tmpdir(), "hmx-bundle-"));
fs.mkdirSync(path.join(home, "config"));
const fixture = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ data: [{ id: "bundle-fixture" }] }));
});
await new Promise((r) => fixture.listen(0, "127.0.0.1", r));
const reserve = http.createServer();
await new Promise((r) => reserve.listen(0, "127.0.0.1", r));
const port = reserve.address().port;
await new Promise((r) => reserve.close(r));
let stderr = "";
const proc = spawn(
  process.execPath,
  ["apps/desktop/out/server.cjs", String(port)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HMX_HOME: home,
      HMX_CONFIG_DIR: path.join(home, "config"),
      HMX_WEB_DIST: path.resolve("apps/web/dist"),
      HMX_LLM_BASE_URL: `http://127.0.0.1:${fixture.address().port}/v1`,
      HMX_LLM_MODEL: "bundle-fixture",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
proc.stderr.on("data", (chunk) => (stderr += String(chunk)));
proc.stdout.resume();
const base = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (proc.exitCode !== null) throw Error("Bundled server exited: " + stderr);
    try {
      ready = (await fetch(base + "/api/health")).ok;
    } catch {}
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert(ready, "Bundled server failed to start");
  const agents = await (await fetch(base + "/api/agents")).json();
  assert.deepEqual(
    agents.map((a) => a.id),
    ["hmx-native", "hermes-loop", "opencode-agent"],
  );
  assert(agents.every((a) => a.available));
  const models = await (await fetch(base + "/api/models")).json();
  assert.equal(models.registered[0].id, "llm:bundle-fixture");
  assert.equal((await fetch(base + "/branding/hmx-mark.webp")).status, 200);
  const page = await (await fetch(base)).text();
  assert.match(page, /assets\/index-/);
  assert(!stderr.includes("Opsiyonel ajan yüklenemedi"));
  console.log(
    "DESKTOP BUNDLE SMOKE PASS: source-independent server, 3 drivers, models, branding, web",
  );
} finally {
  proc.kill("SIGTERM");
  await new Promise((r) => proc.once("exit", r));
  fixture.closeAllConnections();
  await new Promise((r) => fixture.close(r));
  fs.rmSync(home, { recursive: true, force: true });
}
