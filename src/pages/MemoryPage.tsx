/**
 * One memory, read: a page of the family book open on the bench
 * (docs/research/reading-2026.md §3). No hero band: the sheet starts under
 * the bar and the page carries its own head, set as the book sets a
 * memory's first page. The words lead, in EB Garamond at 22px (23 on a
 * large screen, 20 on a phone), 1.6 leading, 25.4em to the line (about 66
 * characters), paragraphs spaced 0.8em, the full ink. A call is set as a
 * clean transcript, with the exact words one click away. On a laptop the
 * photograph is the left page, a straight print held in view; on a phone
 * it follows the first paragraph. A memory without one has the family's
 * lines in the margin. Under the words: the voice when there is a
 * recording, one hairline row of tools, the family's lines, and the page
 * turn.
 */
import { useEffect, useState, useSyncExternalStore, type ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Button, ButtonLink, Problem } from "../components/ui";
import { ChevronLeft, LinkIcon, LockIcon, PenIcon, PeopleIcon, PhotoIcon, TrashIcon, CalendarIcon, PlayIcon } from "../components/icons";
import AudioPlayer from "../components/archive/AudioPlayer";
import ReadAloud from "../components/archive/ReadAloud";
import Treasure from "../components/archive/Treasure";
import FamilyVoices from "../components/archive/FamilyVoices";
import ToolMenu from "../components/archive/ToolMenu";
import { MemoryHead, PageTurn, Plate } from "../components/archive/MemoryLead";
import { smarten } from "../lib/typography";
import { canSpeak } from "../lib/readAloud";
import { isRunOfLines, orderedPhotos, paragraphsOf, readableParagraphs, realChapter, takesDropCap } from "../components/archive/photos";
import { ASKED, cleanTranscript, findTakeaway, soundsSpoken, takeaway } from "../components/archive/transcript";
import { useServerTidy } from "../components/archive/serverTidy";
import { tellerParts, wasSpoken } from "../lib/memoryDisplay";
import WhereNext from "../components/book/WhereNext";
import { isTreasured } from "../lib/treasured";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { usePhotoUrl } from "../lib/photoUrls";
import { dateLine } from "../app-core/lib/memoryCard.js";
import { memoryDate } from "../app-core/lib/timeline.js";
import { loadAskedQuestions } from "../components/book/askedQuestions";
import type { Asked } from "../components/book/bookPages";
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

/** Words with Vietnamese letters, with the short words between them (as "em nhìn thấy dơ luôn"), so screen readers and hyphenation treat them as Vietnamese. */
const VI = "[\\p{L}]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][\\p{L}]*";
const VI_RUN = new RegExp(`(?:\\b[\\p{L}]{1,3}\\s+)?${VI}(?:\\s+(?:${VI}|[\\p{L}]{1,4}(?=\\s+${VI})))*`, "gu");
function withLang(text: string) {
  const out: (string | ReactElement)[] = [];
  let last = 0;
  for (const m of text.matchAll(VI_RUN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <span key={at} lang="vi">
        {m[0]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (!out.length) return text;
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * The takeaway where it stands in the words, under the same low gold marker
 * as under the title: the source, not a repeat. Found ignoring case and
 * punctuation, so it still matches once the words are tidied.
 */
function withMark(text: string, kept: string) {
  const at = findTakeaway(text, kept);
  if (!at) return withLang(text);
  return [
    <span key="a">{withLang(text.slice(0, at[0]))}</span>,
    <mark key="m" className="mv-mark">
      {withLang(text.slice(at[0], at[1]))}
    </mark>,
    <span key="b">{withLang(text.slice(at[1]))}</span>,
  ];
}

/** The spread needs a laptop's width; below it the page is one column and the photograph sits in the words. */
const SPREAD = "(min-width: 1280px)";
function useSpread(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(SPREAD);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(SPREAD).matches,
    () => true,
  );
}

function Missing() {
  return (
    <Shell bare title="Memory">
      <div className="page mv">
        <div className="mp-missing mv-missing">
          <img className="mv-missing-dog" src="/dog/curious-paper.webp" alt="" width={150} height={126} />
          <h1>That memory isn’t here</h1>
          <p className="meta">It may have been removed, or it belongs to a story this account can’t see. The rest of the archive is where it was.</p>
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
  const { account, activeStory, stories, family, chooseStory, saveMemory, removeMemory, saveFailure, clearSaveFailure } = useAccount();
  const navigate = useNavigate();
  const spread = useSpread();

  const found = findMemory(id, activeStory, stories);
  const foundStoryId = found?.story.id ?? null;
  const activeId = activeStory?.id ?? null;
  useEffect(() => {
    if (foundStoryId && activeId && foundStoryId !== activeId) chooseStory(foundStoryId).catch(() => {});
  }, [foundStoryId, activeId, chooseStory]);

  const story = found?.story ?? null;
  const memory = found?.memory ?? null;
  const memoryId = memory?.id ?? null;
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
  const [asked, setAsked] = useState<Asked | null>(null);
  const [verbatim, setVerbatim] = useState(false);
  const [listen, setListen] = useState(false);

  // the question a relative sent in, when this memory answered one (the book prints it the same way)
  useEffect(() => {
    if (!memoryId) return;
    let live = true;
    loadAskedQuestions([memoryId]).then((r) => live && setAsked(r[memoryId] || null));
    return () => {
      live = false;
    };
  }, [memoryId]);

  // the words: what was typed is set as typed; what was said is set as a clean transcript, the exact words a click away.
  // The local clean transcript shows at once; the server's tidy pass (full stops, capitals) replaces it when it arrives.
  const transcript = (memory?.audio || []).filter((c) => c.speaker !== "assistant" && c.transcript).map((c) => c.transcript);
  const typed = paragraphsOf(memory?.body || "");
  const raw = typed.length ? typed : transcript.length ? paragraphsOf(transcript.join("\n\n")) : [];
  const spoken = memory ? wasSpoken(memory) || soundsSpoken(raw.join("\n\n")) : false;
  const localTidy = spoken ? cleanTranscript(raw) : raw;
  const served = useServerTidy(memoryId, raw.join("\n\n"), localTidy, spoken, story && story.relationship !== "Myself" ? story.name : "");

  // a new memory (Previous, Next) opens tidied and silent, on its own first photograph
  const [openFor, setOpenFor] = useState(memoryId);
  if (openFor !== memoryId) {
    setOpenFor(memoryId);
    setVerbatim(false);
    setListen(false);
    setShown(null);
    setConfirm(false);
  }

  if (account === undefined)
    return (
      <Shell bare title="Memory">
        <div className="page mv mv-skeleton" aria-busy="true">
          <span className="sk-line w30" />
          <span className="sk-line w70 tall" />
          <span className="sk-line w45" />
          <span className="sk-line w90" />
          <span className="sk-line w85" />
          <span className="sk-line w60" />
        </div>
      </Shell>
    );
  if (!story || !memory) return <Missing />;

  const own = story.relationship === "Myself";
  const { dated } = memoryDate(memory) as { year: number | null; dated: boolean };
  const date = dateLine(story, memory) as string;
  const people = (memory.personIds || [])
    .map((pid) => family?.people.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const hasVoice = memory.audio?.length > 0;
  const tidyNow = served ?? (localTidy.length ? localTidy : raw);
  const body = readableParagraphs(spoken && !verbatim ? tidyNow : raw, { punctuate: spoken && !verbatim && !served }).map(smarten);
  const tidied = spoken && tidyNow.join(" ") !== raw.join(" ").replace(/\s*\n\s*/g, " ");
  // the memory's one takeaway: the same line as its print, its List card and Home's quote
  const kept = smarten(takeaway(raw.join("\n")));
  // when it stands in the last paragraph the coda is the repeat, so the body leaves it unmarked (said once nearby, not three times)
  const markIn = kept && !findTakeaway(body[body.length - 1] || "", kept);
  // one rule for who told it, shared with the cards and "From the book": "Told by Bao in conversation"
  const { verb: told, name: toldName, rest: toldRest } = tellerParts(memory, story);

  const viewerName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || (user?.email || "").split("@")[0] || "Someone";
  const isOwner = !!user && story.ownerId === user.id;
  const title = smarten(memory.title?.trim() || "Untitled");
  const isPrivate = memory.privacy === "private";
  const byKept = [...story.memories].filter((m) => m.status !== "in_progress").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const at = byKept.findIndex((m) => m.id === memory.id);
  const turn = (k: number) => (byKept[k] ? { id: byKept[k].id, title: smarten(byKept[k].title?.trim() || "Untitled") } : null);
  const prev = at > 0 ? turn(at - 1) : null;
  const next = at >= 0 ? turn(at + 1) : null;
  const plate = Boolean(current);
  const when = memory.period?.trim() || "";
  const editDetails = `/write?edit=${memory.id}&details=1`;

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
      setCopied("Copy the address bar");
    }
    window.setTimeout(() => setCopied(null), 3000);
  };

  const setPrivacy = async (makePrivate: boolean) => {
    if (makePrivate === isPrivate) return;
    setFlipping(true);
    try {
      await saveMemory({ ...memory, privacy: makePrivate ? "private" : "shared" }, story.id);
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

  const thePlate = current ? <Plate photos={photos} current={current} onPick={setShown} when={when} alt={`${story.name}’s photograph for “${title}”`} /> : null;

  const family_ = (
    <FamilyVoices memory={memory} story={story} viewerName={viewerName} isOwner={isOwner} people={family?.people ?? []} open={compose} onOpenChange={setCompose} />
  );

  const headTools = (
    <>
      <Treasure memory={memory} story={story} />
      <ToolMenu
        className={`rd-privacy${isPrivate ? " private" : ""}`}
        icon={isPrivate ? <LockIcon aria-hidden="true" /> : <PeopleIcon aria-hidden="true" />}
        label={flipping ? "Saving…" : isPrivate ? "Private" : "Public"}
        busy={flipping}
        ariaLabel={`${isPrivate ? "Private" : "Public"}. Change who can read it`}
        align="end"
        items={[
          { key: "public", label: "Public", hint: "The family on A Story, and the wall when it is on", checked: !isPrivate, onSelect: () => void setPrivacy(false) },
          { key: "private", label: "Private", hint: "Only you and the story’s keepers", checked: isPrivate, onSelect: () => void setPrivacy(true) },
        ]}
      />
      <button type="button" className="mv-tool" onClick={share}>
        <LinkIcon aria-hidden="true" />
        <span role="status">{copied ?? "Share"}</span>
      </button>
    </>
  );

  const words = (
    <div className={`rd-story mv-words${spoken && !verbatim ? " tidy" : ""}`} lang="en">
      {body.length ? (
        body.map((p, k) => (
          <div key={k} className="mv-para">
            {p.startsWith(ASKED) ? (
              <p className="asked">
                <span className="asked-lab">We asked</span> {withLang(p.slice(ASKED.length))}
              </p>
            ) : (
              <p className={[reading === k ? "reading" : "", k === 0 && takesDropCap(p) ? "drop" : "", isRunOfLines(p) ? "lines" : ""].filter(Boolean).join(" ") || undefined}>
                {p.split("\n").map((line, j, arr) => (
                  <span key={j}>
                    {markIn ? withMark(line, kept) : withLang(line)}
                    {j < arr.length - 1 && <br />}
                  </span>
                ))}
              </p>
            )}
            {k === 0 && plate && !spread && <aside className="mv-plate inline" aria-label="Photographs">{thePlate}</aside>}
          </div>
        ))
      ) : memory.status === "in_progress" ? (
        <p className="quiet">A Story is still writing this one up from the call. The words land here when it’s done.</p>
      ) : (
        <>
          <p className="quiet">Nothing written down yet.</p>
          {plate && !spread && <aside className="mv-plate inline" aria-label="Photographs">{thePlate}</aside>}
        </>
      )}
    </div>
  );

  return (
    <Shell bare title={realChapter(memory.era) || "Archive"}>
      <div className={`page mv${plate ? " has-plate" : " no-plate"}`}>
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}

        <nav className="mv-crumbs" aria-label="Back" data-rise>
          <Link to="/archive" className="mv-back">
            <ChevronLeft aria-hidden="true" width={18} height={18} />
            The Archive
          </Link>
        </nav>

        <article className="mv-grid" aria-labelledby="mv-title">
          {plate && spread && (
            <aside className="mv-plate" aria-label="Photographs" data-rise>
              {thePlate}
            </aside>
          )}

          <MemoryHead
            title={title}
            chapter={memory.era}
            date={date}
            dated={dated}
            editTo={editDetails}
            told={told}
            toldName={toldName}
            toldRest={toldRest}
            toldPhoto={memory.contributor ? null : tellerPhoto}
            people={people}
            stillWriting={memory.status === "in_progress"}
            actions={headTools}
            kept={kept}
            treasured={isTreasured(memory)}
          />

          <div className="mv-body">
            {asked && (
              <div className="mv-asked">
                <p className="mv-asked-lab">The question</p>
                <p className="mv-asked-q">{smarten(asked.q)}</p>
                <p className="mv-asked-by">Asked by {asked.by}</p>
              </div>
            )}

            {words}

            {kept && body.length > 1 && (
              <p className="mv-coda">
                <span className="mv-coda-mark" aria-hidden="true">
                  ✦
                </span>
                “{kept}”
              </p>
            )}

            {tidied && body.length > 0 && (
              <p className="mv-tidy" aria-live="polite">
                {verbatim ? `Word for word, as it was said` : `Lightly tidied from the ${hasVoice ? "call" : "conversation"}`}{" "}
                <span className="mv-tidy-act">
                  <button type="button" onClick={() => setVerbatim((v) => !v)} aria-pressed={verbatim}>
                    {verbatim ? "Read it tidied" : "Read it word for word"}
                  </button>
                </span>
              </p>
            )}

            {hasVoice ? (
              <div className="mv-voice">
                <AudioPlayer clips={memory.audio} name={story.name} photo={tellerPhoto} />
              </div>
            ) : listen && body.length > 0 ? (
              <div className="mv-voice">
                <ReadAloud paragraphs={body} label={title} onPosition={setReading} autoStart />
              </div>
            ) : null}

            {confirm ? (
              <div className="mp-confirm mv-confirm" role="alertdialog" aria-labelledby="rm-h">
                <p id="rm-h" className="mv-confirm-h">
                  Remove “{title}” from {own ? "your" : `${story.name}’s`} story?
                </p>
                <p className="meta">
                  The words{memory.photos.length ? ", the photographs" : ""}
                  {memory.audio?.length ? " and the recording" : ""} go with it. This can’t be undone.
                </p>
                <div className="row">
                  <Button onClick={remove} loading={removing} className="mv-danger-fill">
                    Remove it
                  </Button>
                  <Button variant="outline" onClick={() => setConfirm(false)} disabled={removing}>
                    Keep it
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mv-tools" role="group" aria-label="This memory">
                <Link className="mv-tool" to={`/write?edit=${memory.id}&photo=1`} aria-label={photos.length ? "Add a photograph" : "Add the first photograph"}>
                  <PhotoIcon aria-hidden="true" />
                  <span className="lg">{photos.length ? "Add a photograph" : "Add the first photograph"}</span>
                  <span className="sm" aria-hidden="true">
                    Photograph
                  </span>
                </Link>
                <Link className="mv-tool" to={`/write?edit=${memory.id}`} aria-label="Add to the words">
                  <PenIcon aria-hidden="true" />
                  <span className="lg">Add to the words</span>
                  <span className="sm" aria-hidden="true">
                    Add words
                  </span>
                </Link>
                <span className="mv-tools-gap" aria-hidden="true" />
                <ToolMenu
                  className="mv-more-btn"
                  label={<span aria-hidden="true">•••</span>}
                  ariaLabel="More"
                  align="end"
                  items={[
                    { key: "details", label: "When, chapter and who’s in it", icon: <CalendarIcon />, onSelect: () => navigate(editDetails) },
                    ...(!hasVoice && body.length > 0 && canSpeak() ? [{ key: "listen", label: listen ? "Stop listening" : "Listen", icon: <PlayIcon />, onSelect: () => setListen((v) => !v) }] : []),
                    { key: "remove", label: "Remove…", icon: <TrashIcon />, danger: true, onSelect: () => setConfirm(true) },
                  ]}
                />
              </div>
            )}

            {(plate || !spread) && family_}
            <PageTurn prev={prev} next={next} pos={at >= 0 ? `Memory ${at + 1} of ${byKept.length}` : undefined} />
          </div>

          {!plate && spread && <aside className="mv-margin">{family_}</aside>}
        </article>

        <WhereNext
          rows={[
            { to: "/family", title: "Ask the family", line: "Invite someone to add what they remember of it." },
            { to: "/write", title: own ? "Write the next memory" : `Write a memory for ${story.name}`, line: "A few lines is plenty; the date and chapter come after." },
            { to: "/book", title: "Open the book", line: "See this memory set on the printed page." },
          ]}
        />
      </div>
    </Shell>
  );
}
