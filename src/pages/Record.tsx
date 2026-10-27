/**
 * /record?q=<question id> — answering today's question in your own voice,
 * signed in. The question on a card, one Record button, a calm meter while
 * they talk, then listen back, "Say it again" (asked first) or "Keep it".
 * Keeping puts the voice in the memory's audio first, so it is safe, then
 * brings back the words A Story heard for a light edit, then keeps the
 * memory with the ink stamp: the same memory the phone keeps (question,
 * credit, clip), in the archive at once.
 *
 * The first time in this browser it asks "Talking with A Story" in the
 * phone's words before the microphone opens; "Not now" still records, and
 * the voice is kept without words. A browser that cannot record (no
 * microphone, or it was refused) says so plainly and offers the pen.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Button, ButtonLink, Problem } from "../components/ui";
import { MicIcon, PenIcon } from "../components/icons";
import WhereNext, { Stop } from "../components/book/WhereNext";
import { ListenBack, Meter } from "../components/record/parts";
import { holdsUnsaved, initialState, reduce, type State } from "../components/record/machine";
import { speakerOf, tellerOf, uploadVoice, voiceMemory } from "../components/record/keep";
import { asksAbout } from "./write/keep";
import { MicError, recordingSupported, useRecorder } from "./answer/recorder";
import { AI_CONSENT_MESSAGE, AI_CONSENT_TITLE, hasAiConsent, recordAiConsent, transcribe } from "../data/ai";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { dailyIdOf, findQuestion, markSharedAnswered, todaysQuestion, type Prompt } from "../lib/today";
import { isPaid } from "../lib/plan";
import { track } from "../lib/analytics";
import { inkStamp } from "../lib/stamp";
import { uuid } from "../lib/uuid";
import type { Story } from "../data/stories";
import "../styles/pages/record.css";

// Fifteen minutes is a long answer; it stops there, and they listen and keep it (64 kbps keeps it near 7 MB).
const MAX_MS = 15 * 60 * 1000;

/** Three lengths, three sizes, as the Talk card sets its question. */
const qLen = (q: string) => (q.length > 50 ? "long" : q.length > 34 ? "mid" : "short");

/** What went wrong, in the product's words, never the browser's. The raw error goes to the console. */
function plainCause(err: unknown): string {
  console.warn("[record]", err);
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return offline || err instanceof TypeError ? "There’s no connection just now." : "Something went wrong on our side.";
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Shell
      compact
      wide
      title="Record"
      back="/"
      hero={
        <h1 className="hero-title">
          Record
          <Stop />
        </h1>
      }
    >
      {children}
    </Shell>
  );
}

export default function Record() {
  const { account, activeStory: story, loadError, reload } = useAccount();

  if (account === undefined)
    return (
      <Frame>
        <div className="page rec-page" aria-busy="true" />
      </Frame>
    );
  if (account === null && loadError)
    return (
      <Frame>
        <div className="page">
          <Problem message={loadError} onRetry={reload} />
        </div>
      </Frame>
    );
  if (!story) return <Navigate to="/start" replace />;
  // a new recorder for each story, so a take never crosses from one story to another
  return (
    <Frame>
      <Recorder key={story.id} story={story} />
    </Frame>
  );
}

function Recorder({ story }: { story: Story }) {
  const { user } = useAuth();
  const { saveMemory, family } = useAccount();
  const [params] = useSearchParams();
  const canRecord = useMemo(() => recordingSupported(), []);
  // The question is chosen once: keeping the answer takes it out of today's deck, and the page must not change under them.
  // It is looked up as Home and the writer look it up, in the voice they ask in (about the storyteller, for a relative).
  const [question] = useState<Prompt | null>(() => {
    const opts = { relative: asksAbout(story, user, family?.people), user, family };
    return findQuestion(story, params.get("q"), opts) ?? todaysQuestion(story, { ...opts, unlimited: isPaid(user?.plan ?? "free") });
  });
  const chosen = Boolean(params.get("q")) && question?.id === params.get("q");
  const [s, dispatch] = useReducer(reduce, null, (): State => {
    // a yes given earlier in this browser holds; otherwise it is asked on this page, before the microphone opens
    const start = initialState(uuid(), hasAiConsent(user?.id) ? true : null);
    return canRecord ? start : { ...start, phase: "noMic" };
  });
  const rec = useRecorder();
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  // the words for this take, asked for once even when the upload is tried again
  const heard = useRef<{ blob: Blob; words: Promise<string | null> } | null>(null);

  const teller = useMemo(() => tellerOf(story, user, family?.people ?? []), [story, user, family]);
  const own = teller.isStoryteller;
  const qText = question?.question ?? (own ? "Say it in your own words." : `What do you remember of ${story.name}?`);

  // each new step is read out, and keyboard focus follows it (not while the microphone is opening)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (s.phase !== "starting") statusRef.current?.focus({ preventScroll: true });
  }, [s.phase]);

  // the take's object URL goes when the take does
  const takeUrl = s.take?.url;
  useEffect(
    () => () => {
      if (takeUrl) URL.revokeObjectURL(takeUrl);
    },
    [takeUrl],
  );

  // a voice not kept yet exists nowhere else: the browser asks before the tab closes
  const unsaved = holdsUnsaved(s.phase);
  useEffect(() => {
    if (!unsaved) return;
    const hold = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", hold);
    return () => window.removeEventListener("beforeunload", hold);
  }, [unsaved]);

  const begin = useCallback(async () => {
    setError(null);
    try {
      await rec.start();
      dispatch({ type: "MIC_OK" });
    } catch (e) {
      if (!(e instanceof MicError)) console.warn("record: mic:", e);
      dispatch({ type: "MIC_REFUSED" });
    }
  }, [rec]);

  const onRecord = () => {
    dispatch({ type: "RECORD" });
    if (s.ai !== null) void begin();
  };
  const onTryMic = () => {
    dispatch({ type: "TRY_MIC" });
    if (s.ai !== null) void begin();
  };
  const onConsent = (allow: boolean) => {
    // a yes is remembered (and logged when the server offers it); "Not now" holds for this page only, as on the phone
    if (allow) recordAiConsent(user?.id, true);
    dispatch({ type: "CONSENT", allow });
    void begin();
  };
  const onStop = async () => {
    try {
      const take = await rec.stop();
      dispatch({ type: "STOPPED", take });
    } catch {
      dispatch({ type: "MIC_REFUSED" });
    }
  };
  const stopRef = useRef(onStop);
  useEffect(() => {
    stopRef.current = onStop;
  });
  useEffect(() => {
    if (s.phase !== "recording") return;
    const t = window.setTimeout(() => void stopRef.current(), MAX_MS);
    return () => window.clearTimeout(t);
  }, [s.phase]);

  const onRedoYes = () => {
    dispatch({ type: "REDO_YES" });
    void begin();
  };

  // Keep: the voice goes up first, and the words are asked for beside it (only with their yes to the AI).
  const onKeep = async () => {
    const take = s.take;
    if (!take) return;
    setError(null);
    dispatch({ type: "KEEP" });
    let asked = heard.current;
    if (asked?.blob !== take.blob) {
      asked = {
        blob: take.blob,
        words: s.ai
          ? transcribe(take.blob, "", { userId: user?.id ?? null }).catch((err) => {
              console.warn("record: words:", err);
              return null;
            })
          : Promise.resolve(null),
      };
      heard.current = asked;
    }
    try {
      const [clip, words] = await Promise.all([uploadVoice(story.id, s.memoryId, take, { speaker: speakerOf(teller, user) }), asked.words]);
      dispatch({ type: "UPLOADED", clip, words });
    } catch (err) {
      setError(`${plainCause(err)} Your recording is still here.`);
      dispatch({ type: "UPLOAD_FAILED" });
    }
  };

  const onSave = async () => {
    if (!s.clip) return;
    setError(null);
    dispatch({ type: "SAVE" });
    const memory = voiceMemory({ memoryId: s.memoryId, story, question, words: s.words, clip: s.clip, teller });
    try {
      await saveMemory(memory, story.id);
      // the family's question for today: the server hears it was answered (the memory is kept either way)
      const dailyId = dailyIdOf(question);
      if (dailyId) void markSharedAnswered(dailyId, memory.id);
      track("memory_saved", { mode: 2, chapter: memory.era, has_photo: false, from_question: Boolean(question) });
      if (question) track("question_answered", { question_id: question.id, mode: "voice" });
      // the ink stamp lands beside the button, never on its label (lib/stamp); on a phone, where the button spans the
      // column, just above it
      const r = keepRef.current?.getBoundingClientRect();
      if (r && r.right + 180 < window.innerWidth) inkStamp(r.right, r.top + r.height / 2, "Kept", { offsetX: 16, align: "start" });
      else if (r) inkStamp(r.left + r.width / 2, r.top - 36, "Kept");
      dispatch({ type: "SAVED" });
    } catch (err) {
      setError(`${plainCause(err)} Your voice and your words are still here.`);
      dispatch({ type: "SAVE_FAILED" });
    }
  };

  const writeTo = question ? `/write?q=${encodeURIComponent(question.id)}` : "/write";
  const p = s.phase;
  let act: React.ReactNode = null;

  if (p === "ready")
    act = (
      <>
        <p className="rec-lead">Say it the way you’d tell it at the table. Take your time; you can listen back before it’s kept.</p>
        <div className="rec-acts">
          <Button className="rec-go" icon={<MicIcon />} onClick={onRecord}>
            Record
          </Button>
          <ButtonLink variant="quiet" to={writeTo} viewTransition icon={<PenIcon />}>
            Write it instead
          </ButtonLink>
        </div>
      </>
    );
  else if (p === "consent")
    act = (
      <section className="rec-consent" aria-labelledby="rec-consent-h">
        <h2 id="rec-consent-h">{AI_CONSENT_TITLE}</h2>
        <p>{AI_CONSENT_MESSAGE}</p>
        <p className="rec-aside">With “Not now”, your voice is still recorded and kept, just without the words written down.</p>
        <div className="rec-acts">
          <Button onClick={() => onConsent(true)}>Allow</Button>
          <Button variant="outline" onClick={() => onConsent(false)}>
            Not now
          </Button>
        </div>
      </section>
    );
  else if (p === "starting")
    act = (
      <>
        <p className="rec-lead">Your browser may ask to use the microphone. Nothing is recorded until it’s on.</p>
        <div className="rec-acts">
          <Button className="rec-go" icon={<MicIcon />} loading>
            Record
          </Button>
        </div>
      </>
    );
  else if (p === "recording")
    act = (
      <>
        <Meter level={rec.level} />
        <p className="rec-lead rec-center">Recording. Take your time.</p>
        <div className="rec-acts rec-center">
          <Button className="rec-go rec-stop" onClick={onStop}>
            <span className="rec-square" aria-hidden="true" />
            I’m done
          </Button>
        </div>
      </>
    );
  else if (p === "review" && s.take)
    act = (
      <>
        <p className="rec-lead">Kept just as you said it, until you choose.</p>
        <div className="rec-acts">
          <ListenBack src={s.take.url} durationMs={s.take.durationMs} />
          <Button variant="quiet" onClick={() => dispatch({ type: "REDO" })}>
            Say it again
          </Button>
        </div>
        <div className="rec-acts">
          <Button ref={keepRef} className="rec-keep" onClick={onKeep}>
            Keep it
          </Button>
        </div>
      </>
    );
  else if (p === "confirmRedo")
    act = (
      <section className="rec-confirm" aria-labelledby="rec-redo-h">
        <h2 id="rec-redo-h">Record over this one?</h2>
        <p>What you recorded won’t be kept.</p>
        <div className="rec-acts">
          <Button onClick={() => dispatch({ type: "REDO_NO" })}>Keep this one</Button>
          <Button variant="outline" onClick={onRedoYes}>
            Record over it
          </Button>
        </div>
      </section>
    );
  else if (p === "noMic")
    act = (
      <>
        <p className="rec-lead">
          {s.micRefused
            ? "The microphone isn’t on for A Story in this browser. You can turn it on in the browser’s site settings, or write your answer instead."
            : "This browser can’t record. You can write your answer instead, or record it in the A Story app on iPhone."}
        </p>
        <div className="rec-acts">
          <ButtonLink to={writeTo} viewTransition icon={<PenIcon />}>
            Write it instead
          </ButtonLink>
          {canRecord && (
            <Button variant="outline" icon={<MicIcon />} onClick={onTryMic}>
              Try the microphone again
            </Button>
          )}
        </div>
      </>
    );
  else if (p === "uploading")
    act = (
      <>
        <p className="rec-lead">{s.ai ? "Keeping your voice and writing down your words." : "Keeping your voice."}</p>
        <div className="rec-acts">
          <Button className="rec-keep" loading>
            Keep it
          </Button>
        </div>
      </>
    );
  else if (p === "uploadFailed" && s.take)
    act = (
      <>
        <div className="rec-acts">
          <ListenBack src={s.take.url} durationMs={s.take.durationMs} />
        </div>
        <div className="rec-acts">
          <Button ref={keepRef} className="rec-keep" onClick={onKeep}>
            Try again
          </Button>
        </div>
      </>
    );
  else if (p === "words" || p === "saving" || p === "saveFailed")
    act = (
      <>
        <label className="rec-label" htmlFor="rec-words">
          {s.wordsFrom === "transcript" ? "Your words, as A Story heard them" : "Your words"}
        </label>
        <p className="rec-aside" id="rec-words-note">
          {s.wordsFrom === "transcript"
            ? "Change anything that came out wrong. Your voice is kept just as you said it."
            : s.wordsFrom === "missing"
              ? "The words didn’t come through this time. Your voice is safe; type a line if you like, or keep it as it is."
              : "Your voice is safe. Type a line if you like, or keep it as it is."}
        </p>
        <textarea
          id="rec-words"
          className="rec-words"
          rows={8}
          maxLength={20000}
          value={s.words}
          aria-describedby="rec-words-note"
          readOnly={p === "saving"}
          onChange={(e) => dispatch({ type: "TEXT", text: e.target.value })}
        />
        <div className="rec-acts">
          {s.take && <ListenBack src={s.take.url} durationMs={s.take.durationMs} />}
          <Button ref={keepRef} className="rec-keep" onClick={onSave} loading={p === "saving"}>
            {p === "saveFailed" ? "Try again" : "Keep it"}
          </Button>
        </div>
      </>
    );
  else if (p === "kept")
    act = (
      <section className="rec-kept" aria-labelledby="rec-kept-h">
        <h2 id="rec-kept-h">
          Kept<Stop />
        </h2>
        <p className="rec-lead">
          {own ? "It’s in your archive now, in your own voice." : `It’s in ${story.name}’s archive now, in your voice, with your name on it.`}
        </p>
        <div className="rec-acts">
          <ButtonLink to={`/archive/${s.memoryId}`} viewTransition>
            Read it
          </ButtonLink>
          <ButtonLink variant="outline" to="/" viewTransition>
            Back to today
          </ButtonLink>
        </div>
      </section>
    );

  return (
    <>
      <div className="page rec-page">
        <aside className="rec-card talk-card" aria-label={chosen ? "The question you chose" : "Today’s question"} data-rise>
          <p className="talk-card-kicker">{chosen ? "The question you chose" : question ? "Today’s question" : "In your own voice"}</p>
          <p className="talk-q" data-len={qLen(qText)}>
            {qText}
          </p>
        </aside>
        <section className="rec-desk" aria-label="Your answer" data-rise>
          {error && (p === "uploadFailed" || p === "saveFailed") && (
            <p className="rec-error" role="alert">
              {error}
            </p>
          )}
          <div className="rec-status" role="group" aria-live="polite" tabIndex={-1} ref={statusRef} data-phase={p}>
            {act}
          </div>
        </section>
      </div>
      <div className="page rec-next">
        <WhereNext
          rows={[
            { to: "/", title: "Back to today", line: "Three questions, and the week so far." },
            { to: "/archive", title: "Read what’s kept", line: "Every memory by year." },
            { to: "/book", title: "Open the book", line: "Every page, as it will print." },
          ]}
        />
      </div>
    </>
  );
}
