/**
 * The book open on the desk, as the samples page shows it: two facing
 * pages, the cover alone on the right and the back cover alone on the
 * left, turned with Back / Turn page, the arrow keys, a click on a page,
 * and a row of dashes to jump to any spread. The turn is a leaf rotating
 * on its spine (GSAP, 1.1s, a cubic ease); when the person asks for less
 * motion, or on a phone where one page shows at a time, a page simply
 * fades in. Nothing ever slides sideways. "Read this page" gives the
 * spread to the browser's voice.
 *
 * While the book is closed its cover leans toward the pointer the way the
 * book object on the cloth does (useTilt), and a new cover colour sweeps
 * across the board from the side the swatch was pressed on, under the
 * title and the prints, instead of cutting.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import BookPage from "./BookPage";
import { useTilt } from "../../lib/tilt";
import { pageText, spreadOfPage, spreadsOf, type Book, type Page } from "./bookPages";
import { MARK_MASK } from "./markMask";
import { ChevronLeft, ChevronRight, PauseIcon, PlayIcon } from "../icons";
import { canSpeak, chunksOf } from "../../lib/readAloud";
import { track } from "../../lib/analytics";

type View = { left: Page | null; right: Page | null };
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

const isCover = (p: Page | null) => p?.kind === "cover" || p?.kind === "back";

type Sweep = { cover: Book["cover"]; fromLeft: boolean; into: HTMLElement };

export default function BookSpread({ book, sweepFrom }: { book: Book; sweepFrom?: RefObject<number | null> }) {
  const single = useMedia("(max-width: 760px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [reading, setReading] = useState(false);
  const leafRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLElement | null>(null);
  const sweepRef = useRef<HTMLSpanElement>(null);
  // the cover the stage is painted in: it lags behind the book's while a new colour sweeps across
  const [shown, setShown] = useState(book.cover);
  const [sweep, setSweep] = useState<Sweep | null>(null);
  const opened = useRef(false);
  const speaks = canSpeak();

  const views = useMemo<View[]>(() => {
    if (single) return book.pages.map((p) => ({ left: null, right: p }));
    return spreadsOf(book.pages);
  }, [book.pages, single]);

  // The chapter openers, for the chips under the dashes (a real book can run to a hundred pages).
  const chapters = useMemo(
    () =>
      book.pages
        .map((p, i) => (p.kind === "opener" ? { name: p.chapter, view: single ? i : spreadOfPage(i) } : null))
        .filter((c): c is { name: string; view: number } => c !== null),
    [book.pages, single],
  );

  const last = views.length - 1;
  const safeIndex = Math.min(index, last);

  const stop = useCallback(() => {
    if (canSpeak()) window.speechSynthesis.cancel();
    setReading(false);
  }, []);
  // A new page stops the voice; so does leaving.
  useEffect(() => stop, [safeIndex, stop]);

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
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
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

  const read = () => {
    if (reading) return stop();
    const chunks = chunksOf([...pageText(cur.left), ...pageText(cur.right)].filter(Boolean));
    if (!chunks.length) return;
    window.speechSynthesis.cancel();
    setReading(true);
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c.text);
      if (i === chunks.length - 1) u.onend = () => setReading(false);
      u.onerror = () => setReading(false);
      window.speechSynthesis.speak(u);
    });
  };

  // A click on a page turns it: the right half forward, the left half back.
  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (single) return go(e.clientX > r.left + r.width / 2 ? safeIndex + 1 : safeIndex - 1);
    if (safeIndex === 0) return go(1);
    if (safeIndex === last) return go(last - 1);
    go(e.clientX > r.left + r.width / 2 ? safeIndex + 1 : safeIndex - 1);
  };

  const atFront = safeIndex === 0;
  const atBack = safeIndex === last && (single ? isCover(cur.right) : isCover(cur.left) && !cur.right);

  // The closed cover leans toward the pointer, like the book on the cloth; it lies flat again as soon as a leaf turns.
  const closed = atFront && !turn && !single;
  useLayoutEffect(() => {
    coverRef.current = closed ? (stageRef.current?.querySelector<HTMLElement>(".bk-spread > .bk-page.cover") ?? null) : null;
  }, [closed, safeIndex]);
  useTilt(coverRef, closed, { x: 7, y: 5 });

  // A new cover colour: sweep it across the closed cover from the swatch's side; otherwise, or under reduced motion, just wear it.
  useEffect(() => {
    const same = shown.board === book.cover.board && shown.ink === book.cover.ink;
    if (same && !sweep) return;
    if (!same && sweep && sweep.cover.board === book.cover.board) return; // already on its way
    const id = requestAnimationFrame(() => {
      if (same) {
        setSweep(null);
        return;
      }
      const into = atFront && !turn && !reduced ? stageRef.current?.querySelector<HTMLElement>(".bk-spread > .bk-page.cover") : null;
      if (!into) {
        setShown(book.cover);
        return;
      }
      const r = into.getBoundingClientRect();
      const x = sweepFrom?.current;
      setSweep({ cover: book.cover, fromLeft: x != null && x < r.left + r.width / 2, into });
    });
    return () => cancelAnimationFrame(id);
  }, [book.cover, shown, sweep, atFront, turn, reduced, sweepFrom]);
  useEffect(() => {
    const el = sweepRef.current;
    if (!sweep || !el) return;
    const tween = gsap.fromTo(
      el,
      { clipPath: sweep.fromLeft ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.75,
        ease: "power2.inOut",
        onComplete: () => {
          setShown(sweep.cover);
          setSweep(null);
        },
      },
    );
    return () => {
      tween.kill();
    };
  }, [sweep]);
  const where = atFront ? "Front cover" : atBack ? "Back cover" : single ? `Page ${safeIndex} of ${book.pages.length - 2}` : `Spread ${safeIndex} of ${last - 1}`;
  const dotLabel = (i: number) => (i === 0 ? "Front cover" : i === last ? "Back cover" : single ? `Page ${i}` : `Spread ${i}`);

  const style = {
    "--cover": shown.board,
    "--cover-ink": shown.ink,
    "--cover-print": shown.print,
    "--bk-mark": MARK_MASK,
  } as CSSProperties;

  return (
    <section className={`bk-reader samples${single ? " single" : ""}${atFront ? " closed-front" : ""}${atBack ? " closed-back" : ""}`} aria-label={`${book.name}'s book, as pages`} style={style}>
      <div className="bk-stage" onClick={onStageClick} ref={stageRef}>
        <div className="bk-spread" key={single || reduced ? safeIndex : "spread"}>
          {!single && <BookPage page={baseLeft.left} side="left" teller={book.name} />}
          <BookPage page={baseRight.right} side="right" teller={book.name} />
          {turn && next && (
            <div ref={leafRef} className={`bk-leaf ${turn.dir > 0 ? "fwd" : "back"}`} aria-hidden="true">
              <div className="bk-face front">{turn.dir > 0 ? <BookPage page={cur.right} side="right" teller={book.name} /> : <BookPage page={cur.left} side="left" teller={book.name} />}</div>
              <div className="bk-face back">{turn.dir > 0 ? <BookPage page={next.left} side="left" teller={book.name} /> : <BookPage page={next.right} side="right" teller={book.name} />}</div>
            </div>
          )}
        </div>
      </div>
      {sweep && sweep.into.isConnected && createPortal(<span ref={sweepRef} className="bk-sweep" aria-hidden="true" style={{ background: sweep.cover.board }} />, sweep.into)}

      <div className="bk-controls">
        <button type="button" className="btn outline sm" onClick={() => go(safeIndex - 1)} disabled={atFront || !!turn} aria-label="Previous page">
          <ChevronLeft /> Back
        </button>
        <span className="bk-where" aria-live="polite">
          {where}
        </span>
        <button type="button" className="btn outline sm" onClick={() => go(safeIndex + 1)} disabled={safeIndex === last || !!turn} aria-label="Next page">
          {atFront ? "Open the book" : "Turn page"} <ChevronRight />
        </button>
        {speaks && (
          <button type="button" className={`btn outline sm bk-read${reading ? " on" : ""}`} onClick={read} aria-pressed={reading}>
            {reading ? <PauseIcon /> : <PlayIcon />} {reading ? "Stop reading" : "Read this page"}
          </button>
        )}
      </div>

      <div className="bk-dots" role="group" aria-label="Jump to a spread">
        {views.map((_, i) => (
          <button key={i} type="button" className="bk-dot" aria-label={dotLabel(i)} aria-current={i === safeIndex || undefined} onClick={() => go(i)} />
        ))}
      </div>

      {!book.fictional && chapters.length > 1 && (
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
