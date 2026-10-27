/**
 * The editions on the Book page.
 *
 * Whether a printed book can be ordered is create-book-order's answer
 * (data/printOrder.ts checkPrintOrder, P4-R8), never create-book-checkout's:
 * that older function stays closed behind its own switch for the 1.1 app.
 *
 * While printing is closed the list says what each edition is and nothing it
 * costs: no prices, no Order (DECISIONS.md). One button records that somebody
 * wants a printed copy, as an analytics event only; there is no list it puts
 * anybody on, so its thanks promises no email (E24, as the phone's
 * BookEditions).
 *
 * Once it opens there is one book (R1, R4): one row for it and one link,
 * "Order a printed copy", to the three-step ordering page. Its price depends
 * on the book's length, so it is shown there, once the book is laid out.
 *
 * Print at home is not on the list: it is a button beside the book. The
 * Digital Edition is an in-app purchase, so it is described here and never
 * ordered or priced; whether the plan carries it (`member`) still comes from
 * create-book-checkout's check.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonLink } from "../ui";
import { Stop } from "./WhereNext";
import { CATALOG, checkBookOrder, orderPath, type EditionId } from "../../data/book";
import { checkPrintOrder } from "../../data/printOrder";
import { track } from "../../lib/analytics";

const WORDS: Record<EditionId, { name: string; line: string }> = {
  home: { name: "Print at home", line: "Every page, laid out for your own printer, or saved as a PDF." },
  digital: { name: "Digital Edition", line: "The book and its cover as print-ready files, for any print shop." },
  softcover: { name: "Softcover", line: "A matt cover and good paper. The one to hand round at the table." },
  hardcover: { name: "Classic Hardcover", line: "Case-bound, with the keepsake cover. Made to stay on a shelf." },
  heirloom: { name: "Heirloom Edition", line: "Linen, the name in foil, archival paper and a ribbon. For the generations after." },
  legacy: { name: "Full-Service Edition", line: "We read everything with you, edit, design and proof it, and send three Heirloom copies." },
};

/** Never left pending: a server that has not answered in eight seconds is treated as unreachable. */
const inTime = <T,>(p: Promise<T>) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000))]);

type Offer = { open: boolean; member: boolean; productName: string | null };

/** Mount with key={storyId}: the offer is read once per story. */
export default function Editions({ storyId, memories }: { storyId: string; memories: number }) {
  // undefined while asking; null when there is nothing to ask or no answer (then closed).
  const [offer, setOffer] = useState<Offer | null | undefined>(undefined);
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
    Promise.all([inTime(checkPrintOrder()).catch(() => null), inTime(checkBookOrder(storyId)).catch(() => null)]).then(([print, legacy]) => {
      if (!live) return;
      setOffer({ open: !!print?.orderingOpen, member: !!legacy?.member, productName: print?.product?.name ?? null });
    });
    return () => {
      live = false;
    };
  }, [storyId, memories]);

  const loading = offer === undefined;
  const open = !!offer?.open;
  const digital = CATALOG.find((e) => e.id === "digital")!;
  // closed, the printed editions are described as before; open, there is one printed book
  const printed = CATALOG.filter((e) => e.id !== "home" && e.id !== "digital");

  const interest = () => {
    track("book_interest", { edition: "printed", memories });
    setAsked(true);
  };

  const digitalRow = (
    <li key={digital.id} className="ed-row quiet">
      <div className="ed-name">
        <h3>{WORDS.digital.name}</h3>
        <p>{WORDS.digital.line}</p>
        <p className="ed-note">{offer?.member ? "Part of your plan. Download it in the A Story app." : "Bought once in the A Story app."}</p>
      </div>
    </li>
  );

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
        {digitalRow}
        {open ? (
          <li className="ed-row">
            <div className="ed-name">
              <h3>The printed book</h3>
              <p>{offer?.productName ? `${offer.productName}, with the keepsake cover.` : "A hardcover, with the keepsake cover."} Sent to the people you choose.</p>
            </div>
            <span className="ed-leader" aria-hidden="true" />
            <div className="ed-act">
              <ButtonLink variant="outline" to={orderPath(storyId)}>
                Order a printed copy
              </ButtonLink>
            </div>
          </li>
        ) : (
          printed.map((e) => (
            <li key={e.id} className="ed-row quiet">
              <div className="ed-name">
                <h3>{WORDS[e.id].name}</h3>
                <p>{WORDS[e.id].line}</p>
              </div>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
