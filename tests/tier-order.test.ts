import type { T } from "./run.js";

export async function run(t: T) {
  const { MediaRouter } = await import("@hmx/router");

  const router = new MediaRouter();

  // 1) Tier zinciri: audio icin cheap (openai-tts) free'den (elevenlabs-web) once gelmeli
  //    (spec Bolum 6.2: subscription -> cheap -> free)
  const audioOrder = router.orderFor("audio");
  t("tier: cheap saglayici free'den once", audioOrder.indexOf("openai-tts") < audioOrder.indexOf("elevenlabs-web"),
    `(${audioOrder.join(" -> ")})`);

  // 2) preferred her zaman en basta (Bolum 5.2)
  const withPref = router.orderFor("audio", "openai-tts");
  t("tier: preferred en basta ve tekrar yok", withPref[0] === "openai-tts" && withPref.filter((x) => x === "openai-tts").length === 1);

  // 3) Env override zinciri ezer (Bolum 6.2)
  process.env.HMX_ORDER_AUDIO = "openai-tts,elevenlabs-web";
  const envOrder = router.orderFor("audio");
  delete process.env.HMX_ORDER_AUDIO;
  t("tier: HMX_ORDER_* env'i zinciri ezer", envOrder[0] === "openai-tts");
}
