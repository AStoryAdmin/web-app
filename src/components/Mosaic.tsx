/**
 * The mosaic of prints, every one the photograph itself (or, without one,
 * the person's words typed on the print) with the title as its caption.
 * Home shows it even (`lead={false}`, class "mosaic even"): six prints,
 * three across and two on a phone, with "From the book" in the column
 * beside it. With `lead` the newest memory is one large print across two
 * columns; a `quote` then takes the large frame when that memory has no
 * photograph, and otherwise sits as a wide card under the first row. The
 * memory a quote comes from is never also a print.
 *
 * The family's sides (approved contributions, grouped by memory) are
 * loaded once here and handed to each print for its "New from Linh" dot.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import PrintCard from "./PrintCard";
import { PenIcon } from "./icons";
import { listContributions, type Contribution } from "../data/contributions";
import { groupSides } from "../lib/seenSides";
import { useAuth } from "../state/authContext";
import type { Memory, Story } from "../data/stories";

export type MosaicQuote = { node: ReactNode; memoryId: string };

const hasPhoto = (m: Memory) => Boolean(m.cover || m.photos?.[0]);

export default function Mosaic({
  memories,
  story,
  lead = true,
  quote = null,
  rise = true,
  limit,
}: {
  memories: Memory[];
  story: Story;
  /** Whether the first memory is set large; the Archive's year groups say no. */
  lead?: boolean;
  quote?: MosaicQuote | null;
  /** Mark each cell for the page's arrival (lib/arrive); off where the page runs its own scroll-reveal. */
  rise?: boolean;
  /** How many memories to show, counted after the quoted one is left out. */
  limit?: number;
}) {
  const { user } = useAuth();
  const [sides, setSides] = useState<Map<string, Contribution[]>>(() => new Map());
  const email = user?.email;
  const firstName = user?.firstName;

  useEffect(() => {
    let live = true;
    listContributions(story.id, "approved")
      .then((rows) => live && setSides(groupSides(rows, { email, firstName })))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [story.id, email, firstName]);

  const items = memories.filter((m) => m.id !== quote?.memoryId).slice(0, limit ?? memories.length);
  if (!items.length && !quote) return null;

  const printLead = lead && items.length > 0 && hasPhoto(items[0]);
  const quoteLead = Boolean(quote) && lead && !printLead;
  const riseAttr = rise ? { "data-rise": "" } : {};

  const cells: ReactNode[] = [];
  if (quoteLead && quote) {
    cells.push(
      <div key="quote" className="mosaic-quote lead" {...riseAttr}>
        {quote.node}
      </div>,
    );
  }
  items.forEach((m, i) => {
    const size = printLead && i === 0 ? "lead" : "tall";
    cells.push(
      <div key={m.id} className={`cell ${size}`} {...riseAttr}>
        <PrintCard memory={m} story={story} size={size} sides={sides.get(m.id) || []} index={i} rise={false} />
      </div>,
    );
    if (printLead && quote && i === 1) {
      cells.push(
        <div key="quote" className="mosaic-quote wide" {...riseAttr}>
          {quote.node}
        </div>,
      );
    }
  });
  if (printLead && quote && items.length < 2) {
    cells.push(
      <div key="quote" className="mosaic-quote wide" {...riseAttr}>
        {quote.node}
      </div>,
    );
  }

  return <div className={`mosaic${lead ? "" : " even"}`}>{cells}</div>;
}

/**
 * The empty state: one large typed card inviting the first memory, and
 * nothing else: Bond, curious, on a foil ledge above the words (never over
 * them), one headline with the foil stop, one line of what to write, and the
 * time it takes.
 */
export function InvitePrint({ story }: { story: Story }) {
  const own = story.relationship === "Myself";
  return (
    <div className="mosaic">
      <Link className="print-card lead typed invite" to="/write" data-rise>
        <span className="frame" aria-hidden="true">
          <span className="typed-in">
            <span className="invite-ledge">
              <img className="invite-dog" src="/dog/curious-paper.webp" alt="" width={753} height={630} />
            </span>
            <span className="said">
              Nothing here yet<span className="invite-stop">.</span>
            </span>
            <span className="line">{own ? "Answer the question above, or write about anything at all: a kitchen, a road, a song on the radio." : `Answer today’s question for ${story.name}, or write about anything at all: a kitchen, a road, a song on the radio.`}</span>
          </span>
          <span className="cap">
            <span className="title">
              <PenIcon /> Keep the first memory
            </span>
            <span className="dateline">A few lines is plenty; about five minutes.</span>
          </span>
        </span>
      </Link>
    </div>
  );
}
