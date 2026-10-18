/**
 * The book-arts pieces the Family and person pages use (docs/research/
 * decoration-2026.md): the family's initial in a foil cartouche beside its
 * name (D17), the postmark on a line that arrived from somebody in the
 * family (D18), the pressed fern beside the family's name (D19, shown only
 * once the founder's asset is in public/deco), and "Where to next" at the
 * foot of the page (BAOS §38). All decoration is aria-hidden and never
 * takes a pointer.
 */
import { useState } from "react";
import { Link } from "react-router-dom";

/** D17: the family's initial, blocked in foil inside an oval, as a stationer would. */
export function Cartouche({ letter }: { letter: string }) {
  return (
    <svg className="orn-cartouche" viewBox="0 0 72 88" aria-hidden="true" focusable="false">
      <ellipse cx="36" cy="44" rx="34.5" ry="42.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="36" cy="44" rx="30" ry="38" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <text x="36" y="45" textAnchor="middle" dominantBaseline="central" className="orn-cartouche-l">
        {letter}
      </text>
    </svg>
  );
}

/** D18: it arrived. The day and month in the serif inside a franking ring, the outer ring dashed. */
export function Postmark({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const when = `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}`;
  return (
    <svg className="orn-postmark" viewBox="0 0 56 56" aria-hidden="true" focusable="false">
      <circle cx="28" cy="28" r="26.5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2.6 2.6" />
      <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <line x1="10" y1="20" x2="46" y2="20" stroke="currentColor" strokeWidth="0.8" />
      <line x1="10" y1="36" x2="46" y2="36" stroke="currentColor" strokeWidth="0.8" />
      <text x="28" y="28.5" textAnchor="middle" dominantBaseline="central" className="orn-postmark-d">
        {when}
      </text>
    </svg>
  );
}

/** D19: a pressed fern frond beside the family's name; nothing at all until the asset exists. */
export function PressedFern() {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return <img className="orn-pressed" src="/deco/pressed-fern.webp" alt="" aria-hidden="true" onError={() => setGone(true)} />;
}

export type Next = { to: string; title: string; line: string };

/** BAOS §38: three ruled rows at the foot of the page, a title, one line, a round arrow. */
export function WhereNext({ items }: { items: Next[] }) {
  return (
    <nav className="wn" aria-labelledby="wn-h">
      <h2 id="wn-h" className="wn-h">
        Where to next<span className="stop">.</span>
      </h2>
      <ul>
        {items.map((n) => (
          <li key={n.to + n.title}>
            <Link className="wn-row" to={n.to}>
              <span className="wn-t">{n.title}</span>
              <span className="wn-l">{n.line}</span>
              <span className="wn-a" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
