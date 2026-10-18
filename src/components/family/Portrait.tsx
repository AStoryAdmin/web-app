/**
 * A person as the family book prints them: their photograph as a round
 * print in a white paper ring with a gold hairline, or, with no
 * photograph, their initials engraved on a monogram seal. Never a tinted
 * square, never a blank box. One component for the tree, the storyteller,
 * the family's voices, the person page and the requests, so a face looks
 * the same everywhere on these pages.
 */
import type { CSSProperties } from "react";
import { usePhotoUrl } from "../../lib/photoUrls";

/** Given and family name, one letter each, the way a monogram is cut. "?" when there is no name at all. */
function initialsOf(given: string | null | undefined, family?: string | null): string {
  const a = Array.from(String(given || "").trim())[0] || "";
  const b = Array.from(String(family || "").trim())[0] || "";
  return (a + b).toUpperCase() || "?";
}

type Props = {
  /** The stored photo reference (signed here) or a ready URL. */
  photo?: string | null;
  given?: string | null;
  family?: string | null;
  /** Diameter in CSS pixels; leave it out when the stylesheet sizes it (through --pz). */
  size?: number;
  /** Late: the print is a little faded, never grey. */
  gone?: boolean;
  className?: string;
};

export default function Portrait({ photo, given, family, size, gone, className = "" }: Props) {
  const src = usePhotoUrl(photo || null);
  const style = size ? ({ "--pz": `${size}px` } as CSSProperties) : undefined;
  return (
    <span className={`por${src ? "" : " seal"}${gone ? " gone" : ""} ${className}`} style={style} aria-hidden="true">
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <span className="por-mono">{initialsOf(given, family)}</span>}
    </span>
  );
}
