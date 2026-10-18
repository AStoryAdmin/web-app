/**
 * Undo over confirm (hallmark interaction): a reversible "no" (setting aside
 * what the family sent, declining a request) is held for six seconds as one
 * line with an Undo, and only then sent. Leaving the page before then sends
 * nothing, so the item is still there next time. Once it is being sent the
 * line says so and the Undo goes: an Undo that can no longer undo is a lie.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export const HOLD_MS = 6000;

/** One held "no": the line while it can be undone, the line while it is sent, and whether it is being sent. */
export type Held = { line: string; going: string; sending: boolean };

/** The control an Undo hands focus back to carries `data-undo-to={id}`. */
const focusBack = (id: string) =>
  window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-undo-to="${CSS.escape(id)}"]`)?.focus());

export function useHold(onFail: (err: unknown) => void) {
  const [held, setHeld] = useState<Record<string, Held>>({});
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((t) => window.clearTimeout(t));
  }, []);
  const drop = (id: string) =>
    setHeld((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  const release = useCallback((id: string) => {
    if (!timers.current.has(id)) return; // already being sent
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    drop(id);
    focusBack(id);
  }, []);
  /** Hold `id` with its line ("Set aside Claire's memory") and the words while it goes ("Setting aside Claire's memory…"),
      then run `send`; `done` follows a send that landed. */
  const hold = useCallback(
    (id: string, line: string, going: string, send: () => Promise<unknown>, done: () => void) => {
      setHeld((prev) => ({ ...prev, [id]: { line, going, sending: false } }));
      timers.current.set(
        id,
        window.setTimeout(async () => {
          timers.current.delete(id);
          setHeld((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], sending: true } } : prev));
          try {
            await send();
            done();
          } catch (err) {
            onFail(err);
            focusBack(id);
          } finally {
            drop(id);
          }
        }, HOLD_MS),
      );
    },
    [onFail],
  );
  return { held, hold, undo: release };
}
