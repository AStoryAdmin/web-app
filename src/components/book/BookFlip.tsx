/**
 * Looking through the book before it is printed (P4-R2): the exact pages of
 * the file that will print, one at a time, cover first. The pictures are the
 * ones printPdf.ts drew into the PDF (prepareBookPdfs `pages`), so what the
 * family approves is what the printer gets; a blank page at the back is shown
 * as blank paper and said to be blank.
 *
 * It sits on the order page and opens full screen. Large Previous and Next
 * buttons, the arrow keys (Home and End too), and a swipe on a touch screen
 * turn the page; Escape or Close leaves full screen. Nothing animates: a page
 * that turns is a page that changes (DESIGN.md: interfaces don't move).
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";

type Props = {
  /** One picture per page of the interior; null for a blank page. */
  pages: (string | null)[];
  /** The cover laid flat, when there is a picture of it. */
  cover: string | null;
  /** Whose book, for the pictures' descriptions: "Rose’s book". */
  title: string;
};

type Leaf = { src: string | null; label: string; cover: boolean };

/** How far a finger has to travel sideways to turn a page. */
const SWIPE_PX = 40;

export default function BookFlip({ pages, cover, title }: Props) {
  const leaves: Leaf[] = [
    ...(cover ? [{ src: cover, label: "The cover", cover: true }] : []),
    ...pages.map((src, i) => ({ src, label: `Page ${i + 1} of ${pages.length}${src ? "" : ", a blank page"}`, cover: false })),
  ];
  const [at, setAt] = useState(0);
  const [full, setFull] = useState(false);
  const last = leaves.length - 1;
  const index = Math.min(at, Math.max(0, last));
  const go = useCallback((n: number) => setAt(Math.max(0, Math.min(last, n))), [last]);

  const keys = (e: KeyboardEvent | ReactKeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "PageDown") go(index + 1);
    else if (e.key === "ArrowLeft" || e.key === "PageUp") go(index - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(last);
    else if (e.key === "Escape" && full) setFull(false);
    else return;
    e.preventDefault();
  };

  // a swipe: where the finger went down, read where it comes up
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = down.current;
    down.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(index + (dx < 0 ? 1 : -1));
  };

  // full screen: the keys anywhere on the page, the page behind still, focus on Close and back on the opener after
  const opener = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const latestKeys = useRef(keys);
  useEffect(() => {
    latestKeys.current = keys;
  });
  useEffect(() => {
    if (!full) return;
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => latestKeys.current(e);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = was;
    };
  }, [full]);
  // back from full screen, focus returns to the button that opened it
  const wasFull = useRef(false);
  useEffect(() => {
    if (wasFull.current && !full) opener.current?.focus();
    wasFull.current = full;
  }, [full]);

  if (leaves.length === 0) return null;
  const leaf = leaves[index];

  const view = (
    <div
      className="bf"
      data-full={full || undefined}
      role={full ? "dialog" : "group"}
      aria-modal={full || undefined}
      aria-roledescription="book"
      aria-label={`${title}, as it will print`}
      tabIndex={full ? -1 : 0}
      onKeyDown={full ? undefined : keys}
    >
      <div className="bf-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (down.current = null)}>
        {leaf.src ? (
          <img className="bf-page" data-cover={leaf.cover || undefined} src={leaf.src} alt={`${title}: ${leaf.label}`} draggable={false} />
        ) : (
          <div className="bf-page bf-blank" role="img" aria-label={`${title}: ${leaf.label}`}>
            <span>A blank page</span>
          </div>
        )}
      </div>
      <div className="bf-bar">
        <button type="button" className="bf-turn" onClick={() => go(index - 1)} disabled={index === 0}>
          <span aria-hidden="true">‹</span> Previous page
        </button>
        <output className="bf-where" aria-live="polite">
          {leaf.label}
        </output>
        <button type="button" className="bf-turn" onClick={() => go(index + 1)} disabled={index === last}>
          Next page <span aria-hidden="true">›</span>
        </button>
      </div>
      {full ? (
        <button ref={close} type="button" className="bf-full-toggle" onClick={() => setFull(false)}>
          Close
        </button>
      ) : (
        <button ref={opener} type="button" className="bf-full-toggle" onClick={() => setFull(true)}>
          Look through it full screen
        </button>
      )}
    </div>
  );

  return full ? (
    <>
      <div className="bf-placeholder" aria-hidden="true" />
      {createPortal(<div className="bf-scrim">{view}</div>, document.body)}
    </>
  ) : (
    view
  );
}
