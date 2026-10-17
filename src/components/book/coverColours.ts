/**
 * The seven keepsake cover colours as astoryapp.com/samples shows them
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
import { KEEPSAKE_COLORS } from "../../app-core/lib/bookDesign.js";

export type CoverColour = { key: string; name: string; board: string; ink: string; print: string };

const SWATCH: Record<string, { board: string; ink: string; print: string }> = {
  navy: { board: "#1e3962", ink: "#f3ebdd", print: "#1e3962" },
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
