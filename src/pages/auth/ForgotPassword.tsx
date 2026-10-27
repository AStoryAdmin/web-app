import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import PlateSay from "./PlateSay";
import { useCodeAria } from "./useCodeAria";
import { useArrive } from "./useArrive";
import { carriedEmail } from "./handoff";
import type { CompanionFocus } from "../../components/delight/Companion";
import { Button, Field } from "../../components/ui";
import PlateCode from "./PlateCode";
import { CODE_LEN, MIN_PASSWORD, changePassword, noteRecovery, recoveryStore, requestPasswordReset, resetPassword } from "../../data/auth";
import { useAuth } from "../../state/authContext";

type Bad = "email" | "code" | "password" | null;

// how long a reset link's ?code= may take to become a session before the page offers a code instead
const LINK_WAIT_MS = 6000;

/**
 * Two steps on the plate: the email, then the emailed code with a new password. /reset-password also answers a reset
 * link (data/auth.ts, "A reset link"): once supabase-js has made the link's session, it asks only for the new password;
 * a link that has run out says so and offers a code instead.
 */
export default function ForgotPassword() {
  const { user } = useAuth();
  const { arrive, arriving } = useArrive();
  const location = useLocation();
  const onResetLink = location.pathname === "/reset-password";
  const link = onResetLink ? recoveryStore.linkAtLoad() : null;
  const [linkWaited, setLinkWaited] = useState(false);
  const [email, setEmail] = useState(() => carriedEmail(location.state));
  const [sent, setSent] = useState(false);
  // a link recovery only while the code form is not in use: the code path's own verifyOtp fires PASSWORD_RECOVERY too
  const recovering = useSyncExternalStore(recoveryStore.subscribe, recoveryStore.get) && onResetLink && !sent;
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [focus, setFocus] = useState<CompanionFocus>(null);
  const [busy, setBusy] = useState(false);
  const [again, setAgain] = useState<"" | "busy" | "sent">("");
  const [error, setError] = useState<string | null>(null);
  const [bad, setBad] = useState<Bad>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  useCodeAria(codeRef, bad === "code");

  useEffect(() => {
    if (link !== "pending" || recovering) return;
    const t = setTimeout(() => setLinkWaited(true), LINK_WAIT_MS);
    return () => clearTimeout(t);
  }, [link, recovering]);

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
    if (busy || arriving) return;
    setError(null);
    setBad(null);
    if (code.length < CODE_LEN) return fail("code", "Type all six digits from the email.");
    if (password.length < MIN_PASSWORD) return fail("password", `The new password needs at least ${MIN_PASSWORD} characters.`);
    setBusy(true);
    const r = await resetPassword(email, code, password);
    setBusy(false);
    if (!r.ok) return fail(null, r.error);
    noteRecovery(false);
    arrive("/");
  };

  // a reset link's session: it has just proved they own the inbox, so only the new password is asked for
  const finishFromLink = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || arriving) return;
    setError(null);
    setBad(null);
    if (password.length < MIN_PASSWORD) return fail("password", `The new password needs at least ${MIN_PASSWORD} characters.`);
    setBusy(true);
    const r = await changePassword(password);
    setBusy(false);
    if (!r.ok) return fail(r.needsCode ? null : "password", r.error);
    noteRecovery(false);
    arrive("/");
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

  const passwordField = (
    <Field
      label="New password"
      type={shown ? "text" : "password"}
      autoComplete="new-password"
      placeholder={`${MIN_PASSWORD}+ characters`}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      reveal={{ shown, toggle: () => setShown((s) => !s) }}
      onFocusChange={(w) => setFocus(w ? "password" : null)}
      required
      {...says("password")}
    />
  );

  // the link is still becoming a session (or the person is still loading): a quiet plate, not the wrong form
  const linkPending = (link === "pending" && !recovering && !linkWaited) || (recovering && user === undefined);
  if (linkPending) {
    return (
      <AuthFrame>
        <div className="form" aria-busy="true">
          <h1>One moment.</h1>
          <PlateSay>Opening your reset link.</PlateSay>
        </div>
      </AuthFrame>
    );
  }

  if (recovering && user) {
    return (
      <AuthFrame companion={{ focus, shown, progress: Math.min(1, password.length / 12) }}>
        <form className="form" onSubmit={finishFromLink} noValidate key="link">
          <h1>
            Choose a new password<span className="stop">.</span>
          </h1>
          {user.email && (
            <p className="given">
              <span>
                For <b>{user.email}</b>
              </span>
            </p>
          )}
          <PlateSay error={error}>You’ll stay signed in with it.</PlateSay>
          {passwordField}
          <Button type="submit" block loading={busy || arriving}>
            Save and go on
          </Button>
        </form>
      </AuthFrame>
    );
  }

  // a link that had run out, or never became a session: say so on the plate and offer a fresh code
  // (a recovery the server refused is signed out again, which clears `recovering`)
  const linkNote =
    !arriving && (link === "expired" || (link === "pending" && linkWaited) || (link === "recovery" && !recovering) || (recovering && user === null))
      ? "That reset link has run out. Type your email and we’ll send a fresh code."
      : null;

  return (
    <AuthFrame companion={{ focus, shown, progress: Math.min(1, email.length / 24) }}>
      {!sent ? (
        <form className="form" onSubmit={send} noValidate key="ask">
          <h1>Forgot your password?</h1>
          <PlateSay error={error ?? linkNote}>We’ll email you a six-digit code to choose a new one.</PlateSay>
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
            <Link to="/sign-in" state={email ? { email } : undefined} viewTransition>
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
          <div className={bad === "code" ? "code-wrap is-bad" : "code-wrap"} ref={codeRef}>
            <PlateCode value={code} onChange={setCode} length={CODE_LEN} autoFocus />
          </div>
          {passwordField}
          <Button type="submit" block loading={busy || arriving}>
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
