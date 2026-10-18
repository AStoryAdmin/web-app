/**
 * A quiet tool that opens a small menu under itself: "•••" at the end of
 * the memory's tool row, and the Public/Private word in its head, whose
 * menu carries the page's one disclosure of what each means. The menu
 * grows from its button (origin-aware, 160 ms on the strong ease-out),
 * closes on Escape, on a click outside and after a choice, and the arrow
 * keys move through it. Near the foot of the window it opens upward. Nothing animates under reduced motion.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type ToolMenuItem = {
  key: string;
  label: ReactNode;
  /** A second line under the label, for a choice that needs its meaning said. */
  hint?: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** For a choice that is the current state (Public, Private). */
  checked?: boolean;
  disabled?: boolean;
};

export default function ToolMenu({
  label,
  icon,
  items,
  className = "",
  align = "start",
  ariaLabel,
  busy = false,
}: {
  label: ReactNode;
  icon?: ReactNode;
  items: ToolMenuItem[];
  className?: string;
  align?: "start" | "end";
  ariaLabel?: string;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const choice = items.some((i) => i.checked !== undefined);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    // the first item takes the focus, so the keyboard can carry on
    window.requestAnimationFrame(() => wrap.current?.querySelector<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)')?.focus());
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = Array.from(wrap.current?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)') ?? []);
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = list[(at + (e.key === "ArrowDown" ? 1 : list.length - 1)) % list.length];
      next?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <span className={`mv-menuwrap${align === "end" ? " end" : ""}`} ref={wrap}>
      <button
        type="button"
        ref={button}
        className={`mv-tool ${className}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel}
        aria-busy={busy || undefined}
        disabled={busy}
        onClick={() => {
          // near the foot of the window the menu opens upward, so it is never cut off
          const r = button.current?.getBoundingClientRect();
          setUp(!!r && window.innerHeight - r.bottom < 280 && r.top > 280);
          setOpen((v) => !v);
        }}
      >
        {icon}
        {label}
      </button>
      {open && (
        <div className={`mv-menu${up ? " up" : ""}`} role="menu" id={menuId} onKeyDown={onKey}>
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role={choice ? "menuitemradio" : "menuitem"}
              aria-checked={choice ? !!it.checked : undefined}
              className={`mv-menu-item${it.danger ? " danger" : ""}`}
              disabled={it.disabled}
              onClick={() => {
                setOpen(false);
                button.current?.focus();
                it.onSelect();
              }}
            >
              {it.icon && <span className="mv-menu-ico">{it.icon}</span>}
              <span className="mv-menu-txt">
                <span>{it.label}</span>
                {it.hint && <small>{it.hint}</small>}
              </span>
              {choice && <span className="mv-menu-check" aria-hidden="true">{it.checked ? "✓" : ""}</span>}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
