/**
 * The three warm tiles under a memory's caption: add a photograph, add to
 * the words, add what you remember. Filled terracotta, cream text, the
 * icon above the label, each a 44px+ target. One tile on its own is also
 * used where a page asks for a single thing ("Write a memory with Bao").
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PenIcon, PhotoIcon } from "../icons";

export function QuoteIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M9 7H5.5A1.5 1.5 0 0 0 4 8.5V12a1.5 1.5 0 0 0 1.5 1.5H8L7 17" />
      <path d="M19 7h-3.5A1.5 1.5 0 0 0 14 8.5V12a1.5 1.5 0 0 0 1.5 1.5H18l-1 3.5" />
    </svg>
  );
}

type TileProps = { icon: ReactNode; children: ReactNode; to?: string; onClick?: () => void; className?: string };

/** One filled tile: a link when `to` is given, a button otherwise. */
export function Tile({ icon, children, to, onClick, className = "" }: TileProps) {
  const inner = (
    <>
      <span className="ico" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </>
  );
  if (to)
    return (
      <Link className={`atile ${className}`} to={to}>
        {inner}
      </Link>
    );
  return (
    <button type="button" className={`atile ${className}`} onClick={onClick}>
      {inner}
    </button>
  );
}

export default function ActionTiles({ memoryId, onRemember }: { memoryId: string; onRemember: () => void }) {
  return (
    <div className="atiles" data-rise>
      <Tile icon={<PhotoIcon />} to={`/write?edit=${memoryId}&photo=1`}>
        Add a photograph
      </Tile>
      <Tile icon={<PenIcon />} to={`/write?edit=${memoryId}`}>
        Add to the words
      </Tile>
      <Tile icon={<QuoteIcon />} onClick={onRemember}>
        Add what you remember
      </Tile>
    </div>
  );
}
