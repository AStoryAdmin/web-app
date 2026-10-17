/**
 * Treasured: a small star on the memory page that marks a memory as one of
 * the ones that matter most (rating 5, the same column the phone app
 * reads). The card wears a "Treasured" chip, and the book can lead with
 * them later. One star, on or off; nothing to rate.
 */
import { useState } from "react";
import { useAccount } from "../../state/accountContext";
import { TREASURED, isTreasured } from "../../lib/treasured";
import type { Memory, Story } from "../../data/stories";

export function StarIcon({ filled = false, ...p }: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
    </svg>
  );
}

export default function Treasure({ memory, story }: { memory: Memory; story: Story }) {
  const { saveMemory } = useAccount();
  const [busy, setBusy] = useState(false);
  const on = isTreasured(memory);
  const flip = async () => {
    setBusy(true);
    try {
      await saveMemory({ ...memory, rating: on ? 0 : TREASURED }, story.id);
    } catch {
      /* the provider's saveFailure says so */
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className={`rd-treasure${on ? " on" : ""}`} onClick={flip} disabled={busy} aria-pressed={on} title={on ? "Not one of the treasured ones after all" : "Mark it as one of the treasured ones"}>
      <StarIcon filled={on} />
      {on ? "Treasured" : "Treasure it"}
    </button>
  );
}
