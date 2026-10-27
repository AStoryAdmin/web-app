/**
 * The family’s own code: one code for the whole family, not for one person,
 * that anybody can be given (the phone’s InviteScreen, familyCodeFor({
 * storyId })). Whoever types it joins the family tree and sees the story
 * straight away; ten people can use one code, and when it is near its end
 * the next visit makes a new one (family_code_for keeps a code only while it
 * has more than a week to run). Shown as the invite sheet shows a person’s
 * code: the code large, the link, a QR, and the ways to pass them on.
 *
 * A story not yet in a family tree is put in one first (householdFor), as
 * the phone’s storyFamilyCode does: the server refuses a code for a story
 * with no tree.
 */
import { useEffect, useState } from "react";
import type { Family } from "../../data/family";
import type { Account, Story } from "../../data/stories";
import { attachStory, familyCodeFor, householdFor } from "../../data/familyWrites";
import { CodeCard } from "./InviteSheet";
import { standingCode, untilLabel } from "./familyView";
import type { useMyCodes } from "./useMyCodes";

type Props = {
  story: Story;
  family: Family | null;
  account: Account | null;
  userId: string;
  senderName: string;
  /** The page’s own useMyCodes, so the card and the list of codes never disagree. */
  mine: ReturnType<typeof useMyCodes>;
};

export default function FamilyCodeCard({ story, family, account, userId, senderName, mine }: Props) {
  const standing = standingCode(mine.codes, story.id, mine.now);
  // the code made on this visit, until the list of codes has it too
  const [made, setMade] = useState<{ storyId: string; code: string } | null>(null);
  const [failed, setFailed] = useState<{ storyId: string; why: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Asked for only once the codes are known (or can’t be reached): a code already out is never made twice.
  const settled = mine.codes !== null || mine.failed;
  const need = settled && !standing && made?.storyId !== story.id && failed?.storyId !== story.id;

  useEffect(() => {
    if (!need) return;
    let live = true;
    (async () => {
      try {
        if (!story.householdId) await attachStory(story.id, await householdFor(userId, account, family));
        const r = await familyCodeFor({ storyId: story.id });
        if (!live) return;
        if ("code" in r) {
          setMade({ storyId: story.id, code: r.code });
          mine.reload();
        } else {
          setFailed({ storyId: story.id, why: r.error === "not_ready" ? "Codes aren’t switched on for this family yet." : "The family code couldn’t be made just now." });
        }
      } catch {
        if (live) setFailed({ storyId: story.id, why: "The family code couldn’t be made just now." });
      }
    })();
    return () => {
      live = false;
    };
    // asked again only for another story, or when "Try again" says so; the tree it reads is the one the page has
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [need, story.id, attempt]);

  const code = standing?.code || (made?.storyId === story.id ? made.code : null);
  const listed = code ? mine.codes?.find((c) => c.code === code) : null;
  const problem = failed?.storyId === story.id ? failed.why : null;

  return (
    <div className="fcode" aria-live="polite">
      <p className="fcode-lead">
        One code for the whole family. Whoever you give it to joins the family tree and sees {story.name}’s story straight away.
      </p>
      {code ? (
        <CodeCard code={code} who="the family" title="Your family’s code" story={story} senderName={senderName} until={listed ? untilLabel(listed.expiresAt, mine.now) : undefined} />
      ) : problem ? (
        <p className="fcode-note bad" role="alert">
          {problem}{" "}
          <button
            type="button"
            className="fp-retry"
            onClick={() => {
              setFailed(null);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </p>
      ) : (
        <p className="fcode-note" aria-busy="true">
          Getting the family’s code…
        </p>
      )}
    </div>
  );
}
