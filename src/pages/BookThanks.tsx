/**
 * /book/thanks?order=… — where Stripe sends the buyer back (create-book-checkout's
 * returnTo), and where an order paid with a gift's hardcover lands. Stripe's
 * webhook may be a few seconds behind the buyer, so the page asks book_orders
 * until the order stops being pending (data/bookOrders.ts pollUntilPaid, as
 * the phone's waitForOrder), then says the email will follow. &canceled=1 is
 * Stripe's back link: nothing was charged, and the order page is a click away.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { ButtonLink } from "../components/ui";
import { Stop } from "../components/book/WhereNext";
import { useAccount } from "../state/accountContext";
import { EDITION_WORDS, orderPath } from "../data/book";
import { getOrder, isPaid, pollUntilPaid, type BookOrder } from "../data/bookOrders";
import { track } from "../lib/analytics";
import "../styles/pages/book-order.css";

/** "Rose Miller, San Jose", from the row's own shipping columns. */
const whereTo = (o: BookOrder) => [o.shippingName, o.shippingAddress?.city].map((s) => (s ?? "").trim()).filter(Boolean).join(", ");

export default function BookThanks() {
  const [params] = useSearchParams();
  // the server's return URL names it order_id; the credit path names it order
  const orderId = params.get("order_id") || params.get("order") || "";
  const canceled = params.get("canceled") === "1";
  const { stories } = useAccount();
  // undefined while asking; null when there is no such order for this account (or it couldn't be read)
  const [order, setOrder] = useState<BookOrder | null | undefined>(orderId ? undefined : null);
  const counted = useRef(false);

  useEffect(() => {
    document.title = "Your book order · A Story";
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const stop = new AbortController();
    // Stripe's back link leaves the order pending for good: one look, nothing to wait for.
    const ask = canceled ? getOrder(orderId) : pollUntilPaid(orderId, { signal: stop.signal });
    ask.then((o) => !stop.signal.aborted && setOrder(o)).catch(() => !stop.signal.aborted && setOrder(null));
    return () => stop.abort();
  }, [orderId, canceled]);

  useEffect(() => {
    if (!order || !isPaid(order) || counted.current) return;
    counted.current = true;
    // once per order in this browser: a reload or a later visit reads the same paid order again
    const key = `astory:book-ordered:${order.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* still count once per mount */
    }
    track("book_ordered", { edition: order.edition, copies: order.copies, withNote: !!order.note, giftCredit: order.included });
  }, [order]);

  const story = order ? stories.find((s) => s.id === order.storyId) : null;
  const name = story ? story.name.trim().split(/\s+/)[0] || story.name : "";
  const book = name ? `${name}’s book` : "The book";

  let title: string;
  let body: React.ReactNode;
  if (order === undefined) {
    title = canceled ? "One moment" : "Confirming your payment";
    body = (
      <div aria-busy="true">
        <LoadingMark />
        {!canceled && <p className="bo-lead">Stripe is telling us it went through. This takes a few seconds.</p>}
      </div>
    );
  } else if (!order) {
    title = "We can’t find that order";
    body = (
      <>
        <p className="bo-lead">If you were charged, the receipt from Stripe is in your email, and your orders will show it shortly.</p>
        <p className="bo-acts">
          <ButtonLink to="/book/orders">Your orders</ButtonLink>
          <ButtonLink variant="outline" to="/book">
            Back to the book
          </ButtonLink>
        </p>
      </>
    );
  } else if (canceled && (order.status === "pending" || order.status === "canceled")) {
    title = "Not ordered";
    body = (
      <>
        <p className="bo-lead">You left Stripe’s page before paying, so nothing was charged.</p>
        <p className="bo-acts">
          <ButtonLink to={orderPath(order.storyId, order.edition)}>Back to the order</ButtonLink>
          <ButtonLink variant="outline" to="/book">
            Back to the book
          </ButtonLink>
        </p>
      </>
    );
  } else if (order.status === "pending") {
    title = "Stripe is still finishing";
    body = (
      <>
        <p className="bo-lead">The payment usually comes through within a few minutes, and you’ll hear by email when it does. You can close this page.</p>
        <p className="bo-acts">
          <ButtonLink to="/book/orders">Your orders</ButtonLink>
        </p>
      </>
    );
  } else if (order.status === "canceled" || order.status === "refunded") {
    title = order.status === "refunded" ? "This order was refunded" : "This order wasn’t paid";
    body = (
      <>
        <p className="bo-lead">{order.status === "refunded" ? "The money goes back to the card it came from." : "Nothing was charged for it."}</p>
        <p className="bo-acts">
          <ButtonLink to="/book">Back to the book</ButtonLink>
        </p>
      </>
    );
  } else {
    const where = whereTo(order);
    title = "Ordered";
    body = (
      <>
        <p className="bo-lead">{where ? `${book} is on its way to ${where}.` : `${book} is ordered.`}</p>
        <ul className="bo-steps">
          <li>{order.edition === "legacy" ? "Your editor will be in touch by email within two working days to begin." : `We print it and post it. ${EDITION_WORDS[order.edition].delivery}.`}</li>
          {order.included && <li>Paid with your gift’s hardcover.</li>}
          {order.note && <li>Your note goes on the first page, in your words.</li>}
          <li>You’ll hear by email when it ships.</li>
        </ul>
        <p className="bo-acts">
          <ButtonLink to="/book">Back to the book</ButtonLink>
          <Link to="/book/orders" className="more">
            Your orders
          </Link>
        </p>
      </>
    );
  }

  return (
    <Shell
      compact
      tone="teal"
      back="/book"
      title="Your order"
      hero={
        <div className="bo-hero">
          <h1 className="hero-title">
            {title}
            <Stop />
          </h1>
        </div>
      }
    >
      <div className="page bo-page bo-thanks" aria-live="polite">
        {body}
      </div>
    </Shell>
  );
}
