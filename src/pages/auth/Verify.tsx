import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import { Button, CodeInput, Problem } from "../../components/ui";
import { CODE_LEN, resendSignupCode, safeNext, verifySignupCode } from "../../data/auth";

/** The six-digit code that confirms the email, typed here, never a link. */
export default function Verify() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const next = safeNext(params.get("next"));
  const familyCode = params.get("code") || "";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [wait, setWait] = useState(45);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (code.length < CODE_LEN) return setError("Type all six digits.");
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
    setResent(false);
    const r = await resendSignupCode(email);
    if (!r.ok) return setError(r.error);
    setResent(true);
    setWait(45);
  };

  return (
    <AuthFrame line={1}>
      <form className="form" onSubmit={submit} noValidate>
        <h1>Check your email</h1>
        <p className="sub">
          We sent a six-digit code to <b>{email}</b>.
        </p>
        {error && <Problem message={error} onDismiss={() => setError(null)} />}
        <CodeInput value={code} onChange={setCode} autoFocus />
        <Button type="submit" block loading={busy}>
          Continue
        </Button>
        <p className="resend">
          {resent ? "A new code is on its way." : "Didn't get it?"}
          {wait > 0 ? <span style={{ display: "block", marginTop: 4 }}>You can ask for another in {wait}s</span> : (
            <button type="button" onClick={resend}>
              Send another code
            </button>
          )}
        </p>
      </form>
    </AuthFrame>
  );
}
