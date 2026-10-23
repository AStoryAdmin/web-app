/**
 * /gift/redeem/:code — what the person the gift is for opens, from the
 * card's QR code or the morning's email. The card first (who it's from,
 * the note, the first question), then one way in: an account, then "Open
 * my gift", which gives that account the year and the hardcover credit
 * (redeem_gift, supabase/gift_2026_10_23.sql). No price and no plan words
 * anywhere on it: the person it is for may well be the teller.
 */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lockup } from "../../components/Brand";
import { Button, ButtonLink, Field } from "../../components/ui";
import LoadingMark from "../../components/delight/LoadingMark";
import { useAuth } from "../../state/authContext";
import GiftCard from "./GiftCard";
import { giftPreview, redeemGift, type GiftPreview, type RedeemAnswer } from "./giftApi";
import { codeKind, firstName, looksLikeGiftCode, normaliseGiftCode } from "./giftWords";
import PromoRedeem from "./PromoRedeem";
import "./gift.css";

/** A promotion code (FB-531) opens the month-on-us page; any other code, the gift. */
export default function GiftRedeem() {
  const { code: raw = "" } = useParams();
  return codeKind(raw) === "promo" ? <PromoRedeem code={normaliseGiftCode(raw)} /> : <GiftOnly raw={raw} />;
}

function GiftOnly({ raw }: { raw: string }) {
  const code = normaliseGiftCode(raw);
  const valid = looksLikeGiftCode(code);
  const { user } = useAuth();
  const navigate = useNavigate();
  // What the code opened, kept with the code it was for, so a new code reads as "still opening".
  const [got, setGot] = useState<{ code: string; preview: GiftPreview | null; offline: boolean } | null>(null);
  const preview = got?.code === code ? got.preview : undefined;
  const offline = got?.code === code && got.offline;
  const [done, setDone] = useState<RedeemAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [typedBad, setTypedBad] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Your gift · A Story";
  }, []);

  useEffect(() => {
    if (!valid) return;
    let live = true;
    giftPreview(code)
      .then((p) => live && setGot({ code, preview: p, offline: false }))
      .catch(() => live && setGot({ code, preview: null, offline: true }));
    return () => {
      live = false;
    };
  }, [code, valid]);

  const open = async () => {
    setBusy(true);
    const r = await redeemGift(code);
    setBusy(false);
    setDone(r);
  };

  const tryCode = (e: FormEvent) => {
    e.preventDefault();
    const c = normaliseGiftCode(typed);
    if (codeKind(c) === "bad") return setTypedBad("A gift code is eight letters and numbers, like K7M2 QX9P.");
    setTypedBad(null);
    navigate(`/gift/redeem/${c}`);
  };

  const typeAnother = (
    <form className="gift-form gift-typecode" onSubmit={tryCode} noValidate>
      <Field label="The code on the card" name="code" value={typed} onChange={(e) => setTyped(e.target.value.toUpperCase())} placeholder="K7M2 QX9P" autoComplete="off" maxLength={11} error={typedBad} />
      <Button type="submit" block variant="outline">
        Open this code
      </Button>
    </form>
  );

  let body;
  if (!valid || preview === null) {
    body = (
      <section className="gift-intro">
        <h1 className="gift-title">
          {offline ? "The gift didn’t open" : "That code doesn’t open a gift"}
          <span className="stop">.</span>
        </h1>
        <p className="gift-lead">{offline ? "Check the connection and try again in a moment." : "Check it against the card: it’s eight letters and numbers."}</p>
        {typeAnother}
      </section>
    );
  } else if (preview === undefined || user === undefined) {
    body = (
      <section className="gift-intro" aria-busy="true">
        <LoadingMark />
        <p className="gift-lead">Opening your gift…</p>
      </section>
    );
  } else {
    const to = firstName(preview.toName);
    const from = firstName(preview.fromName) || "Your family";
    const next = `/gift/redeem/${code}`;
    let act;
    if (done?.ok) {
      act = (
        <>
          <p className="gift-lead" role="status">
            {done.already ? "It’s already yours." : "It’s yours."} A year of A Story, from {from}, and a hardcover of the book it makes when the stories are in.
          </p>
          <ButtonLink to="/" block>
            Begin
          </ButtonLink>
        </>
      );
    } else if (preview.redeemed && !user) {
      act = <p className="gift-lead">This gift has been opened. Sign in on the account that opened it.</p>;
    } else if (!user) {
      act = (
        <>
          <p className="gift-step">
            <b>Step 1 of 2:</b> your own account, about a minute. <b>Step 2:</b> open the gift.
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
          <Button block loading={busy} onClick={open}>
            Open my gift
          </Button>
        </>
      );
    }
    body = (
      <>
        <section className="gift-intro">
          <p className="gift-kicker">A gift from {from}</p>
          <h1 className="gift-title">
            {to ? `${to}, this is for you` : "This is for you"}
            <span className="stop">.</span>
          </h1>
        </section>
        <div className="gift-grid">
          <div className="gift-preview">
            <GiftCard to={preview.toName} from={preview.fromName} note={preview.note} question={preview.firstQuestion} />
          </div>
          <div className="gift-form gift-acts-col">
            {act}
            <p className="gift-fine">What you tell is yours: nothing is shared unless you say so.</p>
          </div>
        </div>
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
