/**
 * The editions and what each costs this family, from the server (the
 * create-book-checkout price check), so a price change needs no deploy.
 * Print at home is free and a button, not a plan. Printed ordering stays
 * closed until a printer exists; until then the page records who wants one.
 */
import { useEffect, useState } from "react";
import { Button } from "../ui";
import { PrintIcon } from "../icons";
import { CATALOG, checkBookOrder, orderBook, type BookOffer, type EditionId } from "../../data/book";
import { track } from "../../lib/analytics";

// The same prices as the catalog in src/data/book.ts (proposals until
// launch, docs/PRD.md §7), shown as "to be confirmed" when the server
// cannot be asked.

const WORDS: Record<EditionId, { name: string; line: string; printed: boolean }> = {
  home: { name: "Print at home", line: "Every page, laid out for your own printer, or saved as a PDF.", printed: false },
  digital: { name: "Digital Edition", line: "The finished book as a PDF to keep, send and read anywhere.", printed: false },
  softcover: { name: "Softcover", line: "A5, a matt cover and good paper. The one to hand round at the table.", printed: true },
  hardcover: { name: "Classic Hardcover", line: "Teal cloth over board, the title in foil. Made to stay on a shelf.", printed: true },
  heirloom: { name: "Heirloom Edition", line: "Larger, heavier paper, sewn signatures, a ribbon. For the generations after.", printed: true },
  legacy: { name: "Full-Service Edition", line: "We read everything with you, edit, design and proof it, and print the Heirloom.", printed: true },
};

const dollars = (cents: number) => (cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`);

/** Mount with key={storyId}: the offer is read once per story. */
export default function Editions({ storyId, memories, onPrintAtHome, printing }: { storyId: string; memories: number; onPrintAtHome: () => void; printing: boolean }) {
  const [offer, setOffer] = useState<BookOffer | null | undefined>(undefined);
  const [fallback, setFallback] = useState(false);
  const [busy, setBusy] = useState<EditionId | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [asked, setAsked] = useState<Set<EditionId>>(() => new Set());

  useEffect(() => {
    let live = true;
    checkBookOrder(storyId)
      .then((o) => live && setOffer(o))
      .catch(() => {
        if (!live) return;
        setFallback(true);
        setOffer(null);
      });
    return () => {
      live = false;
    };
  }, [storyId]);

  const editions = offer?.editions ?? CATALOG;
  const loading = offer === undefined;

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

  const interest = (id: EditionId) => {
    track("book_interest", { edition: id, memories });
    setAsked((prev) => new Set(prev).add(id));
  };

  return (
    <section className="editions" id="editions" aria-labelledby="editions-h">
      <div className="sechead" style={{ marginTop: 0 }}>
        <h2 id="editions-h">Editions</h2>
      </div>
      <p className="meta" style={{ marginBottom: "var(--s-5)" }}>
        Most families print their first edition at around 20 memories. Print at home is always free.
        {fallback && " Prices shown are to be confirmed; the server couldn't be reached for this family's offer."}
      </p>
      {problem && (
        <p role="alert" className="meta" style={{ color: "var(--danger)", marginBottom: "var(--s-4)" }}>
          {problem}
        </p>
      )}
      <div className="edition-grid" aria-busy={loading || undefined}>
        {editions.map((e) => {
          const w = WORDS[e.id];
          if (!w) return null;
          const included = e.id === "hardcover" && !!offer?.included;
          const credit = offer?.member && offer.creditCents > 0 && (e.id === "heirloom" || e.id === "legacy") && !offer.included;
          const canOrder = !fallback && !!offer && (w.printed ? offer.orderingOpen : true);
          return (
            <article key={e.id} className={`card pad edition${e.id === "hardcover" ? " featured" : ""}`}>
              <div className="edition-head">
                <h3>{w.name}</h3>
                <p className="edition-price">
                  {e.id === "home" ? "Free" : included ? "Included" : dollars(e.priceCents)}
                </p>
              </div>
              <p className="edition-line">{w.line}</p>
              <p className="meta edition-note">
                {included
                  ? `Included with your plan — you pay shipping${offer?.shippingCents ? ` (${dollars(offer.shippingCents)})` : ""}.`
                  : credit
                    ? `Your plan's ${dollars(offer!.creditCents)} goes toward it.`
                    : e.extraCents
                      ? `${dollars(e.extraCents)} each further copy.`
                      : e.id === "legacy"
                        ? "Includes the Heirloom Edition and the Digital Edition."
                        : e.id === "digital"
                          ? "Yours the moment it is paid for."
                          : " "}
              </p>
              <div className="edition-act">
                {e.id === "home" ? (
                  <Button variant="primary" small block icon={<PrintIcon />} onClick={onPrintAtHome} loading={printing}>
                    Print at home — free
                  </Button>
                ) : loading ? (
                  <Button variant="outline" small block disabled>
                    Checking the price…
                  </Button>
                ) : canOrder ? (
                  <Button variant={included ? "primary" : "outline"} small block onClick={() => order(e.id)} loading={busy === e.id} disabled={!!busy && busy !== e.id}>
                    {included ? "Order yours" : "Order"}
                  </Button>
                ) : asked.has(e.id) ? (
                  <p className="meta edition-thanks" role="status">
                    Thank you. We'll write to you the day printing opens.
                  </p>
                ) : (
                  <Button variant="outline" small block onClick={() => interest(e.id)}>
                    Tell me when printing opens
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
