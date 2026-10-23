/**
 * /gift/redeem/<promo code> — a free month of A Story (FB-531, "Ilovemyfamily2026"). The code is checked
 * before an account exists (promo_preview), then one way in: an account, then "Start my month" (redeem_promo,
 * supabase/promo_2026_10_23.sql). No price, no countdown, no card: it ends on its own with a note a week before.
 * The iPhone app never uses this: there the same words are an App Store Offer Code (App Store 3.1.1).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lockup } from "../../components/Brand";
import { Button, ButtonLink } from "../../components/ui";
import LoadingMark from "../../components/delight/LoadingMark";
import { useAuth } from "../../state/authContext";
import { promoPreview, redeemPromo, type PromoAnswer, type PromoPreview } from "./giftApi";
import { PROMO_LINES, PROMO_REFUSALS, longDay } from "./giftWords";
import "./gift.css";

export default function PromoRedeem({ code }: { code: string }) {
  const { user } = useAuth();
  const [got, setGot] = useState<{ code: string; preview: PromoPreview | null } | null>(null);
  const [done, setDone] = useState<PromoAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = got?.code === code ? got.preview : undefined;

  useEffect(() => {
    document.title = "A free month · A Story";
  }, []);
  useEffect(() => {
    let live = true;
    promoPreview(code)
      .then((p) => live && setGot({ code, preview: p }))
      .catch(() => live && setGot({ code, preview: null }));
    return () => {
      live = false;
    };
  }, [code]);

  const start = async () => {
    setBusy(true);
    const r = await redeemPromo(code);
    setBusy(false);
    setDone(r);
  };

  const next = `/gift/redeem/${code}`;
  let body;
  if (preview === undefined || user === undefined) {
    body = (
      <section className="gift-intro" aria-busy="true">
        <LoadingMark />
        <p className="gift-lead">Checking the code…</p>
      </section>
    );
  } else if (!preview || !preview.valid) {
    body = (
      <section className="gift-intro">
        <h1 className="gift-title">
          {preview ? "That code can’t be used" : "The code didn’t open"}
          <span className="stop">.</span>
        </h1>
        <p className="gift-lead">{preview ? PROMO_REFUSALS[preview.reason || "not_found"] || PROMO_REFUSALS.not_found : "Check the connection and try again in a moment."}</p>
        <p className="gift-acts">
          <ButtonLink to="/" variant="outline">
            Go to A Story
          </ButtonLink>
        </p>
      </section>
    );
  } else {
    let act;
    if (done?.ok) {
      act = (
        <>
          <p className="gift-lead" role="status">
            It’s on. {done.endsAt ? `It ends on its own on ${longDay(done.endsAt)}, with a note from us a week before.` : "It ends on its own, with a note from us a week before."} Nothing renews.
          </p>
          <ButtonLink to="/" block>
            Begin
          </ButtonLink>
        </>
      );
    } else if (!user) {
      act = (
        <>
          <p className="gift-step">
            <b>Step 1 of 2:</b> your own account, about a minute. <b>Step 2:</b> start your month.
          </p>
          <ButtonLink to={`/create-account?next=${encodeURIComponent(next)}`} block>
            Create an account
          </ButtonLink>
          <ButtonLink to={`/sign-in?next=${encodeURIComponent(next)}`} variant="outline" block>
            I already have an account
          </ButtonLink>
        </>
      );
    } else {
      act = (
        <>
          {done && !done.ok ? (
            <p className="gift-problem" role="alert">
              {done.error}
            </p>
          ) : null}
          <Button block loading={busy} onClick={start}>
            Start my month
          </Button>
        </>
      );
    }
    body = (
      <>
        <section className="gift-intro">
          <p className="gift-kicker">{PROMO_LINES.kicker}</p>
          <h1 className="gift-title">
            {preview.months > 1 ? `${preview.months} free months of A Story` : PROMO_LINES.title}
            <span className="stop">.</span>
          </h1>
          <p className="gift-lead">{PROMO_LINES.lead}</p>
        </section>
        <div className="gift-form gift-acts-col promo-acts">{act}</div>
      </>
    );
  }

  return (
    <div className="gift">
      <header className="gift-top">
        <Link to="/welcome" aria-label="A Story" className="gift-brand">
          <Lockup />
        </Link>
      </header>
      <main className="gift-main">{body}</main>
    </div>
  );
}
