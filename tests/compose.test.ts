import path from "node:path";
import { execa } from "execa";
import type { T } from "./run.js";

export async function run(t: T) {
  const { composeProject, probe } = await import("@hmx/media");

  const tmp = process.env.HMX_HOME!;
  const mk = async (file: string, color: string, sec: number) =>
    execa("ffmpeg", ["-y", "-f", "lavfi", "-i", `color=c=${color}:s=320x240:d=${sec}`, "-pix_fmt", "yuv420p", file]);
  const c1 = path.join(tmp, "c1.mp4"), c2 = path.join(tmp, "c2.mp4");
  const voice = path.join(tmp, "voice.wav");
  await mk(c1, "red", 2); await mk(c2, "blue", 2);
  await execa("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=4", voice]);
  const out = path.join(tmp, "final.mp4");
  const r = await composeProject({ clips: [c1, c2], voiceover: voice, out });
  t("compose: cikti dogrulandi", r.durationSec >= 3, `(${r.durationSec} sn)`);
  const info = await probe(out);
  t("compose: video+audio stream var", info.streams >= 2);
}
