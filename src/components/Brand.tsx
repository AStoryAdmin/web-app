import { LOCKUP_SVG, MARK_SVG } from "./brandArt";

/** The "A Story" lockup; colours follow --logo-a / --logo-story / --logo-heart (add .on-dark on a chocolate ground). */
export function Lockup({ height = 36, className = "" }: { height?: number; className?: string }) {
  return (
    <span
      className={className}
      data-lockup=""
      role="img"
      aria-label="A Story"
      style={{ ["--lockup-h" as string]: `${height}px` }}
      dangerouslySetInnerHTML={{ __html: LOCKUP_SVG }}
    />
  );
}

/** The A-with-heart mark alone. */
export function Mark({ height = 48, className = "" }: { height?: number; className?: string }) {
  return (
    <span
      className={className}
      data-mark=""
      aria-hidden="true"
      style={{ ["--mark-h" as string]: `${height}px` }}
      dangerouslySetInnerHTML={{ __html: MARK_SVG }}
    />
  );
}
