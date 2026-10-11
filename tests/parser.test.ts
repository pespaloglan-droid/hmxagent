import type { T } from "./run.js";

export async function run(t: T) {
  const { parsePromptRoute } = await import("@hmx/router");

  const known = [
    { id: "flow-ai", kind: "video" as const }, { id: "flow-ai", kind: "image" as const },
    { id: "elevenlabs-web", kind: "audio" as const }, { id: "openai-tts", kind: "audio" as const },
  ];
  const r = parsePromptRoute("@image:Flow AI @audio:ElevenLabs,openai-tts Uc konsept olustur", { video: ["flow-ai"] }, known);
  t("parser: direktifler cikarildi", r.cleanPrompt === "Uc konsept olustur");
  t("parser: prompt tercihi UI secimini ezer", JSON.stringify(r.effective.audio) === JSON.stringify(["elevenlabs-web", "openai-tts"]));
  t("parser: belirtilmeyen kategori UI seciminden gelir", JSON.stringify(r.effective.video) === JSON.stringify(["flow-ai"]));
  const r2 = parsePromptRoute("@video:BilinmeyenModel test", {}, known);
  t("parser: bilinmeyen model raporlanir (sessiz fallback yok)", r2.unknown.length === 1 && r2.unknown[0].name === "BilinmeyenModel");
}
