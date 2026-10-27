/**
 * /book/orders: the printed books this account has paid for, newest first,
 * each with whose book it is, how many copies, where it is now in the family's
 * words (orderStatus.js customerStage, data/orderStage.ts) and a link to its
 * status page (/book/orders/:id). Orders never paid for are left out
 * (P4-R6); the one just back from the payment page has its own page.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { ButtonLink, Problem } from "../components/ui";
import { Stop } from "../components/book/WhereNext";
import { useAccount } from "../state/accountContext";
import { listOrders, type BookOrder } from "../data/bookOrders";
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
        <div className="page bo-page bo-flow">
          {problem && <Problem message={problem} onRetry={() => setAsk((n) => n + 1)} />}
          {orders.length === 0 && !problem ? (
            <div className="bo-closed">
              <p className="bo-lead">No printed books ordered yet. When one is, it shows here, with where it is.</p>
              <ButtonLink to="/book">Back to the book</ButtonLink>
            </div>
          ) : (
            <ol className="bo-orders">
              {orders.map((o) => (
                <li key={o.id} className="bo-order" data-stage={o.stage}>
                  <div className="bo-order-what">
                    <h2>
                      <Link to={`/book/orders/${encodeURIComponent(o.id)}`}>{bookOf(o)}</Link>
                    </h2>
                    <p>{o.copies > 1 ? `${o.copies} copies` : "One copy"}</p>
                    {(o.paidAt || o.createdAt) && <p className="bo-help">Ordered {day(o.paidAt || o.createdAt)}</p>}
                  </div>
                  <p className="bo-order-status">{o.stage}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </Shell>
  );
}
