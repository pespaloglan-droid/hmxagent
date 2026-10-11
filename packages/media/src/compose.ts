import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execa } from "execa";

export type ComposeOptions = {
  clips: string[]; // sirali video dosyalari
  voiceover?: string; // seslendirme (mp3/wav)
  music?: string; // fon muzigi
  out: string;
  signal?: AbortSignal; // cikti mp4
};

/** ffprobe ile ciktiyi dogrula: sure ve codec */
export async function probe(
  file: string,
): Promise<{ durationSec: number; streams: number }> {
  const { stdout } = await execa("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    file,
  ]);
  const data = JSON.parse(stdout);
  return {
    durationSec: Math.round(parseFloat(data.format?.duration ?? "0")),
    streams: (data.streams ?? []).length,
  };
}

/**
 * OpenCut-tarzi birlestirme (hafif surum): klipleri sirayla birlestir,
 * seslendirme + muzik altina koy, tek mp4 cikart.
 */
export async function composeProject(
  opts: ComposeOptions,
): Promise<{ out: string; durationSec: number }> {
  opts.signal?.throwIfAborted();
  if (opts.clips.length === 0) throw new Error("Birlestirilecek klip yok");
  for (const c of opts.clips) {
    if (!fs.existsSync(c)) throw new Error(`Klip bulunamadi: ${c}`);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hmx-"));
  try {
    const listFile = path.join(tmp, "concat.txt");
    fs.writeFileSync(
      listFile,
      opts.clips.map((c) => `file '${c.replaceAll("'", "'\\''")}'`).join("\n"),
    );

    const merged = path.join(tmp, "merged.mp4");
    await execa(
      "ffmpeg",
      [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listFile,
        "-c",
        "copy",
        merged,
      ],
      { cancelSignal: opts.signal },
    );

    const hasAudio = opts.voiceover || opts.music;
    if (!hasAudio) {
      fs.copyFileSync(merged, opts.out);
    } else {
      const inputs = ["-i", merged];
      if (opts.voiceover) inputs.push("-i", opts.voiceover);
      if (opts.music) inputs.push("-i", opts.music);

      let filter: string;
      if (opts.voiceover && opts.music) {
        filter =
          "[1:a]volume=1.0[voice];[2:a]volume=0.25[music];[voice][music]amix=inputs=2:duration=first[a]";
      } else {
        filter = "[1:a]anull[a]";
      }
      await execa(
        "ffmpeg",
        [
          "-y",
          ...inputs,
          "-filter_complex",
          filter,
          "-map",
          "0:v",
          "-map",
          "[a]",
          "-c:v",
          "copy",
          "-shortest",
          opts.out,
        ],
        { cancelSignal: opts.signal },
      );
    }

    // Dogrulama: cikti gercekten oynatilabilir mi? (Kural 1.4)
    opts.signal?.throwIfAborted();
    const info = await probe(opts.out);
    if (info.durationSec <= 0 || info.streams === 0) {
      throw new Error("Cikti dogrulanamadi: gecersiz video");
    }
    return { out: opts.out, durationSec: info.durationSec };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
