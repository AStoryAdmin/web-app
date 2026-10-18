/**
 * A page that isn't here (an old link, a typo, a screen not built yet). It
 * wears the house style for failure (Bao's Standard rule 42): the cloth,
 * one sheet of the book's paper, the family dog, one headline, one line of
 * cause and remedy, and one way back. Same frame as the wall's dead end.
 */
import { Link } from "react-router-dom";
import { Lockup } from "../components/Brand";

export default function Placeholder({ name }: { name: string }) {
  return (
    <div className="wall wall-bench on-dark">
      <div className="wall-top">
        <Link className="brand" to="/" aria-label="A Story, home">
          <Lockup height={28} />
        </Link>
      </div>
      <div className="wall-none-wrap">
        <img className="wall-none-dog" src="/dog/curious-paper.webp" alt="" aria-hidden="true" width={753} height={630} />
        <main className="wall-none">
        <h1>
          {name.replace(/[.!?]$/, "")}
          <span className="stop">.</span>
        </h1>
        <p>The link may be old, or the address isn’t quite right. Home is one click away.</p>
          <Link className="btn outline" to="/">
            Go home
          </Link>
        </main>
      </div>
    </div>
  );
}
