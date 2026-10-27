/**
 * The choices drawn as the things they make (Bao's Standard rule 39; the
 * phone's Specimen): a cover in its own material, a page on its own paper.
 * The colours are the printed book's (app-core theme BOOK_PRINT), the
 * keepsake's from the samples page (coverColours), so a specimen is the
 * cloth and paper that print, not an interface colour.
 *
 * A small specimen is drawn, not written: bars where the words go, since
 * words at that size could not be read. The large cover (the rail's, for
 * a style other than our keepsake, which BookObject draws exactly) sets
 * the family's own title and line, with the photograph the book prints:
 * across the board for Photo wrap, set into it for Photo plate.
 */
import type { CSSProperties } from "react";
import { BOOK_PRINT } from "../../../app-core/theme/index.js";
import { usePhotoUrl } from "../../../lib/photoUrls";
import { coverColour } from "../coverColours";

type Board = { board: string; foil: string; text: string };

/** The board, foil and lettering a cover style prints in. */
function coverMaterial(style: string, color: string): Board {
  if (style === "keepsake") {
    const c = coverColour(color);
    return { board: c.board, foil: c.ink, text: c.ink };
  }
  const m = (BOOK_PRINT.covers as unknown as Record<string, { board: string; foil: string; text: string }>)[style] ?? BOOK_PRINT.covers.cloth;
  return { board: m.board, foil: m.foil, text: m.text };
}

export function CoverSpecimen({
  style,
  color,
  words,
  photo = null,
  className = "",
}: {
  style: string;
  color: string;
  /** The cover's words, set on a large specimen; a small one draws bars. */
  words?: { title: string; line: string; name: string };
  /** The cover's photograph (app-core coverPhoto), drawn on a large specimen of a photo style. */
  photo?: string | null;
  className?: string;
}) {
  const m = coverMaterial(style, color);
  const css = { "--bd-board": m.board, "--bd-foil": m.foil, "--bd-letter": m.text } as CSSProperties;
  const shape = words && photo && (style === "wrap" || style === "tipped") ? style : "";
  const src = usePhotoUrl(shape ? photo : null);
  return (
    <span
      className={`bd-cover bd-cover-${style}${words ? " bd-cover-lg" : ""}${shape ? ` bd-cover-has-${shape}` : ""} ${className}`.trim()}
      style={css}
      aria-hidden={words ? undefined : true}
    >
      {words ? (
        <>
          {shape === "wrap" && <span className="bd-cover-wrapphoto" aria-hidden="true" style={src ? { backgroundImage: `url("${src}")` } : undefined} />}
          <span className="bd-cover-title">{words.title}</span>
          {shape !== "wrap" && <i className="bd-cover-rule" />}
          <span className="bd-cover-line">{words.line}</span>
          {shape === "tipped" && <span className="bd-cover-plate">{src && <img src={src} alt="" />}</span>}
          <span className="bd-cover-name">{words.name}</span>
        </>
      ) : (
        <>
          <i className="bd-bar bd-bar-title" />
          <i className="bd-cover-rule" />
          <i className="bd-bar bd-bar-line" />
        </>
      )}
    </span>
  );
}

export function PaperSpecimen({ paper }: { paper: string }) {
  const p = (BOOK_PRINT.papers as unknown as Record<string, { page: string; ink: string; heading: string; accent: string; rule: string }>)[paper] ?? BOOK_PRINT.papers.classic;
  const css = { "--bd-page": p.page, "--bd-ink": p.ink, "--bd-heading": p.heading, "--bd-accent": p.accent, "--bd-rule": p.rule } as CSSProperties;
  return (
    <span className="bd-paper" style={css} aria-hidden="true">
      <i className="bd-bar bd-bar-kicker" />
      <i className="bd-bar bd-bar-head" />
      <i className="bd-bar bd-bar-text" />
      <i className="bd-bar bd-bar-text" />
      <i className="bd-bar bd-bar-text short" />
    </span>
  );
}
