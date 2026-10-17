/**
 * Plans and prices (docs/PRD.md §7). Every price in full, what each plan
 * includes, the current one marked. Writing, reading and the family are
 * free on every plan; nothing here is a wall. Stripe Checkout for plans is
 * not wired on the web yet, so "Choose" hands over to the marketing site's
 * pricing page and says so.
 */
import { useEffect } from "react";
import Shell from "../components/Shell";
import { ButtonLink } from "../components/ui";
import { CheckIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { PLAN_LABELS, type Plan } from "../lib/plan";
import { track } from "../lib/analytics";

const PRICING_URL = "https://astoryapp.com/pricing";

type PlanCard = {
  id: Plan;
  price: string;
  cadence: string;
  about?: string;
  includes: string[];
  book: string;
  tone?: "featured";
};

const PLANS: PlanCard[] = [
  {
    id: "free",
    price: "$0",
    cadence: "no card, no clock",
    includes: ["Three guided questions a day", "Unlimited writing", "Unlimited family", "Five photographs a week", "One ten-minute conversation"],
    book: "Print at home, free",
  },
  {
    id: "individual",
    price: "$119",
    cadence: "a year",
    about: "about $9.92 a month",
    includes: ["90 minutes of guided calls a month", "One storyteller", "Every question", "Unlimited photographs"],
    book: "A Classic Hardcover each year, or its $69 toward a finer edition, plus the Digital Edition",
    tone: "featured",
  },
  {
    id: "family",
    price: "$229",
    cadence: "a year",
    about: "about $19.08 a month",
    includes: ["200 minutes a month, shared", "Up to three storytellers", "Every question", "Unlimited photographs"],
    book: "A Classic Hardcover for each storyteller, each year",
  },
  {
    id: "express",
    price: "$79",
    cadence: "once, for about 30 days",
    includes: ["140 minutes of guided calls", "One storyteller", "Nothing renews"],
    book: "A Classic Hardcover with the pass",
  },
  {
    id: "monthly",
    price: "$19.99",
    cadence: "a month",
    includes: ["No yearly commitment", "Guided calls each month", "Every question", "Unlimited photographs"],
    book: "The Digital Edition included; printed books from $39",
  },
];

export default function Plans() {
  const { user } = useAuth();
  const current = user?.plan ?? "free";

  useEffect(() => {
    track("plans_viewed", { plan: current });
  }, [current]);

  return (
    <Shell compact title="Plans" back="/account">
      <div className="page plans-page">
        <div className="pagehead">
          <div className="grow">
            <p className="label">Plans</p>
            <h1 style={{ fontSize: "var(--t-h2)" }}>What each plan includes</h1>
          </div>
        </div>
        <p className="plans-promise story" data-rise>Writing, reading and the family are free on every plan, including after a plan stops.</p>
        {current === "complimentary" && <p className="meta" style={{ marginBottom: "var(--s-5)" }}>Your account has full access through an access code. Nothing below is needed.</p>}

        <div className="plan-grid">
          {PLANS.map((p) => {
            const mine = p.id === current;
            return (
              <article key={p.id} className={`card pad plan${p.tone === "featured" ? " featured" : ""}${mine ? " mine" : ""}`} aria-current={mine ? "true" : undefined} data-rise>
                <div className="plan-head">
                  <h2>{PLAN_LABELS[p.id]}</h2>
                  {mine && <span className="chip green">Your plan</span>}
                </div>
                <p className="plan-price">
                  <b>{p.price}</b> <span>{p.cadence}</span>
                </p>
                {p.about && <p className="meta">{p.about}</p>}
                <ul className="plan-list">
                  {p.includes.map((line) => (
                    <li key={line}>
                      <CheckIcon aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="plan-book">
                  <span className="label quiet">The book</span>
                  {p.book}
                </p>
                <div className="plan-act">
                  {mine ? (
                    <span className="meta">This is the plan you are on.</span>
                  ) : p.id === "free" ? (
                    <span className="meta">A plan that stops returns the account to Free. The app is yours. It does not stop being yours.</span>
                  ) : (
                    <a
                      className={`btn ${p.tone === "featured" ? "primary" : "outline"} block`}
                      href={PRICING_URL}
                      target="_blank"
                      rel="noopener"
                      onClick={() => track("checkout_started", { plan: p.id, via: "pricing_site" })}
                    >
                      Choose {PLAN_LABELS[p.id]}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <p className="meta plans-note" data-rise>Plans are bought on astoryapp.com for now and show up here the moment they are paid for. Checkout inside this app is coming.</p>
        <div style={{ marginTop: "var(--s-6)" }}>
          <ButtonLink to="/account" variant="quiet">
            Back to your account
          </ButtonLink>
        </div>
      </div>
    </Shell>
  );
}
