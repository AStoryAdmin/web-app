/**
 * /import: bringing in what's already written (gap row 50). Paste the words
 * or choose a file; look over what was found, with a box on each; keep the
 * ticked ones. Memories go into the story being kept; a family tree goes
 * into the family, with a story started for each person picked.
 *
 * The reading is the phone's (app-core importers, memoir, whatsapp,
 * gedcom), through data/imports.ts. Nothing is written until the button at
 * the foot of the review.
 */
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { Stop } from "../components/book/WhereNext";
import { Button, ButtonLink, Problem } from "../components/ui";
import Choose from "../components/import/Choose";
import ImportReview from "../components/import/ImportReview";
import TreeReview from "../components/import/TreeReview";
import { useAccount } from "../state/accountContext";
import { useAuth } from "../state/authContext";
import { householdFor } from "../data/familyWrites";
import {
  entriesToMemories,
  planTreeImport,
  readImportFile,
  readPaste,
  readText,
  saveImportedMemories,
  saveTreeImport,
  type ReadResult,
} from "../data/imports";
import { track } from "../lib/analytics";
import "../components/import/import.css";

type Done = { kind: "memories"; count: number } | { kind: "tree"; people: number; started: string[] };

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

export default function Import() {
  const { user } = useAuth();
  const { account, stories, activeStory, family, reload } = useAccount();
  // memories go into a story this account keeps: the chosen one, unless it is only read
  const story = activeStory && !activeStory.readOnly ? activeStory : (stories.find((s) => !s.readOnly) ?? null);

  const [read, setRead] = useState<ReadResult | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    document.title = "Bring in what’s written · A Story";
  }, []);

  if (account === undefined) {
    return (
      <Shell compact back="/archive" title="Bring in">
        <div className="page im-page" aria-busy="true">
          <LoadingMark />
        </div>
      </Shell>
    );
  }
  if (!story) return <Navigate to="/start" replace />;

  const show = (r: ReadResult) => {
    if (r.kind === "nothing") {
      setProblem(r.message);
      return;
    }
    setProblem(null);
    setChosen(new Set(r.kind === "senders" ? r.chosen : []));
    setRead(r);
    window.scrollTo({ top: 0 });
  };

  const fromFile = async (file: File, asMemoir: boolean) => {
    setBusy(true);
    setProblem(null);
    try {
      show(await readImportFile(file, story, { asMemoir }));
    } catch (err) {
      console.warn("import read:", (err as Error)?.message || err);
      setProblem("We couldn’t read that file. A Word, text or export file works best.");
    } finally {
      setBusy(false);
    }
  };

  const startAgain = () => {
    setRead(null);
    setChosen(new Set());
    setProblem(null);
    setDone(null);
  };

  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const keepMemories = async () => {
    if (read?.kind !== "memories") return;
    // made[i] is the i-th ticked entry
    const ticked = read.entries.filter((e) => e.include);
    const made = entriesToMemories(read.entries);
    if (!made.length) return;
    const kept = new Set<string>();
    setBusy(true);
    setProblem(null);
    try {
      await saveImportedMemories(made, story.id, (n, m) => {
        kept.add(ticked[made.indexOf(m)].id);
        setProgress(`Keeping ${n} of ${made.length}`);
      });
      if (read.format === "whatsapp") track("whatsapp_imported", { memories: made.length, voice: 0 });
      await reload();
      setDone({ kind: "memories", count: made.length });
      setRead(null);
    } catch (err) {
      // the ones already written stay, marked as in the archive, so trying again keeps only the rest
      console.warn("import save:", (err as Error)?.message || err);
      setRead({ ...read, entries: read.entries.map((e) => (kept.has(e.id) ? { ...e, include: false, duplicate: true } : e)) });
      setProblem(
        kept.size
          ? `${kept.size} of ${made.length} were kept. Check your connection and try again: the rest are still ticked.`
          : "None of them were kept. Check your connection and try again.",
      );
      await reload();
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const keepTree = async () => {
    if (read?.kind !== "tree" || !user) return;
    setBusy(true);
    setProblem(null);
    try {
      const plan = planTreeImport(family, read.tree, { story, chosen: [...chosen] });
      // the family of the story being brought into, not the chosen story's when that one is only read
      const householdId = story.householdId || (await householdFor(user.id, account, family));
      const started = await saveTreeImport(plan, { userId: user.id, householdId, story }, (n, total) => setProgress(`Adding the family: ${n} of ${total}`));
      await reload();
      setDone({ kind: "tree", people: read.tree.people.length, started: started.map((s) => firstName(s.name)) });
      setRead(null);
    } catch (err) {
      console.warn("family import:", (err as Error)?.message || err);
      setProblem("The tree wasn’t added. Check your connection and try again: nobody already added will be added twice.");
      await reload();
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const who = firstName(story.name);

  return (
    <Shell
      compact
      back="/archive"
      title="Bring in"
      hero={
        <div className="im-hero">
          <h1 className="hero-title">
            Bring in what’s already written
            <Stop />
          </h1>
          <p className="im-hero-sub">{story.relationship === "Myself" ? "Into your own story." : `Into ${who}’s story.`}</p>
        </div>
      }
    >
      <div className="page im-page">
        {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}

        {done ? (
          <section className="im-done" role="status">
            {done.kind === "memories" ? (
              <>
                <h2>
                  {done.count === 1 ? "One memory is" : `${done.count} memories are`} in {story.relationship === "Myself" ? "your" : `${who}’s`} story.
                </h2>
                <p className="im-lead">Open any of them to add a photograph, fix a year or move it to another chapter.</p>
                <div className="im-acts">
                  <ButtonLink to="/archive">See them</ButtonLink>
                  <Button variant="quiet" onClick={startAgain}>
                    Bring in more
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2>The family is in.</h2>
                <p className="im-lead">
                  {done.people === 1 ? "One person" : `${done.people} people`} from the tree joined your family
                  {done.started.length === 1
                    ? `, and ${done.started[0]}’s story has started.`
                    : done.started.length
                      ? `, and stories for ${listNames(done.started)} have started.`
                      : "."}
                </p>
                <div className="im-acts">
                  <ButtonLink to="/family">See the family</ButtonLink>
                  <Button variant="quiet" onClick={startAgain}>
                    Bring in more
                  </Button>
                </div>
              </>
            )}
          </section>
        ) : read?.kind === "memories" ? (
          <ImportReview
            entries={read.entries}
            sourceName={read.sourceName}
            truncated={read.truncated}
            memoir={read.format === "memoir"}
            busy={busy}
            progress={progress}
            onChange={(entries) => setRead({ ...read, entries })}
            onKeep={keepMemories}
            onBack={startAgain}
          />
        ) : read?.kind === "tree" ? (
          <TreeReview
            tree={read.tree}
            sourceName={read.sourceName}
            story={story}
            chosen={chosen}
            busy={busy}
            progress={progress}
            onToggle={toggle}
            onKeep={keepTree}
            onBack={startAgain}
          />
        ) : read?.kind === "senders" ? (
          <section className="im-review" aria-labelledby="im-senders-title">
            <header className="im-review-head">
              <h2 id="im-senders-title">Whose messages are the memories?</h2>
              <p className="im-lead">This chat has {read.senders.length} people in it. Each day becomes one memory, from the people you tick.</p>
            </header>
            <ul className="im-list">
              {read.senders.map((s) => (
                <li key={s.name}>
                  <label className="im-person" data-on={chosen.has(s.name) || undefined}>
                    <input type="checkbox" checked={chosen.has(s.name)} onChange={() => toggle(s.name)} />
                    <span className="im-entry-text">
                      <span className="im-entry-title">{s.name}</span>
                      <span className="im-entry-meta">
                        {s.count} {s.count === 1 ? "message" : "messages"}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <footer className="im-foot">
              <div className="im-acts">
                <Button onClick={() => show(readText(read.text, read.fileName, story, [...chosen]))} disabled={!chosen.size}>
                  Continue
                </Button>
                <Button variant="quiet" onClick={startAgain}>
                  Choose something else
                </Button>
              </div>
            </footer>
          </section>
        ) : (
          <>
            <Choose busy={busy} onPaste={(text) => show(readPaste(text, story))} onFile={fromFile} />
            <p className="im-help im-elsewhere">
              Photographs, recordings and Facebook or Instagram archives with their pictures come in from the phone app. Or <Link to="/write">write a memory</Link> here.
            </p>
          </>
        )}
      </div>
    </Shell>
  );
}

/** "Linh", "Linh and Bao", "Linh, Bao and Mai". */
function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
