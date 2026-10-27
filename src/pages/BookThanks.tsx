/**
 * /book/thanks?order_id=… — where the payment page sends the family back
 * (create-book-order's returnTo). It is only a way through now (P4-R6):
 *   - paid (the success URL): straight on to the order's status page,
 *     /book/orders/:id?placed=1, which waits for the payment to be confirmed;
 *   - &canceled=1 (they left the payment page): back to the order at the Pay
 *     step, which says "Nothing was charged." and still has the approved book
 *     and the addresses (kept in this tab's sessionStorage).
 * The canceled return needs the order's story, so it reads the order once;
 * without one it goes to the list of orders.
 */
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { getOrder } from "../data/bookOrders";
import "../styles/pages/book-order.css";

export default function BookThanks() {
  const [params] = useSearchParams();
  // the server's return URL names it order_id; older links named it order
  const orderId = params.get("order_id") || params.get("order") || "";
  const canceled = params.get("canceled") === "1";
  // where a canceled return goes: undefined while the order is read
  const [back, setBack] = useState<string | undefined>(canceled && orderId ? undefined : "/book/orders");

  useEffect(() => {
    if (!canceled || !orderId) return;
    let live = true;
    getOrder(orderId)
      .then((o) => live && setBack(o?.storyId ? `/book/order?${new URLSearchParams({ story: o.storyId, step: "pay", canceled: "1" })}` : "/book/orders"))
      .catch(() => live && setBack("/book/orders"));
    return () => {
      live = false;
    };
  }, [orderId, canceled]);

  if (orderId && !canceled) return <Navigate to={`/book/orders/${encodeURIComponent(orderId)}?placed=1`} replace />;
  if (back) return <Navigate to={back} replace />;
  return (
    <Shell compact tone="teal" back="/book" title="Your order">
      <div className="page bo-page" aria-busy="true">
        <LoadingMark />
      </div>
    </Shell>
  );
}
