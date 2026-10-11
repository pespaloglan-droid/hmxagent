import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
export const TOOL_NAMES = [
  "read_file",
  "list_dir",
  "write_file",
  "run_command",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];
export const toolDefinitions = TOOL_NAMES.map((name) => ({
  type: "function" as const,
  function: {
    name,
    description: {
      read_file: "Çalışma alanındaki UTF-8 dosyayı oku (en fazla 64 KB)",
      list_dir: "Çalışma alanındaki dizini listele",
      write_file: "Dosyaya yaz; açık kullanıcı onayı gerekli",
      run_command:
        "Çalışma alanında kabuk komutu çalıştır; açık kullanıcı onayı gerekli",
    }[name],
    parameters: {
      type: "object",
      properties:
        name === "run_command"
          ? { command: { type: "string" } }
          : {
              path: { type: "string" },
              ...(name === "write_file" ? { content: { type: "string" } } : {}),
            },
      required:
        name === "run_command"
          ? ["command"]
          : name === "write_file"
            ? ["path", "content"]
            : ["path"],
      additionalProperties: false,
    },
  },
}));
/** Sembolik bağ ve ../ kaçışı engellenir; dosya araçları çalışma alanıyla sınırlıdır. */
async function scoped(
  root: string,
  raw: string,
  write = false,
): Promise<string> {
  const base = await fs.realpath(root);
  const target = path.resolve(base, raw);
  const inside = (file: string) =>
    file === base || file.startsWith(base + path.sep);
  if (!inside(target)) throw new Error("Dosya çalışma alanının dışında.");
  if (
    path
      .relative(base, target)
      .split(path.sep)
      .some(
        (part) =>
          part === ".git" ||
          part === "node_modules" ||
          /^\.env(?:\.|$)/.test(part) ||
          /^(credentials|secrets|accounts)$/i.test(part),
      )
  )
    throw new Error("Hassas veya yönetilen dizine erişim engellendi.");
  const real = await fs.realpath(write ? path.dirname(target) : target);
  if (!inside(real)) throw new Error("Sembolik bağ çalışma alanından çıkıyor.");
  if (
    path
      .relative(base, real)
      .split(path.sep)
      .some(
        (part) =>
          part === ".git" ||
          /^\.env(?:\.|$)/.test(part) ||
          /^(credentials|secrets|accounts)$/i.test(part),
      )
  )
    throw new Error("Hassas dosyaya sembolik bağ erişimi reddedildi.");
  if (write) {
    try {
      const final = await fs.realpath(target);
      if (!inside(final))
        throw new Error("Hedef bağ çalışma alanından çıkıyor.");
      if (
        path
          .relative(base, final)
          .split(path.sep)
          .some(
            (part) =>
              part === ".git" ||
              part === "node_modules" ||
              /^\.env(?:\.|$)/.test(part) ||
              /^(credentials|secrets|accounts)$/i.test(part),
          )
      )
        throw new Error("Hassas dosyaya bağ üzerinden yazma reddedildi.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return target;
}
export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  root = process.env.HMX_WORKSPACE ?? process.cwd(),
  signal?: AbortSignal,
): Promise<string> {
  signal?.throwIfAborted();
  if (name === "run_command") {
    if (
      typeof args.command !== "string" ||
      !args.command.trim() ||
      args.command.length > 2000
    )
      throw new Error("Komut gerekli.");
    return new Promise((resolve, reject) => {
      // Yıkıcı sınıftadır: çağıran driver açık onay almadan buraya giremez.
      const child = spawn(args.command as string, {
        shell: true,
        cwd: root,
        env: Object.fromEntries(
          Object.entries(process.env).filter(
            ([key]) =>
              !/api.?key|password|token|secret|authorization|cookie/i.test(key),
          ),
        ),
        windowsHide: true,
        signal,
      });
      let output = "";
      const append = (chunk: Buffer) => {
        output += chunk.toString();
        if (output.length > 64000) child.kill();
      };
      child.stdout?.on("data", append);
      child.stderr?.on("data", append);
      const timer = setTimeout(() => child.kill(), 30000);
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        code === 0
          ? resolve(output.slice(0, 64000) || "Komut tamamlandı.")
          : reject(
              new Error(`Komut durdu (çıkış ${code}): ${output.slice(-4000)}`),
            );
      });
    });
  }
  if (typeof args.path !== "string")
    throw new Error("Dosya/dizin yolu gerekli.");
  const file = await scoped(root, args.path, name === "write_file");
  if (name === "list_dir")
    return (
      (await fs.readdir(file, { withFileTypes: true }))
        .slice(0, 500)
        .map(
          (entry) =>
            `${entry.isDirectory() ? "dizin" : "dosya"}\t${entry.name}`,
        )
        .join("\n") || "Dizin boş."
    );
  if (name === "read_file") {
    if ((await fs.stat(file)).size > 64000)
      throw new Error("Dosya 64 KB sınırını aşıyor.");
    return await fs.readFile(file, "utf8");
  }
  if (name === "write_file") {
    if (
      typeof args.content !== "string" ||
      Buffer.byteLength(args.content) > 64000
    )
      throw new Error("İçerik gerekli ve en fazla 64 KB olmalı.");
    await fs.writeFile(file, args.content, { encoding: "utf8" });
    return "Dosya yazıldı ve boyutu doğrulandı: " + (await fs.stat(file)).size;
  }
  throw new Error("Bilinmeyen araç.");
}
