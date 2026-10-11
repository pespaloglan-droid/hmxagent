import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

export type Kind = "image" | "video" | "audio" | "llm";
export const KINDS: Kind[] = ["image", "video", "audio", "llm"];
export const kindLabel = (value: string): string =>
  ({ image: "Görsel", video: "Video", audio: "Ses", llm: "Dil modeli" })[
    value
  ] ?? value;
export const tierLabel = (value: string): string =>
  ({ subscription: "Abonelik", cheap: "Ekonomik", free: "Ücretsiz" })[value] ??
  value;
export const statusLabel = (value: string): string =>
  ({
    active: "Aktif",
    cooldown: "Beklemede",
    error: "Hata",
    verified: "Doğrulandı",
    pending: "Bekliyor",
    missing: "Eksik",
  })[value] ?? value;
export const errorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : "İşlem tamamlanamadı. Lütfen yeniden deneyin.";
export const segment = (value: string): string => encodeURIComponent(value);
export function dateLabel(value?: string | number | null): string {
  if (value == null || value === "") return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}
export function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export interface Provider {
  id: string;
  kind: Kind;
  authMode: string;
  tier: string;
  circuitOpen: boolean;
}
export interface Account {
  id: string;
  provider: string;
  label: string;
  profile?: string | null;
  hasApiKey?: boolean;
  status: string;
  failCount: number;
  cooldownRemainingMs: number;
  notes?: string | null;
}
export interface ChromeProfile {
  dir: string;
  name: string;
  email?: string;
}
export interface TokenSaver {
  savedRatio: number;
  compressedCount: number;
  beforeTokens: number;
  afterTokens: number;
}
export interface Routing {
  order: Record<Kind, string[]>;
  policy: string;
  accounts: Account[];
  circuits: { id: string; open: boolean }[];
  tokenSaver?: TokenSaver;
}
export interface Health {
  ok: boolean;
  version?: string;
  llm?: { baseUrl?: string; model?: string };
  ffmpeg: boolean;
  home?: string;
  firstRun?: boolean;
  quota?: { accounts: number; cooldown: number; error: number };
}
export interface Settings {
  quotaCooldownMs: number;
  orders?: Partial<Record<Kind, string>>;
  llm?: { baseUrl?: string; model?: string; apiKey?: string };
  approvalMode?: "strict" | "balanced" | "fast";
  theme?: string;
}
export interface SessionSummary {
  id: string;
  title: string;
  steps: number;
  errors: number;
  lastTs?: string;
}
export interface SessionEvent {
  type: string;
  step: number;
  summary: string;
  ts?: string;
}
export interface Asset {
  id: string;
  type: Kind;
  provider: string;
  filePath: string;
  status: string;
}
export interface ModelEntry {
  available?: boolean;
  reason?: string;
  source?: string;
  registryId?: string;
  id: string;
  provider?: string;
  authMode?: string;
  tier?: string | null;
}
export type ModelCatalog = Record<Kind, ModelEntry[]>;
export interface ApiResult {
  ok: boolean;
  error?: string;
}
export function assertOk<T extends ApiResult>(result: T): T {
  if (!result.ok)
    throw new Error(result.error ?? "Sunucu işlemi tamamlayamadı.");
  return result;
}

/** Eski yanıtlar yeni seçimi ezemez; unmount sonrası state güncellenmez. */
export function useResource<T>(path: string | null, initial: T | null = null) {
  const [data, setData] = useState<T | null>(initial);
  const [loading, setLoading] = useState(path !== null && initial === null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const mounted = useRef(false);
  const inFlight = useRef<{ path: string; promise: Promise<T | null> } | null>(
    null,
  );
  const reload = useCallback((): Promise<T | null> => {
    if (!path) return Promise.resolve(null);
    if (inFlight.current?.path === path) return inFlight.current.promise;
    const request = ++generation.current;
    setLoading(true);
    setError("");
    const promise = api
      .get<T>(path)
      .then((next) => {
        if (mounted.current && request === generation.current) setData(next);
        return next;
      })
      .catch((cause: unknown) => {
        if (mounted.current && request === generation.current)
          setError(errorMessage(cause));
        return null;
      })
      .finally(() => {
        if (request === generation.current) {
          inFlight.current = null;
          if (mounted.current) setLoading(false);
        }
      });
    inFlight.current = { path, promise };
    return promise;
  }, [path]);
  useEffect(() => {
    mounted.current = true;
    setData(initial);
    setError("");
    setLoading(path !== null && initial === null);
    void reload();
    return () => {
      mounted.current = false;
      ++generation.current;
      inFlight.current = null;
    };
    // Başlangıç verisi yalnızca kaynak değiştiğinde uygulanır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, reload]);
  return { data, loading, error, reload };
}

/** Mutasyonlar çift tıklamada tekrarlanmaz. Hata, son işlem ve spinner ortaktır. */
export function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = async (key: string, task: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (cause: unknown) {
      if (mounted.current) setError(errorMessage(cause));
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(null);
    }
  };
  return {
    busy,
    error,
    notice,
    run,
    setNotice,
    clearError: () => setError(""),
  };
}
