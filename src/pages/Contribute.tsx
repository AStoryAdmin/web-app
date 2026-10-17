/**
 * /c/:slug — add to somebody's story without an account. Anyone with the
 * link: their name, how they knew them, a memory or a note, a few
 * photographs, an email if they'd like to hear when the family keeps it.
 * Everything lands as pending; the family reads it first. Afterwards they
 * are offered their place in the family, and nothing more than that.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Lockup } from "../components/Brand";
import { Avatar, Button, ButtonLink, Field } from "../components/ui";
import { CloseIcon, MailIcon, PhotoIcon, UserIcon } from "../components/icons";
import { getSupabase } from "../lib/supabase";
import { usePhotoUrl } from "../lib/photoUrls";
import { uuid } from "../lib/uuid";
import { track } from "../lib/analytics";
import { submitAnonymous } from "../data/contributions";
import { shrinkImage } from "../data/memories";

type Info = { id?: string; name: string; last_name: string; photo_url: string | null };
const BUCKET = "contribution-photos";
const MAX_PHOTOS = 3;

function StoryCard({ info }: { info: Info }) {
  const photo = usePhotoUrl(info.photo_url);
  const full = `${info.name} ${info.last_name}`.trim();
  return (
    <div className="storycard">
      <Avatar src={photo} name={info.name} size={72} />
      <div>
        <p className="label">A memory for</p>
        <h1>{full}'s story</h1>
      </div>
    </div>
  );
}

export default function Contribute() {
  const { slug = "" } = useParams();
  const [info, setInfo] = useState<Info | null | undefined>(undefined);
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
  const fileRef = useRef<HTMLInputElement>(null);

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
  }, [slug]);

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

  const send = async () => {
    setError(null);
    if (!name.trim()) return setError("Your name, so the family knows who this is from.");
    if (!body.trim() && !photos.length) return setError("Write what you remember, or add a photograph.");
    setBusy("send");
    try {
      const ok = await submitAnonymous({ slug, contributorName: name.trim(), relationship: relationship.trim(), kind, title: kind === "memory" ? title.trim() : "", body: body.trim(), photos, contributorEmail: email });
      if (!ok) {
        setError("This link isn't taking memories right now. It may have been closed by the family.");
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

  return (
    <main className="solo contribute">
      <a href="https://astoryapp.com" aria-label="A Story" className="solo-brand">
        <Lockup height={40} />
      </a>
      <section className="solo-card wide" aria-live="polite">
        {info === undefined ? (
          <p className="meta">One moment…</p>
        ) : info === null ? (
          <>
            <h1>This link isn't available.</h1>
            <p className="meta big">It may have been closed by the family.</p>
          </>
        ) : done ? (
          <>
            <p className="label">Sent</p>
            <h1>Thank you.</h1>
            <p className="meta big">It's with {info.name}'s family now. They read everything first, and it joins the story when they keep it.</p>
            <div className="claim">
              <h2 className="story-title">Claim your place in the family</h2>
              <p className="meta">An account with the same email lets {info.name}'s family find you in their tree. If someone sent you a six-letter family code, type it when you create the account.</p>
              <ButtonLink to="/create-account?next=/" style={{ marginTop: "var(--s-4)" }}>
                Claim your place
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <StoryCard info={info} />
            <p className="meta" style={{ margin: "var(--s-2) 0 var(--s-6)" }}>
              Something you remember about {info.name}, or a note for the family. They read it first.
            </p>
            <form
              className="pform"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <Field label="Your name" icon={<UserIcon />} value={name} onChange={(e) => setName(e.target.value)} placeholder="So they know who this is from" autoComplete="name" />
              <Field label={`How you knew ${info.name}`} value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Her neighbour, his niece, an old friend" autoComplete="off" />

              <p className="field-label">What is this?</p>
              <div className="chiprow" role="group" aria-label="What is this">
                <button type="button" className="chip big" aria-pressed={kind === "memory"} onClick={() => setKind("memory")}>
                  A memory
                </button>
                <button type="button" className="chip big" aria-pressed={kind === "testimonial"} onClick={() => setKind("testimonial")}>
                  A note for the family
                </button>
              </div>

              <div className="paper">
                {kind === "memory" && <input className="wtitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A title, if one comes to mind" aria-label="Title" maxLength={200} />}
                <textarea
                  className="wbody"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={kind === "memory" ? `What do you remember about ${info.name}?` : `Something to say to ${info.name}'s family.`}
                  aria-label={kind === "memory" ? "Your memory" : "Your note"}
                  rows={7}
                  maxLength={10000}
                />
                {photos.length > 0 && (
                  <div className="wphotos">
                    {photos.map((url) => (
                      <figure key={url} className="wphoto">
                        <img src={url} alt="" />
                        <button type="button" className="x" aria-label="Remove this photograph" onClick={() => setPhotos((p) => p.filter((u) => u !== url))}>
                          <CloseIcon width={18} height={18} />
                        </button>
                      </figure>
                    ))}
                  </div>
                )}
                {info.id && photos.length < MAX_PHOTOS && (
                  <div className="wtools">
                    <Button variant="outline" small icon={<PhotoIcon />} loading={busy === "photo"} onClick={() => fileRef.current?.click()}>
                      Add a photograph
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
                  </div>
                )}
              </div>

              <Field label="Your email" icon={<MailIcon />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" hint="Kept with what you sent, so the family knows how to reach you. We don't send emails about it yet." autoComplete="email" />

              {error && (
                <p className="meta" role="alert" style={{ color: "var(--danger)", marginBottom: "var(--s-4)" }}>
                  {error}
                </p>
              )}
              <Button type="submit" block loading={busy === "send"} disabled={busy === "photo"}>
                Send to the family
              </Button>
            </form>
          </>
        )}
      </section>
      <p className="solo-foot meta">
        A Story keeps a family's memories in their own words. <Link to="/welcome">Find out more</Link>
      </p>
    </main>
  );
}
