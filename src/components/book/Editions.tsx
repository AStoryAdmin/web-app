/**
 * The editions and what each costs this family, from the server (the
 * create-book-checkout price check), so a price change needs no deploy. Set
 * as a printer's price list: the name and one line about it, a dotted
 * leader, the price, and the one thing you can do. Print at home is not on
 * the list: it is free and a button beside the book. Printed ordering stays
 * closed until a printer exists; until then one button, for the whole list,
 * records who wants to hear the day it opens.
 */
import { useEffect, useState } from "react";
import { Button } from "../ui";
import { Stop } from "./WhereNext";
import { CATALOG, checkBookOrder, orderBook, type BookOffer, type EditionId } from "../../data/book";
import { track } from "../../lib/analytics";

// The same prices as the catalog in src/data/book.ts (proposals until
// launch, docs/PRD.md §7), shown as "to be confirmed" when the server
// cannot be asked.

const WORDS: Record<EditionId, { name: string; line: string; printed: boolean }> = {
  home: { name: "Print at home", line: "Every page, laid out for your own printer, or saved as a PDF.", printed: false },
  digital: { name: "Digital Edition", line: "The finished book as a PDF to keep, send and read anywhere.", printed: false },
  softcover: { name: "Softcover", line: "A5, a matt cover and good paper. The one to hand round at the table.", printed: true },
  hardcover: { name: "Classic Hardcover", line: "Cloth over board, the title in foil. Made to stay on a shelf.", printed: true },
  heirloom: { name: "Heirloom Edition", line: "Larger, heavier paper, sewn signatures, a ribbon. For the generations after.", printed: true },
  legacy: { name: "Full-Service Edition", line: "We read everything with you, edit, design and proof it, and print the Heirloom.", printed: true },
};

const dollars = (cents: number) => (cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`);

/** Mount with key={storyId}: the offer is read once per story. */
export default function Editions({ storyId, memories }: { storyId: string; memories: number }) {
  const [offer, setOffer] = useState<BookOffer | null | undefined>(undefined);
  const [fallback, setFallback] = useState(false);
  const [busy, setBusy] = useState<EditionId | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    let live = true;
    if (memories === 0) {
      // Nothing to print yet: the server would only say so. Show the catalog.
      queueMicrotask(() => live && setOffer(null));
      return () => {
        live = false;
      };
    }
    // Never left on a pending price: a server that has not answered in eight seconds is treated as unreachable.
    const late = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
    Promise.race([checkBookOrder(storyId), late])
      .then((o) => live && setOffer(o))
      .catch(() => {
        if (!live) return;
        setFallback(true);
        setOffer(null);
      });
    return () => {
      live = false;
    };
  }, [storyId, memories]);

  const editions = (offer?.editions ?? CATALOG).filter((e) => e.id !== "home" && WORDS[e.id]);
  const loading = offer === undefined;
  const printingOpen = !!offer?.orderingOpen;

  const order = async (id: EditionId) => {
    setBusy(id);
    setProblem(null);
    try {
      track("book_checkout_started", { edition: id });
      const { checkoutUrl } = await orderBook(storyId, id, 1);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setProblem((err as Error).message || "We couldn't start the order. Please try again.");
      setBusy(null);
    }
  };

  const interest = () => {
    track("book_interest", { edition: "printed", memories });
    setAsked(true);
  };

  const lead = offer?.included
    ? `A Classic Hardcover comes with your plan; you pay only the shipping${offer.shippingCents ? ` (${dollars(offer.shippingCents)})` : ""}.`
    : "Most families print their first edition at around twenty memories.";

  return (
    <section className="editions ed-ledger" id="editions" aria-labelledby="editions-h">
      <div className="ed-intro">
        <h2 id="editions-h" data-running="Editions">
          Editions<Stop />
        </h2>
        <p className="ed-lead">{lead}</p>
        {fallback && <p className="meta">These are the listed prices; we couldn't check this family's offer just now.</p>}
        {!loading && !printingOpen && (
          <div className="ed-wait">
            <p className="meta">Printed copies open once our printer is ready.</p>
            {asked ? (
              <p className="meta ed-thanks" role="status">
                Thank you. We'll write to you the day printing opens.
              </p>
            ) : (
              <Button variant="outline" small onClick={interest}>
                Tell me when printing opens
              </Button>
            )}
          </div>
        )}
        {problem && (
          <p role="alert" className="meta ed-problem">
            {problem}
          </p>
        )}
      </div>

      <ol className="ed-list" aria-busy={loading || undefined}>
        {editions.map((e) => {
          const w = WORDS[e.id];
          const included = e.id === "hardcover" && !!offer?.included;
          const credit = offer?.member && offer.creditCents > 0 && (e.id === "heirloom" || e.id === "legacy") && !offer.included;
          const canOrder = !fallback && !!offer && (w.printed ? offer.orderingOpen : true);
          const note = included
            ? "Included with your plan"
            : credit
              ? `Your plan's ${dollars(offer!.creditCents)} goes toward it`
              : e.extraCents
                ? `${dollars(e.extraCents)} each further copy`
                : e.id === "legacy"
                  ? "With the Heirloom and the Digital Edition"
                  : e.id === "digital"
                    ? "Yours the moment it is paid for"
                    : "";
          return (
            <li key={e.id} className={`ed-row${included ? " included" : ""}`}>
              <div className="ed-name">
                <h3>{w.name}</h3>
                <p>{w.line}</p>
              </div>
              <span className="ed-leader" aria-hidden="true" />
              <p className="ed-price">
                <b>{included ? "Included" : dollars(e.priceCents)}</b>
                {note && <small>{note}</small>}
              </p>
              <div className="ed-act">
                {loading ? null : canOrder ? (
                  <Button variant={included ? "primary" : "outline"} small onClick={() => order(e.id)} loading={busy === e.id} disabled={!!busy && busy !== e.id}>
                    {included ? "Order yours" : "Order"}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
