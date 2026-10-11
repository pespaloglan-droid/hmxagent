# GÖREV 13 — Structured Logger (core/logger.ts)

## Bağlam
HMX'te loglama dağınık: console.log/ warn + electron-log (desktop) + crash.log (main).
Tek bir structured logger gerekli. Tüm loglar `~/.hmx/logs/` altına yazar.
`@hmx/core` içinde `paths` mevcut (`paths.logs`).

## Üretilecek dosya
`packages/core/src/logger.ts`

## Kontrat
```ts
export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogChannel = "app" | "startup" | "crash" | "wizard" | "agent" | "renderer";

export interface Logger {
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  /** Child logger: ayni kanal, sabit meta ekler (ornegin {sessionId}) */
  child(meta: Record<string, unknown>): Logger;
}

export function getLogger(channel: LogChannel): Logger;
```

## Zorunlu davranış
- JSONL satırları: `{ts, level, channel, msg, ...meta}` → `~/.hmx/logs/<channel>.log`.
- Yazma: append + hata toleranslı (log yazımı asla uygulamayı çökertmez).
- Konsola da bas (renksiz, `[channel] level msg` formatı).
- Seviye filtresi: `HMX_LOG_LEVEL` env (varsayılan info).
- `crash` kanalı: Electron main'in mevcut crash.log'uyla aynı dosyaya yazar
  (entegrasyon notu: desktop main `getLogger("crash")` kullanacak şekilde güncellenecek).
- Büyüme kontrolü: dosya 5 MB'ı aşınca `<channel>.log.1`'e rotate (tek yedek yeterli).

## Kurallar
- Bağımlılık yok (node:fs, node:path). ESM, strict TS.
