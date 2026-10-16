/** The hairline icon set: 24×24, stroke 1.8, round joins. Add here, never an icon font. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  ...props,
});

export const HomeIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const ArchiveIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M3 11h18M8 7V4h8v3" /></svg>
);
export const FamilyIcon = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><circle cx="17" cy="10" r="2.6" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" /><path d="M15.5 15.2c2.6.3 4.5 2.3 4.5 4.8" /></svg>
);
export const BookIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z" /><path d="M4 17a3 3 0 0 1 3-3h11" /></svg>
);
export const PlusIcon = (p: P) => <svg {...base({ strokeWidth: 2.4, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const PenIcon = (p: P) => <svg {...base(p)}><path d="M4 20h4l10-10-4-4L4 16zM13 7l4 4" /></svg>;
export const MicIcon = (p: P) => (
  <svg {...base(p)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg>
);
export const PhotoIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="m21 16-5.5-5.5L7 19" /></svg>
);
export const SearchIcon = (p: P) => <svg {...base({ strokeWidth: 2, ...p })}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const UserIcon = (p: P) => <svg {...base({ strokeWidth: 2, ...p })}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
export const ChevronDown = (p: P) => <svg {...base({ strokeWidth: 2, ...p })}><path d="m6 9 6 6 6-6" /></svg>;
export const ChevronRight = (p: P) => <svg {...base({ strokeWidth: 2, ...p })}><path d="m9 6 6 6-6 6" /></svg>;
export const ChevronLeft = (p: P) => <svg {...base({ strokeWidth: 2, ...p })}><path d="m15 6-6 6 6 6" /></svg>;
export const MailIcon = (p: P) => <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
export const LockIcon = (p: P) => <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
export const CodeIcon = (p: P) => <svg {...base(p)}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 12h.01M12 12h.01M17 12h.01" /></svg>;
export const CheckIcon = (p: P) => <svg {...base({ strokeWidth: 2.4, ...p })}><path d="m5 12 4 4L19 7" /></svg>;
export const CloseIcon = (p: P) => <svg {...base({ strokeWidth: 2, ...p })}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const PlayIcon = (p: P) => <svg {...base({ fill: "currentColor", stroke: "none", ...p })}><path d="M8 5v14l11-7z" /></svg>;
export const PauseIcon = (p: P) => <svg {...base({ fill: "currentColor", stroke: "none", ...p })}><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>;
export const LeafIcon = (p: P) => <svg {...base({ fill: "currentColor", stroke: "none", ...p })}><path d="M12 2C7 8 4 11 4 15a8 8 0 0 0 16 0c0-4-3-7-8-13z" /></svg>;
export const PeopleIcon = FamilyIcon;
export const LinkIcon = (p: P) => <svg {...base(p)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" /></svg>;
export const QrIcon = (p: P) => <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v2M17 20h3M14 20h1" /></svg>;
export const TrashIcon = (p: P) => <svg {...base(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>;
export const CalendarIcon = (p: P) => <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
export const PrintIcon = (p: P) => <svg {...base(p)}><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" /></svg>;
export const SparkIcon = (p: P) => <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>;
export const BellIcon = (p: P) => <svg {...base(p)}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" /></svg>;
export const HelpIcon = (p: P) => <svg {...base({ strokeWidth: 2, ...p })}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5M12 17h.01" /></svg>;
export const SettingsIcon = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
export const ShareIcon = (p: P) => <svg {...base(p)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>;
export const SunIcon = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const ArrowRight = (p: P) => <svg {...base({ strokeWidth: 2, ...p })}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const ExpandIcon = (p: P) => <svg {...base(p)}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>;
export const ShrinkIcon = (p: P) => <svg {...base(p)}><path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7" /></svg>;
