/**
 * The one line a held "no" leaves in place of its item: what was done and an
 * Undo, focused as it appears so the keyboard never lands on nothing. While
 * it is being sent there is no Undo, only the words saying so.
 */
import { useEffect, useRef } from "react";
import type { Held } from "./useHold";

export default function HeldLine({ held, onUndo }: { held: Held; onUndo: () => void }) {
  const undoRef = useRef<HTMLButtonElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    undoRef.current?.focus();
  }, []);
  useEffect(() => {
    // the Undo goes while it is sent: keep focus on the line, not on the page's top
    if (held.sending && (document.activeElement === document.body || !document.activeElement)) lineRef.current?.focus();
  }, [held.sending]);
  return (
    <p className="held" role="status" ref={lineRef} tabIndex={-1} aria-busy={held.sending || undefined}>
      {held.sending ? (
        held.going
      ) : (
        <>
          {held.line} ·{" "}
          <button type="button" className="fp-retry" ref={undoRef} onClick={onUndo}>
            Undo
          </button>
        </>
      )}
    </p>
  );
}
