/**
 * Ordering the printed book (/book/order?story=…&edition=…): the phone's
 * BookOrderScreen on one sheet. Top to bottom: which edition, with its price;
 * how many; who it is sent to (the storyteller, the family who are grown,
 * you, or someone else), with the addresses kept on this computer once typed;
 * a note for the first page, two lines in the giver's words; the order summed
 * up; then "Pay with Stripe", which goes to Stripe's own page and comes back
 * to /book/thanks. A gift's Classic Hardcover pays for one copy with no
 * checkout at all.
 *
 * The book's print-ready PDF is laid out and filed with the order before the
 * page leaves for Stripe (components/book/printPdf.ts), so every order has its
 * print file. While the server says ordering is closed, the page says so and
 * shows no prices and no form (DECISIONS.md); printing at home stays on /book.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import LoadingMark from "../components/delight/LoadingMark";
import { Avatar, Button, ButtonLink, Field, Problem } from "../components/ui";
import { Stop } from "../components/book/WhereNext";
import { prepareBookPdfs, uploadBookPdfs } from "../components/book/printPdf";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import {
  EDITION_WORDS,
  MAX_COPIES,
  NOTE_MAX,
  SHIP_COUNTRIES,
  addressLines,
  addressShort,
  blankAddress,
  checkBookOrder,
  formatCents,
  giftCreditCovers,
  missingFields,
  orderBook,
  orderShipping,
  orderingOpen,
  quoteOrder,
  shipChoices,
  tidyAddress,
  tidyNote,
  type BookOffer,
  type EditionId,
  type ShipField,
  type ShipTo,
} from "../data/book";
import { listContributions, type Contribution } from "../data/contributions";
import type { Story } from "../data/stories";
import "../styles/pages/book-order.css";

/** The addresses on file, on this computer, by the choice each belongs to (the phone keeps its own). */
const SAVED_KEY = "astory:book-ship-to:v1";

const FIELD_WORDS: Record<ShipField, string> = {
  name: "their name",
  line1: "the street",
  line2: "",
  city: "the city",
  region: "",
  postal: "",
  country: "the country",
  phone: "",
};

function readSaved(): Record<string, ShipTo> {
  try {
    const s = JSON.parse(localStorage.getItem(SAVED_KEY) || "{}");
    return s && typeof s === "object" ? s : {};
  } catch {
    return {};
  }
}

function writeSaved(saved: Record<string, ShipTo>) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  } catch {
    /* a private window: it is simply not kept */
  }
}

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
  return <OrderForm key={story.id} story={story} edition={params.get("edition")} />;
}

function OrderForm({ story, edition: askedEdition }: { story: Story; edition: string | null }) {
  const { user } = useAuth();
  const { family } = useAccount();
  const navigate = useNavigate();
  const name = story.name.trim().split(/\s+/)[0] || story.name;

  // What ordering costs, as the server works it out: undefined while asking, null when it couldn't be asked.
  const [offer, setOffer] = useState<BookOffer | null | undefined>(undefined);
  const [ask, setAsk] = useState(0);
  useEffect(() => {
    let live = true;
    checkBookOrder(story.id)
      .then((o) => live && setOffer(o))
      .catch(() => live && setOffer(null));
    return () => {
      live = false;
    };
  }, [story.id, ask]);

  const open = orderingOpen(offer);
  const editions = useMemo(() => (offer?.editions ?? []).filter((e) => e.sale === "stripe"), [offer]);
  // The Classic Hardcover first, unless Order was pressed on another: it's the one most families mean by "the book".
  const [editionId, setEditionId] = useState<EditionId>(() => (askedEdition as EditionId) || "hardcover");
  const edition = editions.find((e) => e.id === editionId) ?? editions.find((e) => e.id === "hardcover") ?? editions[0] ?? null;
  const [copies, setCopies] = useState(1);
  const included = edition?.copiesIncluded ?? 1;
  const quote = edition ? quoteOrder(edition, copies) : null;
  const credited = !!edition && giftCreditCovers({ credits: offer?.credits ?? 0, edition: edition.id, copies });

  // Send it to. The addresses on file load once; the one being typed is kept per choice, so switching and back loses nothing.
  const [saved, setSaved] = useState<Record<string, ShipTo>>(readSaved);
  const choices = useMemo(() => shipChoices({ story, people: family?.people ?? [], me: user ?? null, saved }), [story, family, user, saved]);
  const [toKey, setToKey] = useState<string | null>(null);
  const to = choices.find((c) => c.key === toKey) ?? choices[0];
  const [typed, setTyped] = useState<Record<string, ShipTo>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const onFile = to.address;
  const showForm = !onFile || !!editing[to.key];
  const address = typed[to.key] ?? onFile ?? { ...blankAddress(), name: to.key === "other" ? "" : to.name };
  const setAddr = (patch: Partial<ShipTo>) => {
    setTyped((t) => ({ ...t, [to.key]: { ...address, ...patch } }));
    // a field once filled in stops asking for itself
    setMissing((m) => m.filter((k) => !(k in patch)));
  };
  const [missing, setMissing] = useState<ShipField[]>([]);
  const form = useRef<HTMLDivElement>(null);

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  // "Laying the book out for the printer…" while the print files are made, before the order starts
  const [laying, setLaying] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // the family's approved pages, printed with the book as in the preview and at home (Book.tsx)
  const [sides, setSides] = useState<Contribution[]>([]);

  useEffect(() => {
    let live = true;
    listContributions(story.id, "approved")
      .then((rows) => live && setSides(rows))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [story.id]);

  useEffect(() => {
    document.title = `Order ${name}’s book · A Story`;
  }, [name]);

  const keepOnFile = (a: ShipTo) => {
    const next = { ...saved, [to.key]: a };
    setSaved(next);
    writeSaved(next);
    setEditing((e) => ({ ...e, [to.key]: false }));
  };

  const pay = async () => {
    if (!edition || !quote || busy) return;
    const shipping = orderShipping({ address, note });
    if (!shipping) {
      const miss = missingFields(tidyAddress(address));
      setMissing(miss);
      setEditing((e) => ({ ...e, [to.key]: true }));
      // the first field still empty, once the form is drawn
      requestAnimationFrame(() => form.current?.querySelector<HTMLInputElement>(`[name="${miss[0]}"]`)?.focus());
      return;
    }
    setMissing([]);
    keepOnFile(shipping.shipTo);
    setProblem(null);
    setBusy(true);
    try {
      // The print files are made and checked first, so an order is never placed for a book the printer can't take
      // (PrintPdfError, whose message is for a person).
      setLaying("Laying the book out for the printer…");
      const files = await prepareBookPdfs(story, story.bookDesign, {
        sides,
        onProgress: (done, total) => setLaying(`Laying the book out for the printer: page ${done} of ${total}…`),
      });
      setLaying(null);
      const started = await orderBook(story.id, { edition: edition.id, copies, shipTo: shipping.shipTo, note: shipping.note, returnTo: `${window.location.origin}/book/thanks` });
      // Filed with the order before the page leaves for Stripe: a page that has gone can't finish an upload.
      // Best-effort, as on the phone: the order stands, and the files can be laid out again from the design.
      await uploadBookPdfs(started.orderId, files).catch((e) => console.warn("book order pdf:", e));
      // the thanks page counts the order (book_ordered) once it reads it paid
      if (started.paidWithCredit) {
        navigate(`/book/thanks?order=${encodeURIComponent(started.orderId)}`);
        return;
      }
      // the page stays busy while the browser goes
      window.location.assign(started.checkoutUrl!);
    } catch (err) {
      const reason = (err as { reason?: string }).reason;
      setLaying(null);
      setProblem((err as Error).message || "We couldn’t start the order. Please try again.");
      setBusy(false);
      // the server said something about the offer (closed, a credit just used): ask it again
      if (reason) setAsk((n) => n + 1);
    }
  };

  const hero = (
    <div className="bo-hero">
      <h1 className="hero-title">
        A printed copy, sent to someone
        <Stop />
      </h1>
      <p className="bo-promise">Bound, and posted to the door you choose.</p>
    </div>
  );

  if (offer === undefined)
    return (
      <Shell compact tone="teal" back="/book" title="Order the book" hero={hero}>
        <div className="page bo-page" aria-busy="true">
          <LoadingMark />
        </div>
      </Shell>
    );

  if (offer === null)
    return (
      <Shell compact tone="teal" back="/book" title="Order the book" hero={hero}>
        <div className="page bo-page">
          <Problem message="We couldn’t reach the printer just now. Check the connection and try again." onRetry={() => setAsk((n) => n + 1)} />
        </div>
      </Shell>
    );

  if (!open || !edition || !quote)
    return (
      <Shell compact tone="teal" back="/book" title="Order the book" hero={hero}>
        <div className="page bo-page bo-closed">
          <h2>Printed editions are coming</h2>
          <p>Ordering isn’t open yet. Until it is, {name}’s book prints at home, from the Book page.</p>
          <ButtonLink to="/book">Back to the book</ButtonLink>
        </div>
      </Shell>
    );

  const country = SHIP_COUNTRIES.find((c) => c.code === address.country) ?? SHIP_COUNTRIES[0];
  const words = (k: ShipField) => (k === "region" ? `the ${country.region.toLowerCase()}` : k === "postal" ? `the ${country.postal === "ZIP" ? "ZIP" : "postal code"}` : FIELD_WORDS[k]);
  const bad = (k: ShipField) => (missing.includes(k) ? `Add ${words(k)}, so the courier can find the door.` : null);
  const first = to.key === "other" ? "them" : to.first;
  const shown = included > 1 ? copies - 1 : copies;
  const step = (d: 1 | -1) => setCopies((n) => Math.min(MAX_COPIES, Math.max(1, n + d)));

  return (
    <Shell compact tone="teal" back="/book" title="Order the book" hero={hero}>
      <div className="page bo-page">
        <section className="bo-section" aria-labelledby="bo-edition-h">
          <h2 id="bo-edition-h">Which edition</h2>
          <div className="bo-editions" role="radiogroup" aria-labelledby="bo-edition-h">
            {editions.map((e) => {
              const on = e.id === edition.id;
              return (
                <label key={e.id} className="bo-edition" data-on={on || undefined}>
                  <input
                    className="sr-only"
                    type="radio"
                    name="edition"
                    value={e.id}
                    checked={on}
                    onChange={() => {
                      setEditionId(e.id);
                      setCopies(1);
                    }}
                  />
                  <span className="bo-edition-name">{EDITION_WORDS[e.id].name}</span>
                  <span className="bo-edition-price">{formatCents(e.priceCents)}</span>
                  <span className="bo-edition-line">{EDITION_WORDS[e.id].delivery}</span>
                </label>
              );
            })}
          </div>

          <div className="bo-copies">
            <span id="bo-copies-l">{included > 1 ? `Extra copies, beyond the ${included}` : "Copies"}</span>
            <div className="bo-stepper" role="group" aria-labelledby="bo-copies-l">
              <button type="button" onClick={() => step(-1)} disabled={copies <= 1} aria-label="One fewer copy">
                −
              </button>
              <output aria-live="polite">{shown}</output>
              <button type="button" onClick={() => step(1)} disabled={copies >= MAX_COPIES} aria-label="One more copy">
                +
              </button>
            </div>
          </div>
        </section>

        <section className="bo-section" aria-labelledby="bo-to-h">
          <h2 id="bo-to-h">Send it to</h2>
          <div className="bo-people" role="radiogroup" aria-labelledby="bo-to-h">
            {choices.map((c) => (
              <label key={c.key} className="bo-person" data-on={c.key === to.key || undefined}>
                <input
                  className="sr-only"
                  type="radio"
                  name="ship-to"
                  value={c.key}
                  checked={c.key === to.key}
                  onChange={() => {
                    setToKey(c.key);
                    setMissing([]);
                  }}
                />
                {c.key === "other" ? (
                  <span className="bo-person-new" aria-hidden="true">
                    +
                  </span>
                ) : (
                  <Avatar name={c.name} size={44} />
                )}
                <span className="bo-person-words">
                  <b>{c.name}</b>
                  <span>{c.address ? "Address on file" : c.relation}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="bo-address" ref={form}>
            {showForm ? (
              <>
                <Field label={to.key === "other" ? "Their name" : "Name on the parcel"} name="name" autoComplete="shipping name" value={address.name} onChange={(e) => setAddr({ name: e.target.value })} error={bad("name")} />
                <Field label="Street address" name="line1" autoComplete="shipping address-line1" value={address.line1} onChange={(e) => setAddr({ line1: e.target.value })} error={bad("line1")} />
                <Field label="Apartment or floor (if any)" name="line2" autoComplete="shipping address-line2" value={address.line2} onChange={(e) => setAddr({ line2: e.target.value })} />
                <Field label="City" name="city" autoComplete="shipping address-level2" value={address.city} onChange={(e) => setAddr({ city: e.target.value })} error={bad("city")} />
                <div className="bo-two">
                  <Field label={country.region} name="region" autoComplete="shipping address-level1" value={address.region} onChange={(e) => setAddr({ region: e.target.value })} error={bad("region")} />
                  <Field label={country.postal} name="postal" autoComplete="shipping postal-code" value={address.postal} onChange={(e) => setAddr({ postal: e.target.value })} error={bad("postal")} />
                </div>
                <fieldset className="bo-country">
                  <legend>Country</legend>
                  {SHIP_COUNTRIES.map((c) => (
                    <label key={c.code} data-on={c.code === address.country || undefined}>
                      <input className="sr-only" type="radio" name="country" value={c.code} checked={c.code === address.country} onChange={() => setAddr({ country: c.code })} />
                      {c.name}
                    </label>
                  ))}
                </fieldset>
                <Field
                  label="Phone, for the courier (optional)"
                  name="phone"
                  type="tel"
                  autoComplete="shipping tel"
                  value={address.phone}
                  onChange={(e) => setAddr({ phone: e.target.value })}
                  hint={`Kept on this computer, so the next copy for ${first} needs no retyping.`}
                />
                {onFile && (
                  <Button
                    variant="quiet"
                    small
                    onClick={() => {
                      const miss = missingFields(tidyAddress(address));
                      setMissing(miss);
                      if (!miss.length) keepOnFile(tidyAddress(address));
                    }}
                  >
                    Keep this address
                  </Button>
                )}
              </>
            ) : (
              <>
                <address className="bo-label">
                  {addressLines(onFile).map((line, i) => (
                    <span key={i}>{line}</span>
                  ))}
                </address>
                <Button variant="quiet" small onClick={() => setEditing((e) => ({ ...e, [to.key]: true }))}>
                  Change the address
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="bo-section" aria-labelledby="bo-note-h">
          <h2 id="bo-note-h">A note for the first page</h2>
          <p className="bo-help" id="bo-note-help">
            Two lines, printed in your words. Leave it empty and the page stays {name}’s.
          </p>
          <textarea
            className="bo-note"
            aria-labelledby="bo-note-h"
            aria-describedby="bo-note-help"
            rows={3}
            value={note}
            maxLength={NOTE_MAX + 40}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => setNote((v) => tidyNote(v))}
            placeholder={to.key === "me" ? "For our family, in their own words." : `For ${first}. Every word is ${name}’s.`}
          />
          {note.length > NOTE_MAX - 30 && <p className="bo-help">{Math.max(0, NOTE_MAX - note.length)} letters left</p>}
        </section>

        <section className="bo-section bo-summary" aria-labelledby="bo-sum-h">
          <h2 id="bo-sum-h">Your order</h2>
          <dl>
            {quote.lines.map((l) => (
              <div key={l.label} className="bo-line">
                <dt>{l.qty > 1 ? `${l.label} × ${l.qty}` : l.label}</dt>
                <dd>{formatCents(l.unitCents * l.qty)}</dd>
              </div>
            ))}
            <div className="bo-line bo-soft">
              <dt>{addressShort(address) ? `To ${addressShort(address)}` : `To ${to.key === "other" ? "someone" : to.first}, address to come`}</dt>
            </div>
            <div className="bo-line bo-soft">
              <dt>{tidyNote(note) ? "With your note on the first page" : "No note"}</dt>
            </div>
            <div className="bo-line bo-total">
              <dt>Total</dt>
              <dd>{credited ? "Paid with your gift" : formatCents(quote.totalCents)}</dd>
            </div>
          </dl>
          <p className="bo-help">
            Shipping to the US and Canada is in the total. {EDITION_WORDS[edition.id].delivery}.
          </p>

          {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}
          <Button block loading={busy} onClick={pay}>
            {credited ? "Order it, paid with your gift’s hardcover" : `Pay with Stripe · ${formatCents(quote.totalCents)}`}
          </Button>
          {laying && (
            <p className="bo-help bo-center" role="status">
              {laying}
            </p>
          )}
          <p className="bo-help bo-center">{credited ? "Your gift’s hardcover pays for this one, so there is no checkout." : "Stripe takes the payment on its own page, then brings you back here."}</p>
          <p className="bo-help bo-center">
            <Link to="/book/orders" className="more">
              Your orders
            </Link>
          </p>
        </section>
      </div>
    </Shell>
  );
}
