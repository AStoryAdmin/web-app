/**
 * /help — the phone's one help screen (HelpScreen.js, with FaqScreen and
 * ContactScreen retired into it), for the web: the questions answered in
 * place, one form to write to us (FeedbackScreen.js, the same `feedback`
 * row), the support address for anyone who'd rather use their own email,
 * and the terms. The answers describe the web as it is, under the names
 * its places have (Family, Add someone, the name at the top of a page);
 * when one is renamed, rename it here too. No plan, no price.
 *
 * Signed in only: the feedback table takes a person's own row. Sending ends
 * in place with a thank-you, never an alert. `?type=bug` opens the form on
 * "Something's wrong" (the phone's route param).
 */
import { useId, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Button, Field } from "../components/ui";
import { Stop } from "../components/book/WhereNext";
import { useAuth } from "../state/authContext";
import { FEEDBACK_TYPES, SUPPORT_EMAIL, submitFeedback } from "../data/feedback";
import "./help.css";

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "How does talking with A Story work?",
    a: "A Story asks one question at a time and listens. You can talk out loud, record in the room or write it yourself. What you say becomes a memory in your own words, which you read over before it’s kept. Nothing is kept until you say so.",
  },
  {
    q: "Is this the same as the A Story app?",
    a: "Yes. The same account signs in here and in the A Story app on iPhone, and both show the same stories. The daily call and reminders live in the app on the phone, and plans are chosen there too.",
  },
  {
    q: "Is my family’s story private?",
    a: "Yes. Your memories are kept in your own account, sent over an encrypted connection, and seen only by you and the family you add. If you allow it, OpenAI processes what you say only to run A Story, and our team looks only at what’s reported to us. A Story doesn’t sell your data or use it for advertising.",
  },
  {
    q: "Can I keep more than one person’s story?",
    a: "Yes. Keep a story for Grandma, one for Dad and one for yourself. Each has its own memories and its own book. Choose the name at the top of any page to switch between them.",
  },
  {
    q: "How do I bring family in?",
    a: "Open Family and choose Add someone. They get an email with a link, or you give them the six letters and numbers on Family. They can read, add what they remember and send photos. Nothing goes into a story until the person keeping it says yes.",
  },
  {
    q: "Will my memories be there on another computer or phone?",
    a: "Yes. They stay in your account, so signing in anywhere brings everything back. You can also print the book at home at any time, on every plan, and keep a paper copy.",
  },
];

type Kind = (typeof FEEDBACK_TYPES)[number]["key"];

function WriteToUs() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [type, setType] = useState<Kind>(params.get("type") === "bug" ? "bug" : "suggestion");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const messageId = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!message.trim()) {
      setError("Write something first. A line is enough.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await submitFeedback({ userId: user?.id || "", type, message, contactEmail: email, accountEmail: user?.email });
    setBusy(false);
    if ("ok" in res) {
      setSent(true);
      return;
    }
    setError(
      res.error === "offline"
        ? "That didn’t send. Check the connection and try again; your words are still here."
        : res.error === "signed_out"
          ? "That didn’t send, because you’re signed out. Sign in again, or email us instead."
          : `That didn’t send. Try again in a moment, or email us at ${SUPPORT_EMAIL}.`,
    );
  };

  if (sent) {
    return (
      <div className="help-sent" role="status">
        <h2 className="help-h">Thank you.</h2>
        <p>A person reads every message, and answers when there’s something to answer.</p>
        <div className="help-acts">
          <Link className="btn primary" to="/">
            Back to Home
          </Link>
          <Button
            variant="quiet"
            onClick={() => {
              setMessage("");
              setSent(false);
            }}
          >
            Write another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="help-form" onSubmit={submit} noValidate>
      <fieldset className="help-kinds">
        <legend>What is it?</legend>
        <div className="help-chips">
          {FEEDBACK_TYPES.map((t) => (
            <label key={t.key} className={`help-chip${t.key === type ? " on" : ""}`}>
              <input type="radio" name="feedback-type" value={t.key} checked={t.key === type} onChange={() => setType(t.key)} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field" htmlFor={messageId}>
        <span>Your message</span>
        <span className="input help-area" style={error ? { borderColor: "var(--danger)" } : undefined}>
          <textarea
            id={messageId}
            rows={6}
            value={message}
            placeholder="What happened, or what would help?"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${messageId}-err` : undefined}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError("");
            }}
          />
        </span>
        {error && (
          <span id={`${messageId}-err`} className="help-error" role="alert">
            {error}
          </span>
        )}
      </label>

      <Field
        label="Your email (optional)"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={user?.email || "you@example.com"}
        hint="So we can answer. We use the one you sign in with if this is empty."
      />

      <Button type="submit" loading={busy}>
        Send it
      </Button>
    </form>
  );
}

export default function Help() {
  return (
    <Shell
      compact
      back="/account"
      title="Help"
      hero={
        <div>
          <p className="label" data-rise>
            Help
          </p>
          <h1 className="hero-title">
            Questions, and a way to write to us
            <Stop />
          </h1>
        </div>
      }
    >
      <div className="page help-page">
        <section aria-labelledby="help-q">
          <h2 id="help-q" className="help-h">
            Questions
          </h2>
          <div className="help-qs">
            {QUESTIONS.map((item) => (
              <details key={item.q} className="help-q">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="help-write" className="help-write">
          <h2 id="help-write" className="help-h">
            Still wondering?
          </h2>
          <p className="help-lead">Something not working, or an idea. A line is enough. A person reads every message.</p>
          <WriteToUs />
          <p className="help-mail">
            Or email us from your own address: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </section>

        <p className="help-terms">
          <a href="https://astoryapp.com/terms">Terms</a> and <a href="https://astoryapp.com/privacy">privacy</a>: what we keep, and who sees it.
        </p>
      </div>
    </Shell>
  );
}
