/**
 * The signed-out frame: one sheet of the book's paper lying on its cloth.
 * The cloth carries the lockup and one thing a person actually said, in the
 * serif, because that is the whole promise; the form lives on the paper.
 * On a phone the quote sits above the sheet and both fill the width.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lockup, Mark } from "../../components/Brand";

/** Lines a teller said, shown one at a time. Short, true-sounding, about an ordinary day. */
const SAID: { q: string; who: string }[] = [
  { q: "We had one bicycle between the four of us. It was never my turn, and I still loved it.", who: "Nora, 84, telling her granddaughter" },
  { q: "Your grandfather asked me three times. I said yes the first time. He just didn’t hear me.", who: "June, 91, telling her son" },
  { q: "The kitchen was the only warm room, so that’s where everything happened.", who: "Tomás, 78, telling his nephew" },
];

export default function AuthFrame({ children, line = 0 }: { children: ReactNode; line?: number }) {
  const said = SAID[line % SAID.length];
  return (
    <div className="auth on-dark">
      <Link className="brand" to="/welcome" aria-label="A Story">
        <Lockup height={36} />
      </Link>
      <aside className="said" aria-label="Something a person said">
        <p className="q">{said.q}</p>
        <p className="who">{said.who}</p>
      </aside>
      <main className="paper">
        <div className="mark"><Mark height={40} /></div>
        {children}
      </main>
    </div>
  );
}
