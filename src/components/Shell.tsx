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
import { scrollShell } from "../lib/scrollShell";
import { useTransitionLinks } from "../lib/pageTransition";
import { useKeyLayer } from "../lib/keys";
import { useLight } from "./delight/Light";
import Leaf from "./delight/Leaf";
import { usePillThumb } from "../lib/pillThumb";
import LoadingMark from "./delight/LoadingMark";
import { atmosphere } from "../lib/atmosphere";

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
      {!compact && <Avatar src={photo} name={`${activeStory.name} ${activeStory.lastName || ""}`.trim()} size={32} />}
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
            <strong>Keep someone else’s story</strong>
            <span className="meta">for someone who isn’t on A Story yet</span>
          </button>
          <button type="button" className="whose-act quiet" onClick={() => go("/start?another=1&join=1")}>
            <strong>Join someone’s story</strong>
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

/** A stable opener for the key layer (one function per setter, so the listener isn't re-bound every render). */
const openers = new WeakMap<(v: boolean) => void, () => void>();
function openKeys(set: (v: boolean) => void): () => void {
  let f = openers.get(set);
  if (!f) {
    f = () => set(true);
    openers.set(set, f);
  }
  return f;
}

const SHORTCUTS: [string[], string][] = [
  [["W"], "Write a memory"],
  [["/"], "Search the memories"],
  [["←", "→"], "Turn the book’s pages, or move between a memory’s photographs"],
  [["Esc"], "Close what is open, or leave focus mode while writing"],
  [["?"], "This list"],
];

/** The keyboard shortcuts, taught once (Bao's Standard rule 43). Opened with ? or the quiet line at the foot of the sheet. */
function KeysSheet({ onClose }: { onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      back?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheetbox keys-sheet" role="dialog" aria-modal="true" aria-labelledby="keys-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <h2 id="keys-title">Shortcuts</h2>
          <button ref={close} type="button" className="iconbtn soft" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <dl className="keys-list">
          {SHORTCUTS.map(([keys, what]) => (
            <div key={what}>
              <dt>
                {keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
        <p className="keys-note">They work whenever you are not typing in a field.</p>
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
  /** No hero at all: only a strip of cloth under the bar, so the sheet starts near the top and the page has the whole screen. The page puts its own title on the sheet. */
  bare?: boolean;
  /** The sheet's column takes the full width of the window (with a gutter), for pages laid out in several columns. */
  wide?: boolean;
  /** The Book page wears the book's own teal cloth; everything else the brand's chocolate. */
  tone?: "teal";
  /** The running head's book name, when the page shows some other book than the active story's (a sample family). */
  book?: string;
};

export default function Shell({ children, hero, title, back, compact, bare, wide, tone, book }: ShellProps) {
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
  // The sheet is a page of the printed book (CSS §39): a running head (the story's name, the page's name) and a
  // folio. The writer's leaf carries its own, so /write goes without.
  const { activeStory: headStory } = useAccount();
  const path = location.pathname;
  const place = NAV.find((n) => (n.end ? path === n.to : path.startsWith(n.to)))?.label;
  const pageName = title ?? (path.startsWith("/account") ? "Account" : path.startsWith("/plans") ? "Plans" : path.startsWith("/talk") ? "Talk" : place ?? "");
  const bookName = book ?? (headStory ? (headStory.lastName ? `The ${headStory.lastName} book` : `${headStory.name}’s book`) : "A Story");
  // the running head is part of the page's frame: it stands over the loading skeleton too (its words held back until the
  // story is known), so the page never drops when it arrives
  const runningHead = !path.startsWith("/write") && pageName !== "";
  // Each page has its own paper (docs/research/decoration-2026.md D13): laid for the day's pages, linen for the family,
  // a smooth plate for reading and the book, bond for the account and the writer.
  const paper = path === "/" || path === "/archive" ? "laid" : path.startsWith("/family") ? "linen" : path.startsWith("/archive/") || path.startsWith("/book") ? "plate" : "bond";
  // The light on the cloth is the light of the hour (D14): morning from the left, evening from the right, night only the lamp.
  const [hour] = useState(() => {
    const h = new Date().getHours();
    return h >= 5 && h <= 10 ? "morning" : h <= 16 && h > 10 ? "day" : h <= 20 && h > 16 ? "evening" : "night";
  });

  useLight(cloth);
  usePillThumb(pills, location.pathname);
  useTransitionLinks(navigate);
  const [keysOpen, setKeysOpen] = useState(false);
  useKeyLayer(navigate, openKeys(setKeysOpen));
  // once per page, and again when a page swaps its busy placeholder for its content (the hero or title changes)
  const ready = `${compact ? "c" : ""}${hero ? "h" : ""}${title ?? ""}`;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const settle = arrive(el);
    // the bar follows, the sheet slides up over the cloth (lib/scrollShell, CSS section 50)
    const scroll = scrollShell(el);
    // the sheet answers the scroll: the ribbon, the running head's section, the prints (lib/atmosphere, CSS §46)
    const air = atmosphere(el);
    return () => {
      air();
      scroll();
      settle();
    };
  }, [location.pathname, ready]);

  return (
    <div className="shell" ref={root} key={location.pathname}>
      {/* the bar sits above the whole page, outside the cloth's layer, so the sheet never covers it */}
      <header className={`top on-dark${tone ? ` ${tone}` : ""}`}>
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
      <div className={`cloth on-dark${compact ? " compact" : ""}${bare ? " bare" : ""}${tone ? ` ${tone}` : ""}`} ref={cloth} data-hour={hour}>
        <span className="window" aria-hidden="true" />
        <span className="lamp" aria-hidden="true" />
        {/* the cover is tooled: a pressed double fillet, and on a full hero the mark blind-debossed (D6) */}
        <span className="tool" aria-hidden="true" />
        {!compact && !bare && (
          <span className="deboss" aria-hidden="true">
            <i />
          </span>
        )}
        <Leaf page />
        <div className="hero">
          {/* keyed by what the page shows: the title splitter (lib/arrive) rewrites the h1, so a changed hero is a fresh node, never React writing into split lines */}
          <div className="hero-in" key={ready}>
            {back && (
              <button type="button" className="back" aria-label="Back" onClick={() => (back === true ? navigate(-1) : navigate(back))}>
                <ChevronLeft />
              </button>
            )}
            {hero ?? (title ? <h1 className="hero-title">{title}</h1> : null)}
          </div>
        </div>
      </div>

      <main className={`sheet-page${wide ? " wide" : ""}`} id="main" data-paper={paper}>
        {/* the book block's silk headband, where the sheet meets the cloth (D3) */}
        <span className="headband" aria-hidden="true" />
        {runningHead && (
          <p className="running-head-sheet" aria-hidden="true">
            <span style={busy ? { visibility: "hidden" } : undefined}>{bookName}</span>
            <span className="rh-right">
              <span className="rh-page">{pageName}</span>
              <span className="rh-sec" />
            </span>
            {/* the ribbon bookmark, in the cloth's colour, hanging in the outer margin; it lengthens a little as the page is read */}
            <span className="rh-ribbon">
              <i />
            </span>
          </p>
        )}
        {children}
        {busy && <LoadingMark />}
        {runningHead && (
          <p className="folio-sheet" aria-hidden="true">
            {pageName}
          </p>
        )}
        {runningHead && (
          <button type="button" className="keys-hint" onClick={() => setKeysOpen(true)}>
            Press <kbd>?</kbd> for shortcuts
          </button>
        )}
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
      {keysOpen && <KeysSheet onClose={() => setKeysOpen(false)} />}
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
