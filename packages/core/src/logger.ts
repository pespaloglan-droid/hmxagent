import fs from "node:fs";
import path from "node:path";
import { paths } from "./paths.js";
export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogChannel =
  "app" | "startup" | "crash" | "wizard" | "agent" | "renderer";
export interface Logger {
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): Logger;
}
const levels: LogLevel[] = ["debug", "info", "warn", "error"];
/** Döngüler, BigInt ve kimlik bilgileri günlük yazımını bozamaz. */
function clean(
  value: unknown,
  key = "",
  seen = new WeakSet<object>(),
  depth = 0,
): unknown {
  if (/api.?key|password|token|secret|authorization|cookie/i.test(key))
    return "[GİZLENDİ]";
  if (typeof value === "bigint") return String(value);
  if (value instanceof Error)
    return { name: value.name, message: value.message, stack: value.stack };
  if (!value || typeof value !== "object")
    return typeof value === "string" ? value.slice(0, 16000) : value;
  if (seen.has(value)) return "[DÖNGÜ]";
  if (depth > 8) return "[DERİNLİK SINIRI]";
  seen.add(value);
  if (Array.isArray(value))
    return value.slice(0, 100).map((x) => clean(x, "", seen, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, clean(v, k, seen, depth + 1)]),
  );
}
function make(
  channel: LogChannel,
  fixed: Record<string, unknown> = {},
): Logger {
  const emit = (
    level: LogLevel,
    msg: string,
    meta: Record<string, unknown> = {},
  ) => {
    const configured = levels.indexOf(process.env.HMX_LOG_LEVEL as LogLevel);
    if (levels.indexOf(level) < (configured < 0 ? 1 : configured)) return;
    try {
      const safe = clean({ ...fixed, ...meta }) as Record<string, unknown>;
      // Sabit alanlar meta tarafından değiştirilemez.
      const line = JSON.stringify({
        ...safe,
        ts: new Date().toISOString(),
        level,
        channel,
        msg: String(msg).slice(0, 16000),
      });
      fs.mkdirSync(paths.logs, { recursive: true });
      const file = path.join(paths.logs, `${channel}.log`);
      if (
        fs.existsSync(file) &&
        fs.statSync(file).size + Buffer.byteLength(line) > 5 * 1024 * 1024
      ) {
        fs.rmSync(`${file}.1`, { force: true });
        fs.renameSync(file, `${file}.1`);
      }
      fs.appendFileSync(file, line + "\n", { mode: 0o600 });
    } catch {
      /* Günlük yazımı uygulamayı durduramaz. */
    }
    try {
      (level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log)(`[${channel}] ${level} ${String(msg)}`);
    } catch {
      /* Konsol da opsiyoneldir. */
    }
  };
  return {
    debug: (m, x) => emit("debug", m, x),
    info: (m, x) => emit("info", m, x),
    warn: (m, x) => emit("warn", m, x),
    error: (m, x) => emit("error", m, x),
    child: (meta) => make(channel, { ...fixed, ...meta }),
  };
}
export function getLogger(channel: LogChannel): Logger {
  return make(channel);
}
