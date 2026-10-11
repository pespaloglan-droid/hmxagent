import { randomUUID } from "node:crypto";
import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ChatMessage } from "@hmx/core";
import type { AgentDriver, AgentKind } from "./agents/base.js";

/**
 * Native LLM'in yalnızca metin sohbeti yolu. Buraya araç çalıştırabilen
 * HmxAgent.chat bağlanmaz; tool tanımı/dispatch içermeyen LlmClient adaptörü verilir.
 */
export interface ChatOnlyBackend {
  isAvailable(): Promise<boolean>;
  chat(messages: ChatMessage[], opts?: { model?: string }): AsyncIterable<string>;
}

/** Opsiyonel driver modüllerinin createDriver fabrikasına verilen bağlam. */
export interface AgentModuleContext {
  readonly nativeDriver: AgentDriver;
  readonly chatOnly: ChatOnlyBackend;
}

export interface AgentRegistryOptions extends AgentModuleContext {
  /** Varsayılan: ~/.hmx/agents.json */
  readonly agentsFile?: string;
  /** Bozuk profil veya mevcut fakat yüklenemeyen opsiyonel modül için uyarı. */
  readonly onWarning?: (message: string, cause?: unknown) => void;
}

interface CustomProfile {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  // Eski API/export değil; yalnızca diskteki custom profil verisi.
  readonly promptAddon: string;
}

interface AgentsDocument {
  readonly root: unknown[] | Record<string, unknown>;
  readonly entries: unknown[];
}

const BUILTINS = [
  { id: "hmx-native", kind: "native" },
  { id: "hermes-loop", kind: "hermes" },
  { id: "opencode-agent", kind: "opencode-style" },
] as const;
const RESERVED_IDS: ReadonlySet<string> = new Set(BUILTINS.map(({ id }) => id));
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertDriver(value: unknown): asserts value is AgentDriver {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" || !ID_PATTERN.test(value.id) ||
    !isNonemptyString(value.name) ||
    !BUILTINS.some(({ kind }) => kind === value.kind) ||
    typeof value.description !== "string" ||
    !Array.isArray(value.capabilities) ||
    !value.capabilities.every(isNonemptyString) ||
    typeof value.isAvailable !== "function" ||
    typeof value.chat !== "function"
  ) {
    throw new TypeError("Geçerli bir AgentDriver bekleniyor.");
  }
}

function parseProfile(value: unknown): CustomProfile {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" || !ID_PATTERN.test(value.id) ||
    RESERVED_IDS.has(value.id) ||
    !isNonemptyString(value.name) ||
    (value.description !== undefined && typeof value.description !== "string") ||
    (value.promptAddon !== undefined && typeof value.promptAddon !== "string")
  ) {
    throw new TypeError("Custom profilin id/name/description/promptAddon alanları geçersiz.");
  }
  return {
    id: value.id,
    name: value.name,
    description: typeof value.description === "string" ? value.description : "Özel sohbet ajanı",
    promptAddon: typeof value.promptAddon === "string" ? value.promptAddon : "",
  };
}

function readDocument(file: string): AgentsDocument {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (cause: unknown) {
    if (isRecord(cause) && cause.code === "ENOENT") return { root: [], entries: [] };
    throw cause;
  }
  const root: unknown = JSON.parse(text.replace(/^\uFEFF/, ""));
  if (Array.isArray(root)) return { root, entries: root };
  if (isRecord(root) && Array.isArray(root.agents)) return { root, entries: root.agents };
  throw new TypeError("agents.json bir dizi veya { agents: [...] } nesnesi olmalı.");
}

/** Atomik değişim; başarısız yazmada eski dosya ve runtime kayıt korunur. */
function writeDocument(file: string, document: AgentsDocument, entries: unknown[]): void {
  const root = Array.isArray(document.root) ? entries : { ...document.root, agents: entries };
  const text = `${JSON.stringify(root, null, 2)}\n`;
  const temporary = join(dirname(file), `.hmx-agents-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, text, { encoding: "utf8", mode: 0o600, flag: "wx" });
    renameSync(temporary, file);
  } finally {
    try { unlinkSync(temporary); } catch { /* Rename sonrası geçici dosya zaten yok. */ }
  }
}

class CustomChatDriver implements AgentDriver {
  readonly id: string;
  readonly name: string;
  readonly kind = "native" as const;
  readonly description: string;
  readonly capabilities: string[] = ["chat"];

  constructor(
    private readonly profile: CustomProfile,
    private readonly backend: ChatOnlyBackend,
  ) {
    this.id = profile.id;
    this.name = profile.name;
    this.description = profile.description;
  }

  isAvailable(): Promise<boolean> {
    return this.backend.isAvailable();
  }

  chat(messages: ChatMessage[], opts?: { model?: string }): AsyncIterable<string> {
    const augmented = [...messages];
    if (this.profile.promptAddon.trim().length > 0) {
      // Baştaki system mesajlarını koru; ek yönergeyi ilk konuşma mesajından önce koy.
      const firstNonSystem = augmented.findIndex((message) => message.role !== "system");
      augmented.splice(firstNonSystem === -1 ? augmented.length : firstNonSystem, 0, {
        role: "system",
        content: this.profile.promptAddon,
      });
    }
    // Gerçek AsyncIterable doğrudan döner; tamponlama veya sahte token üretimi yok.
    return this.backend.chat(augmented, opts);
  }
}

/**
 * Gerçek driver registry'si. hmx-native zorunlu enjekte edilir; prompt shimi yoktur.
 * Başlangıçta await registry.ready çağrısı, opsiyonel modüllerin yüklenmesini tamamlar.
 * JSON başlangıçta okunur; runtime kayıtlar diske otomatik yazılmaz.
 */
export class AgentRegistry {
  readonly ready: Promise<void>;
  private readonly drivers = new Map<string, AgentDriver>();
  private readonly builtinIds = new Set<string>();
  private readonly agentsFile: string;
  private readonly context: AgentModuleContext;
  private readonly warn: (message: string, cause?: unknown) => void;

  constructor(options: AgentRegistryOptions) {
    assertDriver(options.nativeDriver);
    if (options.nativeDriver.id !== "hmx-native" || options.nativeDriver.kind !== "native") {
      throw new TypeError("nativeDriver, id=hmx-native ve kind=native olmalı.");
    }
    if (
      !options.chatOnly || typeof options.chatOnly.chat !== "function" ||
      typeof options.chatOnly.isAvailable !== "function"
    ) {
      throw new TypeError("Araç çalıştırmayan bir chatOnly backend gerekli.");
    }
    this.agentsFile = resolve(options.agentsFile ?? join(homedir(), ".hmx", "agents.json"));
    this.context = { nativeDriver: options.nativeDriver, chatOnly: options.chatOnly };
    this.warn = options.onWarning ?? ((message, cause) => {
      const detail = cause instanceof Error ? `: ${cause.message}` : "";
      process.emitWarning(`${message}${detail}`, { code: "HMX_AGENT_REGISTRY" });
    });
    this.drivers.set(options.nativeDriver.id, options.nativeDriver);
    this.builtinIds.add(options.nativeDriver.id);
    this.loadCustomProfiles();
    this.ready = this.loadOptionalBuiltins();
  }

  /** Yeni bir liste döner. Kurulu fakat unavailable driver'lar da listede kalır. */
  list(): AgentDriver[] {
    return [...this.drivers.values()];
  }

  get(id: string): AgentDriver | null {
    return this.drivers.get(id) ?? null;
  }

  /** Builtin kimlikleri hariç runtime upsert; dosyaya yazmaz. */
  register(driver: AgentDriver): void {
    assertDriver(driver);
    if (RESERVED_IDS.has(driver.id)) {
      throw new Error(`Builtin kimliği runtime kayıtla değiştirilemez: ${driver.id}`);
    }
    this.drivers.set(driver.id, driver);
  }

  /**
   * Yalnız custom kayıtları kaldırır. Diskteki profil de atomik olarak silinir.
   * I/O/JSON hatası fırlatılır; hatayı başarı diye gizlemez ve runtime kaydı silmez.
   * Dosya yoksa yalnız runtime kayıt kaldırılır. Çoklu süreç için harici kilit gerekir.
   */
  removeCustom(id: string): boolean {
    if (RESERVED_IDS.has(id) || !this.drivers.has(id)) return false;
    // En güncel dosyayı oku: diğer profilleri ve bilinmeyen alanları koru.
    const document = readDocument(this.agentsFile);
    const entries = document.entries.filter((entry) => !isRecord(entry) || entry.id !== id);
    if (entries.length !== document.entries.length) {
      writeDocument(this.agentsFile, document, entries);
    }
    return this.drivers.delete(id);
  }

  /** /api/agents serileştirmesindeki builtin alanı için; kind ile karıştırılmaz. */
  isBuiltin(id: string): boolean {
    return this.builtinIds.has(id);
  }

  private loadCustomProfiles(): void {
    let document: AgentsDocument;
    try {
      document = readDocument(this.agentsFile);
    } catch (cause: unknown) {
      this.warn("Custom ajan dosyası okunamadı; native driver kullanılmaya devam ediyor", cause);
      return;
    }
    for (const [index, entry] of document.entries.entries()) {
      try {
        const profile = parseProfile(entry);
        if (this.drivers.has(profile.id)) throw new Error(`Yinelenen ajan kimliği: ${profile.id}`);
        this.drivers.set(profile.id, new CustomChatDriver(profile, this.context.chatOnly));
      } catch (cause: unknown) {
        this.warn(`Custom ajan kaydı atlandı (sıra ${index + 1})`, cause);
      }
    }
  }

  private async loadOptionalBuiltins(): Promise<void> {
    // Sıra deterministik; yok dosyalar için statik TS import'u oluşturulmaz.
    await this.loadOptionalBuiltin("hermes-loop", "hermes", "./agents/hermes-loop.js");
    await this.loadOptionalBuiltin("opencode-agent", "opencode-style", "./agents/opencode-agent.js");
  }

  private async loadOptionalBuiltin(id: string, kind: AgentKind, path: string): Promise<void> {
    const specifier = new URL(path, import.meta.url).href;
    try {
      const module: unknown = await import(specifier);
      if (!isRecord(module)) throw new TypeError("Driver modülünün export nesnesi geçersiz.");
      // Sözleşme: createDriver(context), driver veya default driver nesnesi.
      let candidate: unknown;
      if (typeof module.createDriver === "function") {
        const createDriver = module.createDriver as (context: AgentModuleContext) => unknown;
        candidate = await createDriver(this.context);
      } else {
        candidate = module.driver ?? module.default;
      }
      assertDriver(candidate);
      if (candidate.id !== id || candidate.kind !== kind) {
        throw new TypeError(`Opsiyonel driver id=${id}, kind=${kind} olmalı.`);
      }
      this.drivers.set(id, candidate);
      this.builtinIds.add(id);
    } catch (cause: unknown) {
      // Yalnız hedef dosyanın yokluğu normal. İç bağımlılık ve init hataları raporlanır.
      if (isRecord(cause) && cause.code === "ERR_MODULE_NOT_FOUND" && cause.url === specifier) return;
      this.warn(`Opsiyonel ajan yüklenemedi: ${id}`, cause);
    }
  }
}
