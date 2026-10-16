/**
 * The signed-out frame: a real family photograph on the left with one line
 * of the promise (never a brand wall), the form on the right. On a phone the
 * photograph is a short header the form slides up over.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lockup } from "../../components/Brand";

export default function AuthFrame({ children, photo = "/photos/27-1200.webp" }: { children: ReactNode; photo?: string }) {
  return (
    <div className="auth">
      <section className="hero on-dark" aria-label="A Story">
        <img className="photo" src={photo} alt="" />
        <Link to="/welcome" aria-label="A Story" style={{ display: "inline-flex", width: "fit-content" }}>
          <Lockup height={40} />
        </Link>
        <div>
          <p className="tag">
            Ask the people you love about their lives. <b>Keep what they say.</b>
          </p>
          <p className="foot">A Story asks, listens and keeps their words, their voice, and what the rest of the family remembers.</p>
        </div>
      </section>
      <section className="form-side">{children}</section>
    </div>
  );
}
