/**
 * The book beside the storyteller: the teal cloth, how full it is, and the
 * one button that opens it.
 */
import { ButtonLink } from "../ui";
import { bookProgress } from "../../app-core/lib/bookProgress.js";
import type { Story } from "../../data/stories";

type Progress = { count: number; remaining: number; ratio: number; headline: string; chaptersCovered: number; chaptersTotal: number; state: string };

export default function BookCard({ story }: { story: Story }) {
  const p = bookProgress(story) as Progress;
  const pct = Math.round(p.ratio * 100);
  const own = story.relationship === "Myself";
  const line =
    p.state === "empty"
      ? "Three memories and the first chapter appears."
      : p.remaining > 0
        ? `About ${p.remaining} more ${p.remaining === 1 ? "memory" : "memories"} and the first edition can be printed.`
        : p.state === "lopsided"
          ? `${p.chaptersCovered} of ${p.chaptersTotal} chapters have something in them.`
          : "Every chapter has something in it.";
  return (
    <section className="card arc-book" id="book" aria-label={own ? "Your book" : `${story.name}'s book`} data-arrive>
      <img src="/book/closed-640.webp" alt="" width={128} />
      <div>
        <h2>{own ? "Your book" : `${story.name}'s book`}</h2>
        <p className="n">
          {p.count}
          <small>{p.headline}</small>
        </p>
        <div className="progress" style={{ ["--pct" as string]: `${Math.max(6, pct)}%` }} role="img" aria-label={`${pct}% of the way to a first edition`}>
          <div className="bar">{pct}%</div>
          <div className="mark" />
          <div className="comb" />
          <div className="end">100%</div>
        </div>
        <p className="meta" style={{ marginTop: 8 }}>{line}</p>
        <div className="acts">
          <ButtonLink to="/book" small>
            Open the book
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
