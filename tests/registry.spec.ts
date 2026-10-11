import { strict as assert } from "node:assert";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ChatMessage } from "@hmx/core";
import type { AgentDriver } from "../packages/agent-core/src/agents/base.js";
import { AgentRegistry, type ChatOnlyBackend } from "../packages/agent-core/src/registry.js";

function nativeDriver(): AgentDriver {
  return {
    id: "hmx-native", name: "HMX Native", kind: "native", description: "Gerçek döngü adaptörü",
    capabilities: ["chat", "tools", "browser", "media"],
    async isAvailable() { return true; },
    async *chat() { yield "native:"; yield "loop"; },
  };
}
function backend(capture?: { messages?: ChatMessage[]; model?: string | undefined }): ChatOnlyBackend {
  return {
    async isAvailable() { return true; },
    async *chat(messages, opts) {
      if (capture) { capture.messages = messages; capture.model = opts?.model; }
      yield "ilk"; yield "ikinci";
    },
  };
}
async function collect(stream: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
}
async function withRegistry(
  document: unknown,
  run: (registry: AgentRegistry, file: string, warnings: string[]) => Promise<void> | void,
): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), "hmx-registry-"));
  const file = join(directory, "agents.json");
  if (document !== undefined) writeFileSync(file, JSON.stringify(document));
  const warnings: string[] = [];
  const registry = new AgentRegistry({
    nativeDriver: nativeDriver(), chatOnly: backend(), agentsFile: file,
    onWarning: (message) => { warnings.push(message); },
  });
  try { await registry.ready; await run(registry, file, warnings); }
  finally { rmSync(directory, { recursive: true, force: true }); }
}

test("Opsiyonel modül ve JSON yokken native kaydı her zaman var", async () => {
  await withRegistry(undefined, (registry, file, warnings) => {
    assert.deepEqual(registry.list().map(({ id }) => id), ["hmx-native"]);
    assert.equal(registry.isBuiltin("hmx-native"), true);
    assert.equal(registry.get("eksik"), null);
    assert.equal(existsSync(file), false);
    assert.deepEqual(warnings, []);
  });
});

test("list kopyadır; native stream gerçek driver'a ulaşır", async () => {
  await withRegistry([], async (registry) => {
    registry.list().length = 0;
    assert.equal(registry.list().length, 1);
    assert.deepEqual(await collect(registry.get("hmx-native")!.chat([])), ["native:", "loop"]);
  });
});

test("Custom yalnız chat; prompt ve model korunur, girdi değişmez", async () => {
  const directory = mkdtempSync(join(tmpdir(), "hmx-prompt-"));
  const file = join(directory, "agents.json");
  writeFileSync(file, JSON.stringify([{ id: "writer", name: "Yazar", promptAddon: "Kısa yaz." }]));
  const capture: { messages?: ChatMessage[]; model?: string | undefined } = {};
  const registry = new AgentRegistry({ nativeDriver: nativeDriver(), chatOnly: backend(capture), agentsFile: file });
  try {
    await registry.ready;
    const driver = registry.get("writer")!;
    const messages: ChatMessage[] = [{ role: "system", content: "Temel yönerge" }, { role: "user", content: "Merhaba" }];
    assert.deepEqual(driver.capabilities, ["chat"]);
    assert.equal(registry.isBuiltin(driver.id), false);
    assert.deepEqual(await collect(driver.chat(messages, { model: "model-x" })), ["ilk", "ikinci"]);
    assert.equal(capture.model, "model-x");
    assert.deepEqual(capture.messages, [messages[0], { role: "system", content: "Kısa yaz." }, messages[1]]);
    assert.equal(messages.length, 2);
    assert.equal(await driver.isAvailable(), true);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("Boş prompt eklenmez; system olmayan ilk mesajın önüne eklenir", async () => {
  const directory = mkdtempSync(join(tmpdir(), "hmx-message-"));
  const file = join(directory, "agents.json");
  writeFileSync(file, JSON.stringify([
    { id: "plain", name: "Sade" }, { id: "extra", name: "Ek", promptAddon: "Ek yönerge" },
  ]));
  const capture: { messages?: ChatMessage[] } = {};
  const registry = new AgentRegistry({ nativeDriver: nativeDriver(), chatOnly: backend(capture), agentsFile: file });
  try {
    await registry.ready;
    const messages: ChatMessage[] = [{ role: "user", content: "Soru" }];
    await collect(registry.get("plain")!.chat(messages));
    assert.deepEqual(capture.messages, messages);
    await collect(registry.get("extra")!.chat(messages));
    assert.deepEqual(capture.messages, [{ role: "system", content: "Ek yönerge" }, ...messages]);
    await collect(registry.get("extra")!.chat([]));
    assert.deepEqual(capture.messages, [{ role: "system", content: "Ek yönerge" }]);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("Kullanılamayan custom kayıt listede kalır", async () => {
  const directory = mkdtempSync(join(tmpdir(), "hmx-unavailable-"));
  const file = join(directory, "agents.json");
  writeFileSync(file, JSON.stringify([{ id: "offline", name: "Offline" }]));
  const chatOnly = { ...backend(), async isAvailable() { return false; } };
  const registry = new AgentRegistry({ nativeDriver: nativeDriver(), chatOnly, agentsFile: file });
  try {
    await registry.ready;
    assert.equal(await registry.get("offline")!.isAvailable(), false);
    assert.equal(registry.list().length, 2);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("Bozuk satır, yinelenen ID ve builtin gölgelemesi atlanır", async () => {
  await withRegistry([
    null, { id: "valid", name: "İlk" }, { id: "valid", name: "Son" },
    { id: "hmx-native", name: "Sahte" }, { id: "hermes-loop", name: "Sahte" },
    { id: "bad", name: 9 }, { id: "bad-prompt", name: "X", promptAddon: 4 },
  ], (registry, _file, warnings) => {
    assert.equal(registry.get("valid")!.name, "İlk");
    assert.equal(registry.list().length, 2);
    assert.equal(warnings.length, 6);
  });
});

test("runtime register upsert yapar, disk yazmaz", async () => {
  await withRegistry([], (registry, file) => {
    const driver = { ...nativeDriver(), id: "runtime", name: "Bir" };
    registry.register(driver);
    registry.register({ ...driver, name: "İki" });
    assert.equal(registry.get("runtime")!.name, "İki");
    assert.equal(registry.isBuiltin("runtime"), false);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), []);
  });
});

test("Tüm builtin ID'leri runtime değiştirmeye ve silmeye kapalı", async () => {
  await withRegistry([], (registry) => {
    for (const id of ["hmx-native", "hermes-loop", "opencode-agent"]) {
      assert.throws(() => registry.register({ ...nativeDriver(), id }), /Builtin/);
      assert.equal(registry.removeCustom(id), false);
    }
    assert.equal(registry.removeCustom("eksik"), false);
    assert.throws(() => registry.register({ ...nativeDriver(), id: "../bad" }), /AgentDriver/);
  });
});

test("removeCustom atomik siler; diğer profiller ve ek alanlar korunur", async () => {
  await withRegistry({ version: 7, extra: { keep: true }, agents: [
    { id: "remove", name: "Sil", unknown: "sakla" }, { id: "keep", name: "Kal", extra: 9 },
  ] }, (registry, file) => {
    assert.equal(registry.removeCustom("remove"), true);
    assert.equal(registry.get("remove"), null);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), {
      version: 7, extra: { keep: true }, agents: [{ id: "keep", name: "Kal", extra: 9 }],
    });
    assert.equal(readdirSync(dirname(file)).length, 1);
    assert.equal(registry.removeCustom("remove"), false);
  });
});

test("Silme disk dosyasını tekrar okur, dışarıdan eklenen kaydı korur", async () => {
  await withRegistry([{ id: "remove", name: "Sil" }], (registry, file) => {
    writeFileSync(file, JSON.stringify([{ id: "remove", name: "Sil" }, { id: "new", name: "Yeni" }]));
    assert.equal(registry.removeCustom("remove"), true);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), [{ id: "new", name: "Yeni" }]);
  });
});

test("Runtime silme kayıp JSON'u oluşturmaz", async () => {
  await withRegistry(undefined, (registry, file) => {
    registry.register({ ...nativeDriver(), id: "runtime" });
    assert.equal(registry.removeCustom("runtime"), true);
    assert.equal(existsSync(file), false);
  });
});

test("Bozuk JSON başlangıçta uyarılır; silmede veri ve runtime korunur", async () => {
  await withRegistry([], async (_registry, file) => {
    writeFileSync(file, "{bad-json");
    const warnings: string[] = [];
    const registry = new AgentRegistry({ nativeDriver: nativeDriver(), chatOnly: backend(), agentsFile: file,
      onWarning: (message) => { warnings.push(message); } });
    await registry.ready;
    assert.equal(warnings.length, 1);
    registry.register({ ...nativeDriver(), id: "runtime" });
    assert.throws(() => registry.removeCustom("runtime"), SyntaxError);
    assert.ok(registry.get("runtime"));
    assert.equal(readFileSync(file, "utf8"), "{bad-json");
  });
});

test("Yazma/rename hatası runtime kaydını korur ve temp dosyasını temizler", async () => {
  await withRegistry([{ id: "remove", name: "Sil" }], (registry, file) => {
    // JSON okunurken dosya yolunu dizine çevirerek rename başarısızlığını tetikle.
    const arrayPrototype = Array.prototype as unknown as { toJSON?: () => unknown };
    const originalToJSON = arrayPrototype.toJSON;
    Object.defineProperty(Array.prototype, "toJSON", {
      configurable: true,
      value(this: unknown[]) {
        rmSync(file); mkdirSync(file);
        return this;
      },
    });
    try { assert.throws(() => registry.removeCustom("remove")); }
    finally {
      if (originalToJSON === undefined) delete arrayPrototype.toJSON;
      else Object.defineProperty(Array.prototype, "toJSON", { value: originalToJSON, configurable: true });
    }
    assert.ok(registry.get("remove"));
    assert.deepEqual(readdirSync(dirname(file)), ["agents.json"]);
  });
});

test("BOM'lu JSON okunur; tanınmayan kök biçimi uyarılır", async () => {
  await withRegistry([], async (_registry, file) => {
    writeFileSync(file, '\uFEFF[{"id":"bom","name":"BOM"}]');
    const options = { nativeDriver: nativeDriver(), chatOnly: backend(), agentsFile: file };
    const registry = new AgentRegistry(options);
    await registry.ready;
    assert.ok(registry.get("bom"));
    writeFileSync(file, '{"unexpected":[]}');
    const warnings: string[] = [];
    const invalid = new AgentRegistry({ ...options, onWarning: (message) => { warnings.push(message); } });
    await invalid.ready;
    assert.equal(warnings.length, 1);
    assert.equal(invalid.list().length, 1);
  });
});

test("Yanlış native driver ve eksik chat backend başlangıçta reddedilir", () => {
  assert.throws(() => new AgentRegistry({ nativeDriver: { ...nativeDriver(), id: "wrong" }, chatOnly: backend() }), /hmx-native/);
  assert.throws(() => new AgentRegistry({ nativeDriver: { ...nativeDriver(), kind: "hermes" }, chatOnly: backend() }), /hmx-native/);
  assert.throws(() => new AgentRegistry({ nativeDriver: nativeDriver(), chatOnly: {} as ChatOnlyBackend }), /chatOnly/);
});

const driverLiteral = (id: string, kind: string, available = true): string => `({
  id: ${JSON.stringify(id)}, name: "Opsiyonel", kind: ${JSON.stringify(kind)}, description: "Döngü",
  capabilities: ["chat", "tools"], async isAvailable() { return ${available}; },
  async *chat() { yield "gerçek-driver"; }
})`;

async function withModules(
  modules: Record<string, string>,
  run: (registry: AgentRegistry, warnings: string[]) => Promise<void> | void,
): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), "hmx-modules-"));
  mkdirSync(join(directory, "agents"));
  writeFileSync(join(directory, "package.json"), '{"type":"module"}');
  // ESM cache'i ve gerçek projeyi etkilemeden modül yükleyicisini izole et.
  copyFileSync(fileURLToPath(new URL("../packages/agent-core/src/registry.ts", import.meta.url)), join(directory, "registry.ts"));
  for (const [name, source] of Object.entries(modules)) writeFileSync(join(directory, "agents", name), source);
  const loaded = await import(pathToFileURL(join(directory, "registry.ts")).href) as typeof import("../packages/agent-core/src/registry.js");
  const warnings: string[] = [];
  const registry = new loaded.AgentRegistry({ nativeDriver: nativeDriver(), chatOnly: backend(), agentsFile: join(directory, "agents.json"),
    onWarning: (message) => { warnings.push(message); } });
  try { await registry.ready; await run(registry, warnings); }
  finally { rmSync(directory, { recursive: true, force: true }); }
}

test("default ve named driver export'ları yüklenir; unavailable builtin gizlenmez", async () => {
  await withModules({
    "hermes-loop.js": `export default ${driverLiteral("hermes-loop", "hermes", false)};`,
    "opencode-agent.js": `export const driver = ${driverLiteral("opencode-agent", "opencode-style")};`,
  }, async (registry, warnings) => {
    assert.deepEqual(registry.list().map(({ id }) => id), ["hmx-native", "hermes-loop", "opencode-agent"]);
    assert.equal(registry.isBuiltin("hermes-loop"), true);
    assert.equal(registry.isBuiltin("opencode-agent"), true);
    assert.equal(await registry.get("hermes-loop")!.isAvailable(), false);
    assert.deepEqual(await collect(registry.get("opencode-agent")!.chat([])), ["gerçek-driver"]);
    assert.deepEqual(warnings, []);
  });
});

test("Async createDriver bağlam alır ve default'tan önce tercih edilir", async () => {
  await withModules({ "hermes-loop.js": `
    export default {};
    export async function createDriver(context) {
      if (context.nativeDriver.id !== "hmx-native" || typeof context.chatOnly.chat !== "function") throw Error("context");
      return ${driverLiteral("hermes-loop", "hermes")};
    }`,
  }, (registry, warnings) => { assert.ok(registry.get("hermes-loop")); assert.deepEqual(warnings, []); });
});

test("İç bağımlılık yokluğu sessiz yok-modül fallback'i değildir", async () => {
  await withModules({ "hermes-loop.js": 'import "./missing-dependency.js";' }, (registry, warnings) => {
    assert.equal(registry.get("hermes-loop"), null);
    assert.equal(warnings.length, 1);
  });
});

test("Yanlış id/kind ve çöken factory uyarılır; diğer driver yüklenir", async () => {
  await withModules({
    "hermes-loop.js": `export default ${driverLiteral("wrong", "hermes")};`,
    "opencode-agent.js": `export const driver = ${driverLiteral("opencode-agent", "native")};`,
  }, (registry, warnings) => { assert.equal(registry.list().length, 1); assert.equal(warnings.length, 2); });
  await withModules({
    "hermes-loop.js": 'export async function createDriver() { throw Error("init-failure"); }',
    "opencode-agent.js": `export default ${driverLiteral("opencode-agent", "opencode-style")};`,
  }, (registry, warnings) => { assert.ok(registry.get("opencode-agent")); assert.equal(warnings.length, 1); });
});
