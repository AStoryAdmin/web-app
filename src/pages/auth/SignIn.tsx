import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import { Button, Field, Problem } from "../../components/ui";
import { LockIcon, MailIcon } from "../../components/icons";
import { resendSignupCode, safeNext, signIn } from "../../data/auth";
import { useAuth } from "../../state/authContext";

export default function SignIn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = await signIn(email, password);
    setBusy(false);
    if (r.ok) {
      navigate(next, { replace: true });
      return;
    }
    if (r.unconfirmed) {
      // Made an account, never typed the code: send a fresh one and ask for it.
      await resendSignupCode(email);
      navigate(`/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
      return;
    }
    setError(r.error);
  };

  return (
    <AuthFrame>
      <form className="form" onSubmit={submit} noValidate>
        <h1>Sign in</h1>
        {error && <Problem message={error} onDismiss={() => setError(null)} />}
        <Field label="Email" type="email" icon={<MailIcon />} autoComplete="username" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field
          label="Password"
          type={shown ? "text" : "password"}
          icon={<LockIcon />}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          reveal={{ shown, toggle: () => setShown((s) => !s) }}
          required
        />
        <Link className="forgot" to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}>
          Forgot password?
        </Link>
        <Button type="submit" block loading={busy}>
          Sign in
        </Button>
        <p className="switch">
          New here? <Link to={`/create-account?next=${encodeURIComponent(next)}`}>Create an account</Link>
        </p>
        <p className="legal">Same account as the app on your phone.</p>
      </form>
    </AuthFrame>
  );
}
