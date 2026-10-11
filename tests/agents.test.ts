import type { T } from "./run.js";

export async function run(t: T) {
  const { AgentRegistry, HmxNativeDriver, createChatOnlyBackend } = await import("@hmx/agent-core");

  const mk = () => new AgentRegistry({
    nativeDriver: new HmxNativeDriver(),
    chatOnly: createChatOnlyBackend(),
  });

  // 1) native her zaman kayitli; opsiyonel moduller yoksa sessizce atlanir
  const reg = mk();
  await reg.ready;
  t("agents: hmx-native her zaman var", !!reg.get("hmx-native") && reg.isBuiltin("hmx-native"));
  t("agents: driver kontrati tam", reg.get("hmx-native")!.capabilities.includes("chat") && typeof reg.get("hmx-native")!.chat === "function");

  // 2) builtin id'ler runtime kayda kapali
  let threw = false;
  try { reg.register({ ...reg.get("hmx-native")!, name: "Sahte" }); } catch { threw = true; }
  t("agents: builtin id korunur", threw);

  // 3) custom runtime kaydi upsert calisir, builtin degildir
  reg.register({
    id: "ozel-ajan", name: "Ozel", kind: "native", description: "d", capabilities: ["chat"],
    isAvailable: async () => true,
    async *chat() { yield "merhaba"; },
  });
  t("agents: runtime custom kayit", reg.get("ozel-ajan")?.name === "Ozel" && !reg.isBuiltin("ozel-ajan"));

  // 4) custom silme
  t("agents: custom silinebilir", reg.removeCustom("ozel-ajan") && reg.get("ozel-ajan") === null);
}
