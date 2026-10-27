/**
 * Where a friend link lands (/friend/:token; the phone’s FriendLinkScreen,
 * FB-284). The phone shares https://astoryapp.com/friend/RM7Q2KWD; a
 * friend opening it on a laptop comes here, signed in first (reading a
 * link needs an account, so RequireAuth sends them to sign in and back).
 *
 * A friend came for one thing: to say what they remember about Rose. So
 * the page opens straight onto it, on the family book’s leaf as /c does:
 *
 *   write   "What do you remember about Rose?", a ruled page, and one line
 *           of what being a friend means. "Send it to Jamie" takes the
 *           link and sends the words in one press.
 *   sent    "Sent to Jamie." It joins Rose’s story when Jamie says yes.
 *   thanks  after Done: "Thank you, Peggy. Rose will be glad you remembered."
 *
 * What a friend sends waits for a keeper’s yes like anything the family
 * sends (relationship "Friend"). A link that doesn’t work says so and
 * offers Home: never a dead end.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import AuthFrame from "./auth/AuthFrame";
import PlateSay from "./auth/PlateSay";
import { smarten } from "../lib/typography";
import { Button, ButtonLink } from "../components/ui";
import LoadingMark from "../components/delight/LoadingMark";
import { track } from "../lib/analytics";
import { useAuth } from "../state/authContext";
import { sendContribution } from "../data/contributions";
import { acceptFriendLink, friendLinkNames, friendLinkTrouble, readFriendLink, type FriendLink as FriendLinkData, type FriendLinkError } from "../data/friendLink";

type Read = { ok: true; link: FriendLinkData } | { ok: false; error: FriendLinkError };

export default function FriendLink() {
  const { token = "" } = useParams();
  const { user } = useAuth();
  const [read, setRead] = useState<Read | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [taken, setTaken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState("");
  const [thanked, setThanked] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let live = true;
    readFriendLink(token).then((r) => live && setRead(r));
    return () => {
      live = false;
    };
  }, [token, attempt]);

  const frame = (page: ReactNode) => (
    <AuthFrame plate={false}>
      <div className="cb">
        {page}
        <p className="cb-colophon">
          A Story keeps a family’s memories in their own words. <Link to="/welcome">About A Story</Link>
        </p>
      </div>
    </AuthFrame>
  );

  if (read === undefined)
    return frame(
      <div className="cb-state cb-wait" aria-busy="true">
        <LoadingMark />
        <p className="cb-p">Opening the link</p>
      </div>,
    );

  if (!read.ok) {
    const offline = read.error === "offline";
    return (
      <AuthFrame rest="curious" poses={["curious"]}>
        <div className="form">
          <h1>
            This link doesn’t work<span className="stop">.</span>
          </h1>
          <PlateSay>{friendLinkTrouble(read.error)}</PlateSay>
          <div className="acts">
            {offline ? (
              <Button
                block
                onClick={() => {
                  setRead(undefined);
                  setAttempt((n) => n + 1);
                }}
              >
                Try again
              </Button>
            ) : (
              <ButtonLink to="/" block viewTransition>
                Go to Home
              </ButtonLink>
            )}
          </div>
        </div>
      </AuthFrame>
    );
  }

  const { teller, sender, keeper, you } = friendLinkNames(read.link, user?.firstName);

  const send = async () => {
    const words = body.trim();
    if (!words) {
      setError(`Write what you remember about ${teller} first.`);
      bodyRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    if (!taken) {
      const r = await acceptFriendLink(token);
      if (!r.ok) {
        setBusy(false);
        setError(r.error === "offline" ? "The connection dropped. Try again once you’re connected." : r.error === "not_found" ? friendLinkTrouble("not_found") : "That didn’t go through. Try once more.");
        return;
      }
      setTaken(true);
      track("friend_joined", { via: "friend_link" });
    }
    try {
      await sendContribution({ storyId: read.link.storyId, contributorName: you || "A friend", relationship: "Friend", body: words });
    } catch {
      setBusy(false);
      setError("It didn’t send. Check your connection and try again.");
      return;
    }
    setBusy(false);
    setSent(words);
    setBody("");
  };

  const slip = sent ? (
    <blockquote className="cb-quote">
      {sent.length > 280 ? `${sent.slice(0, 280).trim()}…` : sent}
      <footer>{you ? `${you}, ${teller}’s friend` : `${teller}’s friend`}</footer>
    </blockquote>
  ) : null;

  if (sent && thanked)
    return frame(
      <div className="cb-state">
        <h1 className="cb-q">
          {you ? `Thank you, ${you}` : "Thank you"}
          <span className="stop">.</span>
        </h1>
        <p className="cb-p">{teller} will be glad you remembered.</p>
        {slip}
        <div className="cb-row">
          <button
            type="button"
            className="linkish"
            onClick={() => {
              setThanked(false);
              setSent("");
            }}
          >
            Add something else
          </button>
        </div>
      </div>,
    );

  if (sent)
    return frame(
      <div className="cb-state">
        <h1 className="cb-q">
          Sent to {keeper}
          <span className="stop">.</span>
        </h1>
        <p className="cb-p">
          It joins {teller}’s story when {keeper} says yes. Your name stays on it.
        </p>
        {slip}
        <div className="cb-row">
          <Button onClick={() => setThanked(true)}>Done</Button>
          <button type="button" className="linkish" onClick={() => setSent("")}>
            Add something else
          </button>
        </div>
      </div>,
    );

  return frame(
    <form
      className="cb-form"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
      noValidate
    >
      <div className="cb-top">
        <p className="cb-kicker">{sender ? `${sender} sent you this link` : "A friend link"}</p>
      </div>
      <h1 className="cb-q">What do you remember about {teller}?</h1>
      <p className="cb-p">
        {you ? `${you}, ` : ""}
        {sender ? `${sender} would love your side.` : "The family would love your side."} It goes to {keeper} first, with your name on it.
      </p>
      <p id="cb-say" className={`cb-error${error ? " is-on" : ""}`} role={error ? "alert" : undefined} aria-live="polite">
        {error && smarten(error)}
      </p>
      <textarea
        ref={bodyRef}
        className="cb-body"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (error) setError(null);
        }}
        placeholder="The first thing that comes back…"
        aria-label={`What you remember about ${teller}`}
        aria-invalid={error && !body.trim() ? true : undefined}
        aria-describedby={error ? "cb-say" : undefined}
        maxLength={10000}
      />
      <p className="cb-p">
        You’ll be one of {teller}’s friends on A Story. Friends aren’t in the family tree, and don’t see {teller}’s private memories.
      </p>
      <div className="cb-foot">
        <ButtonLink to="/" variant="quiet">
          Not now
        </ButtonLink>
        <Button type="submit" loading={busy}>
          {sender ? `Send it to ${sender}` : "Send it"}
        </Button>
      </div>
    </form>,
  );
}
