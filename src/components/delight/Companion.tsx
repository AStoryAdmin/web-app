/**
 * The family dog, chin on the top edge of the sheet. Drawn in ink by the
 * founder's hand (public/dog/*.png, three states). It watches the pointer,
 * cocks its head while you type, covers its eyes with a paw when you move
 * to the password, and peeks between its toes if you press Show. Under
 * reduced motion it simply rests there. The moods are read from the
 * sheet's own focus and input events, so the forms don't know it exists.
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";

type Mood = "watch" | "cover" | "peek";

export default function Companion({ sheet }: { sheet: RefObject<HTMLElement | null> }) {
  const head = useRef<HTMLDivElement>(null);
  const [mood, setMood] = useState<Mood>("watch");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const read = () => {
      const a = document.activeElement as HTMLElement | null;
      const input = a && el.contains(a) && a.tagName === "INPUT" ? (a as HTMLInputElement) : null;
      const show = el.querySelector('.show[aria-pressed="true"]');
      const secret = !!input && (input.type === "password" || (input.autocomplete || "").includes("password"));
      if (secret || (show && a === show)) {
        setMood(show ? "peek" : "cover");
        setTyping(false);
      } else {
        setMood("watch");
        setTyping(!!input && input.type !== "checkbox" && input.type !== "radio");
      }
    };
    const later = () => queueMicrotask(read);
    for (const ev of ["focusin", "focusout", "input", "click"]) el.addEventListener(ev, later);
    return () => {
      for (const ev of ["focusin", "focusout", "input", "click"]) el.removeEventListener(ev, later);
    };
  }, [sheet]);

  // The head turns a little toward the pointer, and cocks while you type.
  useEffect(() => {
    const node = head.current;
    if (!node) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const toX = gsap.quickTo(node, "x", { duration: 0.6, ease: "power3.out" });
    const toY = gsap.quickTo(node, "y", { duration: 0.6, ease: "power3.out" });
    const toR = gsap.quickTo(node, "rotation", { duration: 0.7, ease: "power3.out" });
    if (mood !== "watch") {
      toX(0);
      toY(0);
      toR(0);
      return;
    }
    if (typing) {
      toX(0);
      toY(2);
      toR(-6);
      return;
    }
    if (!matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      toX(dx * 18);
      toY(dy * 8);
      toR(dx * 7);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [mood, typing]);

  return (
    <div className="companion" data-mood={mood} aria-hidden="true">
      <div className="head" ref={head}>
        <img className="state watch" src="/dog/watch.png" alt="" width="629" height="422" />
        <img className="state cover" src="/dog/cover.png" alt="" width="629" height="423" />
        <img className="state peek" src="/dog/peek.png" alt="" width="632" height="423" />
        <span className="lid l" />
        <span className="lid r" />
      </div>
    </div>
  );
}
