import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import PlateSay from "./PlateSay";
import type { CompanionFocus } from "../../components/delight/Companion";
import { Button, Field } from "../../components/ui";
import { resendSignupCode, safeNext, signIn } from "../../data/auth";
import { useAuth } from "../../state/authContext";

export default function SignIn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [focus, setFocus] = useState<CompanionFocus>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // which field the error is about, so that field points at it
  const [bad, setBad] = useState<"email" | "password" | "both" | null>(null);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBad(null);
    if (!email.trim()) {
      setBad("email");
      return setError("Type the email you signed up with.");
    }
    if (!password) {
      setBad("password");
      return setError("Type your password.");
    }
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
      navigate(`/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`, { viewTransition: true });
      return;
    }
    setBad("both");
    setError(r.error);
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
        <Button type="submit" block loading={busy}>
          Sign in
        </Button>
        <p className="plate-links">
          <Link to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} viewTransition>
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
