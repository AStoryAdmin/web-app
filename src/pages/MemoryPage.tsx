/**
 * One memory, read. Its title sits on the cloth with when it was, the
 * chapter and who told it. On the sheet, one reading column: the
 * photographs first, the words in the serif with a drop cap, the voice if
 * there is one, what the family remembers, and a quiet footer where the
 * memory can be made private (you and the keepers) or left public (the
 * family on A Story, and the wall if it is shared), edited, shared or
 * removed.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, Button, ButtonLink, Problem } from "../components/ui";
import { LinkIcon, LockIcon, PeopleIcon, PenIcon, PhotoIcon, TrashIcon } from "../components/icons";
import AudioPlayer from "../components/archive/AudioPlayer";
import FamilyVoices from "../components/archive/FamilyVoices";
import { minutesLabel, orderedPhotos, paragraphsOf } from "../components/archive/photos";
import { useArrive } from "../components/archive/motion";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { usePhotoUrl } from "../lib/photoUrls";
import { toldBy } from "../lib/memoryDisplay";
import { dateLine } from "../app-core/lib/memoryCard.js";
import { memoryDate } from "../app-core/lib/timeline.js";
import type { Memory, Story } from "../data/stories";

function findMemory(id: string | undefined, active: Story | null, stories: Story[]): { story: Story; memory: Memory } | null {
  if (!id) return null;
  const inActive = active?.memories.find((m) => m.id === id);
  if (active && inActive) return { story: active, memory: inActive };
  for (const s of stories) {
    const m = s.memories.find((x) => x.id === id);
    if (m) return { story: s, memory: m };
  }
  return null;
}

function Missing() {
  return (
    <Shell compact title="Memory" back="/archive">
      <div className="page">
        <div className="mp-missing">
          <h1>That memory isn't here.</h1>
          <p className="meta">It may have been removed, or it belongs to a story this account can't see.</p>
          <ButtonLink to="/archive" variant="outline">
            Back to the archive
          </ButtonLink>
        </div>
      </div>
    </Shell>
  );
}

function Big({ url }: { url: string }) {
  const src = usePhotoUrl(url);
  return <img className="rd-hero" src={src ?? undefined} alt="" />;
}

function Thumb({ url, on, tilt, onPick }: { url: string; on: boolean; tilt: number; onPick: () => void }) {
  const src = usePhotoUrl(url);
  return (
    <button type="button" aria-pressed={on} onClick={onPick} style={{ ["--tilt" as string]: `${tilt}deg` }} aria-label="Show this photograph">
      <img src={src ?? undefined} alt="" loading="lazy" />
    </button>
  );
}

export default function MemoryPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { account, activeStory, stories, family, chooseStory, saveMemory, removeMemory, saveFailure, clearSaveFailure } = useAccount();
  const navigate = useNavigate();

  const found = findMemory(id, activeStory, stories);
  const foundStoryId = found?.story.id ?? null;
  const activeId = activeStory?.id ?? null;
  useEffect(() => {
    if (foundStoryId && activeId && foundStoryId !== activeId) chooseStory(foundStoryId).catch(() => {});
  }, [foundStoryId, activeId, chooseStory]);

  const story = found?.story ?? null;
  const memory = found?.memory ?? null;
  const photos = memory ? orderedPhotos(memory) : [];
  const [shown, setShown] = useState<string | null>(null);
  const current = shown && photos.includes(shown) ? shown : photos[0] || null;
  const tellerPhoto = usePhotoUrl(story?.photo);
  const [confirm, setConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const words = useRef<HTMLDivElement>(null);
  useArrive(words, memory?.id);

  if (account === undefined) return <Shell compact title="Memory" back="/archive"><div className="page" aria-busy="true" /></Shell>;
  if (!story || !memory) return <Missing />;

  const own = story.relationship === "Myself";
  const { year, dated } = memoryDate(memory) as { year: number | null; dated: boolean };
  const date = dateLine(story, memory) as string;
  const people = (memory.personIds || [])
    .map((pid) => family?.people.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const seconds = (memory.audio || []).reduce((a, c) => a + (c.duration || 0), 0);
  const told = toldBy(memory, story);
  const toldLine = memory.audio?.length ? `${told} on a call${minutesLabel(seconds) ? ` · ${minutesLabel(seconds)}` : ""}` : told;
  const transcript = (memory.audio || []).filter((c) => c.speaker !== "assistant" && c.transcript).map((c) => c.transcript);
  const paragraphs = paragraphsOf(memory.body);
  const body = paragraphs.length ? paragraphs : transcript.length ? paragraphsOf(transcript.join("\n\n")) : [];
  const viewerName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || (user?.email || "").split("@")[0] || "Someone";
  const isOwner = !!user && story.ownerId === user.id;
  const title = memory.title?.trim() || "Untitled";
  const isPrivate = memory.privacy === "private";
  const number = Math.max(1, [...story.memories].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex((m) => m.id === memory.id) + 1);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} · A Story`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied("Link copied");
    } catch {
      setCopied("Copy the address bar to share this page");
    }
    window.setTimeout(() => setCopied(null), 3000);
  };

  const flip = async () => {
    setFlipping(true);
    try {
      await saveMemory({ ...memory, privacy: isPrivate ? "shared" : "private" }, story.id);
    } catch {
      /* the provider's saveFailure says so */
    } finally {
      setFlipping(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await removeMemory(memory.id, story.id);
      navigate("/archive", { replace: true });
    } catch {
      setRemoving(false);
    }
  };

  return (
    <Shell
      back="/archive"
      hero={
        <div className="whero">
          <p className="label" data-rise>
            Memory No. {number} · {own ? "Your story" : `${story.name}'s story`}
          </p>
          <div className="rd-chips" data-rise>
            <span className="pill gold">{memory.era}</span>
            {dated ? (
              <span className="pill cream">{date}</span>
            ) : (
              <Link className="pill cream" to={`/write?edit=${memory.id}&details=1`}>
                No date yet · add one
              </Link>
            )}
            {people.map((p) => (
              <Link key={p.id} className="pill cream" to={`/family/${p.id}`}>
                {p.givenName || p.familyName || "Someone"}
              </Link>
            ))}
            {memory.status === "in_progress" && <span className="pill cream">Still being written up</span>}
          </div>
          <h1 className="story-q wq">{title}</h1>
          <p className="rd-told" data-rise>
            <Avatar src={memory.contributor ? null : tellerPhoto} name={memory.contributor ? memory.contributor.split(",")[0] : story.name} size={40} />
            <span className="meta">
              {toldLine}
              <small>{isPrivate ? "Private · you and the keepers" : "Public · the family on A Story"}</small>
            </span>
          </p>
        </div>
      }
    >
      <div className="page read">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}

        <div ref={words}>
          {current && (
            <div className="rd-photos" data-arrive>
              <Big url={current} />
              {photos.length > 1 && (
                <div className="rd-strip">
                  {photos.map((p, i) => (
                    <Thumb key={p} url={p} on={p === current} tilt={[-3, 2, -1, 3][i % 4]} onPick={() => setShown(p)} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rd-story" data-arrive>
            {body.length ? (
              body.map((p, k) => (
                <p key={k}>
                  {p.split("\n").map((line, j, arr) => (
                    <span key={j}>
                      {line}
                      {j < arr.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))
            ) : memory.status === "in_progress" ? (
              <p className="quiet">A Story is still writing this one up from the call. The words land here when it's done.</p>
            ) : (
              <p className="quiet">Nothing written down yet. {memory.photos.length ? "The photographs are here, though." : ""}</p>
            )}
          </div>

          <div className="rd-side" data-arrive>
            <Link className="more" to={`/write?edit=${memory.id}&photo=1`}>
              <PhotoIcon style={{ width: 16, height: 16, verticalAlign: "-3px", marginRight: 6 }} />
              {photos.length ? "Add another photograph" : "Add a photograph"}
            </Link>
            {!dated && (
              <Link className="more" to={`/write?edit=${memory.id}&details=1`}>
                Say when it was
              </Link>
            )}
            {year != null && (
              <Link className="more" to={`/archive#y${year}`}>
                Everything from {year}
              </Link>
            )}
          </div>

          {memory.audio?.length > 0 && <AudioPlayer clips={memory.audio} name={story.name} photo={tellerPhoto} />}

          <FamilyVoices memory={memory} story={story} viewerName={viewerName} isOwner={isOwner} />

          {confirm ? (
            <div className="mp-confirm" role="alertdialog" aria-labelledby="rm-h">
              <p id="rm-h" style={{ fontWeight: 600, color: "var(--heading)" }}>
                Remove “{title}” from {own ? "your" : `${story.name}'s`} story?
              </p>
              <p className="meta">The words{memory.photos.length ? ", the photographs" : ""}{memory.audio?.length ? " and the recording" : ""} go with it. This can't be undone.</p>
              <div className="row">
                <Button onClick={remove} loading={removing} style={{ background: "var(--danger)" }}>
                  Remove it
                </Button>
                <Button variant="outline" onClick={() => setConfirm(false)} disabled={removing}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <div className="rd-foot">
              <button type="button" className={`rd-privacy${isPrivate ? " private" : ""}`} onClick={flip} disabled={flipping} aria-pressed={isPrivate} title={isPrivate ? "Make it public" : "Make it private"}>
                {isPrivate ? <LockIcon /> : <PeopleIcon />}
                <span className="dot" aria-hidden="true" />
                {isPrivate ? "Private" : "Public"}
                <small>{isPrivate ? "· you and the keepers" : "· the family, and the wall"}</small>
              </button>
              <ButtonLink to={`/write?edit=${memory.id}`} variant="outline" small icon={<PenIcon />}>
                Edit the words
              </ButtonLink>
              <Button variant="outline" small icon={<LinkIcon />} onClick={share}>
                {copied ?? "Share"}
              </Button>
              <Button variant="quiet" small className="danger" icon={<TrashIcon />} onClick={() => setConfirm(true)}>
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
