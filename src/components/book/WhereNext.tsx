/**
 * "Where to next" (Bao's Standard rule 38): every page ends with three ruled
 * rows, each a title, one line and a round arrow, the way the founder's own
 * sites close a page. A row is a link to a place in the app, or to a page
 * of astoryapp.com (opened in a new tab and said so to a screen reader).
 * Shared by the Book, Plans, Account, Talk and the wall; the lead may move
 * it beside the other shared components.
 */
import { Link } from "react-router-dom";

export type NextRow = { to: string; title: string; line: string; external?: boolean };

export default function WhereNext({ rows, label = "Where to next" }: { rows: NextRow[]; label?: string }) {
  return (
    <nav className="where-next" aria-label={label}>
      <p className="where-next-label">{label}</p>
      <ul style={{ ["--wn-n" as string]: rows.length }}>
        {rows.map((r) => {
          const inner = (
            <>
              <span className="wn-words">
                <b>{r.title}</b>
                <span>{r.line}</span>
              </span>
              <span className="wn-arrow" aria-hidden="true">
                {r.external ? "↗" : "→"}
              </span>
            </>
          );
          return (
            <li key={r.title}>
              {r.external ? (
                <a href={r.to} target="_blank" rel="noopener">
                  {inner}
                  <span className="sr-only"> (opens astoryapp.com)</span>
                </a>
              ) : (
                // the move between pages is lib/pageTransition's, which leaves it out where it would be refused
                <Link to={r.to}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The house full stop that ends a display title, in foil on the cloth and terracotta on the paper (rule 33). */
export function Stop({ mark = "." }: { mark?: string }) {
  return (
    <span className="stop" aria-hidden="true">
      {mark}
    </span>
  );
}
