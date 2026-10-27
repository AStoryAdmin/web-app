/**
 * Designing the book (/book/design): the phone's BookDesignScreen and
 * BookContents on one sheet. The cover's style and colour, its title and
 * line, the dedication, the paper, the order of the chapters and which
 * memories go in. Every choice starts on A Story's pick, so a family that
 * changes nothing still has a finished book; the cover in the rail changes
 * as a choice is made.
 *
 * Saved on the story (stories.book_design, data/bookDesign.ts) with Save, and
 * on the way out if it wasn't, so everyone who keeps the story prints the
 * same book and the phone reads back the same design. The Book page's
 * preview and its print-at-home PDF are built from it.
 *
 * Telling the book as a life story (the phone's "How it reads", retold by
 * A Story's server) is not offered here yet: each retelling costs, and that
 * is the founder's call. A design retold on the phone keeps its retelling.
 */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Navigate, useBlocker } from "react-router-dom";
import Shell from "../components/Shell";
import BookObject from "../components/BookObject";
import LoadingMark from "../components/delight/LoadingMark";
import { Button, ButtonLink, Field, Problem } from "../components/ui";
import CoverSwatches from "../components/book/CoverSwatches";
import WhereNext, { Stop } from "../components/book/WhereNext";
import { buildBook } from "../components/book/bookPages";
import ChoiceCards from "../components/book/design/ChoiceCards";
import ChapterList from "../components/book/design/ChapterList";
import { CoverSpecimen, PaperSpecimen } from "../components/book/design/Specimens";
import { tellerOf } from "../components/record/keep";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { bookStructure } from "../app-core/lib/legacyBook.js";
import {
  COVER_STYLES,
  DEDICATION_MAX,
  DEFAULT_SUBTITLE,
  KEEPSAKE_TITLE,
  PAPERS,
  SUBTITLE_MAX,
  TITLE_MAX,
  coverPhoto,
  coverPhotoChoices,
  keepsakeWords,
} from "../app-core/lib/bookDesign.js";
import {
  cleanDesign,
  designChapters,
  designOf,
  designOver,
  moveChapter,
  ordersByChapter,
  patchCover,
  pressMemory,
  sameDesign,
  withDesign,
  type BookCover,
  type BookDesign as Design,
} from "../data/bookDesign";
import type { Story } from "../data/stories";
import "../components/book/design/bookDesign.css";

type Option = { key: string; name: string; note: string; needsPhoto?: boolean };

export default function BookDesign() {
  const { account, activeStory: story, loadError, reload } = useAccount();

  if (account === undefined)
    return (
      <Shell compact tone="teal" back="/book">
        <div className="page bd-page" aria-busy="true">
          <LoadingMark />
        </div>
      </Shell>
    );
  if (account === null && loadError)
    return (
      <Shell compact tone="teal" back="/book" title="Design the book">
        <div className="page">
          <Problem message={loadError} onRetry={reload} />
        </div>
      </Shell>
    );
  if (!story) return <Navigate to="/start" replace />;
  // a story read as family is theirs to design, not this account's
  if (story.readOnly) return <Navigate to="/book" replace />;
  return <Designer key={story.id} story={story} />;
}

function Designer({ story }: { story: Story }) {
  const { user } = useAuth();
  const { family, updateStory } = useAccount();
  const [draft, setDraft] = useState<Design>(() => designOf(story));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const dirty = !sameDesign(draft, designOf(story));
  const name = story.name.trim().split(/\s+/)[0] || "";
  const asStoryteller = tellerOf(story, user ?? null, family?.people ?? []).isStoryteller;

  // the cover and the words it would print with nothing typed, as placeholders
  const shape = useMemo(() => bookStructure(story) as unknown as Record<string, unknown>, [story]);
  const blank = keepsakeWords(patchCover(draft, { title: "", subtitle: "" }), shape, story) as { title: string; line: string; name: string };
  // the preview follows the typing a beat behind, so a long book never slows a keystroke
  const shown = useDeferredValue(draft);
  const preview = useMemo(() => buildBook({ ...story, bookDesign: cleanDesign(shown) }), [story, shown]);
  const chapters = useMemo(() => designChapters(story, draft), [story, draft]);
  const inBook = preview.memories;
  const kept = chapters.reduce((n, c) => n + c.items.length, 0);

  const keepsake = draft.cover.style === "keepsake";
  const setCover = (patch: Partial<BookCover>) => {
    setSaved(false);
    setDraft((d) => patchCover(d, patch));
  };
  const set = (patch: Partial<Design>) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };
  // A photo style takes the story's first photograph until one is chosen on the phone, as the phone does.
  const chooseStyle = (key: string) => {
    const style = (COVER_STYLES as Option[]).find((c) => c.key === key);
    const first = (coverPhotoChoices(story) as string[])[0] || null;
    setCover({ style: key, photo: style?.needsPhoto && !draft.cover.photo ? first : draft.cover.photo });
  };

  const save = async (): Promise<boolean> => {
    setProblem(null);
    setSaving(true);
    try {
      // only this page's choices, over the design as saved now (the listening key may have landed since);
      // the draft keeps what was typed, so words typed while saving are left alone
      await updateStory(withDesign(story, designOver(designOf(story), draft)));
      setSaved(true);
      return true;
    } catch (err) {
      setProblem((err as Error).message || "The design wasn’t saved. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Leaving with changes saves them first (the phone saves on the way back); if that fails, the page stays.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    let live = true;
    // the save runs as the navigation's callback, not in the effect's own render pass
    Promise.resolve()
      .then(save)
      .then((ok) => {
        if (!live) return;
        if (ok) blocker.proceed();
        else blocker.reset();
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per blocked navigation
  }, [blocker.state]);
  useEffect(() => {
    if (!dirty) return;
    const hold = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", hold);
    return () => window.removeEventListener("beforeunload", hold);
  }, [dirty]);

  const words = { title: draft.cover.title.trim() || (keepsake ? blank.title : preview.fullName), line: draft.cover.subtitle.trim() || (keepsake ? blank.line : DEFAULT_SUBTITLE), name: preview.fullName };
  const status = saving ? "Saving…" : dirty ? "Not saved yet." : saved ? "Saved. The book and its PDF follow it." : "Everyone who keeps the book sees this design.";

  return (
    <Shell
      compact
      wide
      tone="teal"
      back="/book"
      hero={
        <div className="bd-hero">
          <h1 className="hero-title">
            Design the book
            <Stop />
          </h1>
          <p className="bd-promise" data-rise>
            Every choice starts on ours. Change any you like.
          </p>
        </div>
      }
    >
      <div className="page bd-page">
        <aside className="bd-rail" aria-label="The book as it will print">
          <div className="bd-rail-cover">
            {keepsake ? <BookObject book={preview} width="100%" /> : <CoverSpecimen style={draft.cover.style} color={draft.cover.color} words={words} photo={coverPhoto(draft) as string | null} />}
          </div>
          <p className="bd-rail-count">
            {inBook === kept ? `${inBook} ${inBook === 1 ? "memory" : "memories"}` : `${inBook} of ${kept} memories`} · {preview.chapters} {preview.chapters === 1 ? "chapter" : "chapters"}
          </p>
          <div className="bd-save">
            <Button block onClick={() => void save()} loading={saving} disabled={!dirty}>
              Save the design
            </Button>
            <p className="bd-status" role="status">
              {status}
            </p>
          </div>
        </aside>

        <div className="bd-main">
          {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}

          <section className="bd-section" aria-labelledby="bd-cover-h">
            <h2 id="bd-cover-h">The cover</h2>
            <ChoiceCards
              name="cover-style"
              label="Cover style"
              value={draft.cover.style}
              pick="keepsake"
              onChange={chooseStyle}
              options={(COVER_STYLES as Option[]).map((c) => ({
                key: c.key,
                name: c.key === "keepsake" ? "Our cover" : c.name,
                // the keepsake is named "Our cover" here already, so its note starts at what it carries
                note: c.key === "keepsake" ? c.note.replace(/^Our cover:\s*/, "").replace(/^./, (ch) => ch.toUpperCase()) : c.note,
                specimen: <CoverSpecimen style={c.key} color={draft.cover.color} />,
              }))}
            />
            {keepsake && (
              <div className="bd-colours">
                <CoverSwatches value={draft.cover.color} onChange={(color) => setCover({ color })} />
              </div>
            )}
          </section>

          <section className="bd-section" aria-labelledby="bd-words-h">
            <h2 id="bd-words-h">Title and line</h2>
            <div className="bd-fields">
              <Field
                label="Title"
                value={draft.cover.title}
                placeholder={keepsake ? blank.title : preview.fullName}
                maxLength={TITLE_MAX}
                onChange={(e) => setCover({ title: e.target.value })}
              />
              <Field
                label={keepsake ? "The line under it" : "Subtitle"}
                value={draft.cover.subtitle}
                placeholder={keepsake ? blank.line : DEFAULT_SUBTITLE}
                maxLength={SUBTITLE_MAX}
                onChange={(e) => setCover({ subtitle: e.target.value })}
              />
            </div>
            <p className="bd-note">
              Leave either empty and the book uses the words shown.
              {/* the template's own phrase, one press away (the phone's K-11) */}
              {keepsake && draft.cover.title !== KEEPSAKE_TITLE && (
                <>
                  {" "}
                  <button type="button" className="bd-use" onClick={() => setCover({ title: KEEPSAKE_TITLE })}>
                    Use “{KEEPSAKE_TITLE}”
                  </button>
                </>
              )}
            </p>
          </section>

          <section className="bd-section" aria-labelledby="bd-ded-h">
            <h2 id="bd-ded-h">Dedication</h2>
            <label className="bd-dedication">
              <span className="sr-only">Dedication</span>
              <textarea
                value={draft.dedication}
                placeholder="For Jamie, who asked the first question."
                maxLength={DEDICATION_MAX}
                rows={3}
                aria-describedby="bd-ded-note"
                onChange={(e) => set({ dedication: e.target.value })}
              />
            </label>
            <p className="bd-note" id="bd-ded-note">
              {draft.dedication.trim() ? "It has a page of its own, after the title page." : "If you like, a line or two on a page of its own, after the title page."}
            </p>
          </section>

          <section className="bd-section" aria-labelledby="bd-paper-h">
            <h2 id="bd-paper-h">Paper</h2>
            <ChoiceCards
              name="paper"
              label="Paper"
              value={draft.paper}
              pick="classic"
              onChange={(paper) => set({ paper })}
              options={(PAPERS as Option[]).map((p) => ({ key: p.key, name: p.name, note: p.note, specimen: <PaperSpecimen paper={p.key} /> }))}
            />
          </section>

          <section className="bd-section" aria-labelledby="bd-ch-h">
            <h2 id="bd-ch-h">Chapters and memories</h2>
            {chapters.length ? (
              <>
                <p className="bd-note">
                  {asStoryteller
                    ? "Everything you keep goes in, but the private ones. Open a chapter to keep a memory out; only you can put it back."
                    : `Every kept memory goes in, but the private ones until you put them in.${name ? ` What ${name} keeps out stays out.` : ""}`}
                  {ordersByChapter(draft) ? " Move a chapter up or down to change the order." : " This book is set by year, so its parts follow the calendar."}
                </p>
                <ChapterList
                  chapters={chapters}
                  design={draft}
                  asStoryteller={asStoryteller}
                  tellerName={name}
                  canReorder={ordersByChapter(draft)}
                  onMove={(era, step) => {
                    setSaved(false);
                    setDraft((d) => moveChapter(d, chapters.map((c) => c.era), era, step));
                  }}
                  onPress={(m) => {
                    setSaved(false);
                    setDraft((d) => pressMemory(d, m, asStoryteller));
                  }}
                />
              </>
            ) : (
              <div className="bd-empty">
                <p className="bd-note">When there are memories, each chapter is here to put in order, with every memory to put in or keep out.</p>
                <ButtonLink to="/write" variant="outline">
                  Write the first memory
                </ButtonLink>
              </div>
            )}
          </section>
        </div>

        {/* on a narrow window the rail scrolls away: Save is held at the foot while something is unsaved (the phone's dock) */}
        {dirty && (
          <div className="bd-dock">
            <Button block onClick={() => void save()} loading={saving}>
              Save the design
            </Button>
          </div>
        )}

        <WhereNext
          rows={[
            { to: "/book", title: "Open the book", line: "Turn the pages as they will print, or print them at home." },
            { to: "/archive", title: "Read it as an archive", line: "Every memory by year, with the photographs." },
            { to: "/family", title: "Ask the family in", line: "What they add prints under their own names." },
          ]}
        />
      </div>
    </Shell>
  );
}
