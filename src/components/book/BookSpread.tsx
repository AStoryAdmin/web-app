/**
 * The book open on the desk: two facing pages, turned with Previous / Next,
 * the arrow keys, a page scrubber and the chapter chips. The turn is a leaf
 * rotating on its spine (GSAP, 1.1s, a cubic ease); when the person asks
 * for less motion, or on a phone where one page shows at a time, a page
 * simply fades in. Nothing ever slides sideways.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import BookPage from "./BookPage";
import { pageNumber, spreadOfPage, spreadsOf, type Book, type Page } from "./bookPages";
import { ChevronLeft, ChevronRight } from "../icons";
import { track } from "../../lib/analytics";

type View = { left: Page | null; right: Page | null; leftNo: number | null; rightNo: number | null };
type Turn = { to: number; dir: 1 | -1 };

function useMedia(query: string): boolean {
  const [on, setOn] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setOn(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return on;
}

export default function BookSpread({ book }: { book: Book }) {
  const single = useMedia("(max-width: 760px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const opened = useRef(false);

  const views = useMemo<View[]>(() => {
    if (single) return book.pages.map((p, i) => ({ left: null, right: p, leftNo: null, rightNo: pageNumber(i) }));
    return spreadsOf(book.pages).map((s, i) => ({
      left: s.left,
      right: s.right,
      leftNo: i === 0 ? null : pageNumber(2 * i - 1),
      rightNo: i === 0 ? null : s.right ? pageNumber(2 * i) : null,
    }));
  }, [book.pages, single]);

  // The chapter openers, for the chips under the scrubber.
  const chapters = useMemo(
    () =>
      book.pages
        .map((p, i) => (p.kind === "chapter" ? { name: p.chapter, view: single ? i : spreadOfPage(i) } : null))
        .filter((c): c is { name: string; view: number } => c !== null),
    [book.pages, single],
  );

  const last = views.length - 1;
  const safeIndex = Math.min(index, last);

  const go = useCallback(
    (to: number) => {
      const target = Math.max(0, Math.min(last, to));
      if (target === safeIndex || turn) return;
      if (!opened.current) {
        opened.current = true;
        track("book_preview_opened", { pages: book.pages.length });
      }
      if (single || reduced) setIndex(target);
      else setTurn({ to: target, dir: target > safeIndex ? 1 : -1 });
    },
    [last, safeIndex, turn, single, reduced, book.pages.length],
  );

  // The leaf turns; when it lands, the new spread is the spread.
  useEffect(() => {
    if (!turn || !leafRef.current) return;
    const { to, dir } = turn;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        leafRef.current,
        { rotateY: 0 },
        {
          rotateY: dir > 0 ? -180 : 180,
          duration: 1.1,
          ease: "power2.inOut",
          onComplete: () => {
            setIndex(to);
            setTurn(null);
          },
        },
      );
    });
    return () => ctx.revert();
  }, [turn]);

  // Arrow keys turn the pages, unless the person is typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(safeIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(safeIndex - 1);
      } else if (e.key === "Home") {
        go(0);
      } else if (e.key === "End") {
        go(last);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, safeIndex, last]);

  const cur = views[safeIndex];
  const next = turn ? views[turn.to] : null;

  // What sits on the desk while the leaf turns: the pages the leaf is not covering.
  const baseLeft = turn && next && turn.dir < 0 ? next : cur;
  const baseRight = turn && next && turn.dir > 0 ? next : cur;

  const where = single
    ? cur.rightNo != null
      ? `Page ${cur.rightNo} of ${last}`
      : "Cover"
    : cur.leftNo != null
      ? cur.rightNo != null
        ? `Pages ${cur.leftNo}–${cur.rightNo} of ${book.pages.length - 1}`
        : `Page ${cur.leftNo} of ${book.pages.length - 1}`
      : "Cover";

  return (
    <section className={`bk-reader${single ? " single" : ""}`} aria-label={`${book.name}'s book, as pages`} ref={rootRef}>
      <div className="bk-stage">
        <div className="bk-spread" key={single || reduced ? safeIndex : "spread"}>
          {!single && <BookPage page={baseLeft.left} number={baseLeft.leftNo} side="left" teller={book.name} />}
          <BookPage page={baseRight.right} number={baseRight.rightNo} side="right" teller={book.name} />
          {turn && next && (
            <div ref={leafRef} className={`bk-leaf ${turn.dir > 0 ? "fwd" : "back"}`} aria-hidden="true">
              <div className="bk-face front">
                {turn.dir > 0 ? <BookPage page={cur.right} number={cur.rightNo} side="right" teller={book.name} /> : <BookPage page={cur.left} number={cur.leftNo} side="left" teller={book.name} />}
              </div>
              <div className="bk-face back">
                {turn.dir > 0 ? <BookPage page={next.left} number={next.leftNo} side="left" teller={book.name} /> : <BookPage page={next.right} number={next.rightNo} side="right" teller={book.name} />}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bk-controls">
        <button type="button" className="btn outline sm" onClick={() => go(safeIndex - 1)} disabled={safeIndex === 0 || !!turn} aria-label="Previous page">
          <ChevronLeft /> Previous
        </button>
        <label className="bk-scrub">
          <span className="sr-only">Go to a page</span>
          <input type="range" min={0} max={last} value={safeIndex} onChange={(e) => go(Number(e.target.value))} aria-valuetext={where} />
          <span className="bk-where" aria-live="polite">
            {where}
          </span>
        </label>
        <button type="button" className="btn outline sm" onClick={() => go(safeIndex + 1)} disabled={safeIndex === last || !!turn} aria-label="Next page">
          Next <ChevronRight />
        </button>
      </div>

      {chapters.length > 1 && (
        <div className="chiprow bk-chapters" role="group" aria-label="Go to a chapter">
          {chapters.map((c) => (
            <button key={c.name} type="button" className="chip big" aria-pressed={safeIndex >= c.view && (chapters.find((n) => n.view > c.view)?.view ?? Infinity) > safeIndex} onClick={() => go(c.view)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
