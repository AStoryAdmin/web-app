/**
 * Plans and prices (docs/PRD.md §7, from pricing.ts, the file that mirrors
 * what Stripe charges). One comparison table, every plan side by side and
 * every price in full, the current one marked; on a phone each plan is its
 * own short list. Nothing is invented: where a plan says nothing about a
 * row, the cell says nothing. Writing, reading and the family are free on
 * every plan; nothing here is a wall. Checkout for plans is not wired on the
 * web yet, so "Choose" hands over to the marketing site's pricing page, and
 * the page says so once.
 */
import { useEffect } from "react";
import Shell from "../components/Shell";
import { useAuth } from "../state/authContext";
import { PLAN_LABELS, type Plan } from "../lib/plan";
import { track } from "../lib/analytics";
import WhereNext, { Stop } from "../components/book/WhereNext";

const PRICING_URL = "https://astoryapp.com/pricing";

type Row = "calls" | "storytellers" | "questions" | "photos" | "book";

const ROWS: { key: Row; label: string }[] = [
  { key: "calls", label: "Guided calls" },
  { key: "storytellers", label: "Storytellers" },
  { key: "questions", label: "Questions" },
  { key: "photos", label: "Photographs" },
  { key: "book", label: "The book" },
];

type PlanCol = { id: Plan; price: string; cadence: string; about?: string; hardcover?: boolean; cells: Partial<Record<Row, string>> };

const PLANS: PlanCol[] = [
  {
    id: "free",
    price: "$0",
    cadence: "no card, no clock",
    cells: { calls: "One ten-minute conversation", questions: "Three guided questions a day", photos: "Five a week", book: "Print at home" },
  },
  {
    id: "individual",
    hardcover: true,
    price: "$119",
    cadence: "a year",
    about: "about $9.92 a month",
    cells: {
      calls: "90 minutes a month",
      storytellers: "One",
      questions: "Every question",
      photos: "Unlimited",
      book: "A Classic Hardcover each year, and the Digital Edition",
    },
  },
  {
    id: "family",
    hardcover: true,
    price: "$229",
    cadence: "a year",
    about: "about $19.08 a month",
    cells: { calls: "200 minutes a month, shared", storytellers: "Up to three", questions: "Every question", photos: "Unlimited", book: "A Classic Hardcover for each storyteller, each year" },
  },
  {
    id: "express",
    hardcover: true,
    price: "$79",
    cadence: "once",
    about: "for about 30 days; nothing renews",
    cells: { calls: "140 minutes", storytellers: "One", book: "A Classic Hardcover with the pass" },
  },
  {
    id: "monthly",
    price: "$19.99",
    cadence: "a month",
    about: "no yearly commitment",
    cells: { calls: "Guided calls each month", questions: "Every question", photos: "Unlimited", book: "The Digital Edition; printed books from $39" },
  },
];

export default function Plans() {
  const { user } = useAuth();
  const current = user?.plan ?? "free";

  useEffect(() => {
    track("plans_viewed", { plan: current });
  }, [current]);

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
            Writing, reading and the family are free on every plan, including after a plan stops.
          </p>
        </div>
      }
    >
      <div className="page plans-page">
        <div className="pl-note" data-rise>
          {current === "complimentary" ? (
            <p>
              <b>Full access</b>, through an access code: none of these is needed.
            </p>
          ) : (
            <p>
              You are on <b>{PLAN_LABELS[current]}</b>.
            </p>
          )}
          <p>Plans are bought on astoryapp.com for now, and show here the moment they are paid for.</p>
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
                  <p className="pl-price">
                    <b>{p.price}</b> <span>{p.cadence}</span>
                  </p>
                  <p className="pl-about">{p.about ?? " "}</p>
                </header>
                {ROWS.map((r) => (
                  <p key={r.key} className={`pl-cell${p.cells[r.key] ? "" : " none"}`}>
                    <span className="pl-cell-label">{r.label}</span>
                    <span className="pl-cell-value">
                      {/* a small drawn keepsake for the plans with a hardcover, on its own line, on a large window only */}
                      {r.key === "book" && p.hardcover && <span className="pl-keepsake" aria-hidden="true" />}
                      {p.cells[r.key] ?? "—"}
                    </span>
                  </p>
                ))}
                <div className="pl-act">
                  {mine ? (
                    <span className="pl-mine">Your plan</span>
                  ) : p.id === "free" ? (
                    <span className="pl-quiet">Where every account starts</span>
                  ) : current === "complimentary" ? null : (
                    <a className="btn outline sm pl-choose" href={PRICING_URL} target="_blank" rel="noopener" onClick={() => track("checkout_started", { plan: p.id, via: "pricing_site" })}>
                      Choose <span aria-hidden="true">↗</span>
                      <span className="sr-only"> {PLAN_LABELS[p.id]} (opens astoryapp.com)</span>
                    </a>
                  )}
                </div>
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
