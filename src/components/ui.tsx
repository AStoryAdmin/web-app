/**
 * The shared controls, on the classes in src/styles/astory.css (the design
 * system). Pages compose these; they do not restyle a div.
 */
import { smarten } from "../lib/typography";
import { forwardRef, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { CheckIcon } from "./icons";

type Variant = "primary" | "outline" | "accent" | "gold" | "quiet";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
  small?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", block, small, loading, icon, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`btn ${variant}${block ? " block" : ""}${small ? " sm" : ""} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon}
      {loading ? "One moment…" : children}
    </button>
  );
});

export function ButtonLink({ variant = "primary", block, small, icon, className = "", children, ...rest }: LinkProps & { variant?: Variant; block?: boolean; small?: boolean; icon?: ReactNode }) {
  return (
    <Link className={`btn ${variant}${block ? " block" : ""}${small ? " sm" : ""} ${className}`} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  /** A "Show" toggle for passwords. */
  reveal?: { shown: boolean; toggle: () => void };
  /** Told when focus enters or leaves the field as a whole (the input and its Show control count as one). */
  onFocusChange?: (within: boolean) => void;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon, hint, error, reveal, onFocusChange, id, className = "", ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id || auto;
  const hintId = `${inputId}-hint`;
  return (
    <label
      className={`field ${className}`}
      htmlFor={inputId}
      onFocus={onFocusChange ? () => onFocusChange(true) : undefined}
      onBlur={onFocusChange ? (e) => (e.currentTarget.contains(e.relatedTarget as Node | null) ? undefined : onFocusChange(false)) : undefined}
    >
      <span>{label}</span>
      <span className="input" style={error ? { borderColor: "var(--danger)" } : undefined}>
        {icon}
        {icon && <span className="sep" aria-hidden="true" />}
        <input ref={ref} id={inputId} aria-describedby={hint || error ? hintId : undefined} aria-invalid={error ? true : undefined} {...rest} />
        {reveal && (
          <button type="button" className="show" onClick={reveal.toggle} aria-pressed={reveal.shown}>
            {reveal.shown ? "Hide" : "Show"}
          </button>
        )}
      </span>
      {(error || hint) && (
        <span id={hintId} className="hint" style={error ? { color: "var(--danger)", display: "block", marginTop: 8 } : { display: "block", marginTop: 8 }} role={error ? "alert" : undefined}>
          {error || hint}
        </span>
      )}
    </label>
  );
});

/** Six boxes for the emailed code; typing, pasting and backspace all behave. */
export function CodeInput({ value, onChange, length = 6, autoFocus }: { value: string; onChange: (v: string) => void; length?: number; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");
  const set = (next: string) => onChange(next.replace(/\D/g, "").slice(0, length));
  return (
    <div className="code" role="group" aria-label={`${length}-digit code`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          value={d}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (raw.length > 1) {
              set(value.slice(0, i) + raw);
              refs.current[Math.min(length - 1, i + raw.length)]?.focus();
              return;
            }
            const next = value.slice(0, i) + raw + value.slice(i + 1);
            set(next);
            if (raw) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) {
              refs.current[i - 1]?.focus();
              set(value.slice(0, i - 1));
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text) {
              e.preventDefault();
              set(text);
              refs.current[Math.min(length - 1, text.replace(/\D/g, "").length)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" className={`check${checked ? " on" : ""}`} role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}>
      <i aria-hidden="true">{checked && <CheckIcon width={16} height={16} />}</i>
      {children}
    </button>
  );
}

export function Card({ children, pad = true, className = "", ...rest }: { children: ReactNode; pad?: boolean; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card${pad ? " pad" : ""} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Chip({ tone = "", className = "", children, ...rest }: { tone?: "" | "green" | "gold" | "accent" | "outline"; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`chip ${tone} ${className}`} {...rest}>
      {children}
    </span>
  );
}

/** Initials in a circle when there is no photograph. */
export function Avatar({ src, name, size = 44, className = "" }: { src?: string | null; name: string; size?: number; className?: string }) {
  // a monogram, the way a seal is engraved: the first letter of the first and last words of the name
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  const first = words[0] ? Array.from(words[0])[0] : "";
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
  const initial = (first + (size >= 32 ? last : "")).toUpperCase() || "?";
  if (src) return <img className={`avatar ${className}`} src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />;
  return (
    <span className={`avatar ph ${className}`} aria-hidden="true" style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * (initial.length > 1 ? 0.36 : 0.44))) }}>
      {initial}
    </span>
  );
}

/** One line that says what went wrong, in the page, with a way to try again. */
export function Problem({ message, onRetry, onDismiss }: { message: string; onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <div role="alert" className="banner" style={{ background: "var(--accent-soft)", borderColor: "var(--accent)", marginBottom: "var(--s-5)" }}>
      <span style={{ flex: 1, minWidth: 0 }}>{smarten(message)}</span>
      {onRetry && (
        <Button variant="outline" small onClick={onRetry}>
          Try again
        </Button>
      )}
      {onDismiss && (
        <Button variant="quiet" small onClick={onDismiss}>
          Dismiss
        </Button>
      )}
    </div>
  );
}
