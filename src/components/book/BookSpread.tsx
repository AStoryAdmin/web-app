/**
 * The book open on the desk, as the samples page shows it: two facing
 * pages, the cover alone on the right and the back cover alone on the
 * left, turned with Back / Turn page, the arrow keys, a click on a page,
 * or the contents and chapter chips to jump; the dashes under it only show
 * where you are. The turn is a leaf rotating on its spine (GSAP, 0.9s on
 * the samples' own curve); from the keyboard it
 * turns in 250ms, and presses made during a turn are queued, never
 * dropped. When the person asks for less motion, or on a phone where one
 * page shows at a time, a page simply fades in. Under the book, the
 * samples' note for the spread ("Linen hardcover", "Endpapers", the
 * chapter) and "Read this page", which gives the spread to the browser's
 * voice.
 *
 * While the book is closed its cover leans toward the pointer the way the
 * book object on the cloth does (useTilt), and a new cover colour sweeps
 * across the board from the side the swatch was pressed on, under the
 * title and the prints, instead of cutting.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import BookPage from "./BookPage";
import { useTilt } from "../../lib/tilt";
import { pageText, spreadOfPage, spreadsOf, type Book, type Page } from "./bookPages";
import { MARK_MASK } from "./markMask";
import { paperVars } from "./coverColours";
import { ChevronLeft, ChevronRight, PauseIcon, PlayIcon } from "../icons";
import { canSpeak, chunksOf } from "../../lib/readAloud";
import { track } from "../../lib/analytics";
import { MOVE, OUT } from "../../lib/ease";

type View = { left: Page | null; right: Page | null };
type Turn = { to: number; dir: 1 | -1; fast: boolean };

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

gsap.registerPlugin(CustomEase);
/** The samples' leaf: cubic-bezier(.45,.05,.25,1) over 0.9s, so a page turns here exactly as it turns there. */
const LEAF_EASE = CustomEase.create("bk-leaf", "M0,0 C0.45,0.05 0.25,1 1,1");

/**
 * The samples' note for a spread: a name, and for the parts every book shares a line about them (its NOTES table,
 * in this app's words). Memory spreads are named by their chapter.
 */
function noteOf(view: View, i: number, last: number): [string, string] {
  const kinds = [view.left?.kind, view.right?.kind];
  for (const p of [view.right, view.left]) {
    if (!p) continue;
    if (p.kind === "memory" || p.kind === "deeper" || p.kind === "opener") return [p.chapter, ""];
    if (p.kind === "little") return [p.title, ""];
  }
  if (kinds.includes("cover")) return ["Linen hardcover", "Seven cover colours, with the title, the names and the photographs."];
  if (kinds.includes("back")) return ["Back cover", "A dedication to the whole family."];
  if (kinds.includes("final")) return ["The story keeps going", "The book is one edition. The archive keeps growing, and the code takes you there."];
  if (kinds.includes("endpaper")) return ["Endpapers", i > last / 2 ? "The book closes the way it opened." : "The inside covers carry the A Story mark in the cover colour."];
  if (kinds.includes("title") || kinds.includes("colophon")) return ["Title & colophon", "Every book says how it was made."];
  if (kinds.includes("dedication") || kinds.includes("contents")) return ["Dedication & contents", ""];
  return ["", ""];
}

/**
 * `rail`, when given, lays the book out as a desk: the book's own contents (the cover, the contents page, every
 * chapter, the last page) in a column beside it, then whatever the page puts there (the cover colours, print at
 * home), and the spread takes the rest of the window. Without it, the book stands alone (the front door).
 */
export default function BookSpread({ book, sweepFrom, rail }: { book: Book; sweepFrom?: RefObject<number | null>; rail?: ReactNode }) {
  // one page at a time on a phone, and on a window taller than it is wide (the samples' own rule)
  const single = useMedia("(max-width: 760.98px), (max-aspect-ratio: 9/10)");
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

  // The book's own contents, for the desk: the cover, the contents page, each chapter's opener, the last page.
  const contents = useMemo(() => {
    const at = (kind: Page["kind"]) => {
      const i = book.pages.findIndex((p) => p.kind === kind);
      return i < 0 ? -1 : single ? i : spreadOfPage(i);
    };
    const rows: { key: string; num: string; name: string; view: number }[] = [{ key: "cover", num: "", name: "The cover", view: 0 }];
    const c = at("contents");
    if (c > 0) rows.push({ key: "contents", num: "", name: "Contents", view: c });
    chapters.forEach((ch, i) => rows.push({ key: `ch-${ch.name}`, num: String(i + 1), name: ch.name, view: ch.view }));
    const f = at("final");
    if (f > 0) rows.push({ key: "final", num: "", name: "The last page", view: f });
    return rows;
  }, [book.pages, chapters, single]);

  const stop = useCallback(() => {
    if (canSpeak()) window.speechSynthesis.cancel();
    setReading(false);
  }, []);
  // A new page stops the voice; so does leaving.
  useEffect(() => stop, [safeIndex, stop]);

  // A press made while a leaf is turning waits here, and is played the moment the leaf lands.
  const pending = useRef<{ to: number; fast: boolean } | null>(null);
  const go = useCallback(
    (to: number, fast = false) => {
      const target = Math.max(0, Math.min(last, to));
      if (turn) {
        pending.current = { to: target, fast };
        return;
      }
      if (target === safeIndex) return;
      if (!opened.current) {
        opened.current = true;
        track("book_preview_opened", { pages: book.pages.length });
      }
      if (single || reduced) setIndex(target);
      else setTurn({ to: target, dir: target > safeIndex ? 1 : -1, fast });
    },
    [last, safeIndex, turn, single, reduced, book.pages.length],
  );
  // the leaf has landed: play what was pressed meanwhile
  useEffect(() => {
    if (turn || !pending.current) return;
    const p = pending.current;
    pending.current = null;
    go(p.to, p.fast);
  }, [turn, go]);

  // One page at a time (a phone, or less motion): the new page fades in on GSAP, so the motion watchdog can finish it
  // if the frame clock stalls; a CSS animation could sit at opacity 0. Under reduced motion it is the 150ms crossfade.
  const spreadRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = spreadRef.current;
    if (!el || !(single || reduced)) return;
    const tween = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.15 : 0.24, ease: OUT, clearProps: "opacity" });
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: "opacity" });
    };
  }, [safeIndex, single, reduced]);

  // The leaf turns; when it lands, the new spread is the spread.
  useEffect(() => {
    if (!turn || !leafRef.current) return;
    const { to, dir, fast } = turn;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        leafRef.current,
        { rotateY: 0 },
        {
          rotateY: dir > 0 ? -180 : 180,
          duration: fast ? 0.25 : 0.9,
          ease: fast ? OUT : LEAF_EASE,
          onComplete: () => {
            setIndex(to);
            setTurn(null);
          },
        },
      );
    });
    return () => ctx.revert();
  }, [turn]);

  // The left and right arrows turn the pages (quickly, and every press counts), unless the person is typing or holds
  // a modifier. Page Up, Page Down, Home and End are left to the page, so the keyboard can still scroll it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const from = pending.current?.to ?? turn?.to ?? safeIndex;
      go(from + (e.key === "ArrowRight" ? 1 : -1), true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, safeIndex, turn]);

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
        duration: 0.45,
        ease: MOVE,
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
  const [noteK, noteP] = noteOf(cur, safeIndex, last);
  // the book opens and closes while the leaf turns: the slide to centre runs with the turn, not after it
  const slidFront = atFront && !turn;
  const slidBack = atBack && !turn;
  const where = atFront ? "Front cover" : atBack ? "Back cover" : single ? `Page ${safeIndex} of ${book.pages.length - 2}` : `Spread ${safeIndex} of ${last - 1}`;

  const style = {
    "--cover": shown.board,
    "--cover-ink": shown.ink,
    "--cover-print": shown.print,
    "--bk-mark": MARK_MASK,
    // the paper the family chose in Cover and layout, its page and inks (classic keeps the samples' own)
    ...paperVars(book.paper),
  } as CSSProperties;

  // the row of the contents the reader is in: the last one whose spread is at or before this one
  const currentRow = [...contents].reverse().find((r) => r.view <= safeIndex)?.key;

  const reader = (
    <>
      <div className="bk-stage" onClick={onStageClick} ref={stageRef}>
        <div className="bk-spread" ref={spreadRef} key={single || reduced ? safeIndex : "spread"}>
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

      <div className={`bk-under${rail ? " bk-row" : ""}`}>
        <p className="bk-caption" aria-live="polite">
          {noteK && <b>{noteK}</b>}
          {noteP && <span>{noteP}</span>}
        </p>
        <div className="bk-controls">
          {/* on the front cover, as on the samples page, Back is there and disabled (a phone takes it out of the row) */}
          <button type="button" className={`btn outline sm bk-back${atFront ? " at-front" : ""}`} onClick={() => go(safeIndex - 1)} disabled={atFront} aria-label="Previous page">
            <ChevronLeft /> Back
          </button>
          <span className="bk-where" aria-live="polite">
            {where}
          </span>
          <button type="button" className="btn outline sm bk-next" onClick={() => go(safeIndex + 1)} disabled={safeIndex === last} aria-label="Next page">
            {atFront ? "Open the book" : "Turn page"} <ChevronRight />
          </button>
        </div>
        {speaks ? (
          <button type="button" className={`btn outline sm bk-read${reading ? " on" : ""}`} onClick={read} aria-pressed={reading}>
            {reading ? <PauseIcon /> : <PlayIcon />} {reading ? "Stop reading" : "Read this page"}
          </button>
        ) : (
          <span className="bk-read-none" aria-hidden="true" />
        )}
        {/* the dashes are a quiet hairline of where you are; the jump is the contents beside the book, or the chapters
            under it on the front door (a 22px dash can't be a 44px target without crowding its neighbours) */}
        <div className="bk-dots bk-dots-quiet" aria-hidden="true">
          {views.map((_, i) => (
            <span key={i} className="bk-dot" aria-current={i === safeIndex || undefined} />
          ))}
        </div>
      </div>
    </>
  );

  const cls = `bk-reader samples${rail ? " bk-desk" : ""}${single ? " single" : ""}${slidFront ? " closed-front" : ""}${slidBack ? " closed-back" : ""}`;

  if (rail) {
    return (
      <section className={cls} aria-label={`${book.name}’s book, as pages`} style={style}>
        <aside className="bk-rail">
          <nav className="bk-contents" aria-label="Contents of the book">
            <p className="bk-rail-label">Contents</p>
            <ol>
              {contents.map((r) => (
                <li key={r.key}>
                  <button type="button" onClick={() => go(r.view)} aria-current={currentRow === r.key ? "true" : undefined}>
                    <span className="n">{r.num}</span>
                    <span className="t">{r.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          {rail}
        </aside>
        <div className="bk-main">{reader}</div>
      </section>
    );
  }

  return (
    <section className={cls} aria-label={`${book.name}’s book, as pages`} style={style}>
      {reader}

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
