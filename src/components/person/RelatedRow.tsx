/**
 * "Related memories": a row of three small prints from the same chapter or
 * the same year as what is on the rail, each with its title under it.
 */
import { Link } from "react-router-dom";
import { usePhotoUrl } from "../../lib/photoUrls";
import { paperFor } from "../../lib/memoryDisplay";
import type { Found } from "./personRail";
import type { Memory } from "../../data/stories";

function cover(m: Memory): string | null {
  const all = m.photos || [];
  return (m.cover && all.includes(m.cover) ? m.cover : all[0]) || null;
}

function Thumb({ memory }: Found) {
  const photo = usePhotoUrl(cover(memory));
  const paper = paperFor(memory);
  const title = memory.title?.trim() || "Untitled";
  return (
    <Link className="pp-thumb" to={`/archive/${memory.id}`}>
      <span className={`pp-thumb-print${cover(memory) ? "" : ` text${paper ? ` ${paper}` : ""}`}`} aria-hidden="true">
        {cover(memory) ? <img src={photo ?? undefined} alt="" loading="lazy" data-develop /> : <span>{title.trim()[0] || "“"}</span>}
      </span>
      <span className="pp-thumb-title">{title}</span>
    </Link>
  );
}

export default function RelatedRow({ items }: { items: Found[] }) {
  if (!items.length) return null;
  return (
    <section className="pp-related" aria-labelledby="pp-related-h" data-rise>
      <h2 id="pp-related-h">Related memories</h2>
      <div className="pp-thumbs">
        {items.map((f) => (
          <Thumb key={f.memory.id} {...f} />
        ))}
      </div>
    </section>
  );
}
