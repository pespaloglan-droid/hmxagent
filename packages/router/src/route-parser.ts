import type { ProviderKind } from "@hmx/providers";

/**
 * Prompt uzerinden model yonlendirme parser'i.
 * Ornek: "@image:Flow AI,Midjourney @video:Runway @audio:ElevenLabs Uc konsept olustur"
 *
 * Kurallar (spec 3.4):
 * - Promptta belirtilen tercihler onceliklidir
 * - Belirtilmeyen kategoriler icin UI secimleri kullanilir
 * - Model adlari registry'den dogrulanir; bilinmeyenler raporlanir
 * - Sessiz fallback yok: sadece fallback politikasi izin verirse
 */

export type RouteDirectives = Partial<Record<ProviderKind, string[]>>;

export type ParsedRoute = {
  cleanPrompt: string;              // @... direktifleri cikarilmis gorev metni
  directives: RouteDirectives;      // prompttan gelen
  unknown: { kind: ProviderKind; name: string }[]; // registry'de bulunamayanlar
  effective: RouteDirectives;       // prompt > UI secimi birlesimi
};

const TAG_RE = /@(image|video|audio|llm):([^@]+)/gi;
const norm = (s: string) => s.toLowerCase().replace(/[\s_\-\.]/g, "");

/**
 * Chunk icinde bilinen saglayiciyla eslesen EN UZUN oneki bulur.
 * "openai-tts Uc konsept olustur" -> { id: "openai-tts", rest: "Uc konsept olustur" }
 * Eslesme yoksa null doner; geriye kalan metin goreve geri eklenir.
 */
function matchProviderPrefix(chunk: string, kind: ProviderKind, known: { id: string; kind: ProviderKind }[]) {
  const words = chunk.trim().split(/\s+/).filter(Boolean);
  for (let len = Math.min(words.length, 4); len >= 1; len--) {
    const needle = norm(words.slice(0, len).join(" "));
    const hit = known.find((p) => {
      if (p.kind !== kind) return false;
      const pid = norm(p.id);
      return pid === needle || pid.startsWith(needle);
    });
    if (hit) return { id: hit.id, rest: words.slice(len).join(" ") };
  }
  return null;
}

export function parsePromptRoute(
  raw: string,
  uiSelection: RouteDirectives,
  knownProviders: { id: string; kind: ProviderKind }[],
): ParsedRoute {
  const directives: RouteDirectives = {};
  const unknown: ParsedRoute["unknown"] = [];
  const leftovers: string[] = [];

  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(raw)) !== null) {
    const kind = m[1].toLowerCase() as ProviderKind;
    // deger: virgulle ayrilmis aday listesi; her parcada en uzun saglayici oneki eslesir,
    // eslesmeyen kuyruk metni goreve geri doner
    for (const chunk of m[2].split(",")) {
      const hit = matchProviderPrefix(chunk, kind, knownProviders);
      if (hit) {
        directives[kind] = [...(directives[kind] ?? []), hit.id];
        if (hit.rest) leftovers.push(hit.rest);
      } else {
        const words = chunk.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
          unknown.push({ kind, name: words[0] });
          if (words.length > 1) leftovers.push(words.slice(1).join(" "));
        }
      }
    }
  }

  const cleanPrompt = [...leftovers, raw.replace(TAG_RE, " ")]
    .join(" ").replace(/\s{2,}/g, " ").trim();

  // prompt > UI secimi
  const effective: RouteDirectives = {};
  for (const kind of ["llm", "image", "video", "audio"] as ProviderKind[]) {
    const list = directives[kind] ?? uiSelection[kind];
    if (list && list.length > 0) effective[kind] = list;
  }

  return { cleanPrompt, directives, unknown, effective };
}
