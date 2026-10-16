import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import { Button, CodeInput, Field, Problem } from "../../components/ui";
import { LockIcon, MailIcon } from "../../components/icons";
import { CODE_LEN, MIN_PASSWORD, requestPasswordReset, resetPassword } from "../../data/auth";

/** Two steps on one page: the email, then the emailed code with a new password. */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = await requestPasswordReset(email);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setSent(true);
  };

  const finish = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length < CODE_LEN) return setError("Type all six digits.");
    if (password.length < MIN_PASSWORD) return setError(`The password needs at least ${MIN_PASSWORD} characters.`);
    setError(null);
    setBusy(true);
    const r = await resetPassword(email, code, password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    navigate("/", { replace: true });
  };

  return (
    <AuthFrame line={2}>
      {!sent ? (
        <form className="form" onSubmit={send} noValidate>
          <h1>Forgot your password?</h1>
          <p className="sub">We'll email you a six-digit code.</p>
          {error && <Problem message={error} onDismiss={() => setError(null)} />}
          <Field label="Email" type="email" icon={<MailIcon />} autoComplete="username" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" block loading={busy}>
            Send the code
          </Button>
          <p className="switch">
            <Link to="/sign-in">Back to sign in</Link>
          </p>
        </form>
      ) : (
        <form className="form" onSubmit={finish} noValidate>
          <h1>Choose a new password</h1>
          <p className="sub">
            The code went to <b>{email}</b>.
          </p>
          {error && <Problem message={error} onDismiss={() => setError(null)} />}
          <CodeInput value={code} onChange={setCode} autoFocus />
          <Field
            label="New password"
            type={shown ? "text" : "password"}
            icon={<LockIcon />}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            reveal={{ shown, toggle: () => setShown((s) => !s) }}
            required
          />
          <Button type="submit" block loading={busy}>
            Save and sign in
          </Button>
          <p className="resend">
            <button type="button" onClick={() => requestPasswordReset(email)}>
              Send another code
            </button>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
