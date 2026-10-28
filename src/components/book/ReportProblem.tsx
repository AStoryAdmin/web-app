/**
 * "Report a problem with my book" (phone repo docs/PLAN_ORDERING.md, P5-R13, the words in P5-R16), inline on the
 * status page of an order that has shipped. Three things, in this order: what happened (one of four), a few words
 * about it (needed, up to 2000 characters), and a photo if they have one (optional: a book that never arrived has
 * none). The photo goes up first, shrunk to a JPEG (orderHelp.ts uploadIssuePhoto), then the report with its path.
 *
 * A refusal shows the server's own sentence and keeps everything typed. On success the parent shows the thanks and
 * reads the order again.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button, Problem } from "../ui";
import { ISSUE_REASONS, MAX_DESCRIPTION, OrderHelpError, reportProblem, uploadIssuePhoto, type IssueReason } from "../../data/orderHelp";

export default function ReportProblem({ orderId, onSent, onCancel }: { orderId: string; onSent: (words: string) => void; onCancel: () => void }) {
  const ids = useId();
  const [reason, setReason] = useState<IssueReason | null>(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  // the path of the photo already uploaded, so a second press after a refusal doesn't upload it again
  const uploaded = useRef<{ file: File; path: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
  }, []);

  // the chosen photo, shown small so they can see it is the right one
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  const choose = (files: FileList | null) => {
    const f = files?.[0] ?? null;
    if (f) setPhoto(f);
    setProblem(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const send = async () => {
    if (busy) return;
    if (!reason) {
      setProblem("Please choose what happened.");
      return;
    }
    if (!description.trim()) {
      setProblem("Please tell us a little about what happened.");
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      let photoPath: string | null = null;
      if (photo) {
        photoPath = uploaded.current?.file === photo ? uploaded.current.path : await uploadIssuePhoto(orderId, photo);
        uploaded.current = { file: photo, path: photoPath };
      }
      const out = await reportProblem({ orderId, reason, description, photoPath });
      onSent(out.words);
    } catch (err) {
      setProblem(err instanceof OrderHelpError ? err.message : "Something went wrong on our side. Please try again in a moment.");
      setBusy(false);
    }
  };

  const left = MAX_DESCRIPTION - description.length;
  return (
    <section className="bo-section bo-report" aria-labelledby={`${ids}-h`}>
      <h2 id={`${ids}-h`}>Report a problem with your book</h2>
      <fieldset className="bo-reasons">
        <legend>What happened?</legend>
        <div className="bo-reason-list">
          {ISSUE_REASONS.map((r, i) => (
            <label key={r.id} className="bo-reason" data-on={reason === r.id || undefined}>
              <input ref={i === 0 ? first : undefined} type="radio" name={`${ids}-reason`} value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="bo-describe" htmlFor={`${ids}-more`}>
        <span>Tell us a little more</span>
        <textarea id={`${ids}-more`} value={description} maxLength={MAX_DESCRIPTION} rows={5} onChange={(e) => setDescription(e.target.value)} aria-describedby={left < 200 ? `${ids}-left` : undefined} />
      </label>
      {left < 200 && (
        <p id={`${ids}-left`} className="bo-help">
          {left} characters left.
        </p>
      )}

      <div className="bo-photo">
        <input ref={fileInput} id={`${ids}-photo`} className="sr-only" type="file" tabIndex={-1} aria-hidden="true" accept="image/jpeg,image/png,image/*" onChange={(e) => choose(e.target.files)} />
        {photo && preview ? (
          <>
            <img src={preview} alt="The photo you chose" />
            <div className="bo-photo-acts">
              <Button variant="outline" onClick={() => fileInput.current?.click()}>
                Change the photo
              </Button>
              <Button variant="outline" onClick={() => setPhoto(null)}>
                Remove the photo
              </Button>
            </div>
          </>
        ) : (
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            Add a photo (if you can)
          </Button>
        )}
      </div>

      {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}
      <div className="bo-next">
        <Button block onClick={send} loading={busy}>
          Send to A Story
        </Button>
        <Button variant="quiet" block onClick={onCancel} disabled={busy}>
          Not now
        </Button>
      </div>
    </section>
  );
}
