import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import PlateSay from "./PlateSay";
import { useArrive } from "./useArrive";
import { carriedEmail, handOff } from "./handoff";
import type { CompanionFocus } from "../../components/delight/Companion";
import { Button, Field } from "../../components/ui";
import { resendSignupCode, safeNext, sendEmailCode, signIn } from "../../data/auth";
import { useAuth } from "../../state/authContext";

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/**
 * Sign in with a password, or with a code by email: the app's default way in, so an account made on the phone with
 * no password gets in here too. The address goes on to Verify and Forgot password in the router's state, never the URL.
 */
export default function SignIn() {
  const { user } = useAuth();
  const { arrive, arriving } = useArrive();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState(() => carriedEmail(location.state));
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [focus, setFocus] = useState<CompanionFocus>(null);
  const [busy, setBusy] = useState<"password" | "code" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // which field the error is about, so that field points at it
  const [bad, setBad] = useState<"email" | "password" | "both" | null>(null);

  if (user && !arriving) return <Navigate to={next} replace />;

  const toVerify = (mode: "signup" | "email") =>
    navigate(`/verify?next=${encodeURIComponent(next)}`, { state: handOff({ email: email.trim(), mode }), viewTransition: true });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || arriving) return;
    setError(null);
    setBad(null);
    if (!email.trim()) {
      setBad("email");
      return setError("Type the email you signed up with.");
    }
    if (!password) {
      setBad("password");
      return setError("Type your password, or have a code emailed to you.");
    }
    setBusy("password");
    const r = await signIn(email, password);
    if (r.ok) {
      // stays busy until AuthProvider has them; then on to where they were going
      setBusy(null);
      arrive(next);
      return;
    }
    if (r.unconfirmed) {
      // Made an account, never typed the code: send a fresh one and ask for it.
      await resendSignupCode(email);
      setBusy(null);
      toVerify("signup");
      return;
    }
    setBusy(null);
    setBad("both");
    setError(r.error);
  };

  // No password, or none remembered: a six-digit code by email signs them in, as it does in the app.
  const byCode = async () => {
    if (busy || arriving) return;
    setError(null);
    setBad(null);
    if (!looksLikeEmail(email)) {
      setBad("email");
      return setError("Type your email first, and we’ll send the code there.");
    }
    setBusy("code");
    const r = await sendEmailCode(email, { createUser: false });
    setBusy(null);
    if (!r.ok) {
      setBad(r.noAccount ? "email" : null);
      return setError(r.error);
    }
    toVerify("email");
  };

  const says = (field: "email" | "password") => (bad === field || bad === "both" ? { "aria-invalid": true as const, "aria-describedby": "plate-say" } : {});

  return (
    <AuthFrame companion={{ focus, shown, progress: Math.min(1, email.length / 24) }}>
      <form className="form" onSubmit={submit} noValidate>
        <h1>
          Sign in<span className="stop">.</span>
        </h1>
        <PlateSay error={error}>With the same account as the A Story app.</PlateSay>
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
        <Field
          label="Password"
          type={shown ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          reveal={{ shown, toggle: () => setShown((s) => !s) }}
          onFocusChange={(w) => setFocus(w ? "password" : null)}
          required
          {...says("password")}
        />
        <Button type="submit" block loading={busy === "password" || arriving}>
          Sign in
        </Button>
        <p className="plate-links one">
          <button type="button" className="linkish" onClick={byCode} disabled={busy !== null || arriving} aria-busy={busy === "code" || undefined}>
            {busy === "code" ? "Sending…" : "Email me a code instead"}
          </button>
        </p>
        <p className="plate-links">
          <Link to="/forgot-password" state={email ? { email } : undefined} viewTransition>
            Forgot password?
          </Link>
          <Link to={`/create-account?next=${encodeURIComponent(next)}`} viewTransition>
            Create an account
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
