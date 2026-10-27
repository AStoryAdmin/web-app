import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import PlateSay from "./PlateSay";
import { useCodeAria } from "./useCodeAria";
import { useArrive } from "./useArrive";
import { clearHandoff, readHandoff } from "./handoff";
import { Button } from "../../components/ui";
import PlateCode from "./PlateCode";
import { CODE_LEN, resendSignupCode, safeNext, sendEmailCode, verifyEmailCode, verifySignupCode } from "../../data/auth";
import { useAuth } from "../../state/authContext";

/**
 * The six-digit emailed code, typed here, never a link: the one that confirms a new account's email, or the one that
 * signs someone in with no password (the app's default way in). The address comes in the router's state (handoff.ts),
 * never the URL. The dog sleeps while it waits.
 */
export default function Verify() {
  const { user } = useAuth();
  const { arrive, arriving } = useArrive();
  const location = useLocation();
  const [params] = useSearchParams();
  // read once: after the code is accepted the stored copy is cleared, and the page must not forget the address mid-way
  const [handoff] = useState(() => readHandoff(location.state));
  const email = handoff?.email || "";
  const byCode = handoff?.mode === "email";
  const next = safeNext(params.get("next"));
  const familyCode = params.get("code") || "";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [again, setAgain] = useState<"wait" | "ready" | "busy" | "sent">("wait");
  const codeRef = useRef<HTMLDivElement>(null);
  useCodeAria(codeRef, !!error);

  // Another code can be asked for after a little while; no clock is shown, the link simply appears.
  useEffect(() => {
    if (again !== "wait" && again !== "sent") return;
    const t = setTimeout(() => setAgain("ready"), 45000);
    return () => clearTimeout(t);
  }, [again]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy || arriving) return;
    if (code.length < CODE_LEN) return setError("Type all six digits from the email.");
    setError(null);
    setBusy(true);
    const r = byCode ? await verifyEmailCode(email, code) : await verifySignupCode(email, code);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    clearHandoff();
    // signed in now: go on once AuthProvider has them, so the signed-in pages don't send them back to sign in
    arrive(familyCode ? `/join/${encodeURIComponent(familyCode)}` : next);
  };

  useEffect(() => {
    if (code.length === CODE_LEN) queueMicrotask(() => void submit());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (user && !arriving) return <Navigate to={next} replace />;

  const resend = async () => {
    setAgain("busy");
    const r = !byCode
      ? await resendSignupCode(email)
      : await sendEmailCode(email, handoff?.create ? { createUser: true, name: handoff.create.name, code: handoff.create.code } : { createUser: false });
    if (!r.ok) {
      setAgain("ready");
      return setError(r.error);
    }
    setAgain("sent");
  };

  // a mistyped address is fixed where it was typed; the address travels in the router's state (never in the URL), so
  // that page opens with it ready to correct
  const fromSignIn = byCode && !handoff?.create;
  const change = fromSignIn
    ? `/sign-in?next=${encodeURIComponent(next)}`
    : `/create-account?next=${encodeURIComponent(next)}${familyCode ? `&code=${encodeURIComponent(familyCode)}` : ""}`;

  if (!email) {
    return (
      <AuthFrame poses={["sleep"]}>
        <div className="form">
          <h1>Which email was it?</h1>
          <PlateSay>This page needs the address the code went to. Sign in with it and we’ll send a fresh code; it takes a minute.</PlateSay>
          <div className="acts">
            <Link className="btn primary block" to={`/sign-in?next=${encodeURIComponent(next)}`} viewTransition>
              Sign in
            </Link>
          </div>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame poses={["sleep"]}>
      <form className="form" onSubmit={submit} noValidate>
        <h1>
          Check your email<span className="stop">.</span>
        </h1>
        <p className="given">
          <span>
            The code went to <b>{email}</b>
          </span>
          <Link className="linkish" to={change} state={{ email }} viewTransition data-turn="now">
            Change
          </Link>
        </p>
        <PlateSay error={error}>{byCode ? "Six digits, from the email we just sent. No password needed." : "Six digits, from the email we just sent."}</PlateSay>
        <div className={error ? "code-wrap is-bad" : "code-wrap"} ref={codeRef}>
          <PlateCode value={code} onChange={setCode} length={CODE_LEN} autoFocus />
        </div>
        <Button type="submit" block loading={busy || arriving}>
          Continue
        </Button>
        <p className="resend">
          {again === "sent" ? (
            <span className="plate-ok">A new code is on its way.</span>
          ) : again === "wait" ? (
            "Nothing yet? It can take a minute; look in spam too."
          ) : (
            <button type="button" className="linkish" onClick={resend} disabled={again === "busy"} aria-busy={again === "busy" || undefined}>
              {again === "busy" ? "Sending…" : "Send another code"}
            </button>
          )}
        </p>
      </form>
    </AuthFrame>
  );
}
