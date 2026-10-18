/**
 * /c/:slug — add to somebody's story without an account. The family book
 * open on the cloth, like the sign-in: on the left page, the person whose
 * story it is (their photograph as a print, or their initials as a seal)
 * and what happens to what you send; on the right page, a leaf to write
 * on, in two steps that never share the page (Bao's Standard rule 13):
 * first what you remember, with up to three photographs; then who it is
 * from. Everything lands as pending; the family reads it first and keeps
 * it under your name. Afterwards you are offered your place in the
 * family, and nothing more than that.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuthFrame from "./auth/AuthFrame";
import { Button, ButtonLink, Field } from "../components/ui";
import { CloseIcon } from "../components/icons";
import LoadingMark from "../components/delight/LoadingMark";
import { getSupabase } from "../lib/supabase";
import { usePhotoUrl } from "../lib/photoUrls";
import { uuid } from "../lib/uuid";
import { track } from "../lib/analytics";
import { submitAnonymous } from "../data/contributions";
import { shrinkImage } from "../data/memories";

type Info = { id?: string; name: string; last_name: string; photo_url: string | null };
const BUCKET = "contribution-photos";
const MAX_PHOTOS = 3;

const initials = (info: Info) => `${info.name.trim()[0] || ""}${info.last_name.trim()[0] || ""}`.toUpperCase() || "A";

/** The left page: whose story this is, and what happens to what you send. */
function Person({ info }: { info: Info }) {
  const photo = usePhotoUrl(info.photo_url);
  const full = `${info.name} ${info.last_name}`.trim();
  return (
    <div className="cb-person ep-arrive">
      {photo ? (
        <figure className="cb-print" aria-hidden="true">
          <img src={photo} alt="" decoding="async" />
          <i className="pc tl" />
          <i className="pc tr" />
          <i className="pc bl" />
          <i className="pc br" />
        </figure>
      ) : (
        <div className="cb-seal" aria-hidden="true">
          <span>{initials(info)}</span>
        </div>
      )}
      <div className="cb-who">
        <p className="cb-for">The book of</p>
        <h2 className="cb-name">{full}</h2>
        <i className="cb-rule" aria-hidden="true" />
        <ul className="cb-what">
          <li>Their family reads what you send before anything else happens.</li>
          <li>When they keep it, it joins {info.name}'s book under your name.</li>
          <li>You don't need an account to send it.</li>
        </ul>
      </div>
    </div>
  );
}

export default function Contribute() {
  const { slug = "" } = useParams();
  const [info, setInfo] = useState<Info | null | undefined>(undefined);
  const [step, setStep] = useState<"words" | "who">("words");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [kind, setKind] = useState<"memory" | "testimonial">("memory");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"" | "send" | "photo">("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    const sb = getSupabase();
    if (!sb || !slug) {
      queueMicrotask(() => live && setInfo(null));
      return;
    }
    (async () => {
      try {
        const { data, error: err } = await sb.rpc("get_contribute_info", { slug });
        if (live) setInfo(err || !data ? null : (data as Info));
      } catch {
        if (live) setInfo(null);
      }
    })();
    return () => {
      live = false;
    };
  }, [slug, attempt]);

  const addPhotos = async (files: FileList | null) => {
    const sb = getSupabase();
    if (!files?.length || !sb || !info?.id) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return setError(`Up to ${MAX_PHOTOS} photographs.`);
    setBusy("photo");
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const blob = await shrinkImage(file);
        const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
        const path = `${info.id}/contrib-${uuid()}/${uuid()}.${ext}`;
        const { error: upErr } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg" });
        if (upErr) throw upErr;
        urls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
      setPhotos((p) => [...p, ...urls]);
    } catch (err) {
      setError(`A photograph didn't go up (${(err as Error)?.message || "no connection"}). The words are safe; try it again.`);
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toWho = () => {
    setError(null);
    if (!body.trim() && !photos.length) {
      setError("Write what you remember, or add a photograph.");
      bodyRef.current?.focus();
      return;
    }
    setStep("who");
    requestAnimationFrame(() => nameRef.current?.focus());
  };

  const send = async () => {
    setError(null);
    if (!name.trim()) {
      nameRef.current?.focus();
      return setError("Your name, so the family knows who this is from.");
    }
    setBusy("send");
    try {
      const ok = await submitAnonymous({ slug, contributorName: name.trim(), relationship: relationship.trim(), kind, title: kind === "memory" ? title.trim() : "", body: body.trim(), photos, contributorEmail: email });
      if (!ok) {
        setError("This link isn't taking memories right now. The family may have closed it.");
        return;
      }
      track("contribution_sent", { kind, photos: photos.length, with_email: !!email.trim() });
      setDone(true);
    } catch (err) {
      setError(`That didn't send (${(err as Error)?.message || "no connection"}). Your words are still here; try again.`);
    } finally {
      setBusy("");
    }
  };

  const again = () => {
    setTitle("");
    setBody("");
    setPhotos([]);
    setKind("memory");
    setStep("words");
    setDone(false);
    setError(null);
  };

  const errorLine = error && (
    <p className="cb-error" role="alert">
      {error}
    </p>
  );

  // A link that leads nowhere is the family book with the dog on its plate, one line of cause and remedy, one action.
  if (info === null) {
    return (
      <AuthFrame rest="watch">
        <div className="form">
          <h1>
            This link isn’t available<span className="stop">.</span>
          </h1>
          <p className="sub">The family may have closed it, or a letter is missing from the address. Ask whoever sent it for the link again; it takes a minute.</p>
          <div className="acts">
            <Button block onClick={() => setAttempt((a) => a + 1)}>
              Try the link again
            </Button>
          </div>
          <p className="switch">
            <Link to="/welcome" viewTransition>
              What is A Story?
            </Link>
          </p>
        </div>
      </AuthFrame>
    );
  }

  let page;
  if (info === undefined) {
    page = (
      <div className="cb-state cb-wait" aria-busy="true">
        <LoadingMark />
        <p className="cb-p">Opening the family’s book</p>
      </div>
    );
  } else if (done) {
    page = (
      <div className="cb-state">
        <p className="cb-kicker">Sent to {info.name}'s family</p>
        <h1 className="cb-q">
          Thank you<span className="stop">.</span>
        </h1>
        <p className="cb-p">It's with {info.name}'s family now. They read everything first, and it joins the book under your name when they keep it.</p>
        <div className="cb-claim">
          <h2>Your place in the family</h2>
          <p className="cb-p">An account with the same email lets {info.name}'s family find you in their tree. If someone sent you a six-letter family code, type it when you make the account.</p>
          <div className="cb-row">
            <ButtonLink to={`/create-account?next=/`} viewTransition>
              Claim your place
            </ButtonLink>
            <button type="button" className="linkish" onClick={again}>
              Send another memory
            </button>
          </div>
        </div>
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
          <p className="cb-kicker">A page for {info.name}'s book</p>
          <div className="cb-kind" role="group" aria-label="What you are writing">
            <button type="button" aria-pressed={kind === "memory"} onClick={() => setKind("memory")}>
              A memory
            </button>
            <button type="button" aria-pressed={kind === "testimonial"} onClick={() => setKind("testimonial")}>
              A note for the family
            </button>
          </div>
        </div>
        <h1 className="cb-q">{kind === "memory" ? `What do you remember about ${info.name}?` : `What would you like to tell ${info.name}'s family?`}</h1>
        {errorLine}
        {kind === "memory" && <input className="cb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A title, if one comes to mind" aria-label="Title" maxLength={200} />}
        <textarea
          ref={bodyRef}
          className="cb-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={kind === "memory" ? "Begin anywhere: a place, a smell, something they said." : "A few lines is plenty."}
          aria-label={kind === "memory" ? "Your memory" : "Your note"}
          maxLength={10000}
        />
        <div className="cb-foot">
          <div className="cb-photos">
            {photos.map((url) => (
              <figure key={url} className="cb-thumb">
                <img src={url} alt="A photograph you added" />
                <button type="button" className="x" aria-label="Remove this photograph" onClick={() => setPhotos((p) => p.filter((u) => u !== url))}>
                  <CloseIcon width={14} height={14} />
                </button>
              </figure>
            ))}
            {info.id && photos.length < MAX_PHOTOS && (
              <>
                <button type="button" className="linkish cb-add" onClick={() => fileRef.current?.click()} disabled={busy === "photo"} aria-busy={busy === "photo" || undefined}>
                  {busy === "photo" ? "Adding…" : photos.length ? "Add another photograph" : "Add a photograph"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
              </>
            )}
          </div>
          <Button type="submit" disabled={busy === "photo"}>
            Next: who it's from
          </Button>
        </div>
      </form>
    );
  } else {
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
          <p className="cb-kicker">A page for {info.name}'s book</p>
          <button type="button" className="linkish cb-back" onClick={() => setStep("words")}>
            ← Back to your words
          </button>
        </div>
        <h1 className="cb-q">Who is it from?</h1>
        {firstLine && <blockquote className="cb-quote">{firstLine.length > 140 ? `${firstLine.slice(0, 140).trim()}…` : firstLine}</blockquote>}
        {errorLine}
        <div className="cb-fields">
          <Field ref={nameRef} label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="So they know who this is from" autoComplete="name" aria-invalid={error && !name.trim() ? true : undefined} />
          <Field label={`How you knew ${info.name}`} value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Her neighbour, his niece, an old friend" autoComplete="off" />
          <Field label="Your email, if you like" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" hint="Kept with what you sent, so the family can reach you." />
        </div>
        <div className="cb-foot">
          <span />
          <Button type="submit" loading={busy === "send"}>
            Send to the family
          </Button>
        </div>
      </form>
    );
  }

  return (
    <AuthFrame plate={false} left={info ? <Person info={info} /> : <span />} leftLabel={info ? `Whose story: ${info.name} ${info.last_name}` : undefined}>
      <div className="cb" aria-live="polite">
        {page}
        <p className="cb-colophon">
          A Story keeps a family's memories in their own words. <Link to="/welcome">About A Story</Link>
        </p>
      </div>
    </AuthFrame>
  );
}
