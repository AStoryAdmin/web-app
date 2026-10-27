/**
 * Asking the storyteller today's question, by a link they answer in.
 *
 * Two steps in one sheet. First the question: today's from their deck,
 * already chosen, or another from the day's walk ("Show others"). Then the
 * link: daily_question_create puts it on the story's rota and the sheet
 * shows /a/<token> with Copy, a QR for a phone across the table, and the
 * asker's own way to send it (the share sheet, or a text or an email they
 * send themselves). We never send anything. The phone's version is
 * phone-app src/screens/question (data/dailyQuestions.js).
 *
 * `person` is the story's own person in the tree (people.story_id): the
 * server only takes a living storyteller who isn't the account asking.
 */
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Person } from "../../data/family";
import type { Story } from "../../data/stories";
import type { Prompt } from "../../lib/today";
import { AuthContext } from "../../state/authContext";
import { askDeck, askMessage, askQuestion, canAsk, dayWords, shareLinks, storyRota, takenToday, type AskError, type Rota } from "../../data/dailyQuestions";
import { track } from "../../lib/analytics";
import { Button } from "../ui";
import QrCode from "../QrCode";
import { CheckIcon, CloseIcon, LinkIcon, MailIcon, ShareIcon } from "../icons";
import "./ask.css";

const PAGE = 3;

type Made = { question: string; linkUrl: string; sendOn: string; today: boolean; day: string };

/** The words for a refusal, said to the asker. `whom` is the storyteller's name, or "them". */
function errorWords(error: AskError, whom: string): string {
  switch (error) {
    case "not_ready":
      return "Asking by link isn’t switched on for this family yet.";
    case "not_family":
      return "Only family can ask. Sign in again and try once more.";
    case "not_askable":
      return `${whom === "them" ? "They" : whom} can’t be asked from this account.`;
    case "too_many":
      return "That’s a lot of questions for one day. Try again tomorrow.";
    case "empty":
      return "Choose a question first.";
    default:
      return "That didn’t go. Check the connection and try again.";
  }
}

function useCopied() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt("Copy this:", text);
    }
  };
  return { copied, copy };
}

export default function AskSheet({ open, onClose, story, person }: { open: boolean; onClose: () => void; story: Story; person: Person | null }) {
  if (!open) return null;
  // Keyed, so each opening starts on today's question with nothing made yet.
  return <AskSheetBody key={`${story.id}:${person?.id || ""}`} onClose={onClose} story={story} person={person} />;
}

function AskSheetBody({ onClose, story, person }: { onClose: () => void; story: Story; person: Person | null }) {
  const userId = useContext(AuthContext)?.user?.id || null;
  const name = String(person?.givenName || "").trim();
  const whom = name || "them";
  const who = name || "they";
  const whose = name ? `${name}’s` : "their";

  const { today, others } = useMemo(() => askDeck(story), [story]);
  const [page, setPage] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(today?.id ?? others[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<Made | null>(null);
  const [rota, setRota] = useState<Rota | null>(null);
  const { copied, copy } = useCopied();
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Who has today, so the sheet can say when theirs will land before it is sent.
  useEffect(() => {
    let live = true;
    void storyRota(story.id).then((r) => live && setRota(r));
    return () => {
      live = false;
    };
  }, [story.id]);

  // The link replaces the questions: take the keyboard to the new heading.
  useEffect(() => {
    if (made) headRef.current?.focus();
  }, [made]);

  const pages = Math.max(1, Math.ceil(others.length / PAGE));
  const shown = others.slice(page * PAGE, page * PAGE + PAGE);
  const choices: { q: Prompt; kicker: string }[] = [...(today ? [{ q: today, kicker: "Today’s question" }] : []), ...shown.map((q) => ({ q, kicker: q.era || "" }))];
  const chosen = choices.find((c) => c.q.id === chosenId)?.q ?? null;
  // Only the story's own storyteller: daily_question_create refuses anyone else.
  const askable = canAsk(person, userId) && !!person && person.storyId === story.id;
  const taken = takenToday(rota);

  const showOthers = () => {
    setPage((p) => (p + 1) % pages);
    // The chosen question may leave the list: fall back to today's, which stays.
    if (chosenId !== today?.id) setChosenId(today?.id ?? null);
  };

  const send = async () => {
    if (!person || !chosen) return setError(errorWords("empty", whom));
    setBusy(true);
    setError(null);
    const res = await askQuestion({ storyId: story.id, tellerPersonId: person.id, text: chosen.question, questionId: chosen.id });
    setBusy(false);
    if ("error" in res) return setError(errorWords(res.error, whom));
    if (!res.linkUrl) return setError(errorWords("failed", whom));
    track("family_question_asked", { via: "link", today: res.today, fromDeck: true });
    setMade({ question: chosen.question, linkUrl: res.linkUrl, sendOn: res.sendOn, today: res.today, day: res.day });
  };

  // On the body, so a sticky column, the running head or the tab bar never draws over it.
  return createPortal(
    <div className="scrim asksheet-scrim" onClick={onClose}>
      <div className="sheetbox asksheet" role="dialog" aria-modal="true" aria-labelledby="asksheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <h2 id="asksheet-title" ref={headRef} tabIndex={-1}>
            {made ? (name ? `Send ${name} the link` : "Send them the link") : name ? `Ask ${name} a question` : "Ask them a question"}
          </h2>
          <button type="button" className="iconbtn soft" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {made ? (
          <Ready made={made} name={name} who={who} whose={whose} taken={taken} email={person?.email || ""} copied={copied} copy={copy} onClose={onClose} />
        ) : !askable ? (
          <>
            <p className="asksheet-lede">{person?.deathYear ? `${name || "They"} can’t be asked by link. You can still add what you remember.` : person ? "This is your own story. Your questions are on your Home." : "Add them to the family tree first, then you can ask them."}</p>
            <div className="acts">
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        ) : !choices.length ? (
          <>
            <p className="asksheet-lede">There’s no question to send today. Try again tomorrow.</p>
            <div className="acts">
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <p className="asksheet-lede">
              You’ll get a link to send {whom}. {name || "They"} can answer by talking or writing, and the answer goes into {whose} story.
            </p>
            <fieldset className="asksheet-picks">
              <legend>Which question?</legend>
              {choices.map(({ q, kicker }, i) => (
                <label key={q.id} className="asksheet-pick">
                  <input type="radio" name="asksheet-q" value={q.id} checked={chosenId === q.id} onChange={() => setChosenId(q.id)} autoFocus={i === 0} />
                  {kicker && <span className="k">{kicker}</span>}
                  <span className="q">{q.question}</span>
                </label>
              ))}
            </fieldset>
            {others.length > 0 && (
              <Button variant="quiet" className="asksheet-more" onClick={showOthers}>
                Show others
              </Button>
            )}
            {taken && (
              <p className="meta asksheet-note">
                {taken.mine ? "You already asked today’s" : `${taken.askerName || "Someone in the family"} already asked today’s`}, so in the app this one comes {dayWords(rota?.next || "", rota?.today || "")}. The link works as soon as it’s made.
              </p>
            )}
            {error && (
              <p className="meta asksheet-bad" role="alert">
                {error}
              </p>
            )}
            <div className="acts">
              <Button type="submit" loading={busy} icon={<LinkIcon />} disabled={!chosen}>
                Make the link
              </Button>
              <Button variant="quiet" onClick={onClose}>
                Not now
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Ready({
  made,
  name,
  who,
  whose,
  taken,
  email,
  copied,
  copy,
  onClose,
}: {
  made: Made;
  name: string;
  who: string;
  whose: string;
  /** Who already had today, before this ask (null when it was free). */
  taken: { askerName: string; mine: boolean } | null;
  email: string;
  copied: boolean;
  copy: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const message = askMessage({ question: made.question, link: made.linkUrl, tellerName: name });
  const { mail, sms } = shareLinks(message, { email });
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const They = who === "they" ? "They" : who;
  return (
    <>
      <p className="asksheet-chosen">“{made.question}”</p>
      <p className="meta asksheet-note">
        {made.today
          ? `It’s ready for ${name || "them"} to answer now.`
          : `${taken?.mine ? "You already asked today’s" : taken?.askerName ? `${taken.askerName} already asked today’s` : "Today’s question is taken"}, so in the app this one comes ${dayWords(made.sendOn, made.day)}. The link works now.`}
      </p>
      <div className="asksheet-link">
        <div className="input">
          <LinkIcon />
          <span className="asksheet-url">{made.linkUrl.replace(/^https?:\/\//, "")}</span>
        </div>
        <Button variant="outline" onClick={() => void copy(made.linkUrl)} icon={copied ? <CheckIcon /> : undefined}>
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <div className="asksheet-send">
        <div className="asksheet-qr">
          <QrCode value={made.linkUrl} label={`QR code for ${whose} answer link`} />
        </div>
        <div>
          <p className="meta">{They} can scan this with a phone camera, or you can send it:</p>
          <div className="acts">
            {canShare ? (
              <Button variant="outline" icon={<ShareIcon />} onClick={() => navigator.share({ title: "A question for your story", text: message }).catch(() => {})}>
                Send by text or email
              </Button>
            ) : (
              <>
                <a className="btn outline" href={sms}>
                  Send by text
                </a>
                <a className="btn outline" href={mail}>
                  <MailIcon /> Send by email
                </a>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="acts">
        <Button onClick={onClose}>Done</Button>
      </div>
    </>
  );
}
