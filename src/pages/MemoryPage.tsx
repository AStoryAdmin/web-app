/**
 * One memory, read, the way the founder's own draft lays it out. The cloth
 * keeps a short band: where this is, and who told it. The sheet opens with
 * the photograph large (or, without one, the first sentence typed on the
 * memory's paper), then the caption band with the title and when it was,
 * three warm tiles (a photograph, more words, what you remember), the
 * words themselves with a drop cap, the voice if there is one, what the
 * family remembers as faces and quoted lines, the years this story lives
 * in, and a quiet footer where the memory can be made private (you and
 * the keepers) or left public, edited, shared or removed.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, Button, ButtonLink, Problem } from "../components/ui";
import { LinkIcon, LockIcon, PenIcon, PeopleIcon, TrashIcon } from "../components/icons";
import AudioPlayer from "../components/archive/AudioPlayer";
import ReadAloud from "../components/archive/ReadAloud";
import Treasure from "../components/archive/Treasure";
import FamilyVoices from "../components/archive/FamilyVoices";
import ActionTiles from "../components/archive/ActionTiles";
import YearStrip from "../components/archive/YearStrip";
import { CaptionBand, Photograph, TypedCard } from "../components/archive/MemoryLead";
import { smarten } from "../lib/typography";
import { opening } from "../lib/resurface";
import { minutesLabel, orderedPhotos, paragraphsOf } from "../components/archive/photos";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { usePhotoUrl } from "../lib/photoUrls";
import { paperFor, toldBy } from "../lib/memoryDisplay";
import { dateLine, quoteFor } from "../app-core/lib/memoryCard.js";
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

/** A small print on the strip. Under the pointer it turns over: the date is written on the back. */
function Thumb({ url, on, tilt, caption, onPick }: { url: string; on: boolean; tilt: number; caption: string; onPick: () => void }) {
  const src = usePhotoUrl(url);
  return (
    <button type="button" aria-pressed={on} onClick={onPick} style={{ ["--tilt" as string]: `${tilt}deg` }} aria-label="Show this photograph">
      <span className="flip">
        <span className="face">
          <img src={src ?? undefined} alt="" loading="lazy" />
        </span>
        <span className="back" aria-hidden="true">
          <span>{caption}</span>
        </span>
      </span>
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
  const [reading, setReading] = useState<number | null>(null);
  const [compose, setCompose] = useState(false);

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
  const body = (paragraphs.length ? paragraphs : transcript.length ? paragraphsOf(transcript.join("\n\n")) : []).map(smarten);
  const viewerName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || (user?.email || "").split("@")[0] || "Someone";
  const isOwner = !!user && story.ownerId === user.id;
  const title = smarten(memory.title?.trim() || "Untitled");
  const isPrivate = memory.privacy === "private";
  const number = Math.max(1, [...story.memories].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex((m) => m.id === memory.id) + 1);
  const paper = paperFor(memory);
  const plain = body.join(" ");
  const lead = plain ? smarten(quoteFor(opening(plain) || plain, 170) as string) : title;

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
      compact
      back="/archive"
      hero={
        <div className="mpd-band">
          <nav className="mpd-crumbs" aria-label="Where this is" data-rise>
            <Link to="/archive">Archive</Link>
            <span aria-hidden="true">·</span>
            <span>{own ? "Your story" : `${story.name}'s story`}</span>
            <span aria-hidden="true">·</span>
            <span className="here">Memory No. {number}</span>
          </nav>
          <p className="rd-told mpd-told" data-rise>
            <Avatar src={memory.contributor ? null : tellerPhoto} name={memory.contributor ? memory.contributor.split(",")[0] : story.name} size={40} />
            <span className="meta">
              {toldLine}
              <small>{isPrivate ? "Private · you and the keepers" : "Public · the family on A Story"}</small>
            </span>
          </p>
        </div>
      }
    >
      <div className="page read mpd">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}

        <div className="mpd-cols">
        <div className="mpd-side">
        <div className="mpd-lead" data-rise>
          {current ? <Photograph url={current} paper={paper} /> : <TypedCard line={lead} chapter={memory.era} paper={paper} />}
          {photos.length > 1 && (
            <div className="rd-strip">
              {photos.map((p, i) => (
                <Thumb key={p} url={p} on={p === current} tilt={[-3, 2, -1, 3][i % 4]} caption={memory.period?.trim() || "No date yet"} onPick={() => setShown(p)} />
              ))}
            </div>
          )}
        </div>

        <CaptionBand title={title} date={date} dated={dated} editTo={`/write?edit=${memory.id}&details=1`} chapter={memory.era} paper={paper} people={people} stillWriting={memory.status === "in_progress"} />

        <ActionTiles memoryId={memory.id} onRemember={() => setCompose(true)} />
        </div>

        <div className="mpd-main">
        <div className="rd-story mpd-words" data-rise>
          {body.length ? (
            body.map((p, k) => (
              <p key={k} className={[reading === k ? "reading" : "", k === 0 && p.split("\n")[0].trim().length < 48 ? "nodrop" : ""].filter(Boolean).join(" ") || undefined}>
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

        {body.length > 0 && <ReadAloud paragraphs={body} label={title} onPosition={setReading} />}

        {memory.audio?.length > 0 && <AudioPlayer clips={memory.audio} name={story.name} photo={tellerPhoto} />}

        <FamilyVoices memory={memory} story={story} viewerName={viewerName} isOwner={isOwner} people={family?.people ?? []} open={compose} onOpenChange={setCompose} />
        </div>
        </div>

        <YearStrip story={story} year={year} />

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
            <Treasure memory={memory} story={story} />
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
    </Shell>
  );
}
