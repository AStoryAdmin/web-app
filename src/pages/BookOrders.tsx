/**
 * /book/orders: the printed books this account has ordered, newest first,
 * each with whose book it is, the edition, where it went and where it is now
 * (data/bookOrders.ts; book_orders is read-only for its owner). No amounts:
 * Stripe's receipt carries those.
 */
import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { ButtonLink, Problem } from "../components/ui";
import { Stop } from "../components/book/WhereNext";
import { useAccount } from "../state/accountContext";
import { EDITION_WORDS } from "../data/book";
import { listOrders, orderStatusLine, type BookOrder } from "../data/bookOrders";
import "../styles/pages/book-order.css";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "");

export default function BookOrders() {
  const { stories } = useAccount();
  // undefined while asking
  const [orders, setOrders] = useState<BookOrder[] | undefined>(undefined);
  const [problem, setProblem] = useState<string | null>(null);
  const [ask, setAsk] = useState(0);

  useEffect(() => {
    document.title = "Your book orders · A Story";
  }, []);

  useEffect(() => {
    let live = true;
    listOrders()
      .then((rows) => {
        if (!live) return;
        setOrders(rows);
        setProblem(null);
      })
      .catch((err: Error) => {
        if (!live) return;
        setOrders([]);
        setProblem(err.message);
      });
    return () => {
      live = false;
    };
  }, [ask]);

  const bookOf = (o: BookOrder) => {
    const s = stories.find((x) => x.id === o.storyId);
    const first = s ? s.name.trim().split(/\s+/)[0] || s.name : "";
    return first ? `${first}’s book` : "The book";
  };

  return (
    <Shell
      compact
      tone="teal"
      back="/book"
      title="Your orders"
      hero={
        <div className="bo-hero">
          <h1 className="hero-title">
            Your book orders
            <Stop />
          </h1>
        </div>
      }
    >
      {orders === undefined ? (
        <div className="page bo-page" aria-busy="true">
          <LoadingMark />
        </div>
      ) : (
        <div className="page bo-page">
          {problem && <Problem message={problem} onRetry={() => setAsk((n) => n + 1)} />}
          {orders.length === 0 && !problem ? (
            <div className="bo-closed">
              <p className="bo-lead">No printed books ordered yet. When one is, it shows here, with where it is.</p>
              <ButtonLink to="/book">Back to the book</ButtonLink>
            </div>
          ) : (
            <ol className="bo-orders">
              {orders.map((o) => {
                const where = [o.shippingName, o.shippingAddress?.city].map((s) => (s ?? "").trim()).filter(Boolean).join(", ");
                const started = o.status === "pending" || o.status === "canceled";
                return (
                  <li key={o.id} className="bo-order" data-status={o.status}>
                    <div className="bo-order-what">
                      <h2>{bookOf(o)}</h2>
                      <p>
                        {EDITION_WORDS[o.edition].name}
                        {o.copies > 1 ? `, ${o.copies} copies` : ""}
                        {where ? `, to ${where}` : ""}
                      </p>
                      {o.createdAt && (
                        <p className="bo-help">
                          {started ? "Started" : "Ordered"} {day(o.createdAt)}
                        </p>
                      )}
                    </div>
                    <p className="bo-order-status">
                      {orderStatusLine(o)}
                      {o.trackingUrl && (
                        <>
                          {" "}
                          <a href={o.trackingUrl} target="_blank" rel="noreferrer">
                            Follow it
                          </a>
                        </>
                      )}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </Shell>
  );
}
