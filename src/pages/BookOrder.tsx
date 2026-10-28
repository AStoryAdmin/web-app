/**
 * Ordering the printed book (/book/order?story=…&step=review|send|pay): one
 * flow, three steps, one place (P4-R1). The step is in the URL, so the
 * browser's Back goes back one step, and so does the header's.
 *
 *   1. Review your book. The server makes a new, unlocked book version
 *      (lib/bookVersion prepareVersion) and names the print profile; this page
 *      lays the book out with it (printPdf prepareBookPdfs: "Laying out page
 *      12 of 140…"), files the two files with the version (uploadVersionPdfs)
 *      and checks them (app-core preflight.js). The family looks through the
 *      exact pages that will print (BookFlip), reads how many pages and what
 *      one copy costs, reads any warning in plain words (a blurry photo never
 *      stops them; over 300 pages does), and ticks "I've reviewed my book and
 *      it's ready to print." Continue locks the version (approveVersion).
 *   2. Who should receive it. One card per address, US only, each with its
 *      own copies; quick picks from the family (book.ts shipChoices) with
 *      the addresses kept on this computer; one secondary button, "Add another
 *      copy for someone else". The rules and their sentences are the server's
 *      (printOrder.ts validateShipments).
 *   3. Pay. The server's itemised total, read-only (previewPrintOrder): the
 *      book, shipping, the deposit as its own line, the total and when it
 *      arrives. Pay places the order then (placePrintOrder) and the page goes
 *      to the payment page; an order credits cover goes straight to its
 *      status page. If the real total differs from the one shown, the new
 *      lines are shown and Pay is pressed again.
 *
 * The approved version and the address cards are kept in sessionStorage per
 * story, so a family back from the payment page (canceled=1) lands on Pay and
 * is not asked to look through the book again.
 *
 * While create-book-order says ordering is closed the page says "Printed
 * books are coming", with no price and no form. Safari can't lay the book
 * out (printPdf.ts), so there it says PRINT_BROWSER_MESSAGE instead.
 *
 * "Order more copies" (?reorder=<order id>, P5-R14): the order it copies is
 * read under the family's own RLS, and its locked book version and page count
 * are the approved book. There is no Review step and no new approval: the
 * flow is Send and Pay only, under "More copies of the same book", and
 * step=review goes to Send. The price of a copy is asked again
 * (checkPrintOrder with the page count) and the preview and the order carry
 * reorderOf, which the server checks (else bad_reorder). Back from Send goes
 * to that order's page. Its draft is kept apart from the ordinary one.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { Button, ButtonLink, Checkbox, Field, Problem } from "../components/ui";
import { Stop } from "../components/book/WhereNext";
import BookFlip from "../components/book/BookFlip";
import { PRINT_BROWSER_MESSAGE, PrintPdfError, isPrintCapableBrowser, prepareBookPdfs, revokeBookPages, uploadVersionPdfs, type PreparedBookPdfs } from "../components/book/printPdf";
import { preflightBook } from "../app-core/lib/preflight.js";
import { APPROVE_CHECKBOX_TEXT, approveVersion, prepareVersion, BookVersionError, type PreflightResult } from "../lib/bookVersion";
import { listenBase } from "../lib/qrLinks";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { shipChoices } from "../data/book";
import {
  FIELD_OF_ERROR,
  MAX_ADDRESSES,
  PRINT_ORDER_MESSAGES,
  MAX_COPIES_PER_ADDRESS,
  PrintOrderError,
  US_STATES,
  arrivesWords,
  blankAddress,
  checkPrintOrder,
  coveredWords,
  fromSaved,
  groupWarnings,
  lineLabel,
  money,
  placePrintOrder,
  previewPrintOrder,
  price,
  tidyAddress,
  validateShipments,
  type OrderLine,
  type PlacedOrder,
  type PrintAddress,
  type PrintCheck,
  type PrintField,
  type PrintPreview,
  type Shipment,
} from "../data/printOrder";
import { listContributions } from "../data/contributions";
import { afterShip, getOrder, type BookOrder as PaidOrder } from "../data/bookOrders";
import type { Story } from "../data/stories";
import "../styles/pages/book-order.css";

type Step = "review" | "send" | "pay";
const STEPS: { id: Step; name: string }[] = [
  { id: "review", name: "Review your book" },
  { id: "send", name: "Who should receive it" },
  { id: "pay", name: "Pay" },
];
const isStep = (v: string | null): v is Step => v === "review" || v === "send" || v === "pay";

/** One address on the Send step: which quick pick it came from, how many copies, and where. */
type Card = { id: string; pick: string; quantity: number; address: PrintAddress };
/** What this tab keeps per story: the approved book and the address cards (P4-R6). */
type Draft = { versionId: string | null; pageCount: number | null; copyCents: number | null; cards: Card[] };
type CardProblem = { index: number; field: PrintField | "quantity" | null; message: string };

/** The addresses kept on this computer, by the pick each belongs to (the phone keeps its own). Older ones carry region and country. */
const SAVED_KEY = "astory:book-ship-to:v1";
const draftKey = (storyId: string, reorderOf?: string | null) => (reorderOf ? `astory:book-order:${storyId}:reorder:${reorderOf}:v1` : `astory:book-order:${storyId}:v1`);

function readSaved(): Record<string, PrintAddress> {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || "{}") as Record<string, unknown>;
    const out: Record<string, PrintAddress> = {};
    for (const [k, v] of Object.entries(raw && typeof raw === "object" ? raw : {})) {
      const a = fromSaved(v);
      if (a) out[k] = a;
    }
    return out;
  } catch {
    return {};
  }
}

function writeSaved(saved: Record<string, PrintAddress>) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  } catch {
    /* a private window: it is simply not kept */
  }
}

const EMPTY_DRAFT: Draft = { versionId: null, pageCount: null, copyCents: null, cards: [] };

function readDraft(storyId: string, reorderOf?: string | null): Draft {
  try {
    const d = JSON.parse(sessionStorage.getItem(draftKey(storyId, reorderOf)) || "null") as Partial<Draft> | null;
    if (!d || typeof d !== "object") return EMPTY_DRAFT;
    const cards = Array.isArray(d.cards)
      ? d.cards
          .filter((c) => c && typeof c === "object")
          .slice(0, MAX_ADDRESSES)
          .map((c, i) => ({
            id: typeof c.id === "string" ? c.id : `card-${i}`,
            pick: typeof c.pick === "string" ? c.pick : "other",
            quantity: Number.isInteger(c.quantity) ? Math.min(MAX_COPIES_PER_ADDRESS, Math.max(1, c.quantity)) : 1,
            address: { ...blankAddress(), ...tidyAddress(c.address) },
          }))
      : [];
    return {
      versionId: typeof d.versionId === "string" && d.versionId ? d.versionId : null,
      pageCount: Number.isInteger(d.pageCount) ? (d.pageCount as number) : null,
      copyCents: Number.isInteger(d.copyCents) ? (d.copyCents as number) : null,
      cards,
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function writeDraft(storyId: string, d: Draft, reorderOf?: string | null) {
  try {
    sessionStorage.setItem(draftKey(storyId, reorderOf), JSON.stringify(d));
  } catch {
    /* a private window: Pay will ask again from step 1 */
  }
}

let cardSeq = 0;
const newCardId = () => `card-${Date.now().toString(36)}-${++cardSeq}`;

export default function BookOrder() {
  const { account, stories, activeStory, loadError, reload } = useAccount();
  const [params] = useSearchParams();
  const asked = params.get("story");

  if (account === undefined)
    return (
      <Shell compact tone="teal" back="/book">
        <div className="page bo-page" aria-busy="true">
          <LoadingMark />
        </div>
      </Shell>
    );
  if (account === null && loadError)
    return (
      <Shell compact tone="teal" back="/book" title="Order the book">
        <div className="page">
          <Problem message={loadError} onRetry={reload} />
        </div>
      </Shell>
    );
  const story = (asked && stories.find((s) => s.id === asked)) || activeStory;
  if (!story) return <Navigate to="/book" replace />;
  const reorder = params.get("reorder") || null;
  return <OrderFlow key={`${story.id}:${reorder ?? ""}`} story={story} reorder={reorder} />;
}

/** The order "Order more copies" copies: the family's own, of this story, shipped, with its locked version (P5-R14). Pure. */
function reorderable(o: PaidOrder | null | undefined, storyId: string): o is PaidOrder & { bookVersionId: string; pageCount: number } {
  return !!o && o.storyId === storyId && afterShip(o) && !!o.bookVersionId && !!o.pageCount;
}

function OrderFlow({ story, reorder }: { story: Story; reorder: string | null }) {
  const [params, setParams] = useSearchParams();
  const name = story.name.trim().split(/\s+/)[0] || story.name;
  const book = `${name}’s book`;

  // Is ordering open (create-book-order's check)? undefined while asking, null when it couldn't be reached.
  const [check, setCheck] = useState<PrintCheck | null | undefined>(undefined);
  const [ask, setAsk] = useState(0);
  useEffect(() => {
    let live = true;
    checkPrintOrder()
      .then((c) => live && setCheck(c))
      .catch((err) => {
        if (!live) return;
        // a server that refuses the question is closed; only a dropped connection is worth another try
        setCheck(err instanceof PrintOrderError && err.reason === "network" ? null : { orderingOpen: false, product: null, credits: [], copyCents: null });
      });
    return () => {
      live = false;
    };
  }, [ask]);

  const [draft, setDraftState] = useState<Draft>(() => readDraft(story.id, reorder));
  const setDraft = useCallback(
    (next: Draft | ((d: Draft) => Draft)) =>
      setDraftState((d) => {
        const n = typeof next === "function" ? next(d) : next;
        writeDraft(story.id, n, reorder);
        return n;
      }),
    [story.id, reorder],
  );

  // "Order more copies": the order it copies, undefined while reading, null when it can't be read
  const [source, setSource] = useState<PaidOrder | null | undefined>(reorder ? undefined : null);
  const [sourceAsk, setSourceAsk] = useState(0);
  useEffect(() => {
    if (!reorder) return;
    let live = true;
    getOrder(reorder)
      .then((o) => {
        if (!live) return;
        setSource(o);
        // its locked version is the approved book
        if (reorderable(o, story.id)) setDraft((d) => (d.versionId === o.bookVersionId && d.pageCount === o.pageCount ? d : { ...d, versionId: o.bookVersionId, pageCount: o.pageCount }));
      })
      .catch(() => live && setSource(null));
    return () => {
      live = false;
    };
  }, [reorder, sourceAsk, story.id, setDraft]);
  const copyOf = reorder && reorderable(source, story.id) ? source : null;
  // a copy's price is asked again for its page count
  useEffect(() => {
    if (!copyOf) return;
    let live = true;
    checkPrintOrder({ pageCount: copyOf.pageCount })
      .then((c) => live && setDraft((d) => ({ ...d, copyCents: c.copyCents })))
      .catch(() => {
        /* the Pay step's preview has the real total */
      });
    return () => {
      live = false;
    };
  }, [copyOf, setDraft]);

  // The pages the family looked through, kept while the flow is open (going back to step 1 shows them again).
  const [prepared, setPrepared] = useState<PreparedBookPdfs | null>(null);
  const preparedRef = useRef<PreparedBookPdfs | null>(null);
  const keepPrepared = (p: PreparedBookPdfs | null) => {
    if (preparedRef.current && preparedRef.current !== p) revokeBookPages(preparedRef.current);
    preparedRef.current = p;
    setPrepared(p);
  };
  useEffect(() => () => revokeBookPages(preparedRef.current), []);

  // a refusal from the server about one address, carried back to its card on the Send step
  const [sendProblem, setSendProblem] = useState<CardProblem | null>(null);

  const asked = params.get("step");
  // Send and Pay need an approved book; without one (a new tab, a link typed in), the flow starts at the review.
  // More copies have no review: the book was approved with the first order, so they start at Send.
  const step: Step = reorder
    ? asked === "pay" && draft.versionId
      ? "pay"
      : "send"
    : isStep(asked) && (asked === "review" || draft.versionId)
      ? asked
      : "review";
  const canceled = params.get("canceled") === "1";
  const query = useCallback((to: Step): Record<string, string> => (reorder ? { story: story.id, reorder, step: to } : { story: story.id, step: to }), [story.id, reorder]);
  const go = useCallback(
    (to: Step, replace = false) => {
      setParams(query(to), { replace });
      window.scrollTo({ top: 0 });
    },
    [setParams, query],
  );
  // ?reorder=…&step=review (or no step) is Send, and the address bar says so
  useEffect(() => {
    if (reorder && asked !== "send" && asked !== "pay") setParams(query("send"), { replace: true });
  }, [reorder, asked, setParams, query]);
  const stepUrl = (to: Step) => `/book/order?${new URLSearchParams(query(to))}`;
  const back = reorder ? (step === "pay" ? stepUrl("send") : `/book/orders/${encodeURIComponent(reorder)}`) : step === "review" ? "/book" : stepUrl(step === "pay" ? "send" : "review");
  const steps = reorder ? STEPS.filter((s) => s.id !== "review") : STEPS;

  useEffect(() => {
    document.title = `Order ${name}’s book · A Story`;
  }, [name]);

  const at = Math.max(0, steps.findIndex((s) => s.id === step));
  const hero = reorder ? (
    <div className="bo-hero">
      <h1 className="hero-title">
        More copies of the same book
        <Stop />
      </h1>
      {copyOf && <p className="bo-promise">The book you approved, {copyOf.pageCount} pages. Nothing in it changes.</p>}
    </div>
  ) : (
    <div className="bo-hero">
      <h1 className="hero-title">
        A printed copy of {book}
        <Stop />
      </h1>
      {check?.orderingOpen && (
        <p className="bo-promise">
          Step {at + 1} of 3: {STEPS[at].name}
        </p>
      )}
    </div>
  );

  const shell = (children: React.ReactNode, extra = "") => (
    <Shell compact tone="teal" back={back} title="Order the book" hero={hero}>
      <div className={`page bo-page bo-flow ${extra}`}>{children}</div>
    </Shell>
  );

  if (check === undefined || (reorder && source === undefined))
    return shell(
      <div aria-busy="true">
        <LoadingMark />
      </div>,
    );
  if (check === null) return shell(<Problem message="We couldn’t reach A Story just now. Check the connection and try again." onRetry={() => setAsk((n) => n + 1)} />);
  if (!check.orderingOpen)
    return shell(
      <>
        <h2>Printed books are coming</h2>
        <p>Ordering isn’t open yet. Until it is, {name}’s book prints at home, from the Book page.</p>
        <ButtonLink to="/book">Back to the book</ButtonLink>
      </>,
      "bo-closed",
    );

  if (reorder && !copyOf)
    return shell(
      <section className="bo-section">
        <h2>We can’t copy that order</h2>
        <p className="bo-lead" role="alert">
          {PRINT_ORDER_MESSAGES.bad_reorder}
        </p>
        <p className="bo-acts">
          <ButtonLink to="/book">Back to the book</ButtonLink>
          <Button variant="outline" onClick={() => setSourceAsk((n) => n + 1)}>
            Try again
          </Button>
        </p>
      </section>,
    );

  return shell(
    <>
      <ol className={`bo-steps-bar${reorder ? " bo-steps-two" : ""}`} aria-label={reorder ? "Ordering, in two steps" : "Ordering, in three steps"}>
        {steps.map((s, i) => (
          <li key={s.id} aria-current={i === at ? "step" : undefined} data-done={i < at || undefined}>
            <span aria-hidden="true">{i + 1}</span> {s.name}
          </li>
        ))}
      </ol>
      {step === "review" && (
        <ReviewStep
          story={story}
          book={book}
          draft={draft}
          prepared={prepared}
          onPrepared={keepPrepared}
          onApproved={(v) => {
            setDraft((d) => ({ ...d, ...v }));
            go("send");
          }}
          onAgain={() => {
            keepPrepared(null);
            setDraft((d) => ({ ...d, versionId: null, pageCount: null, copyCents: null }));
          }}
          onNext={() => go("send")}
        />
      )}
      {step === "send" && (
        <SendStep
          story={story}
          check={check}
          copyCents={reorder ? draft.copyCents : null}
          cards={draft.cards}
          problem={sendProblem}
          onDone={(cards) => {
            setSendProblem(null);
            setDraft((d) => ({ ...d, cards }));
            go("pay");
          }}
          onCards={(cards) => setDraft((d) => ({ ...d, cards }))}
        />
      )}
      {step === "pay" && (
        <PayStep
          draft={draft}
          reorderOf={reorder}
          canceled={canceled}
          onAddresses={(p) => {
            setSendProblem(p ?? null);
            go("send");
          }}
          onReview={
            reorder
              ? undefined
              : () => {
                  setDraft((d) => ({ ...d, versionId: null, pageCount: null, copyCents: null }));
                  go("review");
                }
          }
        />
      )}
    </>,
  );
}

/* ── Step 1: Review your book ───────────────────────────────────────────── */

type Approved = { versionId: string; pageCount: number; copyCents: number | null };

function ReviewStep({
  story,
  book,
  draft,
  prepared,
  onPrepared,
  onApproved,
  onAgain,
  onNext,
}: {
  story: Story;
  book: string;
  draft: Draft;
  prepared: PreparedBookPdfs | null;
  onPrepared: (p: PreparedBookPdfs | null) => void;
  onApproved: (v: Approved) => void;
  onAgain: () => void;
  onNext: () => void;
}) {
  const capable = useMemo(() => isPrintCapableBrowser(), []);
  // "making" while the book is laid out and saved; "ready" to look through and approve; "blocked" when it can't print
  const [phase, setPhase] = useState<"idle" | "making" | "ready" | "blocked" | "failed">("idle");
  const [progress, setProgress] = useState("Getting your book ready…");
  const [problem, setProblem] = useState<string | null>(null);
  const [made, setMade] = useState<{ versionId: string; pageCount: number; copyCents: number | null; warnings: string[]; preflight: PreflightResult } | null>(null);
  const [ticked, setTicked] = useState(false);
  const [approving, setApproving] = useState(false);
  const started = useRef(false);

  const make = useCallback(async () => {
    setPhase("making");
    setProblem(null);
    setTicked(false);
    setProgress("Getting your book ready…");
    try {
      const version = await prepareVersion(story.id);
      const sides = await listContributions(story.id, "approved").catch(() => []);
      const files = await prepareBookPdfs(story, story.bookDesign, {
        sides,
        profile: version.printProfile,
        onProgress: (done, total) => setProgress(`Laying out page ${done} of ${total}…`),
      });
      onPrepared(files);
      setProgress("Saving your book’s pages…");
      await uploadVersionPdfs(version.versionId, files);
      const memories = story.memories.map((m) => ({ id: m.id, title: m.title, hasAudio: (m.audio || []).length > 0 }));
      const found = (preflightBook as (args: Record<string, unknown>) => unknown)({
        profile: version.printProfile,
        pageCount: files.plan.rendered,
        photos: files.photos,
        qrCodes: [],
        memories,
        listenBase: listenBase(),
        listenKey: version.listenKey,
      }) as PreflightResult & { blocking: { words: string }[]; warnings: { kind: string; words: string; memoryId?: string | null }[] };
      if (!found.ok) {
        setProblem(found.blocking[0]?.words || "This book can’t be printed as it is.");
        setPhase("blocked");
        return;
      }
      const copy = await checkPrintOrder({ pageCount: files.plan.pages }).catch(() => null);
      setMade({ versionId: version.versionId, pageCount: files.plan.pages, copyCents: copy?.copyCents ?? null, warnings: groupWarnings(found.warnings, memories), preflight: found });
      setPhase("ready");
    } catch (err) {
      const blocked = err instanceof PrintPdfError && (err.problem === "too_many_pages" || err.problem === "empty");
      setProblem(err instanceof PrintPdfError || err instanceof BookVersionError ? err.message : "We couldn’t get the book ready. Please try again.");
      setPhase(blocked ? "blocked" : "failed");
    }
  }, [story, onPrepared]);

  useEffect(() => {
    if (draft.versionId || !capable || started.current) return;
    started.current = true;
    void make();
  }, [draft.versionId, capable, make]);

  const approve = async () => {
    if (!made || !ticked || approving) return;
    setApproving(true);
    setProblem(null);
    try {
      await approveVersion({ versionId: made.versionId, pageCount: made.pageCount, preflight: made.preflight, confirmed: true });
      onApproved({ versionId: made.versionId, pageCount: made.pageCount, copyCents: made.copyCents });
    } catch (err) {
      setProblem((err as Error).message || "We couldn’t lock the book for printing. Please try again.");
      setApproving(false);
    }
  };

  // Already looked through and approved in this tab: no need to do it again.
  if (draft.versionId) {
    return (
      <section className="bo-section" aria-labelledby="bo-review-h">
        <h2 id="bo-review-h">You’ve approved {book}</h2>
        {prepared && <BookFlip pages={prepared.pages} cover={prepared.coverPage} title={book} />}
        <BookFacts pages={draft.pageCount} copyCents={draft.copyCents} />
        <p className="bo-help">It’s locked for printing exactly as you saw it.</p>
        <div className="bo-next">
          <Button block onClick={onNext}>
            Continue
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => {
              started.current = false;
              onAgain();
            }}
          >
            Make the book again from the latest memories
          </Button>
        </div>
      </section>
    );
  }

  if (!capable)
    return (
      <section className="bo-section">
        <h2>Please use Chrome or the app</h2>
        <p className="bo-lead">{PRINT_BROWSER_MESSAGE}</p>
        <ButtonLink to="/book">Back to the book</ButtonLink>
      </section>
    );

  if (phase === "making" || phase === "idle")
    return (
      <section className="bo-section bo-making" aria-busy="true">
        <h2>Getting {book} ready to print</h2>
        <LoadingMark />
        <p className="bo-lead" role="status">
          {progress}
        </p>
        <p className="bo-help">A long book takes a few minutes. Please keep this page open.</p>
      </section>
    );

  if (phase === "blocked" || phase === "failed")
    return (
      <section className="bo-section">
        <h2>{phase === "blocked" ? "This book can’t be printed yet" : "We couldn’t get the book ready"}</h2>
        <p className="bo-lead" role="alert">
          {problem}
        </p>
        {phase === "failed" ? (
          <Button onClick={() => void make()}>Try again</Button>
        ) : (
          <ButtonLink to="/book/design">Change what goes in the book</ButtonLink>
        )}
      </section>
    );

  return (
    <section className="bo-section" aria-labelledby="bo-review-h">
      <h2 id="bo-review-h">Look through {book}</h2>
      <p className="bo-help">These are the exact pages that will be printed.</p>
      {prepared && <BookFlip pages={prepared.pages} cover={prepared.coverPage} title={book} />}
      <BookFacts pages={made?.pageCount ?? null} copyCents={made?.copyCents ?? null} />
      {made && made.warnings.length > 0 && (
        <div className="bo-warnings">
          <h3>Worth a look before you print</h3>
          <ul>
            {made.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p className="bo-help">None of these stop the book from printing.</p>
        </div>
      )}
      <div className="bo-approve">
        <Checkbox checked={ticked} onChange={setTicked}>
          {APPROVE_CHECKBOX_TEXT}
        </Checkbox>
      </div>
      {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}
      <Button block onClick={approve} disabled={!ticked} loading={approving}>
        Continue
      </Button>
    </section>
  );
}

function BookFacts({ pages, copyCents }: { pages: number | null; copyCents: number | null }) {
  if (!pages) return null;
  return (
    <dl className="bo-facts">
      <div>
        <dt>Pages</dt>
        <dd>Your book has {pages} pages</dd>
      </div>
      {copyCents !== null && (
        <div>
          <dt>Price</dt>
          <dd>Each copy: {price(copyCents)}</dd>
        </div>
      )}
    </dl>
  );
}

/* ── Step 2: Who should receive it ─────────────────────────────────────── */

const FIELD_LABELS: Record<Exclude<PrintField, "state">, { label: string; auto: string; optional?: boolean; type?: string; inputMode?: "numeric" | "tel" }> = {
  name: { label: "Their name", auto: "shipping name" },
  line1: { label: "Street address", auto: "shipping address-line1" },
  line2: { label: "Apartment or floor (if any)", auto: "shipping address-line2", optional: true },
  city: { label: "City", auto: "shipping address-level2" },
  postal: { label: "ZIP code", auto: "shipping postal-code", inputMode: "numeric" },
  phone: { label: "Phone, for the courier (optional)", auto: "shipping tel", optional: true, type: "tel", inputMode: "tel" },
};

function SendStep({
  story,
  check,
  copyCents = null,
  cards: kept,
  problem,
  onCards,
  onDone,
}: {
  story: Story;
  check: PrintCheck;
  /** More copies: one copy's price, shown above the addresses (P5-R14). */
  copyCents?: number | null;
  cards: Card[];
  problem: CardProblem | null;
  onCards: (c: Card[]) => void;
  onDone: (c: Card[]) => void;
}) {
  const { user } = useAuth();
  const { family } = useAccount();
  const [saved, setSaved] = useState<Record<string, PrintAddress>>(readSaved);
  const choices = useMemo(() => shipChoices<PrintAddress>({ story, people: family?.people ?? [], me: user ?? null, saved }), [story, family, user, saved]);
  const maxCopies = check.product?.maxCopiesPerShipment ?? MAX_COPIES_PER_ADDRESS;
  const maxCards = check.product?.maxShipments ?? MAX_ADDRESSES;

  const fresh = useCallback(
    (pick: string): Card => {
      const c = choices.find((x) => x.key === pick);
      return { id: newCardId(), pick, quantity: 1, address: c?.address ? { ...c.address } : { ...blankAddress(), name: pick === "other" || !c ? "" : c.name } };
    },
    [choices],
  );
  const [cards, setCardsState] = useState<Card[]>(() => (kept.length ? kept : [fresh(choices[0]?.key ?? "other")]));
  const setCards = (next: Card[]) => {
    setCardsState(next);
    onCards(next);
  };
  const [bad, setBad] = useState<CardProblem | null>(problem);
  const list = useRef<HTMLDivElement>(null);

  const update = (i: number, patch: Partial<Card>) => {
    setCards(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)));
    if (bad?.index === i) setBad(null);
  };
  const setField = (i: number, field: PrintField, value: string) => update(i, { address: { ...cards[i].address, [field]: value } });

  const focusProblem = (p: CardProblem) =>
    requestAnimationFrame(() => {
      const card = list.current?.querySelectorAll<HTMLElement>(".bo-card")[p.index];
      const target = card?.querySelector<HTMLElement>(p.field ? `[data-field="${p.field}"]` : "input") ?? card;
      target?.focus();
      card?.scrollIntoView({ block: "nearest" });
    });

  const add = () => {
    if (cards.length >= maxCards) return;
    // the next person not yet on a card, or someone new
    const used = new Set(cards.map((c) => c.pick));
    const next = choices.find((c) => c.key !== "other" && !used.has(c.key))?.key ?? "other";
    setCards([...cards, fresh(next)]);
    requestAnimationFrame(() => {
      const all = list.current?.querySelectorAll<HTMLElement>(".bo-card");
      all?.[all.length - 1]?.querySelector<HTMLElement>("input")?.focus();
    });
  };

  const done = () => {
    const out = validateShipments(cards.map((c) => ({ quantity: c.quantity, address: c.address })));
    if (!out.ok) {
      const p = { index: out.index ?? 0, field: out.field ?? null, message: out.message };
      setBad(p);
      focusProblem(p);
      return;
    }
    // each address is kept on this computer under the pick it was typed for, so the next copy needs no retyping
    const next = { ...saved };
    const tidied = cards.map((c, i) => ({ ...c, address: out.shipments[i].address }));
    for (const c of tidied) next[c.pick === "other" ? "other" : c.pick] = c.address;
    setSaved(next);
    writeSaved(next);
    setBad(null);
    onDone(tidied);
  };

  return (
    <section className="bo-section" aria-labelledby="bo-send-h">
      <h2 id="bo-send-h">Who should receive it</h2>
      {copyCents !== null && <p className="bo-lead">Each copy: {price(copyCents)}</p>}
      <p className="bo-help">We send printed books to addresses in the United States.</p>
      <div className="bo-cards" ref={list}>
        {cards.map((card, i) => {
          const who = choices.find((c) => c.key === card.pick);
          const first = card.address.name.trim().split(/\s+/)[0] || (card.pick === "other" ? "" : who?.first) || "";
          const heading = first ? `For ${first}` : cards.length > 1 ? `Address ${i + 1}` : "Their address";
          const err = (f: PrintField) => (bad?.index === i && bad.field === f ? bad.message : null);
          const cardWide = bad?.index === i && (!bad.field || bad.field === "quantity") ? bad.message : null;
          return (
            <fieldset key={card.id} className="bo-card" aria-labelledby={`${card.id}-h`}>
              <legend className="sr-only">{heading}</legend>
              <div className="bo-card-head">
                <h3 id={`${card.id}-h`}>{heading}</h3>
                <div className="bo-stepper" role="group" aria-label={`Copies ${first ? `for ${first}` : "to this address"}`}>
                  <button type="button" onClick={() => update(i, { quantity: Math.max(1, card.quantity - 1) })} disabled={card.quantity <= 1} aria-label="One fewer copy">
                    −
                  </button>
                  <output aria-live="polite" data-field="quantity" tabIndex={-1}>
                    {card.quantity} {card.quantity === 1 ? "copy" : "copies"}
                  </output>
                  <button type="button" onClick={() => update(i, { quantity: Math.min(maxCopies, card.quantity + 1) })} disabled={card.quantity >= maxCopies} aria-label="One more copy">
                    +
                  </button>
                </div>
              </div>

              <div className="bo-picks" role="radiogroup" aria-label="Send it to">
                {choices.map((c) => (
                  <label key={c.key} className="bo-pick" data-on={c.key === card.pick || undefined}>
                    <input
                      className="sr-only"
                      type="radio"
                      name={`${card.id}-pick`}
                      value={c.key}
                      checked={c.key === card.pick}
                      onChange={() => {
                        const f = fresh(c.key);
                        update(i, { pick: c.key, address: f.address });
                      }}
                    />
                    {c.key === "other" ? "Someone else" : c.name}
                  </label>
                ))}
              </div>

              {cardWide && (
                <p className="bo-card-problem" role="alert">
                  {cardWide}
                </p>
              )}

              {(["name", "line1", "line2", "city"] as const).map((f) => (
                <Field
                  key={f}
                  label={FIELD_LABELS[f].label}
                  name={f}
                  data-field={f}
                  autoComplete={FIELD_LABELS[f].auto}
                  value={card.address[f]}
                  onChange={(e) => setField(i, f, e.target.value)}
                  error={err(f)}
                />
              ))}
              <div className="bo-two">
                <label className="field">
                  <span>State</span>
                  <span className="input" style={err("state") ? { borderColor: "var(--danger)" } : undefined}>
                    <select
                      name="state"
                      data-field="state"
                      autoComplete="shipping address-level1"
                      value={card.address.state}
                      onChange={(e) => setField(i, "state", e.target.value)}
                      aria-invalid={err("state") ? true : undefined}
                    >
                      <option value="">Choose a state</option>
                      {Object.entries(US_STATES).map(([code, n]) => (
                        <option key={code} value={code}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </span>
                  {err("state") && (
                    <span className="hint bo-error" role="alert">
                      {err("state")}
                    </span>
                  )}
                </label>
                <Field
                  label={FIELD_LABELS.postal.label}
                  name="postal"
                  data-field="postal"
                  inputMode="numeric"
                  autoComplete={FIELD_LABELS.postal.auto}
                  value={card.address.postal}
                  onChange={(e) => setField(i, "postal", e.target.value)}
                  error={err("postal")}
                />
              </div>
              <Field
                label={FIELD_LABELS.phone.label}
                name="phone"
                data-field="phone"
                type="tel"
                inputMode="tel"
                autoComplete={FIELD_LABELS.phone.auto}
                value={card.address.phone}
                onChange={(e) => setField(i, "phone", e.target.value)}
                error={err("phone")}
              />
              {cards.length > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCards(cards.filter((_, j) => j !== i));
                    setBad(null);
                  }}
                >
                  Remove this address
                </Button>
              )}
            </fieldset>
          );
        })}
      </div>

      {cards.length < maxCards && (
        <Button variant="outline" block onClick={add}>
          Add another copy for someone else
        </Button>
      )}
      <p className="bo-help">Addresses are kept on this computer, so the next copy needs no retyping.</p>
      <div className="bo-next">
        <Button block onClick={done}>
          Continue
        </Button>
      </div>
    </section>
  );
}

/* ── Step 3: Pay ────────────────────────────────────────────────────────── */

function PayStep({
  draft,
  reorderOf = null,
  canceled,
  onAddresses,
  onReview,
}: {
  draft: Draft;
  reorderOf?: string | null;
  canceled: boolean;
  onAddresses: (p?: CardProblem) => void;
  /** Look through the book again; none for more copies, whose book is already locked. */
  onReview?: () => void;
}) {
  const navigate = useNavigate();
  const checked = useMemo(() => validateShipments(draft.cards.map((c) => ({ quantity: c.quantity, address: c.address }))), [draft.cards]);
  const shipments: Shipment[] | null = checked.ok ? checked.shipments : null;
  const [preview, setPreview] = useState<PrintPreview | null | undefined>(undefined);
  const [problem, setProblem] = useState<PrintOrderError | null>(null);
  const [ask, setAsk] = useState(0);
  const [busy, setBusy] = useState(false);
  // the order the server made, when its total came out different from the one shown: the next press goes on with it
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    if (!shipments || !draft.versionId) return;
    let live = true;
    previewPrintOrder({ versionId: draft.versionId, shipments, reorderOf })
      .then((p) => {
        if (!live) return;
        setPreview(p);
        setProblem(null);
      })
      .catch((err) => {
        if (!live) return;
        setPreview(null);
        setProblem(err instanceof PrintOrderError ? err : new PrintOrderError("unknown"));
      });
    return () => {
      live = false;
    };
  }, [draft.versionId, shipments, reorderOf, ask]);

  if (!shipments)
    return (
      <section className="bo-section">
        <h2>Where should it go?</h2>
        <p className="bo-lead">{checked.ok ? "" : checked.message}</p>
        <Button onClick={() => onAddresses()}>Add the address</Button>
      </section>
    );

  const pay = async () => {
    if (!preview || busy || !draft.versionId) return;
    setBusy(true);
    setProblem(null);
    try {
      const order = placed ?? (await placePrintOrder({ versionId: draft.versionId, shipments, returnTo: `${window.location.origin}/book/thanks`, reorderOf }));
      if (order.paid) {
        navigate(`/book/orders/${encodeURIComponent(order.orderId)}?placed=1`);
        return;
      }
      if (!placed && order.totalCents !== preview.totalCents) {
        // the server's price moved since the total was shown: show the new one, and wait for a second press
        setPreview({ ...preview, totalCents: order.totalCents, lines: order.lines.length ? order.lines : preview.lines, delivery: order.delivery ?? preview.delivery, coveredByCredits: false });
        setPlaced(order);
        setBusy(false);
        return;
      }
      // the page stays busy while the browser goes
      window.location.assign(order.checkoutUrl!);
    } catch (err) {
      setProblem(err instanceof PrintOrderError ? err : new PrintOrderError("unknown"));
      setBusy(false);
    }
  };

  const recipients = shipments.map((s) => `${s.quantity} ${s.quantity === 1 ? "copy" : "copies"} to ${s.address.name}, ${s.address.city}`);
  const covered = !!preview && preview.totalCents === 0;
  const arrives = preview ? arrivesWords(preview.delivery) : null;

  return (
    <section className="bo-section" aria-labelledby="bo-pay-h">
      <h2 id="bo-pay-h">Your order</h2>
      {canceled && (
        <p className="bo-note-line" role="status">
          Nothing was charged. Your order is here when you’re ready.
        </p>
      )}
      {preview === undefined && !problem && (
        <div aria-busy="true">
          <LoadingMark />
          <p className="bo-help">Working out the total…</p>
        </div>
      )}
      {problem && (
        <div className="bo-problem">
          <Problem message={problem.message} onRetry={problem.reason === "network" || problem.reason === "unknown" ? () => setAsk((n) => n + 1) : undefined} />
          {problem.reason === "address" && (
            <Button onClick={() => onAddresses(problem.index !== null ? { index: problem.index, field: (problem.code && FIELD_OF_ERROR[problem.code]) || null, message: problem.message } : undefined)}>
              Change the address
            </Button>
          )}
          {problem.reason === "needs_review" && onReview && <Button onClick={onReview}>Look through the book again</Button>}
          {(problem.reason === "bad_reorder" || (problem.reason === "needs_review" && !onReview)) && <ButtonLink to="/book">Back to the book</ButtonLink>}
        </div>
      )}
      {preview && (
        <div className="bo-summary">
          <dl>
            {preview.lines.map((l: OrderLine, i) => (
              <div key={`${l.kind}-${i}`} className="bo-line" data-kind={l.kind}>
                <dt>{lineLabel(l)}</dt>
                <dd>{money(l.amountCents)}</dd>
              </div>
            ))}
            <div className="bo-line bo-total">
              <dt>Total</dt>
              <dd>{covered ? coveredWords(preview.lines) : money(preview.totalCents)}</dd>
            </div>
          </dl>
          <ul className="bo-recipients">
            {recipients.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {arrives && <p className="bo-arrives">{arrives}</p>}
          {placed && (
            <p className="bo-note-line" role="status">
              The total has changed to {money(placed.totalCents)}. Please check it, then press Pay again.
            </p>
          )}
          <Button block onClick={pay} loading={busy}>
            {covered ? "Place my order" : `Pay ${money(preview.totalCents)}`}
          </Button>
          <p className="bo-help bo-center">
            {covered
              ? "Nothing to pay. We wait an hour before printing, in case anything needs changing."
              : "You’ll pay on a secure payment page, then come straight back here. We wait an hour before printing, in case anything needs changing."}
          </p>
        </div>
      )}
    </section>
  );
}
