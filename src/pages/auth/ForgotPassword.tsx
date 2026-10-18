import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import type { CompanionFocus } from "../../components/delight/Companion";
import { Button, CodeInput, Field } from "../../components/ui";
import { CODE_LEN, MIN_PASSWORD, requestPasswordReset, resetPassword } from "../../data/auth";

/** Two steps on the plate: the email, then the emailed code with a new password. */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [focus, setFocus] = useState<CompanionFocus>(null);
  const [busy, setBusy] = useState(false);
  const [again, setAgain] = useState<"" | "busy" | "sent">("");
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Type the email you signed up with.");
    setBusy(true);
    const r = await requestPasswordReset(email);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setSent(true);
  };

  const finish = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length < CODE_LEN) return setError("Type all six digits from the email.");
    if (password.length < MIN_PASSWORD) return setError(`The new password needs at least ${MIN_PASSWORD} characters.`);
    setError(null);
    setBusy(true);
    const r = await resetPassword(email, code, password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    navigate("/", { replace: true });
  };

  const resend = async () => {
    setAgain("busy");
    setError(null);
    const r = await requestPasswordReset(email);
    if (!r.ok) {
      setAgain("");
      return setError(r.error);
    }
    setAgain("sent");
  };

  return (
    <AuthFrame companion={{ focus, shown, progress: Math.min(1, email.length / 24) }}>
      {!sent ? (
        <form className="form" onSubmit={send} noValidate key="ask">
          <h1>Forgot your password?</h1>
          <p className="sub">We'll email you a six-digit code to choose a new one.</p>
          {error && (
            <p className="plate-error" role="alert">
              {error}
            </p>
          )}
          <Field ref={emailRef} label="Email" type="email" autoComplete="username" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocusChange={(w) => setFocus(w ? "email" : null)} required />
          <Button type="submit" block loading={busy}>
            Send the code
          </Button>
          <p className="switch">
            Remembered it?{" "}
            <Link to={`/sign-in${email ? `?email=${encodeURIComponent(email)}` : ""}`} viewTransition>
              Back to sign in
            </Link>
          </p>
        </form>
      ) : (
        <form className="form" onSubmit={finish} noValidate key="choose">
          <h1>
            Choose a new password<span className="stop">.</span>
          </h1>
          <p className="given">
            <span>
              The code went to <b>{email.trim()}</b>
            </span>
            <button
              type="button"
              className="linkish"
              onClick={() => {
                setSent(false);
                setCode("");
                setAgain("");
                setError(null);
              }}
            >
              Change
            </button>
          </p>
          {error && (
            <p className="plate-error" role="alert">
              {error}
            </p>
          )}
          <CodeInput value={code} onChange={setCode} autoFocus />
          <Field
            label="New password"
            type={shown ? "text" : "password"}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            reveal={{ shown, toggle: () => setShown((s) => !s) }}
            onFocusChange={(w) => setFocus(w ? "password" : null)}
            required
          />
          <Button type="submit" block loading={busy}>
            Save and sign in
          </Button>
          <p className="resend">
            {again === "sent" ? (
              <span className="plate-ok">A new code is on its way.</span>
            ) : (
              <button type="button" className="linkish" onClick={resend} disabled={again === "busy"} aria-busy={again === "busy" || undefined}>
                {again === "busy" ? "Sending…" : "Send another code"}
              </button>
            )}
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
