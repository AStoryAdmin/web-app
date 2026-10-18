import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import PlateSay from "./PlateSay";
import type { CompanionFocus } from "../../components/delight/Companion";
import { Button, CodeInput, Field } from "../../components/ui";
import { CODE_LEN, MIN_PASSWORD, requestPasswordReset, resetPassword } from "../../data/auth";

type Bad = "email" | "code" | "password" | null;

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
  const [bad, setBad] = useState<Bad>(null);

  const fail = (field: Bad, message: string) => {
    setBad(field);
    setError(message);
  };
  const says = (field: Bad) => (bad === field ? { "aria-invalid": true as const, "aria-describedby": "plate-say" } : {});

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBad(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail("email", "Type the email you signed up with.");
    setBusy(true);
    const r = await requestPasswordReset(email);
    setBusy(false);
    if (!r.ok) return fail(null, r.error);
    setSent(true);
  };

  const finish = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBad(null);
    if (code.length < CODE_LEN) return fail("code", "Type all six digits from the email.");
    if (password.length < MIN_PASSWORD) return fail("password", `The new password needs at least ${MIN_PASSWORD} characters.`);
    setBusy(true);
    const r = await resetPassword(email, code, password);
    setBusy(false);
    if (!r.ok) return fail(null, r.error);
    navigate("/", { replace: true });
  };

  const resend = async () => {
    setAgain("busy");
    setError(null);
    const r = await requestPasswordReset(email);
    if (!r.ok) {
      setAgain("");
      return fail(null, r.error);
    }
    setAgain("sent");
  };

  return (
    <AuthFrame companion={{ focus, shown, progress: Math.min(1, email.length / 24) }}>
      {!sent ? (
        <form className="form" onSubmit={send} noValidate key="ask">
          <h1>Forgot your password?</h1>
          <PlateSay error={error}>We’ll email you a six-digit code to choose a new one.</PlateSay>
          <Field
            label="Email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocusChange={(w) => setFocus(w ? "email" : null)}
            required
            {...says("email")}
          />
          <Button type="submit" block loading={busy}>
            Send the code
          </Button>
          <p className="plate-links one">
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
                setBad(null);
              }}
            >
              Change
            </button>
          </p>
          <PlateSay error={error}>Type the six digits, then your new password.</PlateSay>
          <div className={bad === "code" ? "code-wrap is-bad" : "code-wrap"} aria-describedby={bad === "code" ? "plate-say" : undefined}>
            <CodeInput value={code} onChange={setCode} autoFocus />
          </div>
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
            {...says("password")}
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
