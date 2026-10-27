/**
 * "Ask Rose today's question": the button that opens the ask sheet, for
 * Home, a person's page or the family tree. It shows nothing when the
 * person can't be asked by link (passed away, the account's own place, not
 * in the tree), so a page can drop it in without checking first.
 */
import { useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { Person } from "../../data/family";
import type { Story } from "../../data/stories";
import { canAsk } from "../../data/dailyQuestions";
import { AuthContext } from "../../state/authContext";
import { Button } from "../ui";
import { PenIcon } from "../icons";
import AskSheet from "./AskSheet";

export function AskButton({
  story,
  person,
  variant = "outline",
  block,
  className = "",
  children,
}: {
  story: Story;
  person: Person | null;
  variant?: "primary" | "outline" | "accent" | "gold" | "quiet";
  block?: boolean;
  className?: string;
  /** The button's words; "Ask Rose today’s question" (or "Ask them…") when not given. */
  children?: ReactNode;
}) {
  const userId = useContext(AuthContext)?.user?.id || null;
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    // Back to where the asker was.
    button.current?.focus();
  }, []);
  // Only on the storyteller's own story: daily_question_create refuses anyone else.
  if (!canAsk(person, userId) || !person || person.storyId !== story.id) return null;
  const name = String(person?.givenName || "").trim();
  return (
    <>
      <Button ref={button} variant={variant} block={block} className={`askbtn ${className}`.trim()} icon={<PenIcon />} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {children ?? `Ask ${name || "them"} today’s question`}
      </Button>
      <AskSheet open={open} onClose={close} story={story} person={person} />
    </>
  );
}

export default AskButton;
