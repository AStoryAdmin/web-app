/**
 * The signed-out frame: one sheet of the book's paper lying on its cloth,
 * with the family dog resting its chin on the sheet's top edge
 * (components/delight/Companion). The cloth carries the lockup and one
 * thing a person actually said, in the serif, because that is the whole
 * promise. The pointer is a soft light over the cloth (Light); a pressed
 * leaf drifts after it (Leaf); pressing the cloth leaves the binder's blind
 * deboss of the mark (ClothStamp). On a phone the quote sits above the
 * sheet and both fill the width.
 */
import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lockup } from "../../components/Brand";
import ClothStamp from "../../components/delight/ClothStamp";
import Companion from "../../components/delight/Companion";
import Leaf from "../../components/delight/Leaf";
import { useLight } from "../../components/delight/Light";

/** Lines a teller said, shown one at a time. Short, true-sounding, about an ordinary day. */
const SAID: { q: string; who: string }[] = [
  { q: "We had one bicycle between the four of us. It was never my turn, and I still loved it.", who: "Nora, 84, telling her granddaughter" },
  { q: "Your grandfather asked me three times. I said yes the first time. He just didn’t hear me.", who: "June, 91, telling her son" },
  { q: "The kitchen was the only warm room, so that’s where everything happened.", who: "Tomás, 78, telling his nephew" },
];

export default function AuthFrame({ children, line = 0 }: { children: ReactNode; line?: number }) {
  const said = SAID[line % SAID.length];
  const ground = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLElement>(null);
  useLight(ground);

  return (
    <div className="auth on-dark" ref={ground}>
      <ClothStamp ground={ground} />
      <Leaf ground={ground} />
      <Link className="brand" to="/welcome" aria-label="A Story">
        <Lockup height={36} />
      </Link>
      <aside className="said" aria-label="Something a person said">
        <p className="q">{said.q}</p>
        <p className="who">{said.who}</p>
      </aside>
      <div className="sheet-wrap">
        <Companion sheet={paper} />
        <main className="paper" ref={paper}>
          {children}
        </main>
      </div>
    </div>
  );
}
