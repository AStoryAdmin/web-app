/**
 * The chapters in the order the book prints them, each with its memories:
 * move a chapter earlier or later with its two buttons (never only by
 * dragging), and open it to put a memory in or keep it out (the phone's
 * "Which memories go in" and BookContents). Quiet ruled rows on the paper,
 * an In or Out at the end of each memory, the reason beside one that is out.
 *
 * The storyteller's own press keeps a memory out, and only they put it back;
 * anyone else sees "Rose kept this out" and can't switch it (S-PL8).
 */
import { useRef, useState } from "react";
import { inBookCount, memoryLocked, memoryWhy, stateOf, type BookDesign, type DesignChapter } from "../../../data/bookDesign";
import type { Memory } from "../../../data/stories";

const count = (n: number) => `${n} ${n === 1 ? "memory" : "memories"}`;

export default function ChapterList({
  chapters,
  design,
  asStoryteller,
  tellerName,
  canReorder,
  onMove,
  onPress,
}: {
  chapters: DesignChapter[];
  design: BookDesign;
  asStoryteller: boolean;
  tellerName: string;
  /** False for a book set by year: its parts follow the calendar. */
  canReorder: boolean;
  onMove: (era: string, step: -1 | 1) => void;
  onPress: (memory: Memory) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const list = useRef<HTMLOListElement>(null);

  const move = (era: string, name: string, step: -1 | 1) => {
    const at = chapters.findIndex((c) => c.era === era) + step;
    onMove(era, step);
    setSaid(`${name} is now chapter ${at + 1} of ${chapters.length}.`);
    // the row moved under the pointer: keep focus on its button, or on the other one at either end
    requestAnimationFrame(() => {
      const row = list.current?.querySelector<HTMLElement>(`[data-era="${CSS.escape(era)}"]`);
      const same = row?.querySelector<HTMLButtonElement>(`[data-step="${step}"]`);
      (same && !same.disabled ? same : row?.querySelector<HTMLButtonElement>(`[data-step="${-step}"]`))?.focus();
    });
  };

  return (
    <>
      <ol className="bd-chapters" ref={list}>
        {chapters.map((c, i) => {
          const isOpen = open === c.era;
          const inBook = inBookCount(design, c.items);
          const panel = `bd-ch-${i}`;
          return (
            <li key={c.era} className="bd-chapter" data-era={c.era} data-open={isOpen || undefined}>
              <div className="bd-chapter-row">
                <button type="button" className="bd-chapter-open" aria-expanded={isOpen} aria-controls={panel} onClick={() => setOpen(isOpen ? null : c.era)}>
                  <span className="bd-chapter-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="bd-chapter-words">
                    <b>{c.name}</b>
                    <span>{inBook === c.items.length ? count(c.items.length) : `${inBook} of ${count(c.items.length)} in the book`}</span>
                  </span>
                  <span className="bd-chapter-chev" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {canReorder && (
                  <span className="bd-movers">
                    <button type="button" className="bd-mover" data-step={-1} aria-label={`Move ${c.name} earlier`} disabled={i === 0} onClick={() => move(c.era, c.name, -1)}>
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button type="button" className="bd-mover" data-step={1} aria-label={`Move ${c.name} later`} disabled={i === chapters.length - 1} onClick={() => move(c.era, c.name, 1)}>
                      <span aria-hidden="true">↓</span>
                    </button>
                  </span>
                )}
              </div>
              <ul id={panel} className="bd-memories" hidden={!isOpen}>
                {c.items.map((m) => {
                  const state = stateOf(design, m);
                  const locked = memoryLocked(design, m, asStoryteller);
                  const why = memoryWhy(design, m, asStoryteller, tellerName);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={state.in}
                        className="bd-memory"
                        data-in={state.in || undefined}
                        disabled={locked}
                        onClick={() => onPress(m)}
                      >
                        <span className="bd-memory-words">
                          <span className="bd-memory-title">{m.title || "A memory"}</span>
                          {why && <span className="bd-memory-why">{why}</span>}
                        </span>
                        <span className="bd-memory-mark">{state.in ? "In" : "Out"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" role="status">
        {said}
      </p>
    </>
  );
}
