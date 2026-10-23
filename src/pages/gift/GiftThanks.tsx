/**
 * /gift/thanks?session_id=… — where Stripe sends the buyer back. The card,
 * with the code that opens it and a QR code, ready to print (only the card
 * prints), and what happens next in plain words. Stripe's webhook may be a
 * few seconds behind the buyer: the page asks again for up to half a
 * minute (the server also asks Stripe itself), then says the email will
 * bring the card.
 */
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lockup } from "../../components/Brand";
import { Button, ButtonLink } from "../../components/ui";
import LoadingMark from "../../components/delight/LoadingMark";
import GiftCard from "./GiftCard";
import { giftStatus, type GiftStatus } from "./giftApi";
import { firstName, nextLines } from "./giftWords";
import "./gift.css";

const SITE = typeof window !== "undefined" ? window.location.origin : "https://app.astoryapp.com";
const TRIES = 15;
const EVERY_MS = 2000;

export default function GiftThanks() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const [state, setState] = useState<GiftStatus | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    document.title = "Your gift · A Story";
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let live = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = async () => {
      const s = await giftStatus(sessionId);
      if (!live) return;
      setState(s);
      if (s.status === "pending" && ++tries < TRIES) timer = setTimeout(ask, EVERY_MS);
      else if (s.status === "pending") setGaveUp(true);
    };
    void ask();
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  let body;
  if (!sessionId || state?.status === "error" || state?.status === "canceled" || state?.status === "refunded") {
    body = (
      <section className="gift-intro">
        <h1 className="gift-title">
          {state?.status === "canceled" ? "This gift wasn’t paid" : "We can’t find that gift"}
          <span className="stop">.</span>
        </h1>
        <p className="gift-lead">
          {state?.status === "error" ? state.error : "Nothing was charged for it. If you were charged, the email from us has the card; or write to contact@astoryapp.com."}
        </p>
        <p className="gift-acts">
          <ButtonLink to="/gift">Give A Story</ButtonLink>
        </p>
      </section>
    );
  } else if (!state || state.status === "pending") {
    body = (
      <section className="gift-intro" aria-busy={!gaveUp}>
        {gaveUp ? (
          <>
            <h1 className="gift-title">
              Stripe is still finishing<span className="stop">.</span>
            </h1>
            <p className="gift-lead">The card and its code come by email as soon as the payment is through, usually within a few minutes. You can close this page.</p>
          </>
        ) : (
          <>
            <LoadingMark />
            <p className="gift-lead">Making the card…</p>
          </>
        )}
      </section>
    );
  } else {
    const paid = state as Extract<GiftStatus, { status: "paid" }>;
    const name = firstName(paid.recipientName);
    const link = `${SITE}/gift/redeem/${paid.code}`;
    body = (
      <>
        <section className="gift-intro no-print">
          <p className="gift-kicker">Thank you</p>
          <h1 className="gift-title">
            Your gift for {name} is ready<span className="stop">.</span>
          </h1>
          <p className="gift-lead">The receipt and this card are in your email too.</p>
        </section>
        <div className="gift-grid">
          <div className="gift-preview print-only-card">
            <GiftCard to={paid.recipientName} from={paid.buyerName} note={paid.note} question={paid.firstQuestion} code={paid.code} link={link} />
          </div>
          <div className="gift-form no-print">
            <Button block onClick={() => window.print()}>
              Print the card
            </Button>
            <section className="gift-what" aria-labelledby="gift-next-head">
              <h2 id="gift-next-head">What happens next</h2>
              <ul>
                {nextLines({ recipientName: paid.recipientName, deliverOn: paid.deliverOn, emailed: paid.emailed }).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>
            <p className="gift-fine">
              <Link to="/gift">Give another</Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="gift">
      <header className="gift-top no-print">
        <Link to="/welcome" aria-label="A Story" className="gift-brand">
          <Lockup />
        </Link>
      </header>
      <main className="gift-main">{body}</main>
    </div>
  );
}
