/**
 * The strip of years at the foot of a memory: one small pill for every
 * year this story has memories in, the memory's own year filled, each
 * opening that year in the Archive. Time as a row you can look along.
 */
import { Link } from "react-router-dom";
import { archiveStats } from "../../app-core/lib/timeline.js";
import type { Story } from "../../data/stories";

export default function YearStrip({ story, year }: { story: Story; year: number | null }) {
  const { years } = archiveStats(story) as { years: number[] };
  if (!years.length) return null;
  return (
    <nav className="ystrip" aria-label="Years in this story" data-rise>
      {years.map((y) => (
        <Link key={y} to={`/archive#y${y}`} className={y === year ? "on" : undefined} aria-current={y === year ? "true" : undefined}>
          {y}
        </Link>
      ))}
    </nav>
  );
}
