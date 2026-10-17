/**
 * The typesetter's pass over what a person wrote: straight quotes become
 * curly, "--" becomes a dash, three dots an ellipsis. Done when the words
 * are read, never when they are kept, so the memory row stays exactly as it
 * was typed and the book can set it its own way.
 */

const OPEN_BEFORE = /[\s([{<—–-]/;

/** Typographic quotes, dashes and ellipses for one run of text. */
export function smarten(text: string): string {
  const s = String(text || "");
  if (!s) return s;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const prev = i > 0 ? s[i - 1] : "";
    if (ch === '"') {
      out += !prev || OPEN_BEFORE.test(prev) ? "“" : "”";
    } else if (ch === "'") {
      // An apostrophe inside a word ("don't", "'68") or after a word closes; at the start of a word it opens.
      out += !prev || OPEN_BEFORE.test(prev) ? (/[0-9]/.test(s[i + 1] || "") ? "’" : "‘") : "’";
    } else {
      out += ch;
    }
  }
  return out
    .replace(/(\S)\s*---\s*(\S)/g, "$1—$2")
    .replace(/(\S)\s+--\s+(\S)/g, "$1 – $2")
    .replace(/(\S)--(\S)/g, "$1—$2")
    .replace(/\.\.\./g, "…");
}
