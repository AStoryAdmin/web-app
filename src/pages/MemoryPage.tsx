/**
 * One memory, read like a book page: the photographs on the left, the
 * words on the right, the voice if there is one, who is in it, and under
 * it every other version the family sent, each under its own name. Then
 * one line: what do you remember about this?
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, Button, ButtonLink, Problem } from "../components/ui";
import { LeafIcon, LinkIcon, PenIcon, PhotoIcon, TrashIcon } from "../components/icons";
import Photographs, { PhonePolaroids } from "../components/archive/Photographs";
import AudioPlayer from "../components/archive/AudioPlayer";
import FamilyVoices from "../components/archive/FamilyVoices";
import { minutesLabel, orderedPhotos, paragraphsOf } from "../components/archive/photos";
import { useArrive } from "../components/archive/motion";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { usePhotoUrl } from "../lib/photoUrls";
import { paperFor, toldBy } from "../lib/memoryDisplay";
import { dateLine } from "../app-core/lib/memoryCard.js";
import { memoryDate } from "../app-core/lib/timeline.js";
import { CHAPTER_COLOR } from "../app-core/theme/index.js";
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
    <Shell title="Memory" back="/archive">
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

export default function MemoryPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { account, activeStory, stories, family, chooseStory, removeMemory, saveFailure, clearSaveFailure } = useAccount();
  const navigate = useNavigate();

  // The memory in the story being looked at; failing that, in any story the
  // account keeps, and the view follows it.
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
  const [copied, setCopied] = useState<string | null>(null);
  const words = useRef<HTMLDivElement>(null);
  useArrive(words, memory?.id);

  if (account === undefined) return <Shell title="Memory" back="/archive"><div className="page" aria-busy="true" /></Shell>;
  if (!story || !memory) return <Missing />;

  const own = story.relationship === "Myself";
  const paper = paperFor(memory);
  const chapterColour = (CHAPTER_COLOR as Record<string, string>)[memory.era];
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
  const others = photos.filter((p) => p !== current);

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
    <Shell title={own ? "Your story" : `${story.name}'s story`} back="/archive">
      <div className="page mp-page">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}
        <nav className="mp-crumbs" aria-label="Breadcrumb">
          <Link to="/archive">Archive</Link>
          {dated && year != null && (
            <>
              <span aria-hidden="true">›</span>
              <Link to={`/archive#y${year}`}>{year}</Link>
            </>
          )}
          <span aria-hidden="true">›</span>
          <span className="here" aria-current="page">
            {title}
          </span>
        </nav>

        <article className="mp-spread">
          <Photographs memory={memory} story={story} paper={paper} photos={photos} current={current} onPick={setShown} />

          <div className={`mp-right${current ? "" : " nohero"}`} ref={words}>
            <div className="mp-meta" data-arrive>
              <div>
                <p className="date">
                  {dated ? date : <Link to={`/write?edit=${memory.id}`}>No date yet · add one</Link>}
                </p>
                <div className="chiprow">
                  <span className="chip" style={chapterColour ? { color: chapterColour, background: `color-mix(in srgb, ${chapterColour} 12%, white)` } : undefined}>
                    <LeafIcon />
                    {memory.era}
                  </span>
                  {people.map((p) => (
                    <Link key={p.id} className="chip" to={`/family/${p.id}`}>
                      {p.givenName || p.familyName || "Someone"}
                    </Link>
                  ))}
                  {memory.status === "in_progress" && <span className="chip accent">Still being written up</span>}
                </div>
              </div>
            </div>

            <h1 className="story-title" data-arrive>
              {title}
            </h1>
            <p className="mp-told" data-arrive>
              <Avatar src={memory.contributor ? null : tellerPhoto} name={memory.contributor ? memory.contributor.split(",")[0] : story.name} size={40} />
              <span className="meta">{toldLine}</span>
            </p>

            <div className="story mp-story" data-arrive>
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
              {body.length > 0 && others.length > 0 && <PhonePolaroids memory={memory} photos={others} onPick={setShown} />}
            </div>
            {body.length === 0 && others.length > 0 && <PhonePolaroids memory={memory} photos={others} onPick={setShown} />}
            <div className="mp-m-addphoto">
              <ButtonLink to={`/write?edit=${memory.id}&photo=1`} variant="outline" small icon={<PhotoIcon />}>
                Add a photograph
              </ButtonLink>
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
              <div className="mp-actions">
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
        </article>
      </div>
    </Shell>
  );
}
