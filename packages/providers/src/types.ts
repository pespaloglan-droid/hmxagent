export type ProviderKind = "llm" | "image" | "video" | "audio";
export type AuthMode = "api-key" | "browser-session";

export type GenerateRequest = {
  kind: ProviderKind;
  prompt: string;
  negativePrompt?: string;
  durationSec?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  voiceId?: string;
  outputPath: string;
};

export type GenerateResult = {
  ok: boolean;
  filePath?: string;
  error?: string;
  meta?: Record<string, unknown>;
};

export interface MediaProvider {
  id: string;
  kind: ProviderKind;
  authMode: AuthMode;
  isAvailable(): Promise<boolean>;
  generate(req: GenerateRequest): Promise<GenerateResult>;
}

// Based on hermes-agent/agent/video_gen_provider.py (MIT) — generate(prompt, model, image_url,
// duration, aspect_ratio, resolution, negative_prompt) imzasi + success_response/error_response
// donus sozlesmesi. Unknown ekstra alanlar sessizce yok sayilir.
export type VideoResult = {
  success: boolean;
  video: string | null;
  model?: string;
  prompt?: string;
  modality?: string;
  aspect_ratio?: string;
  duration?: number;
  provider: string;
  error?: string;
  error_type?: string;
} & Record<string, unknown>;

// Based on hermes-agent/agent/tts_provider.py (MIT) — synthesize(text, output_path, voice, model,
// speed, format) imzasi. Bilinmeyen ekstra secenekler yok sayilir; hata durumunda throw edilir.
export type TtsOptions = {
  voice?: string;
  model?: string;
  speed?: number;
  format?: string;
} & Record<string, unknown>;

export type AudioResult = { path: string; bytes: number };

/**
 * Panelden kod yazmadan site eklemek icin JSON config semasi.
 * Manifest alanlari (name/version/description/kind/requires_env) Hermes eklenti
 * manifestinden alinmistir.
 * Based on hermes-agent/plugins/video_gen/fal/plugin.yaml (MIT).
 */
export type ProviderConfig = {
  id: string;
  kind: ProviderKind;
  authMode: AuthMode;
  baseUrl: string;
  // Manifest alanlari (plugin.yaml sozlesmesi):
  version?: string;
  description?: string;
  requiresEnv?: string[];
  // Tarayici oturumu:
  loginCheck?: { selector?: string; loggedInText?: string; failUrlContains?: string };
  selectors?: Record<string, string>;
  timeouts?: { generateMs?: number };
  // Kota rotasyonu (Bolum 2): bu metinler sayfada/hatada gorunurse hesap cooldown'a alinir
  quotaIndicators?: string[];
  // Maliyet katmani (Bolum 6.2): fallback zinciri subscription -> cheap -> free sirasiyla kurulur
  tier?: "subscription" | "cheap" | "free";
  // api-key modu icin:
  apiKeyEnv?: string;   // env degiskeni adi, ornegin "OPENAI_API_KEY"
  endpoint?: string;
  model?: string;
};
