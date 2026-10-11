/**
 * RTK Token Saver (Bolum 6.1) — 9router README'sindeki
 * "Auto-compress tool_result content, save 20-40% tokens" davranisinin
 * clean-room TypeScript yeniden yazimi (kod kopyalanmaz, davranis yeniden yazilir).
 *
 * Arac ciktilari modele geri verilmeden once sikistirilir:
 *  - Tekrarlayan satirlar tekillestirilir ("... N similar lines omitted")
 *  - Uzun loglar bas/son ozetine indirilir (ilk 50 + son 20 satir)
 *  - JSON ciktilarda gereksiz bosluk/derinlik budanir
 *  - Sikistirma orani tokenSaverStats uzerinden panele akar
 */

const TOKEN_CHAR_RATIO = 4; // kaba token tahmini: 4 karakter ~ 1 token

function estimateTokens(text: string): number {
  return Math.ceil(text.length / TOKEN_CHAR_RATIO);
}

export type CompressResult = { text: string; savedRatio: number };

/** JSON ise: compact yaz + 6 seviyeden derin dallari buda */
function tryCompressJson(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const prune = (v: unknown, depth: number): unknown => {
      if (depth >= 6) return Array.isArray(v) ? "[...]" : "{...}";
      if (Array.isArray(v)) return v.map((x) => prune(x, depth + 1));
      if (v && typeof v === "object") {
        return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, prune(x, depth + 1)]));
      }
      return v;
    };
    return JSON.stringify(prune(JSON.parse(trimmed), 0));
  } catch {
    return null;
  }
}

export function compressToolResult(raw: string, opts?: { maxLines?: number }): CompressResult {
  const before = estimateTokens(raw);

  // 1) JSON cikti -> compact + budanmis
  const json = tryCompressJson(raw);
  if (json !== null && json.length < raw.length) {
    return finish(json, before);
  }

  // 2) Tekrarlayan satirlari tekillestir (ardisik ayni satirlar sayilir)
  const lines = raw.split("\n");
  const deduped: string[] = [];
  let i = 0;
  while (i < lines.length) {
    let j = i + 1;
    while (j < lines.length && lines[j] === lines[i]) j++;
    const count = j - i;
    deduped.push(lines[i]);
    if (count > 1) deduped.push(`... ${count - 1} similar lines omitted`);
    i = j;
  }

  // 3) Hala uzunsa bas/son ozeti (ilk 50 + son 20)
  const maxLines = opts?.maxLines ?? 70;
  let text: string;
  if (deduped.length > maxLines) {
    const head = deduped.slice(0, 50);
    const tail = deduped.slice(-20);
    text = [...head, `... ${deduped.length - 70} lines omitted ...`, ...tail].join("\n");
  } else {
    text = deduped.join("\n");
  }
  return finish(text.length < raw.length ? text : raw, before);

  function finish(text: string, beforeTokens: number): CompressResult {
    const after = estimateTokens(text);
    const savedRatio = beforeTokens > 0 ? Math.max(0, 1 - after / beforeTokens) : 0;
    tokenSaverStats.record(before, after);
    return { text, savedRatio };
  }
}

/** Sikistirma istatistikleri (Activity & Health sekmesine akar) */
class TokenSaverStats {
  private compressed = 0;
  private beforeTokens = 0;
  private afterTokens = 0;

  record(before: number, after: number) {
    this.compressed++;
    this.beforeTokens += before;
    this.afterTokens += after;
  }

  snapshot() {
    return {
      compressedCount: this.compressed,
      beforeTokens: this.beforeTokens,
      afterTokens: this.afterTokens,
      savedRatio: this.beforeTokens > 0 ? 1 - this.afterTokens / this.beforeTokens : 0,
    };
  }
}

export const tokenSaverStats = new TokenSaverStats();
