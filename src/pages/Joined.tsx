/**
 * /joined — where a relative lands once a family code has joined them (the
 * phone's "You're in, Linh", JoinFamilyScreen.js, and the guide's light
 * first run, FirstRunGuideScreen.js). One light page, never a walkthrough:
 * on the cloth, whose family it is, their own name and who invited them;
 * on the sheet, the family's newest memory, set to be read, and three
 * things to do next (answer today's question, add what you remember, see
 * the family). Nothing counts down and nothing celebrates; the family's
 * own words are the welcome.
 *
 * Join.tsx comes here with join_family's answer in the router state
 * (familyLink.ts holdJoined); a reload reads this tab's copy, and with
 * neither the page still stands on the account's own stories.
 */
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Shell from "../components/Shell";
import MemoryCard from "../components/MemoryCard";
import WhereNext, { Stop } from "../components/book/WhereNext";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { joinedWords, readJoined } from "../data/familyLink";
import { latestKept } from "../app-core/lib/firstRunGuide.js";
import type { Memory, Story } from "../data/stories";

const firstOf = (s: string | null | undefined) => String(s || "").trim().split(/\s+/)[0] || "";

export default function Joined() {
  const { user } = useAuth();
  const { account, stories, activeStory } = useAccount();
  const state = useLocation().state;
  // read once: the router's state, else this tab's copy
  const [welcome] = useState(() => readJoined(state));

  if (account === null) return <Navigate to="/" replace />;
  if (account === undefined) {
    return (
      <Shell compact title="Welcome">
        <div className="page" aria-busy="true" />
      </Shell>
    );
  }

  const story: Story | null = stories.find((s) => s.id === welcome?.storyId) || activeStory || null;
  const memory = (story ? latestKept(story) : null) as Memory | null;
  // the join's own name for the storyteller first: on a code for the joiner's own place it names whoever started the tree
  const teller = welcome?.storyName || (story ? `${story.name} ${story.lastName}`.trim() : "");
  const first = firstOf(teller);
  const keeper = firstOf(welcome?.inviterName);
  const words = joinedWords({ welcome, firstName: user?.firstName, teller });

  return (
    <Shell
      compact
      title="Welcome"
      hero={
        <div>
          <p className="label" data-rise>
            {words.kicker}
          </p>
          <h1 className="hero-title">
            {words.title}
            <Stop />
          </h1>
          <p className="meta" data-rise>
            {words.line}
          </p>
        </div>
      }
    >
      <div className="page">
        {story && memory ? (
          <section aria-labelledby="joined-latest" data-rise>
            <h2 id="joined-latest" className="sec-title">{first ? `${first}’s latest` : "The family’s latest"}</h2>
            <MemoryCard memory={memory} story={story} />
          </section>
        ) : (
          <section className="card empty" data-rise>
            <h2>Nothing shared with you yet</h2>
            <p>{keeper ? `When ${keeper} shares a memory, it is on your Home.` : "When the family shares a memory, it is on your Home."} You can add what you remember now.</p>
          </section>
        )}

        <WhereNext
          label="Three things to do next"
          rows={[
            { to: "/", title: "Answer today’s question", line: first ? `One small question a day about ${first}, on your Home.` : "One small question a day, on your Home." },
            memory
              ? { to: `/archive/${memory.id}`, title: "Add what you remember", line: `Under ${first ? `${first}’s` : "the"} latest, in your own name. It joins the book when they keep it.` }
              : { to: "/family", title: "Add what you remember", line: "Open anyone in the family and add what you remember, in your own name." },
            { to: "/family", title: "See the family", line: "Everyone in the family tree, and where you are in it." },
          ]}
        />
      </div>
    </Shell>
  );
}
