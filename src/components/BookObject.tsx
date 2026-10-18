/**
 * The family's book as an object: its front cover exactly as the reader
 * and astoryapp.com/samples draw it (the keepsake board in the chosen
 * colour, the title in capitals, the year, their photographs as prints,
 * the names and the line in script), standing on the paper with a spine
 * and a contact shadow. It leans a few degrees toward the pointer, the way
 * a book picked up off a table catches the light, and settles back when
 * the pointer leaves. Still under reduced motion and on touch (lib/tilt).
 *
 * The cover is the reader's own page, so a colour chosen on the swatches
 * is the colour here, and the object can never drift from the printed book.
 */
import { useRef, type CSSProperties } from "react";
import { useTilt } from "../lib/tilt";
import BookPage from "./book/BookPage";
import { MARK_MASK } from "./book/markMask";
import type { Book } from "./book/bookPages";

export default function BookObject({ book, width = 300, className = "" }: { book: Book; width?: number | string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, true, { x: 10, y: 7 });
  const cover = book.pages.find((p) => p.kind === "cover") ?? null;
  const style = {
    width,
    "--cover": book.cover.board,
    "--cover-ink": book.cover.ink,
    "--cover-print": book.cover.print,
    "--bk-mark": MARK_MASK,
  } as CSSProperties;
  return (
    <div className={`bk-object bk-reader samples ${className}`.trim()} style={style} aria-label={`${book.title}, the cover`} role="img">
      <div ref={ref} className="bk-object-in">
        <BookPage page={cover} side="right" teller={book.name} />
      </div>
    </div>
  );
}
