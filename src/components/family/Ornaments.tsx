/**
 * The book-arts pieces the Family and person pages use (docs/research/
 * decoration-2026.md): the family's initial in a foil cartouche beside its
 * name (D17), the postmark on a line that arrived from somebody in the
 * family (D18), and "Where to next" at the foot of the page (BAOS §38).
 * The pressed fern beside the family's name (D19) waits for the founder's
 * asset in public/deco; nothing requests it until then. All decoration is aria-hidden and never
 * takes a pointer.
 */
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

/** The foil star that sits on a section's rule (the samples' ✦), drawn rather than typed. */
export function Star({ className = "orn-star" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path d="M7 0C7.6 4.6 9.4 6.4 14 7 9.4 7.6 7.6 9.4 7 14 6.4 9.4 4.6 7.6 0 7 4.6 6.4 6.4 4.6 7 0Z" fill="currentColor" />
    </svg>
  );
}

/** The leaf fleuron that closes a person's own words (D9). */
export function Leaf({ className = "pp-leaf" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2 14C2 7 6.5 2.5 14 2c-.4 7.4-5 12-12 12Zm0 0 7-7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
                <svg viewBox="0 0 18 18" focusable="false">
                  <path d="M3 9h12m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
