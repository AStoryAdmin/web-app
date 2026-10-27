/**
 * /book/orders/:id — where one printed-book order is (P4-R6). The family
 * reads four steps, Approved → Printing → Shipped → Delivered, in the words of
 * orderStatus.js customerStage (data/orderStage.ts); what they paid, with the
 * deposit and any covered copies as their own lines; when it should arrive;
 * and one tracking link per address once it ships ("Track the parcel to Rose
 * in San Jose"), opening in a new tab. Never a street, never the printer.
 *
 * Coming back from the payment page (?placed=1, via /book/thanks) the webhook
 * can be a few seconds behind the family, so the page says "Confirming your
 * payment…" and reads the order every 2 s for up to 30 s
 * (bookOrders.ts pollUntilPaid); after that it says the email will follow.
 *
 * No endpoint of its own: two plain selects under the owner's RLS
 * (book_orders by id, order_shipments by order_id).
 */
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { ButtonLink, Problem } from "../components/ui";
import { Stop } from "../components/book/WhereNext";
import { useAccount } from "../state/accountContext";
import { getOrder, isPaid, listShipments, pollUntilPaid, type BookOrder, type OrderShipment } from "../data/bookOrders";
import { arrivesWords, money } from "../data/printOrder";
import { track } from "../lib/analytics";
import "../styles/pages/book-order.css";

const TRACKER = ["Approved", "Printing", "Shipped", "Delivered"] as const;

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name.trim();

/** The receipt, from the order's own money columns. An old row without them shows its total alone. */
function receipt(o: BookOrder): { label: string; cents: number }[] {
  if (o.subtotalCents === null) return [];
  const out = [{ label: o.copies > 1 ? `Your book × ${o.copies}` : "Your book", cents: o.subtotalCents }];
  if (o.shippingCents !== null) out.push({ label: "Shipping", cents: o.shippingCents });
  if (o.discountCents > 0) out.push({ label: "Covered copies", cents: -o.discountCents });
  if (o.depositCents > 0) out.push({ label: "Your deposit", cents: -o.depositCents });
  if (o.taxCents > 0) out.push({ label: "Tax", cents: o.taxCents });
  return out;
}

export default function BookOrderStatus() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const placed = params.get("placed") === "1";
  const { stories } = useAccount();
  // undefined while reading; null when there is no such order for this account
  const [order, setOrder] = useState<BookOrder | null | undefined>(undefined);
  const [shipments, setShipments] = useState<OrderShipment[]>([]);
  const [waiting, setWaiting] = useState(placed);
  const [problem, setProblem] = useState<string | null>(null);
  const [ask, setAsk] = useState(0);
  const counted = useRef(false);

  useEffect(() => {
    document.title = "Your book order · A Story";
  }, []);

  useEffect(() => {
    const stop = new AbortController();
    const live = () => !stop.signal.aborted;
    (async () => {
      try {
        const o = placed ? await pollUntilPaid(id, { signal: stop.signal, timeoutMs: 30000, onRead: (r) => live() && r && setOrder(r) }) : await getOrder(id);
        if (!live()) return;
        setOrder(o);
        setWaiting(false);
        setProblem(null);
        if (o) setShipments(await listShipments(id).catch(() => []));
      } catch (err) {
        if (!live()) return;
        setWaiting(false);
        setOrder((prev) => prev ?? null);
        setProblem((err as Error).message || "We couldn’t load the order. Please try again.");
      }
    })();
    return () => stop.abort();
  }, [id, placed, ask]);

  useEffect(() => {
    if (!order || !isPaid(order) || counted.current) return;
    counted.current = true;
    // once per order in this browser: a reload or a later visit reads the same paid order again
    const key = `astory:book-ordered:${order.id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* still counted once per visit */
    }
    track("book_ordered", { copies: order.copies, addresses: shipments.length || undefined, covered: order.totalCents === 0 });
  }, [order, shipments.length]);

  const story = order ? stories.find((s) => s.id === order.storyId) : null;
  const name = story ? firstName(story.name) : "";
  const book = name ? `${name}’s book` : "Your book";

  const hero = (title: string) => (
    <div className="bo-hero">
      <h1 className="hero-title">
        {title}
        <Stop />
      </h1>
    </div>
  );
  const page = (title: string, body: React.ReactNode) => (
    <Shell compact tone="teal" back="/book/orders" title="Your order" hero={hero(title)}>
      <div className="page bo-page bo-flow" aria-live="polite">
        {body}
      </div>
    </Shell>
  );

  if (order === undefined || (waiting && !isPaid(order)))
    return page(
      placed ? "Confirming your payment…" : "Your order",
      <div className="bo-making" aria-busy="true">
        <LoadingMark />
        {placed && <p className="bo-lead">This usually takes a few seconds.</p>}
      </div>,
    );

  if (!order)
    return page(
      "We can’t find that order",
      <>
        {problem && <Problem message={problem} onRetry={() => setAsk((n) => n + 1)} />}
        <p className="bo-lead">If you were charged, the receipt is in your email, and your orders will show it shortly.</p>
        <p className="bo-acts">
          <ButtonLink to="/book/orders">Your orders</ButtonLink>
        </p>
      </>,
    );

  if (!isPaid(order)) {
    const left = order.stage === "Canceled" || order.stage === "Refunded";
    return page(
      placed && !left ? "Your payment is on its way" : "This order wasn’t paid",
      <>
        <p className="bo-lead">{placed && !left ? "We’ll email you as soon as your bank confirms. You can close this page." : "Nothing was charged for it."}</p>
        <p className="bo-acts">
          <ButtonLink to="/book/orders">Your orders</ButtonLink>
        </p>
      </>,
    );
  }

  const at = TRACKER.indexOf(order.stage as (typeof TRACKER)[number]);
  const lines = receipt(order);
  const arrives = order.stage === "Delivered" ? null : arrivesWords(order.deliveryEarliest && order.deliveryLatest ? { earliest: order.deliveryEarliest, latest: order.deliveryLatest } : null);
  const title = order.stage === "Delivered" ? `${book} has arrived` : order.stage === "Shipped" ? `${book} is on its way` : order.stage === "Refunded" ? "This order was refunded" : order.stage === "Canceled" ? "This order was canceled" : `${book} is ordered`;

  return page(
    title,
    <>
      {problem && <Problem message={problem} onRetry={() => setAsk((n) => n + 1)} />}
      {at >= 0 ? (
        <ol className="bo-tracker" aria-label="Where your order is">
          {TRACKER.map((s, i) => (
            <li key={s} data-state={i < at ? "done" : i === at ? "current" : "todo"} aria-current={i === at ? "step" : undefined}>
              <span className="bo-dot" aria-hidden="true" />
              {s}
            </li>
          ))}
        </ol>
      ) : (
        <p className="bo-lead bo-stage-line">
          {order.stage === "Refunded"
            ? "The money goes back to the card it came from."
            : order.stage === "Canceled"
              ? "Nothing more will be charged for it."
              : "This order needs our attention. We’ll email you, or reply to your confirmation email and we’ll help."}
        </p>
      )}
      {order.stage === "Printing" && <p className="bo-help">We wait an hour before printing. If anything looks wrong, reply to your confirmation email right away.</p>}
      {arrives && <p className="bo-arrives">{arrives}</p>}

      {shipments.length > 0 && (
        <section className="bo-section" aria-labelledby="bo-where-h">
          <h2 id="bo-where-h">Where it’s going</h2>
          <ul className="bo-parcels">
            {shipments.map((s) => {
              const first = firstName(s.name) || "them";
              return (
                <li key={s.id}>
                  <p>
                    {s.quantity} {s.quantity === 1 ? "copy" : "copies"} to {first}
                    {s.city ? ` in ${s.city}` : ""}
                  </p>
                  {s.trackingUrl && (
                    <a className="btn outline" href={s.trackingUrl} target="_blank" rel="noopener noreferrer">
                      Track the parcel to {first}
                      {s.city ? ` in ${s.city}` : ""}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="bo-section bo-summary" aria-labelledby="bo-paid-h">
        <h2 id="bo-paid-h">What you paid</h2>
        <dl>
          {lines.map((l) => (
            <div key={l.label} className="bo-line">
              <dt>{l.label}</dt>
              <dd>{money(l.cents)}</dd>
            </div>
          ))}
          <div className="bo-line bo-total">
            <dt>Total</dt>
            <dd>{money(order.totalCents)}</dd>
          </div>
        </dl>
      </section>
      <p className="bo-acts">
        <ButtonLink to="/book/orders">Your orders</ButtonLink>
        <ButtonLink variant="outline" to="/book">
          Back to the book
        </ButtonLink>
      </p>
    </>,
  );
}
