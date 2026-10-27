/**
 * What each plan gives (docs/PRD.md §7, gap rows 41 and E22 of the M6
 * audit). One comparison table, every plan side by side, the current one
 * marked; on a phone each plan is its own short list. No prices while
 * ordering is closed, and no printed book on any plan: plans are in-app
 * purchases of the digital service (phone-app/src/lib/planPerks.js), and a
 * printed book is ordered on its own. Plans are chosen in the A Story app on
 * iPhone; the web has no checkout, so nothing here is a button to buy.
 */
import { useEffect } from "react";
import Shell from "../components/Shell";
import { useAuth } from "../state/authContext";
import { PLAN_LABELS, type GiftYear, type Plan } from "../lib/plan";
import { track } from "../lib/analytics";
import WhereNext, { Stop } from "../components/book/WhereNext";

type Row = "calls" | "storytellers" | "questions" | "photos" | "book";

const ROWS: { key: Row; label: string }[] = [
  { key: "calls", label: "Guided calls" },
  { key: "storytellers", label: "Storytellers" },
  { key: "questions", label: "Questions" },
  { key: "photos", label: "Photographs" },
  { key: "book", label: "The book" },
];

// The minutes are callUsage.js's CALL_MINUTES_BY_PLAN; the Digital Edition
// goes to the year-long plans and Express only (bookAllowance.js, `member`).
type PlanCol = { id: Plan; line: string; cells: Partial<Record<Row, string>> };

const PLANS: PlanCol[] = [
  {
    id: "free",
    line: "Where every account starts, for as long as you like.",
    cells: { calls: "One ten-minute conversation", questions: "Three guided questions a day", photos: "Five a week", book: "Every page, ready to print at home" },
  },
  {
    id: "individual",
    line: "One storyteller, every part of A Story. Renews each year until you turn it off.",
    cells: { calls: "90 minutes a month", storytellers: "One", questions: "Every question", photos: "Unlimited", book: "The Digital Edition" },
  },
  {
    id: "family",
    line: "Up to three storytellers, one shared archive. Renews each year until you turn it off.",
    cells: { calls: "200 minutes a month, shared", storytellers: "Up to three", questions: "Every question", photos: "Unlimited", book: "The Digital Edition" },
  },
  {
    id: "express",
    line: "For a visit, or a moment that can’t wait. Runs for 30 days and does not renew.",
    cells: { calls: "140 minutes, within 30 days", storytellers: "One", questions: "Every question", photos: "Unlimited", book: "The Digital Edition" },
  },
  {
    id: "monthly",
    line: "Every part of A Story, month by month. Renews each month until you turn it off.",
    cells: { calls: "90 minutes a month", storytellers: "One", questions: "Every question", photos: "Unlimited" },
  },
];

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** "You are on Individual", and where it came from when it was given. */
function CurrentPlan({ plan, giftYear }: { plan: Plan; giftYear: GiftYear | null }) {
  if (plan === "complimentary") {
    return (
      <p>
        <b>Full access</b>, through an access code: none of these is needed.
      </p>
    );
  }
  if (giftYear) {
    const from = giftYear.kind === "promo" ? "A Story" : giftYear.fromName || "your family";
    return (
      <p>
        You are on <b>{PLAN_LABELS[plan]}</b>, a gift from {from}, until {longDate(giftYear.endsAt)}. It does not renew, so there is nothing to cancel.
      </p>
    );
  }
  return (
    <p>
      You are on <b>{PLAN_LABELS[plan]}</b>.
    </p>
  );
}

export default function Plans() {
  const { user } = useAuth();
  const current = user?.plan ?? "free";
  const source = user?.planSource ?? "free";

  useEffect(() => {
    track("plans_viewed", { plan: current, source });
  }, [current, source]);

  return (
    <Shell
      compact
      wide
      back="/account"
      title="Plans"
      hero={
        <div className="pl-hero">
          <h1 className="hero-title">
            Plans
            <Stop />
          </h1>
          <p className="pl-promise" data-rise>
            Writing, reading and the family come with every plan, Free included, and they stay after a plan stops.
          </p>
        </div>
      }
    >
      <div className="page plans-page">
        <div className="pl-note" data-rise>
          <CurrentPlan plan={current} giftYear={user?.giftYear ?? null} />
          <p>Plans are chosen in the A Story app on iPhone, and show here as soon as they start. A printed book is ordered on its own, apart from any plan.</p>
        </div>

        <div className={`pl-table${current === "complimentary" ? " no-act" : ""}`} role="group" aria-label="What each plan includes" data-rise>
          <div className="pl-labels" aria-hidden="true">
            <span className="pl-corner" />
            {ROWS.map((r) => (
              <span key={r.key} className="pl-label">
                {r.label}
              </span>
            ))}
            <span className="pl-label pl-label-act" />
          </div>
          {PLANS.map((p) => {
            const mine = p.id === current;
            return (
              <section key={p.id} className={`pl-col${mine ? " mine gilt" : ""}`} aria-labelledby={`pl-${p.id}`} aria-current={mine ? "true" : undefined}>
                {mine && (
                  <>
                    <i className="glint" aria-hidden="true" />
                    <span className="pl-flourish tl" aria-hidden="true" />
                    <span className="pl-flourish br" aria-hidden="true" />
                  </>
                )}
                <header className="pl-head">
                  <h2 id={`pl-${p.id}`}>{PLAN_LABELS[p.id]}</h2>
                  <p className="pl-about">{p.line}</p>
                </header>
                {ROWS.map((r) => (
                  <p key={r.key} className={`pl-cell${p.cells[r.key] ? "" : " none"}`}>
                    <span className="pl-cell-label">{r.label}</span>
                    <span className="pl-cell-value">{p.cells[r.key] ?? "—"}</span>
                  </p>
                ))}
                <div className="pl-act">{mine ? <span className="pl-mine">Your plan</span> : null}</div>
              </section>
            );
          })}
        </div>

        <WhereNext
          rows={[
            { to: "/book", title: "See the book", line: "Every page as it will print, and the editions." },
            { to: "/account", title: "Your account", line: "Your name, the wall, who looks after this." },
            { to: "/", title: "Back to today", line: "Today’s question is waiting." },
          ]}
        />
      </div>
    </Shell>
  );
}
