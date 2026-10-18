/**
 * The emailed code on the plate: one input (one-time-code, numeric) across the paper's width, drawn as six slots. It
 * is one target 52px tall that fits inside the plate's engraved frame at any width down to 320, where six separate
 * 44px boxes could not. Typing, paste, the phone's code suggestion and backspace are the input's own; the slots only
 * show the digits, and which one comes next while it has focus. useCodeAria marks it while the code is wrong.
 */
import { useState } from "react";

export default function PlateCode({ value, onChange, length = 6, autoFocus }: { value: string; onChange: (v: string) => void; length?: number; autoFocus?: boolean }) {
  const [focused, setFocused] = useState(false);
  const digits = Array.from({ length }, (_, i) => value[i] || "");
  const next = Math.min(value.length, length - 1);
  return (
    <div className="plate-code">
      <div className="plate-code-slots" aria-hidden="true">
        {digits.map((d, i) => (
          <span key={i} className={focused && i === next ? "slot is-next" : d ? "slot is-filled" : "slot"}>
            {d}
          </span>
        ))}
      </div>
      <input
        className="plate-code-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        spellCheck={false}
        aria-label={`${length}-digit code`}
        value={value}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (!text) return;
          e.preventDefault();
          onChange(text.replace(/\D/g, "").slice(0, length));
        }}
      />
    </div>
  );
}
