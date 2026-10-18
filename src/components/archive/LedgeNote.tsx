/**
 * Bond on a ledge, for the Archive's and the memory page's empty, missing
 * and failed states (Bao's Standard rules 41 and 42): the dog sits on a
 * foil hairline (his art fades out at his foot, so the line is where he
 * rests), centred on the sheet, with one headline ending in the foil full
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
        <img src={`/dog/${pose}-paper.webp`} alt="" width={pose === "sleep" ? 781 : 753} height={pose === "sleep" ? 622 : 630} />
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
