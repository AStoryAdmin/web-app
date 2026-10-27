/**
 * The eight keepsake cover colours, as astoryapp.com/samples shows them
 * (its COVERS table), keyed by the phone app's KEEPSAKE_COLORS so a colour
 * chosen here is the one the phone app reads back from
 * stories.book_design.cover.color. `print` is the colour the inside pages
 * use for the cover (the drop cap, the chapter number): a darker ink for
 * the light boards.
 *
 * The phone app's own swatches (app-core theme BOOK_PRINT.covers.keepsake)
 * are sampled from coverbook.pdf and differ slightly; the samples page is
 * the one the founder points families at, so its values are used here.
 */
import { COVER_STYLES, KEEPSAKE_COLORS } from "../../app-core/lib/bookDesign.js";
import { BOOK_PRINT } from "../../app-core/theme/index.js";

export type CoverColour = { key: string; name: string; board: string; ink: string; print: string };

const SWATCH: Record<string, { board: string; ink: string; print: string }> = {
  navy: { board: "#1e3962", ink: "#f3ebdd", print: "#1e3962" },
  // Not on the samples page; the printed book's own chocolate board (BOOK_PRINT.covers.keepsake).
  chocolate: { board: "#4A3327", ink: "#f3ebdd", print: "#4A3327" },
  cream: { board: "#f0ede6", ink: "#2b2b2b", print: "#8a6a2c" },
  forest: { board: "#1f3328", ink: "#f3ebdd", print: "#2f4b3b" },
  slate: { board: "#283f51", ink: "#f3ebdd", print: "#283f51" },
  charcoal: { board: "#343231", ink: "#f3ebdd", print: "#4c4a48" },
  mustard: { board: "#e7c34d", ink: "#2b2b2b", print: "#a07d14" },
  black: { board: "#1c1b1a", ink: "#f3ebdd", print: "#3a3836" },
};

export const COVER_COLOURS: CoverColour[] = (KEEPSAKE_COLORS as { key: string; name: string }[]).map((c) => ({
  key: c.key,
  name: c.name,
  ...(SWATCH[c.key] || SWATCH.navy),
}));

export const coverColour = (key: string | null | undefined): CoverColour => COVER_COLOURS.find((c) => c.key === key) || COVER_COLOURS[0];

/**
 * The other cover styles (Clothbound, Heirloom, Photo plate, Photo wrap) each have one material, the printed book's
 * own (app-core theme BOOK_PRINT.covers), so the screen shows the board the family chose rather than the keepsake's
 * colour. `print` is the ink the inside pages borrow: the board itself, or the foil on the light linen of a plate.
 */
type Material = { board: string; foil: string; text: string; soft: string };
export function materialColour(style: string): CoverColour | null {
  const m = (BOOK_PRINT.covers as unknown as Record<string, Material | undefined>)[style];
  const named = (COVER_STYLES as { key: string; name: string }[]).find((s) => s.key === style);
  if (!m || !named || style === "keepsake") return null;
  return { key: style, name: named.name, board: m.board, ink: m.text, print: style === "tipped" ? m.foil : m.board };
}

/** The foil and the small print of a material board, for the cover page's title and line. */
export function materialInks(style: string): { foil: string; soft: string } | null {
  const m = (BOOK_PRINT.covers as unknown as Record<string, Material | undefined>)[style];
  return m && style !== "keepsake" ? { foil: m.foil, soft: m.soft } : null;
}

/**
 * The paper the family chose, as the samples' page tokens. Classic is the samples' own ivory, as the phone's reader
 * shows it (BookPagesScreen useReaderBook); Ivory and Antique are the printed book's papers and inks.
 */
type PaperInks = { page: string; ink: string; soft: string; accent: string; rule: string };
export function paperVars(paper: string): Record<string, string> {
  if (paper === "classic") return {};
  const p = (BOOK_PRINT.papers as Record<string, PaperInks | undefined>)[paper];
  if (!p) return {};
  return { "--sb-paper": p.page, "--sb-ink": p.ink, "--sb-ink-soft": p.soft, "--sb-terracotta": p.accent, "--sb-rule": p.rule };
}
