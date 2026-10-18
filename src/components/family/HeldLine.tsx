/**
 * The one line a held "no" leaves in place of its item: what was done and an
 * Undo, focused as it appears so the keyboard never lands on nothing. While
 * it is being sent there is no Undo, only the words saying so. A pointer
 * resting on the line stops its six seconds (useHold).
 */
import { useEffect, useRef } from "react";
import type { Held } from "./useHold";

export default function HeldLine({ held, onUndo, onPause, onResume, as: Tag = "p" }: { held: Held; onUndo: () => void; onPause?: () => void; onResume?: () => void; as?: "p" | "li" }) {
  const undoRef = useRef<HTMLButtonElement>(null);
  const lineRef = useRef<HTMLElement>(null);
  useEffect(() => {
    undoRef.current?.focus();
  }, []);
  useEffect(() => {
    // the Undo goes while it is sent: keep focus on the line, not on the page’s top
    const a = document.activeElement;
    if (held.sending && (!a || a === document.body || !a.isConnected)) lineRef.current?.focus();
  }, [held.sending]);
  return (
    <Tag
      className="held"
      role="status"
      ref={lineRef as never}
      tabIndex={-1}
      aria-busy={held.sending || undefined}
      onPointerEnter={onPause}
      onPointerLeave={onResume}
    >
      {held.sending ? (
        held.going
      ) : (
        <>
          {held.line}{" ·"}{" "}
          <button type="button" className="fp-retry" ref={undoRef} onClick={onUndo}>
            Undo
          </button>
        </>
      )}
    </Tag>
  );
}
