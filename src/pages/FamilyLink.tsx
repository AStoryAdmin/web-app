/**
 * The family's link, for somebody with no account (phone FamilyLinkScreen,
 * FB-326 item 4, DECISIONS S-PL8). The link is the join link itself,
 * /join/RS4HNT: signed out, Join.tsx opens this page when the code opens a
 * story; signed in, the code joins at once. The family book open on the
 * cloth, like /c/:slug: on the left page, whose family it is; on the right,
 * one leaf at a time (Bao's Standard rule 13):
 *
 *   read   what the family shares, each memory with its credit, opened in
 *          place to read in full; "Add what you remember"; the code's own
 *          join a quiet line away for the relative who was invited
 *   words  what you remember, on the ruled leaf
 *   who    your name and how you knew them; it goes to the keeper first
 *   sent   "Sent to Jamie." and their words; then, offered and never
 *          forced, "Keep this, make an account": the address is held with
 *          what they sent (session.ts rememberClaim), so the account made
 *          with it claims it at sign-in (claim_contributions), and the code
 *          joins them on the way in
 *
 * No account is asked for to read or to send.
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFrame from "./auth/AuthFrame";
import { smarten } from "../lib/typography";
import { Button, Field } from "../components/ui";
import { holdUntilDecoded } from "../components/delight/photoReady";
import { usePhotoUrl } from "../lib/photoUrls";
import { track } from "../lib/analytics";
import { rememberClaim } from "../data/session";
import { sendMemoryByLink, type FamilyLink as Link, type LinkMemory } from "../data/familyLink";
import { creditLine } from "../app-core/lib/credit.js";
import { dateLine } from "../app-core/lib/memoryCard.js";

const firstOf = (s: string) => s.trim().split(/\s+/)[0] || "";
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** The left page: whose family this is, and what happens to what you add. */
function Whose({ link, keeper }: { link: Link; keeper: string }) {
  const photo = usePhotoUrl(link.photo);
  const full = `${link.name} ${link.lastName}`.trim();
  const initials = `${link.name[0] || ""}${link.lastName[0] || ""}`.toUpperCase() || "A";
  return (
    <div className="cb-person ep-arrive">
      {photo ? (
        <figure className="cb-print" aria-hidden="true">
          <img src={photo} alt="" decoding="async" ref={(img) => holdUntilDecoded(img, img?.parentElement)} />
          <i className="pc tl" />
          <i className="pc tr" />
          <i className="pc bl" />
          <i className="pc br" />
        </figure>
      ) : (
        <div className="cb-seal" aria-hidden="true">
          <span>{initials}</span>
        </div>
      )}
      <div className="cb-who">
        <p className="cb-for">The family of</p>
        <h2 className="cb-name">{full}</h2>
        <i className="cb-rule" aria-hidden="true" />
        <ul className="cb-what">
          <li>Read what the family shares.</li>
          <li>Add what you remember, with just your name. {keeper === "the family" ? "The family reads" : `${keeper} reads`} it first.</li>
          <li>You don’t need an account.</li>
        </ul>
      </div>
    </div>
  );
}

/** One shared memory, its title and credit as the row; opened in place to read it whole. */
function Row({ memory, story }: { memory: LinkMemory; story: { name: string; birthYear: string } }) {
  const date = dateLine(story, memory) as string;
  const meta = [date !== "No date yet" ? date : "", creditLine(memory) as string].filter(Boolean).join(" · ");
  return (
    <li className="fl-row">
      <details>
        <summary>
          <span className="fl-title">{smarten(memory.title || "Untitled")}</span>
          {meta && <span className="fl-meta">{meta}</span>}
        </summary>
        <p className="cb-p fl-open">
          {smarten(memory.body)}
        </p>
      </details>
    </li>
  );
}

export default function FamilyLink({ link, onJoin }: { link: Link; /** The quiet "Join with the code": the account plate on /join. */ onJoin: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"read" | "words" | "who" | "sent">("read");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [how, setHow] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ id: string | null; words: string; from: string } | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const teller = firstOf(link.name) || "them";
  const full = `${link.name} ${link.lastName}`.trim() || teller;
  const keeper = firstOf(link.senderName) || "the family";
  const story = { name: link.name, birthYear: link.birthYear };

  const go = (next: typeof step) => {
    setError(null);
    setStep(next);
    requestAnimationFrame(() => (next === "words" ? bodyRef : next === "who" ? nameRef : null)?.current?.focus());
  };

  const toWho = () => {
    if (!body.trim()) {
      setError("Write what you remember first.");
      return bodyRef.current?.focus();
    }
    go("who");
  };

  const send = async () => {
    if (busy) return;
    setError(null);
    if (!name.trim()) {
      setError("Your name, so the family knows who this is from.");
      return nameRef.current?.focus();
    }
    setBusy(true);
    const r = await sendMemoryByLink({ code: link.code, name, how, body, title });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    track("contribution_sent", { via: "family_link", account: false });
    setSent({ id: r.id, words: body.trim(), from: [firstOf(name), how.trim().replace(/^[A-Z]/, (c) => c.toLowerCase())].filter(Boolean).join(", ") });
    setTitle("");
    setBody("");
    setStep("sent");
  };

  // The account, with the code carried so it joins them, and the address in the router's state (never the URL).
  // What they sent is held under that address, so only an account made with it claims it.
  const keep = () => {
    setError(null);
    if (!looksLikeEmail(email)) {
      setError("Your email, so what you sent can be yours. Check it for a missing letter.");
      return emailRef.current?.focus();
    }
    if (sent?.id) rememberClaim({ id: sent.id, name: name.trim(), email: email.trim(), storyName: link.name });
    track("claim_place_tapped", { via: "family_link" });
    const q = new URLSearchParams({ code: link.code, next: `/join/${link.code}` });
    navigate(`/create-account?${q}`, { state: { email: email.trim() }, viewTransition: true });
  };

  // the leaf's one line for what went wrong; it keeps its room, so an error never moves the page
  const errorLine = (
    <p id="cb-say" className={`cb-error${error ? " is-on" : ""}`} role={error ? "alert" : undefined} aria-live="polite">
      {error && smarten(error)}
    </p>
  );
  const says = (bad: boolean) => (bad && error ? { "aria-invalid": true as const, "aria-describedby": "cb-say" } : {});

  let page;
  if (step === "sent" && sent) {
    page = (
      <div className="cb-state">
        <h1 className="cb-q">
          Sent to {keeper}
          <span className="stop">.</span>
        </h1>
        <p className="cb-p">
          It joins {teller}’s story under your name when {keeper === "the family" ? "they keep it. They read" : `${keeper} keeps it. ${keeper} reads`} everything first.
        </p>
        <blockquote className="cb-quote">
          {sent.words.length > 220 ? `${sent.words.slice(0, 218).replace(/\s+\S*$/, "")}…` : sent.words}
          {sent.from && <footer>{sent.from}</footer>}
        </blockquote>
        <form
          className="cb-claim"
          onSubmit={(e) => {
            e.preventDefault();
            keep();
          }}
          noValidate
        >
          <h2>Keep this, make an account</h2>
          <p className="cb-p">With an account, what you sent is yours, and the family’s code puts you in {teller}’s family tree. It takes about a minute.</p>
          {errorLine}
          <Field ref={emailRef} label="Your email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" {...says(!looksLikeEmail(email))} />
          <div className="cb-row">
            <Button type="submit">Keep this, make an account</Button>
            <button type="button" className="linkish" onClick={() => go("words")}>
              Add another memory
            </button>
            <button type="button" className="linkish cb-back" onClick={() => go("read")}>
              Back to the family’s page
            </button>
          </div>
        </form>
      </div>
    );
  } else if (step === "words") {
    page = (
      <form
        className="cb-form"
        onSubmit={(e) => {
          e.preventDefault();
          toWho();
        }}
        noValidate
      >
        <div className="cb-top">
          <p className="cb-kicker">A page for {teller}’s story</p>
          <button type="button" className="linkish cb-back" onClick={() => go("read")}>
            ← Back to the family’s page
          </button>
        </div>
        <h1 className="cb-q">What do you remember about {teller}?</h1>
        {errorLine}
        <input className="cb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A title, if you like" aria-label="Title" maxLength={160} />
        <textarea
          ref={bodyRef}
          className="cb-body"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Start anywhere: a room, a day, something they said."
          aria-label={`What you remember about ${teller}`}
          {...says(!body.trim())}
          maxLength={10000}
        />
        <div className="cb-foot">
          <span />
          <Button type="submit">Next: who it’s from</Button>
        </div>
      </form>
    );
  } else if (step === "who") {
    const firstLine = body.trim().split(/\n/)[0] || title.trim();
    page = (
      <form
        className="cb-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        noValidate
      >
        <div className="cb-top">
          <p className="cb-kicker">A page for {teller}’s story</p>
          <button type="button" className="linkish cb-back" onClick={() => go("words")}>
            ← Back to your words
          </button>
        </div>
        <h1 className="cb-q">Who is it from?</h1>
        {firstLine && <blockquote className="cb-quote">{firstLine.length > 140 ? `${firstLine.slice(0, 140).trim()}…` : firstLine}</blockquote>}
        {errorLine}
        <div className="cb-fields">
          <Field ref={nameRef} label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="So they know who it’s from" autoComplete="name" {...says(!name.trim())} />
          <Field label={`How you knew ${teller}`} value={how} onChange={(e) => setHow(e.target.value)} placeholder="Neighbour, niece, old friend" autoComplete="off" hint={`It goes to ${keeper} first, with your name on it. Nothing here is public.`} />
        </div>
        <div className="cb-foot">
          <span />
          <Button type="submit" loading={busy}>
            {keeper === "the family" ? "Send it to the family" : `Send it to ${keeper}`}
          </Button>
        </div>
      </form>
    );
  } else {
    const n = link.memories.length;
    page = (
      <div className="cb-state">
        <div className="cb-top">
          <p className="cb-kicker">The family’s link</p>
        </div>
        <h1 className="cb-q">
          {full}’s family<span className="stop">.</span>
        </h1>
        <p className="cb-p">
          {keeper === "the family" ? "The family shares" : `${keeper} shares`} what {teller}’s family keeps. Read it, and add what you remember. No account is needed.
        </p>
        {n ? (
          <ul className="fl-list" aria-label={`${n} ${n === 1 ? "memory" : "memories"} the family shares`}>
            {link.memories.map((m) => (
              <Row key={m.id} memory={m} story={story} />
            ))}
          </ul>
        ) : (
          <p className="cb-p">Nothing is shared yet. {teller}’s family will add to it; you can be first.</p>
        )}
        <div className="cb-foot">
          <button type="button" className="linkish" onClick={onJoin}>
            Family of {teller}? Join with the code <span aria-hidden="true">→</span>
          </button>
          <Button onClick={() => go("words")}>Add what you remember</Button>
        </div>
      </div>
    );
  }

  return (
    <AuthFrame plate={false} left={<Whose link={link} keeper={keeper} />} leftLabel={`The family of ${full}`}>
      <div className="cb">{page}</div>
    </AuthFrame>
  );
}
