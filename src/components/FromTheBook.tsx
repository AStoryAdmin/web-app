/**
 * From the book: one earlier memory brought back to the Home page for the
 * day, in the serif, with where it came from and a way back to it. The
 * same one all day, a different one tomorrow (lib/resurface.ts).
 */
import { Link } from "react-router-dom";
import { resurface } from "../lib/resurface";
import { smarten } from "../lib/typography";
import { toldBy } from "../lib/memoryDisplay";
import type { Story } from "../data/stories";

export default function FromTheBook({ story }: { story: Story }) {
  const r = resurface(story);
  if (!r) return null;
  const title = r.memory.title?.trim() || "Untitled";
  return (
    <section className="card fromthebook" aria-label="From the book" data-rise>
      <p className="label">
        {r.kicker}
        {r.age ? ` · ${r.age}` : ""}
      </p>
      <blockquote>
        <p className="said">
          <span className="omark">“</span>
          {smarten(r.quote)}”
        </p>
      </blockquote>
      <footer>
        <span className="meta">
          <b>{title}</b> · {toldBy(r.memory, story)}
        </span>
        <Link className="more" to={`/archive/${r.memory.id}`}>
          Read it again
        </Link>
      </footer>
    </section>
  );
}
