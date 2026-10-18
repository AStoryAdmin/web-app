import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import { Button, CodeInput } from "../../components/ui";
import { CODE_LEN, resendSignupCode, safeNext, verifySignupCode } from "../../data/auth";

/** The six-digit code that confirms the email, typed here, never a link. The dog sleeps while it waits. */
export default function Verify() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const next = safeNext(params.get("next"));
  const familyCode = params.get("code") || "";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [again, setAgain] = useState<"wait" | "ready" | "busy" | "sent">("wait");

  // Another code can be asked for after a little while; no clock is shown, the link simply appears.
  useEffect(() => {
    if (again !== "wait" && again !== "sent") return;
    const t = setTimeout(() => setAgain("ready"), 45000);
    return () => clearTimeout(t);
  }, [again]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (code.length < CODE_LEN) return setError("Type all six digits from the email.");
    setError(null);
    setBusy(true);
    const r = await verifySignupCode(email, code);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    navigate(familyCode ? `/join/${familyCode}` : next, { replace: true });
  };

  useEffect(() => {
    if (code.length === CODE_LEN) queueMicrotask(() => void submit());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = async () => {
    setAgain("busy");
    const r = await resendSignupCode(email);
    if (!r.ok) {
      setAgain("ready");
      return setError(r.error);
    }
    setAgain("sent");
  };

  if (!email) {
    return (
      <AuthFrame>
        <div className="form">
          <h1>Which email was it?</h1>
          <p className="sub">This page needs the address the code was sent to. Sign in with it and we'll send a fresh code.</p>
          <div className="acts">
            <Link className="btn primary block" to="/sign-in" viewTransition>
              Sign in
            </Link>
          </div>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <form className="form" onSubmit={submit} noValidate>
        <h1>
          Check your email<span className="stop">.</span>
        </h1>
        <p className="sub">
          We sent a six-digit code to <b>{email}</b>.
        </p>
        {error && (
          <p className="plate-error" role="alert">
            {error}
          </p>
        )}
        <CodeInput value={code} onChange={setCode} autoFocus />
        <Button type="submit" block loading={busy}>
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
