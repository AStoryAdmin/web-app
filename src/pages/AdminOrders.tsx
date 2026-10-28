/**
 * /admin/orders — every printed-book order, for Daniel (docs/PLAN_ORDERING.md, P5-R8). Linked from nowhere.
 *
 * On load it asks admin-orders "me"; the server reads the staff table. Anyone it doesn't answer staff: true for (or an
 * error) sees only "This page isn't available." The list is newest first, 50 at a time, filtered by status or "Needs a
 * look" (failed to send, or a family reported a problem), with "Load more" for the next page.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { Button, Problem } from "../components/ui";
import { ORDER_STATUSES, listAdminOrders, statusLabel, useStaffGate, when, type AdminListRow } from "../data/adminOrders";
import { money } from "../data/printOrder";
import "../styles/pages/admin.css";

export function NotAvailable() {
  return (
    <Shell compact title="Orders">
      <div className="page adm-page">
        <p className="adm-lead">This page isn’t available.</p>
      </div>
    </Shell>
  );
}

export default function AdminOrders() {
  const gate = useStaffGate();
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<AdminListRow[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [ask, setAsk] = useState(0);

  useEffect(() => {
    document.title = "Orders · A Story";
  }, []);

  useEffect(() => {
    if (gate !== "staff") return;
    let live = true;
    listAdminOrders({ status })
      .then((r) => {
        if (!live) return;
        setRows(r.orders);
        setNext(r.next);
        setProblem(null);
      })
      .catch((e: Error) => live && setProblem(e.message))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [gate, status, ask]);

  const more = async () => {
    if (!next) return;
    setBusy(true);
    try {
      const r = await listAdminOrders({ status, before: next });
      setRows((prev) => [...(prev ?? []), ...r.orders]);
      setNext(r.next);
      setProblem(null);
    } catch (e) {
      setProblem((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (gate === "no") return <NotAvailable />;
  if (gate === "checking")
    return (
      <Shell compact title="Orders">
        <div className="page adm-page" aria-busy="true">
          <LoadingMark />
        </div>
      </Shell>
    );

  return (
    <Shell compact title="Orders">
      <div className="page adm-page" aria-live="polite">
        {problem && (
          <Problem
            message={problem}
            onRetry={() => {
              setBusy(true);
              setAsk((n) => n + 1);
            }}
          />
        )}
        <label className="adm-field">
          <span>Show</span>
          <select value={status} onChange={(e) => {
              setBusy(true);
              setRows(null);
              setStatus(e.target.value);
            }} disabled={busy}>
            <option value="">All</option>
            <option value="needs_look">Needs a look</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>

        {rows === null ? (
          <div aria-busy="true">
            <LoadingMark />
          </div>
        ) : rows.length === 0 ? (
          <p className="adm-lead">No orders here.</p>
        ) : (
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Total</th>
                  <th scope="col">Copies</th>
                  <th scope="col">Email</th>
                  <th scope="col">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} data-status={o.status}>
                    <td>
                      <Link to={`/admin/orders/${o.id}`}>{when(o.createdAt) || o.id.slice(0, 8)}</Link>
                    </td>
                    <td>{statusLabel(o.status)}</td>
                    <td>{o.totalCents === null ? "" : money(o.totalCents)}</td>
                    <td>{o.quantity ?? ""}</td>
                    <td className="adm-email">{o.customerEmail ?? ""}</td>
                    <td>{o.submitAttempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {next && (
          <p className="adm-acts">
            <Button variant="outline" onClick={more} disabled={busy}>
              Load more
            </Button>
          </p>
        )}
      </div>
    </Shell>
  );
}
