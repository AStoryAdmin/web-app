/**
 * The open leaf at the foot of the sheet (Home and the Archive): a blank
 * page of the family book with today's question already written at the
 * top, "Dear family," the way a letter opens, three ruled lines waiting,
 * a fountain-pen nib lying across them, a pencilled note in the margin,
 * and "Write it". The family dog sleeps with its chin on the page's top
 * edge and wakes, looking up, when you reach the end of the page.
 *
 * It invites rather than asks: no count, no streak, no "you haven't
 * written today". Nothing in it starts hidden; the dog's waking is a
 * cross-fade between two drawings, and under reduced motion it still
 * wakes, without the fade.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { MOVE } from "../../lib/ease";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ButtonLink } from "../ui";
import { PenIcon } from "../icons";
import { useAuth } from "../../state/authContext";
import { isPaid } from "../../lib/plan";
import { todaysQuestion } from "../../lib/today";
import type { Story } from "../../data/stories";

gsap.registerPlugin(ScrollTrigger);

const longDate = (d = new Date()) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export default function OpenLeaf({ story }: { story: Story }) {
  const { user } = useAuth();
  const root = useRef<HTMLElement>(null);
  const unlimited = isPaid(user?.plan ?? "free");
  const question = todaysQuestion(story, { unlimited });
  const own = story.relationship === "Myself";
  const bookName = story.lastName ? `The ${story.lastName} book` : own ? "Your book" : `${story.name}'s book`;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let nap: gsap.core.Tween | null = null;
    // the dog wakes when the end of the page is reached, and dozes again when you go back up
    const st = ScrollTrigger.create({
      trigger: el,
      start: "bottom bottom+=40",
      onToggle: (self) => {
        nap?.kill();
        if (self.isActive) nap = gsap.delayedCall(0.35, () => el.setAttribute("data-awake", ""));
        else el.removeAttribute("data-awake");
      },
    });
    // the arrow in the margin is drawn with the pencil as it comes into view (triggered by the arrow itself, at once,
    // so a drawn arrow never blinks out and back); it is already drawn if the trigger never fires
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const arrow = el.querySelector<SVGPathElement>(".ol-arrow path");
      if (!arrow) return;
      const len = arrow.getTotalLength();
      ScrollTrigger.create({
        trigger: arrow,
        start: "top bottom-=40",
        once: true,
        onEnter: () => {
          gsap.fromTo(arrow, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, ease: MOVE, immediateRender: false, clearProps: "strokeDasharray,strokeDashoffset" });
        },
      });
    });
    return () => {
      nap?.kill();
      st.kill();
      mm.revert();
    };
  }, []);

  return (
    <section className="open-leaf" ref={root} data-running="A page for today" aria-labelledby="open-leaf-h">
      <span className="ol-dog" aria-hidden="true">
        <img className="sleep" src="/dog/sleep-paper.webp" alt="" width={762} height={640} loading="lazy" decoding="async" />
        <img className="awake" src="/dog/curious-paper.webp" alt="" width={762} height={640} loading="lazy" decoding="async" />
      </span>
      <div className="ol-page">
        <span className="page-frame" aria-hidden="true" />
        <p className="ol-head" aria-hidden="true">
          <span>{longDate()}</span>
          <i>✦</i>
          <span>{bookName}</span>
        </p>
        <h2 id="open-leaf-h" className="sr-only">
          A page for today
        </h2>
        <p className="ol-dear">Dear family,</p>
        <p className="ol-q">{question ? question.question : own ? "What would you like to keep today?" : `What would you like to keep of ${story.name}'s?`}</p>
        <div className="ol-lines" aria-hidden="true">
          <span />
          <span />
          <span />
          <svg className="ol-nib" viewBox="0 0 40 96" width="40" height="96">
            <path className="body" d="M20 94 L7 50 C5 41 7 27 11 15 L29 15 C33 27 35 41 33 50 Z" />
            <path className="slit" d="M20 92 V52" />
            <circle className="hole" cx="20" cy="48" r="3.2" />
            <path className="collar" d="M10 15 L30 15 L31 4 L9 4 Z" />
          </svg>
        </div>
        <div className="ol-foot">
          <div className="ol-act">
            <p className="ol-note">A few lines is plenty.</p>
            <svg className="ol-arrow" viewBox="0 0 64 40" width="64" height="40" aria-hidden="true">
              <path d="M58 4 C50 18 36 30 12 32 M12 32 L20 25 M12 32 L21 37" />
            </svg>
            <ButtonLink to={question ? `/write?q=${encodeURIComponent(question.id)}` : "/write"} icon={<PenIcon />}>
              Write it
            </ButtonLink>
          </div>
          <p className="ol-sign" aria-hidden="true">
            {own ? "Yours," : "As told by"}
            <span>{story.name}</span>
          </p>
        </div>
        <span className="ol-ear" aria-hidden="true" />
      </div>
    </section>
  );
}
