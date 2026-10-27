/**
 * Not yet told, under the archive (the phone's NotYetToldScreen, FB-313): each chapter with nothing in it yet, its
 * question in the serif, and the way to answer it as one link to the writer (/write?q=). "Ask me another" walks the
 * bank's other questions for that chapter, the easiest first, and comes round again. Three chapters show; the rest
 * are one press away. Gone once every chapter has its first memory.
 */
import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "../icons";
import { smarten } from "../../lib/typography";
import { NOT_YET_TOLD_LIMIT, notYetTold, untoldLine } from "./untold";
import type { Story } from "../../data/stories";

export default function NotYetTold({ story, relative = false }: { story: Story; relative?: boolean }) {
  // in the voice the writer will ask it in, so the words don't change on "Answer it"
  const chapters = useMemo(() => notYetTold(story, { relative }), [story, relative]);
  // which question each chapter is on ("Ask me another")
  const [turns, setTurns] = useState<Record<string, number>>({});
  const [all, setAll] = useState(false);
  const headId = useId();

  if (!chapters.length) return null;
  const shown = all ? chapters : chapters.slice(0, NOT_YET_TOLD_LIMIT);
  const others = chapters.length - shown.length;

  return (
    <section className="arc-untold" aria-labelledby={headId}>
      <h2 id={headId}>Not yet told</h2>
      <p className="arc-untold-line">{untoldLine(chapters.length)}. One question is enough to start one.</p>
      <ul className="arc-untold-list">
        {shown.map((c) => {
          const q = c.questions[(turns[c.era] || 0) % c.questions.length];
          const words = smarten(q.question);
          return (
            <li key={c.era} className="arc-untold-row">
              <p className="arc-untold-era">{c.era}</p>
              <p className="arc-untold-q" aria-live="polite">
                {words}
              </p>
              <div className="arc-untold-acts">
                <Link className="arc-untold-go" to={`/write?q=${encodeURIComponent(q.id)}`} aria-label={`Answer: ${words}`}>
                  Answer it
                  <ChevronRight aria-hidden="true" />
                </Link>
                {c.questions.length > 1 && (
                  <button type="button" className="arc-untold-another" onClick={() => setTurns((t) => ({ ...t, [c.era]: (t[c.era] || 0) + 1 }))} aria-label={`Ask me another about ${c.era}`}>
                    Ask me another
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {others > 0 && (
        <button type="button" className="arc-untold-more" onClick={() => setAll(true)}>
          {others === 1 ? "Show the other chapter" : `Show the other ${others} chapters`}
        </button>
      )}
    </section>
  );
}
