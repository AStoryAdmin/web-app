/**
 * Undo over confirm (hallmark interaction): a reversible "no" (setting aside
 * what the family sent, declining a request) is held for six seconds as one
 * line with an Undo, and only then sent. Leaving the page before then sends
 * nothing, so the item is still there next time.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export const HOLD_MS = 6000;

export function useHold(onFail: (err: unknown) => void) {
  const [held, setHeld] = useState<Record<string, string>>({});
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((t) => window.clearTimeout(t));
  }, []);
  const release = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setHeld((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);
  /** Hold `id` with its line ("Set aside Claire's memory"), then run `send`; `done` follows a send that landed. */
  const hold = useCallback(
    (id: string, line: string, send: () => Promise<unknown>, done: () => void) => {
      setHeld((prev) => ({ ...prev, [id]: line }));
      timers.current.set(
        id,
        window.setTimeout(async () => {
          timers.current.delete(id);
          try {
            await send();
            done();
          } catch (err) {
            onFail(err);
          } finally {
            setHeld((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
          }
        }, HOLD_MS),
      );
    },
    [onFail],
  );
  return { held, hold, undo: release };
}
