/**
 * The editions, set as a printer's price list: the name and one line about
 * it, a dotted leader, the price, and Order. Prices come from the server
 * (the create-book-checkout price check), so a change needs no deploy.
 *
 * While printing is closed the list says what each edition is and nothing
 * it costs: no prices, no Order (DECISIONS.md). One button records that
 * somebody wants a printed copy, as an analytics event only; there is no
 * list it puts anybody on, so its thanks promises no email (E24, as the
 * phone's BookEditions). Print at home is not on the list: it is a button
 * beside the book. The Digital Edition is an in-app purchase, so it is
 * described here and never ordered or priced (bookCatalog.js).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonLink } from "../ui";
import { Stop } from "./WhereNext";
import { CATALOG, checkBookOrder, editionTerms, formatCents, orderingOpen, orderPath, type BookOffer, type EditionId } from "../../data/book";
import { track } from "../../lib/analytics";

const WORDS: Record<EditionId, { name: string; line: string }> = {
  home: { name: "Print at home", line: "Every page, laid out for your own printer, or saved as a PDF." },
  digital: { name: "Digital Edition", line: "The book and its cover as print-ready files, for any print shop." },
  softcover: { name: "Softcover", line: "A matt cover and good paper. The one to hand round at the table." },
  hardcover: { name: "Classic Hardcover", line: "Case-bound, with the keepsake cover. Made to stay on a shelf." },
  heirloom: { name: "Heirloom Edition", line: "Linen, the name in foil, archival paper and a ribbon. For the generations after." },
  legacy: { name: "Full-Service Edition", line: "We read everything with you, edit, design and proof it, and send three Heirloom copies." },
};

/** Mount with key={storyId}: the offer is read once per story. */
export default function Editions({ storyId, memories }: { storyId: string; memories: number }) {
  // undefined while asking; null when there is nothing to ask or no answer (then closed).
  const [offer, setOffer] = useState<BookOffer | null | undefined>(undefined);
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    let live = true;
    if (memories === 0) {
      // Nothing to print yet: the server would only say so.
      queueMicrotask(() => live && setOffer(null));
      return () => {
        live = false;
      };
    }
    // Never left pending: a server that has not answered in eight seconds is treated as unreachable.
    const late = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
    Promise.race([checkBookOrder(storyId), late])
      .then((o) => live && setOffer(o))
      .catch(() => live && setOffer(null));
    return () => {
      live = false;
    };
  }, [storyId, memories]);

  const loading = offer === undefined;
  const open = orderingOpen(offer);
  const editions = (offer?.editions ?? CATALOG).filter((e) => e.id !== "home");

  const interest = () => {
    track("book_interest", { edition: "printed", memories });
    setAsked(true);
  };

  return (
    <section className="editions ed-ledger" id="editions" aria-labelledby="editions-h">
      <div className="ed-intro">
        <h2 id="editions-h" data-running="Editions">
          Editions<Stop />
        </h2>
        <p className="ed-lead">A first edition reads well from about twenty memories.</p>
        {open && (
          <p className="ed-lead">
            <Link to="/book/orders" className="more">
              Your orders
            </Link>
          </p>
        )}
        {!loading && !open && (
          <div className="ed-wait">
            <p className="ed-coming">Printed editions are coming. Until they are, the book prints at home.</p>
            {asked ? (
              <p className="ed-thanks" role="status">
                Thank you. Ordering will open here, on this page.
              </p>
            ) : (
              <Button variant="outline" small onClick={interest}>
                I’d like a printed copy
              </Button>
            )}
          </div>
        )}
      </div>

      <ol className="ed-list" aria-busy={loading || undefined}>
        {editions.map((e) => {
          const w = WORDS[e.id];
          const { orderable, giftCredit } = editionTerms(offer ?? null, e);
          const note =
            e.id === "digital"
              ? offer?.member
                ? "Part of your plan. Download it in the A Story app."
                : "Bought once in the A Story app."
              : giftCredit
                ? "A gift has already paid for one."
                : "";
          // The Full-Service Edition already sends three Heirloom copies; its extra is a fourth.
          const extra = e.extraCents ? `${formatCents(e.extraCents)} each ${e.id === "legacy" ? "copy beyond the three" : "further copy"}` : "";
          return (
            <li key={e.id} className={`ed-row${orderable ? "" : " quiet"}`}>
              <div className="ed-name">
                <h3>{w.name}</h3>
                <p>{w.line}</p>
                {note && <p className="ed-note">{note}</p>}
              </div>
              {orderable && (
                <>
                  <span className="ed-leader" aria-hidden="true" />
                  <p className="ed-price">
                    <b>{formatCents(e.priceCents)}</b>
                    {extra && <small>{extra}</small>}
                  </p>
                  <div className="ed-act">
                    <ButtonLink variant="outline" small to={orderPath(storyId, e.id)} aria-label={`Order the ${w.name}`}>
                      Order
                    </ButtonLink>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
