/**
 * /gift — the holiday gift, bought on the web (PLAN-READY 3.1; the owner's
 * ruling of 23 Oct 2026). Who it's for, a note, the first question, when it
 * arrives, then what the $99 is in plain words and one button to Stripe.
 * On the left (above, on a phone) the card itself, written as you type, the
 * way the app's Give page writes it. No account is needed; a signed-in
 * buyer's order is kept on their account. The person it is for never sees
 * this page or a price: they get the card, or an email on the morning.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lockup } from "../../components/Brand";
import { Button, Field } from "../../components/ui";
import { smarten } from "../../lib/typography";
import GiftCard from "./GiftCard";
import { startGiftCheckout } from "./giftApi";
import { GIFT_INCLUDES, GIFT_PRICE, QUESTION_IDEAS, arrivalChoices, arrivalDate, checkGiftForm, dayMonth, firstName, isoLocal, type GiftForm } from "./giftWords";
import "./gift.css";

const EMPTY: GiftForm = { recipientName: "", recipientEmail: "", note: "", firstQuestion: "", arrival: "christmas", otherDay: "", buyerName: "", buyerEmail: "" };

export default function Gift() {
  const [params] = useSearchParams();
  const canceled = params.get("canceled") === "1";
  const choices = arrivalChoices();
  const [f, setF] = useState<GiftForm>(() => ({ ...EMPTY, arrival: choices.some((c) => c.key === "christmas") ? "christmas" : "today" }));
  const [bad, setBad] = useState<{ field: string; error: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(canceled ? "Nothing was charged. Your card is still here when you’re ready." : null);
  const noteId = useId();
  const firstBad = useRef<HTMLElement | null>(null);
  const set = <K extends keyof GiftForm>(k: K, v: GiftForm[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    if (bad?.field === k) setBad(null);
  };
  const name = firstName(f.recipientName);
  const err = (k: keyof GiftForm) => (bad?.field === k ? bad.error : null);

  useEffect(() => {
    document.title = "Give A Story · A Story";
  }, []);
  useEffect(() => {
    if (bad) firstBad.current?.focus();
  }, [bad]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const wrong = checkGiftForm(f);
    if (wrong) {
      firstBad.current = document.querySelector<HTMLElement>(`[name="${wrong.field}"]`);
      setBad(wrong);
      return;
    }
    setBusy(true);
    setProblem(null);
    const r = await startGiftCheckout(f);
    if (r.ok) {
      window.location.assign(r.checkoutUrl);
      return;
    }
    setBusy(false);
    if (r.field) {
      firstBad.current = document.querySelector<HTMLElement>(`[name="${r.field}"]`);
      setBad({ field: r.field, error: r.error });
    } else setProblem(r.error);
  };

  const arrives = arrivalDate(f.arrival, f.otherDay);

  return (
    <div className="gift">
      <header className="gift-top">
        <Link to="/welcome" aria-label="A Story" className="gift-brand">
          <Lockup />
        </Link>
      </header>

      <main className="gift-main">
        <section className="gift-intro">
          <p className="gift-kicker">A gift for the holidays</p>
          <h1 className="gift-title">
            Give {name || "someone you love"} A Story<span className="stop">.</span>
          </h1>
          <p className="gift-lead">
            {smarten(
              `A year of questions about ${name ? `${name}’s` : "a"} life, answered in ${name ? `${name}’s` : "their"} own words, and the book it makes. Write the card; we take care of the rest.`,
            )}
          </p>
        </section>

        <div className="gift-grid">
          <div className="gift-preview">
            <GiftCard draft to={f.recipientName} from={f.buyerName} note={f.note} question={f.firstQuestion} />
            <p className="gift-preview-cap">The card, as it will arrive{arrives ? ` on ${dayMonth(arrives)}` : ""}.</p>
          </div>

          <form className="gift-form" onSubmit={submit} noValidate aria-describedby={problem ? "gift-problem" : undefined}>
            <fieldset>
              <legend>Who it’s for</legend>
              <Field label="Their first name" name="recipientName" value={f.recipientName} onChange={(e) => set("recipientName", e.target.value)} autoComplete="off" maxLength={80} error={err("recipientName")} placeholder="Hien" />
              <Field
                label={`${name ? `${name}’s` : "Their"} email, if you’d like us to send it`}
                name="recipientEmail"
                type="email"
                inputMode="email"
                value={f.recipientEmail}
                onChange={(e) => set("recipientEmail", e.target.value)}
                autoComplete="off"
                maxLength={254}
                error={err("recipientEmail")}
                hint="Optional. We email the card on the morning it arrives. Leave it empty to hand it over yourself."
              />
            </fieldset>

            <fieldset>
              <legend>The card</legend>
              <label className="field" htmlFor={noteId}>
                <span>A note from you</span>
                <span className="input gift-area">
                  <textarea id={noteId} name="note" value={f.note} onChange={(e) => set("note", e.target.value.slice(0, 500))} rows={4} placeholder="I want to hear all of it." />
                </span>
              </label>
              <Field
                label={`The first thing you’d love to hear${name ? ` from ${name}` : ""}`}
                name="firstQuestion"
                value={f.firstQuestion}
                onChange={(e) => set("firstQuestion", e.target.value.slice(0, 300))}
                maxLength={300}
                error={err("firstQuestion")}
                hint="Optional. It waits on the first day."
              />
              <div className="gift-ideas" aria-label="Ideas for the first question">
                {QUESTION_IDEAS.filter((q) => q !== f.firstQuestion).map((q) => (
                  <button key={q} type="button" className="gift-idea" onClick={() => set("firstQuestion", q)}>
                    + {smarten(q)}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>When it arrives</legend>
              <div className="gift-when" role="radiogroup" aria-label="When it arrives">
                {choices.map((c) => (
                  <label key={c.key} className={`gift-chip${f.arrival === c.key ? " on" : ""}`}>
                    <input type="radio" name="arrival" value={c.key} checked={f.arrival === c.key} onChange={() => set("arrival", c.key)} />
                    {c.label}
                    {c.key === "christmas" ? <small> · 25 Dec</small> : null}
                  </label>
                ))}
              </div>
              {f.arrival === "day" ? (
                <Field label="The day" name="otherDay" type="date" min={isoLocal(new Date())} value={f.otherDay} onChange={(e) => set("otherDay", e.target.value)} error={err("otherDay")} />
              ) : null}
            </fieldset>

            <fieldset>
              <legend>From you</legend>
              <Field label="Your name, as it’s signed" name="buyerName" value={f.buyerName} onChange={(e) => set("buyerName", e.target.value)} autoComplete="name" maxLength={80} error={err("buyerName")} />
              <Field
                label="Your email"
                name="buyerEmail"
                type="email"
                inputMode="email"
                value={f.buyerEmail}
                onChange={(e) => set("buyerEmail", e.target.value)}
                autoComplete="email"
                maxLength={254}
                error={err("buyerEmail")}
                hint="For the receipt, and the card to print."
              />
            </fieldset>

            <section className="gift-what" aria-labelledby="gift-what-head">
              <h2 id="gift-what-head">
                What {GIFT_PRICE} gives {name || "them"}
              </h2>
              <ul>
                {GIFT_INCLUDES.map((i) => (
                  <li key={i.head}>
                    <b>{i.head}.</b> {i.line}
                  </li>
                ))}
              </ul>
              <p className="gift-price">
                <span>{GIFT_PRICE}</span> once, for all of it.
              </p>
            </section>

            {problem ? (
              <p id="gift-problem" className="gift-problem" role="alert">
                {smarten(problem)}
              </p>
            ) : null}
            <Button type="submit" block loading={busy}>
              Continue to payment · {GIFT_PRICE}
            </Button>
            <p className="gift-fine">
              Paid securely with Stripe.{" "}
              {name ? `What ${name} tells is ${name}’s: nothing is shared unless ${name} says so.` : "What they tell is theirs: nothing is shared unless they say so."}
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
