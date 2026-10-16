/**
 * The signed-in frame: the chocolate rail on a laptop (the book's spine),
 * the curved top bar and bottom tabs on a phone. Four places and one Add
 * button; the storyteller switcher at the top because every place is about
 * one person; Account behind the avatar at the foot.
 */
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { Lockup, Mark } from "./Brand";
import { Avatar, Button } from "./ui";
import { ArchiveIcon, BookIcon, ChevronDown, ChevronLeft, CloseIcon, FamilyIcon, HomeIcon, MicIcon, PenIcon, PhotoIcon, PlusIcon } from "./icons";
import { usePhotoUrl } from "../lib/photoUrls";
import { storySubtitle } from "../app-core/lib/social.js";
import { storyLine } from "../lib/storyLine";

const NAV = [
  { to: "/", label: "Home", Icon: HomeIcon, end: true },
  { to: "/archive", label: "Archive", Icon: ArchiveIcon },
  { to: "/family", label: "Family", Icon: FamilyIcon },
  { to: "/book", label: "The Book", Icon: BookIcon },
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
      {!compact && <Avatar src={photo} name={activeStory.name} size={44} />}
      <span>
        {!compact && <small>Storyteller</small>}
        <strong>{compact ? storyLine(activeStory) : `${activeStory.name} ${activeStory.lastName}`.trim()}</strong>
      </span>
      {many && <ChevronDown width={20} height={20} />}
    </button>
  );
}

/** Pick whose story the four places are about. */
function TellerSheet({ onClose }: { onClose: () => void }) {
  const { stories, activeStory, chooseStory } = useAccount();
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheetbox" role="dialog" aria-modal="true" aria-label="Whose story" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <h2>Whose story?</h2>
          <button type="button" className="iconbtn soft" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <ul>
          {stories.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="person"
                style={{ width: "100%", background: s.id === activeStory?.id ? "var(--sheet)" : undefined, border: 0, cursor: "pointer", textAlign: "left" }}
                aria-current={s.id === activeStory?.id ? "true" : undefined}
                onClick={async () => {
                  await chooseStory(s.id).catch(() => {});
                  onClose();
                }}
              >
                <Avatar name={s.name} size={52} />
                <span>
                  <strong>{`${s.name} ${s.lastName}`.trim()}</strong>
                  <span className="meta">
                    {storySubtitle(s) as string} · {s.memories.length} {s.memories.length === 1 ? "memory" : "memories"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          block
          style={{ marginTop: "var(--s-4)" }}
          onClick={() => {
            onClose();
            navigate("/start?another=1");
          }}
        >
          Keep someone else's story
        </Button>
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

export default function Shell({ children, title, back }: { children: ReactNode; title?: string; back?: string | true }) {
  const { user } = useAuth();
  const [teller, setTeller] = useState(false);
  const [add, setAdd] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email || "";

  return (
    <div className="shell">
      <aside className="rail on-dark">
        <div className="brand">
          <NavLink to="/" aria-label="Home">
            <Lockup height={40} className="wide" />
            <Mark height={34} className="narrow" />
          </NavLink>
        </div>
        <TellerButton onClick={() => setTeller(true)} />
        <nav aria-label="Main">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn add" onClick={() => setAdd(true)}>
          <PlusIcon />
          <span>Add a memory</span>
        </button>
        <div className="rail-foot">
          <NavLink className="me" to="/account">
            <Avatar src={user?.avatarUrl} name={name} size={40} />
            <span>
              <strong>{name}</strong>
              <small>Account &amp; settings</small>
            </span>
          </NavLink>
        </div>
      </aside>

      <main className="content" id="main">
        <header className="topbar on-dark">
          {back && (
            <button type="button" className="back" aria-label="Back" onClick={() => (back === true ? navigate(-1) : navigate(back))}>
              <ChevronLeft />
            </button>
          )}
          <div className="row">{title ? <h1>{title}</h1> : <Lockup height={36} />}</div>
        </header>
        {children}
      </main>

      <nav className="tabbar" aria-label="Main">
        <div className="tabs">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
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
