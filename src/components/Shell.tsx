/**
 * The signed-in frame, the bookbinder's bench: the top of every page is
 * the book's cloth, in the brand's chocolate, carrying the lockup, the four
 * places, whose story this is, Add, and the page's own hero in cream. The
 * work happens on a sheet of ivory paper that rises over the cloth. On a
 * phone the places move to a floating tab bar at the bottom. The pointer
 * is a soft light over the cloth; each page arrives once (lib/arrive).
 */
import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { Lockup } from "./Brand";
import { Avatar } from "./ui";
import { ArchiveIcon, BookIcon, ChevronDown, ChevronLeft, CloseIcon, FamilyIcon, HomeIcon, MicIcon, PenIcon, PhotoIcon, PlusIcon } from "./icons";
import { usePhotoUrl } from "../lib/photoUrls";
import { storySubtitle } from "../app-core/lib/social.js";
import { storyLine } from "../lib/storyLine";
import { storyGroups } from "./family/familyView";
import { arrive } from "../lib/arrive";
import { useLight } from "./delight/Light";
import Leaf from "./delight/Leaf";
import { usePillThumb } from "../lib/pillThumb";
import LoadingMark from "./delight/LoadingMark";

const NAV = [
  { to: "/", label: "Home", Icon: HomeIcon, end: true },
  { to: "/archive", label: "Archive", Icon: ArchiveIcon },
  { to: "/family", label: "Family", Icon: FamilyIcon },
  { to: "/book", label: "Book", Icon: BookIcon },
];

function TellerButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  const { activeStory, stories } = useAccount();
  const photo = usePhotoUrl(activeStory?.photo);
  if (!activeStory) return null;
  const many = stories.length > 1;
  return (
    <button
      type="button"
      className={compact ? "teller-pick" : "teller"}
      onClick={many ? onClick : undefined}
      aria-haspopup={many ? "dialog" : undefined}
      aria-label={`Storyteller: ${storyLine(activeStory)}${many ? ". Change storyteller" : ""}`}
      style={many ? undefined : { cursor: "default" }}
    >
      {!compact && <Avatar src={photo} name={activeStory.name} size={28} />}
      <span>
        {!compact && <small>Storyteller</small>}
        <strong>{compact ? storyLine(activeStory) : `${activeStory.name} ${activeStory.lastName}`.trim()}</strong>
      </span>
      {many && <ChevronDown width={16} height={16} />}
    </button>
  );
}

/**
 * Pick whose story the four places are about. The stories sit under three
 * headings, never mixed (docs/PRD.md §3.3a): your own, the ones you keep
 * for someone who is not on A Story, and the ones you've joined (somebody
 * else's account; you add what you remember under your own name).
 */
function TellerSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { stories, activeStory, chooseStory } = useAccount();
  const navigate = useNavigate();
  const groups = storyGroups(stories, user?.id);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const go = (to: string) => {
    onClose();
    navigate(to);
  };
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheetbox whose" role="dialog" aria-modal="true" aria-label="Whose story" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <h2>Whose story?</h2>
          <button type="button" className="iconbtn soft" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        {groups.map((g) => (
          <section key={g.key} className="whose-group" aria-labelledby={`whose-${g.key}`}>
            <h3 id={`whose-${g.key}`}>{g.title}</h3>
            <p className="meta">{g.meaning}</p>
            <ul>
              {g.stories.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`person whose-story${s.id === activeStory?.id ? " current" : ""}`}
                    aria-current={s.id === activeStory?.id ? "true" : undefined}
                    onClick={async () => {
                      await chooseStory(s.id).catch(() => {});
                      onClose();
                    }}
                  >
                    <Avatar name={s.name} size={48} />
                    <span>
                      <strong>{`${s.name} ${s.lastName}`.trim()}</strong>
                      <span className="meta">
                        {g.key === "joined" ? "their story" : (storySubtitle(s) as string)} · {s.memories.length} {s.memories.length === 1 ? "memory" : "memories"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <div className="whose-acts">
          <button type="button" className="whose-act outline" onClick={() => go("/start?another=1")}>
            <strong>Keep someone else's story</strong>
            <span className="meta">for someone who isn't on A Story yet</span>
          </button>
          <button type="button" className="whose-act quiet" onClick={() => go("/start?another=1&join=1")}>
            <strong>Join someone's story</strong>
            <span className="meta">someone who already has an account; you add what you remember</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** The Add sheet: write, add a photograph, talk. */
function AddSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const go = (to: string) => {
    onClose();
    navigate(to);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheetbox" role="dialog" aria-modal="true" aria-label="Add a memory" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <h2>Add a memory</h2>
          <button type="button" className="iconbtn soft" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="addgrid">
          <button type="button" className="tile dark" onClick={() => go("/write")}>
            <PenIcon />
            Write it
          </button>
          <button type="button" className="tile light" onClick={() => go("/write?photo=1")}>
            <PhotoIcon />
            Add a photograph
          </button>
          <button type="button" className="tile light" onClick={() => go("/talk")}>
            <MicIcon />
            Talk about it
          </button>
        </div>
      </div>
    </div>
  );
}

type ShellProps = {
  children: ReactNode;
  /** What this page puts on the cloth: its title and whatever belongs beside it. Without one, the title alone. */
  hero?: ReactNode;
  title?: string;
  back?: string | true;
  /** A short cloth band (for writing, reading, settings) instead of the full hero. */
  compact?: boolean;
  /** The Book page wears the book's own teal cloth; everything else the brand's chocolate. */
  tone?: "teal";
};

export default function Shell({ children, hero, title, back, compact, tone }: ShellProps) {
  const { user } = useAuth();
  const [teller, setTeller] = useState(false);
  const [add, setAdd] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const cloth = useRef<HTMLDivElement>(null);
  const pills = useRef<HTMLElement>(null);
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email || "";
  // A page still on its way passes an empty placeholder marked aria-busy; the heart draws itself over it.
  const busy = isValidElement<{ "aria-busy"?: boolean | string }>(children) && !!children.props["aria-busy"];

  useLight(cloth);
  usePillThumb(pills, location.pathname);
  // once per page, and again when a page swaps its busy placeholder for its content (the hero or title changes)
  const ready = `${compact ? "c" : ""}${hero ? "h" : ""}${title ?? ""}`;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    return arrive(el);
  }, [location.pathname, ready]);

  return (
    <div className="shell" ref={root} key={location.pathname}>
      <div className={`cloth on-dark${compact ? " compact" : ""}${tone ? ` ${tone}` : ""}`} ref={cloth}>
        <span className="lamp" aria-hidden="true" />
        <Leaf ground={cloth} />
        <header className="top">
          <div className="top-in">
            <NavLink className="brand" to="/" aria-label="Home" viewTransition>
              <Lockup height={28} />
            </NavLink>
            <nav className="pillnav" aria-label="Main" ref={pills}>
              <span className="pill-thumb" aria-hidden="true" />
              {NAV.map(({ to, label, Icon, end }) => (
                <NavLink key={to} to={to} end={end} viewTransition>
                  <Icon />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="top-right">
              <TellerButton onClick={() => setTeller(true)} />
              <button type="button" className="btn add" onClick={() => setAdd(true)} aria-label="Add a memory">
                <PlusIcon />
                <span>Add</span>
              </button>
              <NavLink className="me" to="/account" aria-label="Account and settings" viewTransition>
                <Avatar src={user?.avatarUrl} name={name} size={32} />
              </NavLink>
            </div>
          </div>
        </header>
        <div className="hero">
          <div className="hero-in">
            {back && (
              <button type="button" className="back" aria-label="Back" onClick={() => (back === true ? navigate(-1) : navigate(back))}>
                <ChevronLeft />
              </button>
            )}
            {hero ?? (title ? <h1 className="hero-title">{title}</h1> : null)}
          </div>
        </div>
      </div>

      <main className="sheet-page" id="main">
        {children}
        {busy && <LoadingMark />}
      </main>

      <nav className="tabbar" aria-label="Main">
        <div className="tabs">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} viewTransition>
              <Icon />
              {label}
            </NavLink>
          ))}
        </div>
        <button type="button" className="fab" aria-label="Add a memory" onClick={() => setAdd(true)}>
          <PlusIcon />
        </button>
      </nav>

      {teller && <TellerSheet onClose={() => setTeller(false)} />}
      {add && <AddSheet key={location.pathname} onClose={() => setAdd(false)} />}
    </div>
  );
}

/** The compact switcher a page header uses on a phone. */
export function TellerPick() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TellerButton compact onClick={() => setOpen(true)} />
      {open && <TellerSheet onClose={() => setOpen(false)} />}
    </>
  );
}
