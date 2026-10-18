/**
 * Bond on a ledge, for the Archive's and the memory page's empty, missing
 * and failed states (Bao's Standard rules 41 and 42): the whole dog on a
 * foil hairline, curious with his front paws resting on it or asleep with
 * his chin on his paws along it, never a head fading out above it; centred
 * on the sheet, with one headline ending in the foil full
 * stop, one line of cause and remedy (and the time it takes, where there
 * is a task), and one action.
 */
import type { ReactNode } from "react";

export type Pose = "curious" | "sleep";

export default function LedgeNote({ pose = "curious", title, line, children, className = "", level = 1 }: { pose?: Pose; title: string; line: ReactNode; children?: ReactNode; className?: string; /** h1 when it is the page, h2 inside a page that has its own title */ level?: 1 | 2 }) {
  const H = level === 2 ? "h2" : "h1";
  return (
    <section className={`ledge-note ${className}`} aria-label={title}>
      <span className="ledge-dog" aria-hidden="true">
        <img src={pose === "sleep" ? "/dog/sleep.webp" : "/dog/curious-420.webp"} alt="" width={pose === "sleep" ? 781 : 488} height={pose === "sleep" ? 622 : 637} />
      </span>
      <span className="ledge-line" aria-hidden="true" />
      <H className="ledge-title">
        {title}
        <span className="ledge-stop" aria-hidden="true">
          .
        </span>
      </H>
      <p className="ledge-text">{line}</p>
      {children && <div className="ledge-acts">{children}</div>}
    </section>
  );
}
