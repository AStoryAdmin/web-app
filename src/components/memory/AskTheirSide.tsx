/**
 * "Ask someone to add their side" (phone screens/memory/AskSheet.js, the
 * link half; FB-322): one memory's own link, for anybody who was there. It
 * opens that memory and nothing else, and what they add comes to a keeper
 * first. The asker sends it themselves (a text, an email, a printed QR):
 * the page makes the link, shows it, draws its QR and copies it, or copies
 * a short message with it in the asker's own voice. Nothing is sent from
 * here.
 *
 * A name is optional. When it is somebody in the tree, the link is kept as
 * theirs (memory_link_create p_person), so the memory can say who was
 * asked; the names are offered as the field's suggestions.
 */
import { useId, useMemo, useState } from "react";
import { Button, Field } from "../ui";
import { CheckIcon, LinkIcon, PeopleIcon } from "../icons";
import QrCode from "../QrCode";
import { askablePeople, linkProblem, memoryLinkFor, memoryLinkMessage, personForName } from "../../data/memoryLinks";
import type { Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";
import "./AskTheirSide.css";

type Me = { id?: string | null; firstName?: string | null; email?: string | null } | null | undefined;
type Made = { link: string; message: string; forName: string };

export default function AskTheirSide({ story, memory, people, me }: { story: Story; memory: Memory; people: Person[] | null | undefined; me: Me }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [made, setMade] = useState<Made | null>(null);
  const [copied, setCopied] = useState<"link" | "message" | "fail" | null>(null);
  const listId = useId();
  const panelId = useId();

  const own = story.relationship === "Myself";
  const title = String(memory.title || "").trim();
  const askable = useMemo(
    () => askablePeople(people, { householdId: story.householdId, tellerStoryId: story.id, meId: me?.id ?? null, meEmail: me?.email ?? "" }),
    [people, story.householdId, story.id, me?.id, me?.email],
  );

  const make = async () => {
    if (busy) return;
    setBusy(true);
    setProblem("");
    // a name that is somebody in the tree is theirs, spelled as the tree spells it
    const person = personForName(askable, name);
    const forName = person?.name ?? name.trim();
    const r = await memoryLinkFor({ memoryId: memory.id, forName, personId: person?.id ?? null });
    setBusy(false);
    if ("error" in r) {
      setProblem(linkProblem(r.error));
      return;
    }
    setMade({
      link: r.link,
      forName,
      message: memoryLinkMessage({ link: r.link, title, tellerName: story.name, senderName: me?.firstName || "", toName: forName, senderIsTeller: own }),
    });
  };

  const copy = async (what: "link" | "message") => {
    if (!made) return;
    try {
      await navigator.clipboard.writeText(what === "link" ? made.link : made.message);
      setCopied(what);
    } catch {
      setCopied("fail");
    }
    window.setTimeout(() => setCopied(null), 3000);
  };

  const again = () => {
    setMade(null);
    setName("");
    setCopied(null);
  };

  const who = made?.forName ? made.forName.split(/\s+/)[0] : "";

  if (!open)
    return (
      <div className="ats ats-closed">
        <button type="button" className="ats-open" onClick={() => setOpen(true)} aria-expanded={false}>
          <PeopleIcon aria-hidden="true" />
          <span>Ask someone to add their side</span>
        </button>
      </div>
    );

  return (
    <section className="ats" id={panelId} aria-labelledby={`${panelId}-h`}>
      <p className="ats-kick">Ask about this memory</p>
      <h2 id={`${panelId}-h`} className="ats-head">
        Who else was there?
      </h2>
      <p className="ats-line">
        They add what they remember of {title ? `“${title}”` : "it"}, written or in their own voice. {own ? "It comes to you first." : "It comes to the family’s keeper first."}
      </p>

      {made ? (
        <div className="ats-made">
          <div className="ats-qr">
            <QrCode value={made.link} label={`A QR code for the link to “${title || "this memory"}”`} size={148} />
          </div>
          <div className="ats-side">
            <p className="ats-for">{who ? `The link for ${who}. It opens this memory and nothing else.` : "A link to this memory, for anyone who was there. It opens this memory and nothing else."}</p>
            <p className="ats-link">
              <a href={made.link} target="_blank" rel="noreferrer">
                {made.link.replace(/^https?:\/\//, "")}
              </a>
            </p>
            <div className="ats-acts">
              <Button onClick={() => copy("link")} icon={copied === "link" ? <CheckIcon aria-hidden="true" /> : <LinkIcon aria-hidden="true" />}>
                {copied === "link" ? "Copied" : "Copy the link"}
              </Button>
              <Button variant="outline" onClick={() => copy("message")} icon={copied === "message" ? <CheckIcon aria-hidden="true" /> : undefined}>
                {copied === "message" ? "Copied" : "Copy a message with it"}
              </Button>
            </div>
            <p className="ats-note" role="status">
              {copied === "fail"
                ? "That didn’t copy. Select the link above and copy it from there."
                : copied === "message"
                  ? "Paste it into a text or an email, and send it yourself."
                  : "Send it yourself, by text or email, or let them scan the code."}
            </p>
            <button type="button" className="ats-again" onClick={again}>
              Ask someone else
            </button>
          </div>
        </div>
      ) : (
        <form
          className="ats-form"
          onSubmit={(e) => {
            e.preventDefault();
            void make();
          }}
        >
          <Field
            label="Who is it for? (you can leave this blank)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            list={askable.length ? listId : undefined}
            autoComplete="off"
            autoFocus
            maxLength={120}
            placeholder="A cousin, a neighbour, an old friend"
            error={problem || null}
          />
          {askable.length > 0 && (
            <datalist id={listId}>
              {askable.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          )}
          <div className="ats-acts">
            <Button type="submit" loading={busy}>
              Make the link
            </Button>
            <Button variant="quiet" onClick={() => setOpen(false)} disabled={busy}>
              Not now
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
