/**
 * /admin/orders/:id — one order, for Daniel (docs/PLAN_ORDERING.md, P5-R8 and P5-R9). Linked from the list only.
 *
 * Shows the order and its money lines, every shipment with its full address and tracking, the family's reports with
 * their photos (signed for 10 minutes), and the whole event log. Three actions, each sent to admin-orders, which checks
 * staff on the server:
 *   - Retry sending to the printer: only on submission_failed.
 *   - Change status: a target and a note; it changes the status only (no refund, no email, no printer).
 *   - Refund: only when the order was charged; a note, then "Refund $X to the card?".
 * Every button is disabled while one of them is on its way.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { Button, Problem } from "../components/ui";
import {
  OVERRIDE_TARGETS,
  getAdminOrder,
  noteOk,
  overrideAdminOrder,
  refundAdminOrder,
  retryAdminOrder,
  statusLabel,
  useStaffGate,
  when,
  type AdminDetail,
  type OverrideTarget,
} from "../data/adminOrders";
import { money } from "../data/printOrder";
import { NotAvailable } from "./AdminOrders";
import "../styles/pages/admin.css";

const REASONS: Record<string, string> = {
  not_arrived: "It hasn’t arrived",
  damaged: "It arrived damaged",
  wrong: "Something in the book is wrong",
  other: "Something else",
};

function moneyLines(o: AdminDetail["order"]): { label: string; cents: number }[] {
  const out: { label: string; cents: number }[] = [];
  if (o.subtotalCents !== null) out.push({ label: `Copies${o.quantity ? ` × ${o.quantity}` : ""}`, cents: o.subtotalCents });
  if (o.shippingCents !== null) out.push({ label: "Shipping", cents: o.shippingCents });
  if (o.discountCents > 0) out.push({ label: "Covered copies", cents: -o.discountCents });
  if (o.depositCreditCents > 0) out.push({ label: "Deposit", cents: -o.depositCreditCents });
  if (o.taxCents > 0) out.push({ label: "Tax", cents: o.taxCents });
  return out;
}

export default function AdminOrder() {
  const { id = "" } = useParams();
  const gate = useStaffGate();
  const [detail, setDetail] = useState<AdminDetail | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [ask, setAsk] = useState(0);

  const [to, setTo] = useState<OverrideTarget>("delivered");
  const [overrideNote, setOverrideNote] = useState("");
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [refundNote, setRefundNote] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);

  useEffect(() => {
    document.title = "Order · A Story";
  }, []);

  useEffect(() => {
    if (gate !== "staff") return;
    let live = true;
    getAdminOrder(id)
      .then((d) => {
        if (!live) return;
        setDetail(d);
        setProblem(null);
      })
      .catch((e: Error) => {
        if (!live) return;
        setDetail((prev) => prev ?? null);
        setProblem(e.message);
      });
    return () => {
      live = false;
    };
  }, [gate, id, ask]);

  /** Runs one action, then reads the order again. */
  const act = async (run: () => Promise<string | null>) => {
    setBusy(true);
    setSaid(null);
    try {
      const words = await run();
      setProblem(null);
      setSaid(words);
      setDetail(await getAdminOrder(id));
    } catch (e) {
      setProblem((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (gate === "no") return <NotAvailable />;
  const page = (body: React.ReactNode) => (
    <Shell compact title="Order" back="/admin/orders">
      <div className="page adm-page" aria-live="polite">
        {body}
      </div>
    </Shell>
  );
  if (gate === "checking" || detail === undefined)
    return page(
      <div aria-busy="true">
        <LoadingMark />
      </div>,
    );
  if (detail === null)
    return page(
      <>
        <p className="adm-id">{id}</p>
        {problem && <Problem message={problem} onRetry={() => setAsk((n) => n + 1)} />}
      </>,
    );

  const { order, shipments, events, issues } = detail;
  const total = order.totalCents === null ? "" : money(order.totalCents);

  return page(
    <>
      <p className="adm-id">{order.id}</p>
      {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}
      {said && <p className="adm-said">{said}</p>}

      <section className="adm-section" aria-labelledby="adm-sum-h">
        <h2 id="adm-sum-h">Summary</h2>
        <dl className="adm-dl">
          <div>
            <dt>Status</dt>
            <dd data-testid="adm-status">{statusLabel(order.status)}</dd>
          </div>
          <div>
            <dt>Placed</dt>
            <dd>{when(order.createdAt)}</dd>
          </div>
          {order.paidAt && (
            <div>
              <dt>Paid</dt>
              <dd>{when(order.paidAt)}</dd>
            </div>
          )}
          {order.submitAfter && (
            <div>
              <dt>Hold ends</dt>
              <dd>{when(order.submitAfter)}</dd>
            </div>
          )}
          <div>
            <dt>Email</dt>
            <dd>{order.customerEmail ?? ""}</dd>
          </div>
          <div>
            <dt>Attempts</dt>
            <dd>
              {order.submitAttempts}
              {order.nextAttemptAt ? `, next ${when(order.nextAttemptAt)}` : ""}
            </dd>
          </div>
          {order.stripePaymentIntentId && (
            <div>
              <dt>Payment</dt>
              <dd className="adm-mono">{order.stripePaymentIntentId}</dd>
            </div>
          )}
          {order.providerName && (
            <div>
              <dt>Printer</dt>
              <dd>{order.providerName}</dd>
            </div>
          )}
          {order.reorderOf && (
            <div>
              <dt>Reorder of</dt>
              <dd className="adm-mono">{order.reorderOf}</dd>
            </div>
          )}
        </dl>
        <dl className="adm-money">
          {moneyLines(order).map((l) => (
            <div key={l.label}>
              <dt>{l.label}</dt>
              <dd>{money(l.cents)}</dd>
            </div>
          ))}
          <div className="adm-total">
            <dt>Total</dt>
            <dd>{total}</dd>
          </div>
        </dl>
      </section>

      <section className="adm-section" aria-labelledby="adm-ship-h">
        <h2 id="adm-ship-h">Shipments</h2>
        {shipments.length === 0 ? (
          <p>None.</p>
        ) : (
          <ul className="adm-cards">
            {shipments.map((s) => (
              <li key={s.id}>
                <p>
                  <strong>
                    {s.quantity} {s.quantity === 1 ? "copy" : "copies"} · {statusLabel(s.status)}
                  </strong>
                </p>
                <p className="adm-address">
                  {s.name}
                  <br />
                  {s.line1}
                  {s.line2 ? (
                    <>
                      <br />
                      {s.line2}
                    </>
                  ) : null}
                  <br />
                  {s.city}, {s.state} {s.postalCode} {s.country}
                </p>
                {(s.phone || s.email) && <p>{[s.phone, s.email].filter(Boolean).join(" · ")}</p>}
                {s.providerOrderId && <p className="adm-mono">Printer order {s.providerOrderId}</p>}
                {(s.carrier || s.trackingNumber) && <p>{[s.carrier, s.trackingNumber].filter(Boolean).join(" ")}</p>}
                {s.trackingUrl && (
                  <p>
                    <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer">
                      Tracking link
                    </a>
                  </p>
                )}
                {s.providerIssue && <p className="adm-warn">Printer issue: {s.providerIssue}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {issues.length > 0 && (
        <section className="adm-section" aria-labelledby="adm-iss-h">
          <h2 id="adm-iss-h">Reports from the family</h2>
          <ul className="adm-cards">
            {issues.map((i) => (
              <li key={i.id}>
                <p>
                  <strong>{(i.reason && REASONS[i.reason]) || i.reason || "Report"}</strong> · {when(i.createdAt)}
                  {i.resolvedAt ? ` · resolved ${when(i.resolvedAt)}` : " · open"}
                </p>
                <p className="adm-issue-text">{i.description}</p>
                {i.photoUrl && (
                  <a href={i.photoUrl} target="_blank" rel="noopener noreferrer" className="adm-thumb">
                    <img src={i.photoUrl} alt="The family’s photo" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="adm-section" aria-labelledby="adm-act-h">
        <h2 id="adm-act-h">Actions</h2>

        {order.status === "submission_failed" && (
          <div className="adm-box">
            <Button onClick={() => act(async () => (await retryAdminOrder(order.id)).words ?? "It will be sent on the next run.")} disabled={busy}>
              Retry sending to the printer
            </Button>
          </div>
        )}

        <div className="adm-box">
          <h3>Change status</h3>
          <p>This changes the status only. It doesn’t refund, email the family or tell the printer.</p>
          <label className="adm-field">
            <span>New status</span>
            <select
              value={to}
              onChange={(e) => {
                setTo(e.target.value as OverrideTarget);
                setConfirmOverride(false);
              }}
              disabled={busy}
            >
              {OVERRIDE_TARGETS.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="adm-field">
            <span>Note (required)</span>
            <textarea value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} maxLength={1000} rows={2} disabled={busy} />
          </label>
          {confirmOverride ? (
            <div className="adm-confirm" role="group" aria-label="Confirm the status change">
              <p>
                Change the status to {statusLabel(to)}?
              </p>
              <div className="adm-acts">
                <Button
                  onClick={() =>
                    act(async () => {
                      const r = await overrideAdminOrder(order.id, to, overrideNote);
                      setConfirmOverride(false);
                      setOverrideNote("");
                      return r.changed ? `Status changed to ${statusLabel(to)}.` : "Nothing changed: it was already there.";
                    })
                  }
                  disabled={busy || !noteOk(overrideNote)}
                >
                  Yes, change it
                </Button>
                <Button variant="outline" onClick={() => setConfirmOverride(false)} disabled={busy}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirmOverride(true)} disabled={busy || !noteOk(overrideNote)}>
              Change status
            </Button>
          )}
        </div>

        {order.charged && order.status !== "refunded" && (
          <div className="adm-box">
            <h3>Refund</h3>
            <p>Refunds the whole payment. Printer orders that haven’t shipped are canceled first, the credits go back and the family gets the refunded email.</p>
            <label className="adm-field">
              <span>Note (required)</span>
              <textarea value={refundNote} onChange={(e) => setRefundNote(e.target.value)} maxLength={1000} rows={2} disabled={busy} />
            </label>
            {confirmRefund ? (
              <div className="adm-confirm" role="group" aria-label="Confirm the refund">
                <p>Refund {total} to the card?</p>
                <div className="adm-acts">
                  <Button
                    onClick={() =>
                      act(async () => {
                        const r = await refundAdminOrder(order.id, refundNote);
                        setConfirmRefund(false);
                        setRefundNote("");
                        return r.alreadyRefunded ? "Stripe had already refunded it. The order is marked refunded." : `Refunded ${total}.`;
                      })
                    }
                    disabled={busy || !noteOk(refundNote)}
                  >
                    Yes, refund {total}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmRefund(false)} disabled={busy}>
                    Don’t refund
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setConfirmRefund(true)} disabled={busy || !noteOk(refundNote)}>
                Refund
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="adm-section" aria-labelledby="adm-log-h">
        <h2 id="adm-log-h">Event log</h2>
        <ol className="adm-log">
          {events.map((e) => (
            <li key={e.id}>
              <p>
                <span className="adm-when">{when(e.at)}</span> · <span className="adm-mono">{e.actor}</span> · {e.kind}
                {e.fromStatus || e.toStatus ? ` · ${e.fromStatus ? statusLabel(e.fromStatus) : "—"} → ${e.toStatus ? statusLabel(e.toStatus) : "—"}` : ""}
              </p>
              {e.note && <p className="adm-note">{e.note}</p>}
              {e.data !== null && e.data !== undefined && (
                <details>
                  <summary>Data</summary>
                  <pre>{JSON.stringify(e.data, null, 2)}</pre>
                </details>
              )}
            </li>
          ))}
        </ol>
      </section>
    </>,
  );
}
