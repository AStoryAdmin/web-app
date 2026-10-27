/**
 * Choosing a face: your own picture (forProfile), or the face of somebody on
 * the family tree (personId), living or late. The web's half of the app's
 * "Your picture" page (ProfilePictureScreen): the face as it is now, one way
 * to choose another from this computer or phone (a click, or a picture
 * dropped on the face), and a way to take it away. The picture is cut to a
 * square and set in at once (data/portraits.ts); while it goes up, the face
 * already shows it, and if it does not go the old face comes back with the
 * reason beside it.
 *
 * After a save the account and the tree are read again, so the plate, the
 * tree and the person's page agree; onChange is for the page's own copy.
 */
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import Portrait from "./Portrait";
import { Button } from "../ui";
import { PhotoIcon } from "../icons";
import { useAuth } from "../../state/authContext";
import { useAccount } from "../../state/accountContext";
import { householdFor } from "../../data/familyWrites";
import { clearPortrait, pictureProblem, PortraitError, uploadOwnPortrait, uploadPersonPortrait } from "../../data/portraits";
import { meOf } from "./familyView";
import { track } from "../../lib/analytics";
import "./PortraitUpload.css";

type Props = {
  /** Somebody on the tree. Leave it out with forProfile for your own picture. */
  personId?: string;
  /** Your own picture: the account's, and your tree row's when you have one. */
  forProfile?: boolean;
  /** The face as it is now: a stored reference (signed when shown) or a ready URL. */
  currentUrl: string | null | undefined;
  /** The new face once it is saved; null when it was taken away. */
  onChange: (url: string | null) => void;
  /** Diameter of the face in CSS pixels. */
  size?: number;
};

type Note = { ok?: string; error?: string } | null;

const said = (err: unknown) =>
  err instanceof PortraitError ? err.message : `That picture didn’t save (${(err as Error)?.message || "no connection"}). Try again in a moment.`;

export default function PortraitUpload({ personId, forProfile = false, currentUrl, onChange, size = 96 }: Props) {
  const { user, refresh } = useAuth();
  const { account, family, reload } = useAccount();
  const fileRef = useRef<HTMLInputElement>(null);
  const noteId = useId();
  const [busy, setBusy] = useState<"" | "up" | "clear">("");
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [over, setOver] = useState(false);

  // the local copy shown while a picture goes up is let go once it is no longer shown
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const me = user ? meOf(family, user.id) : null;
  const person = personId ? family?.people.find((p) => p.id === personId) || null : forProfile ? me : null;
  const isSelf = forProfile || (!!user && !!person?.userId && person.userId === user.id);
  const given = forProfile ? user?.firstName || person?.givenName || "" : person?.givenName || "";
  const surname = forProfile ? user?.lastName || person?.familyName || "" : person?.familyName || "";
  const whose = isSelf ? "Your" : given ? `${given}’s` : "Their";
  const shown = preview || currentUrl || null;
  const ready = !!user && (forProfile || !!person);

  // the face is saved by now; a re-read that fails leaves the page a step behind, never a "didn't save"
  const reread = () =>
    Promise.all([isSelf ? refresh() : null, reload()]).catch((err) => console.warn("PortraitUpload: re-read:", (err as Error)?.message || err));

  const save = async (file: File) => {
    if (!user || busy) return;
    const problem = pictureProblem(file);
    if (problem) return setNote({ error: problem });
    setBusy("up");
    setNote(null);
    setPreview(URL.createObjectURL(file));
    try {
      if (forProfile) {
        const r = await uploadOwnPortrait({ userId: user.id, file, me });
        onChange(r.url);
        setNote({ ok: me && !r.mirrored ? "Your picture is set. It didn’t reach the family tree yet." : "Your picture is set." });
      } else if (person) {
        const householdId = person.householdId || (await householdFor(user.id, account ?? null, family));
        const url = await uploadPersonPortrait({ personId: person.id, householdId, file, selfUserId: isSelf ? user.id : null });
        onChange(url);
        setNote({ ok: "Saved. Only your family can see it." });
      }
      track("person_photo_added", {});
      await reread();
    } catch (err) {
      console.warn("PortraitUpload:", (err as Error)?.message || err);
      setNote({ error: said(err) });
    } finally {
      setPreview(null);
      setBusy("");
    }
  };

  const remove = async () => {
    if (!user || busy) return;
    setBusy("clear");
    setNote(null);
    try {
      await clearPortrait(forProfile ? { userId: user.id, personId: me?.id || null } : { personId: person?.id || null, userId: isSelf ? user.id : null });
      onChange(null);
      setNote({ ok: isSelf ? "Your picture is taken away." : "The picture is taken away." });
      await reread();
    } catch (err) {
      setNote({ error: said(err) });
    } finally {
      setBusy("");
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && ready) void save(file);
  };

  return (
    <div
      className={`pup${over ? " over" : ""}`}
      role="group"
      aria-label={`${whose} picture`}
      aria-describedby={note ? noteId : undefined}
      onDragOver={(e) => {
        if (!ready || busy) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <Portrait photo={shown} given={given} family={surname} size={size} className={busy === "up" ? "pup-going" : ""} />
      <div className="pup-side">
        <div className="pup-acts">
          <Button variant="outline" small icon={<PhotoIcon />} onClick={() => fileRef.current?.click()} loading={busy === "up"} disabled={!ready || !!busy}>
            {shown ? "Choose another picture" : "Add a picture"}
          </Button>
          {currentUrl && !preview && (
            <Button variant="quiet" small onClick={() => void remove()} loading={busy === "clear"} disabled={!ready || !!busy}>
              Take it away
            </Button>
          )}
        </div>
        {note && (
          <p id={noteId} className={`pup-note${note.error ? " bad" : ""}`} role={note.error ? "alert" : "status"}>
            {note.error || note.ok}
          </p>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // the same picture chosen twice in a row is still a choice
          e.target.value = "";
          if (file) void save(file);
        }}
      />
    </div>
  );
}
