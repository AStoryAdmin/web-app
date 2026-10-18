/**
 * The plate's one line under its heading: what the form is for, or, when
 * something went wrong, what and how to fix it, in the same place. The line
 * keeps its room either way, so an error changes words, never the size of
 * the plate or the book (the fields it is about point at it with
 * aria-describedby="plate-say" and carry aria-invalid).
 */
import type { ReactNode } from "react";
import { smarten } from "../../lib/typography";

export default function PlateSay({ error, children }: { error?: string | null; children?: ReactNode }) {
  return (
    <p id="plate-say" className={`plate-say${error ? " is-error" : ""}`} role={error ? "alert" : undefined} aria-live="polite">
      {/* messages from the server and the app core come with straight quotes: set them as the book would */}
      {error ? smarten(error) : typeof children === "string" ? smarten(children) : children}
    </p>
  );
}
