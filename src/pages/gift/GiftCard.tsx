/**
 * The gift card: a sheet of the book's paper with a foil rule, "Dear Hien,",
 * the note written on it in the book's face, signed in the hand, the first
 * question under the rule, and, once it is paid, the code and a QR code
 * that opens it. The same card is the live preview on /gift, the printable
 * card on /gift/thanks, and what the recipient opens on /gift/redeem. It
 * never carries a price.
 */
import QrCode from "../../components/QrCode";
import { smarten } from "../../lib/typography";
import { firstName, spacedGiftCode } from "./giftWords";

type Props = {
  to: string;
  from: string;
  note: string;
  question: string;
  /** The paid code; without it the card says where the code will go. */
  code?: string;
  /** Where the QR code points (the redeem page). */
  link?: string;
  /** A preview being written: empty parts show what goes there, faintly. */
  draft?: boolean;
};

export default function GiftCard({ to, from, note, question, code, link, draft }: Props) {
  const name = firstName(to);
  const signer = firstName(from);
  return (
    <article className={`gift-card${draft ? " is-draft" : ""}`} aria-label={name ? `The card for ${name}` : "The card"}>
      <p className="gift-card-kicker">A Story · a gift</p>
      <p className="gift-card-dear">Dear {name || "…"},</p>
      <p className={`gift-card-note${note.trim() ? "" : " faint"}`}>{note.trim() ? smarten(note.trim()) : draft ? "Your note, written here." : ""}</p>
      {signer ? <p className="gift-card-sign">{signer}</p> : draft ? <p className="gift-card-sign faint">Your name</p> : null}
      <i className="gift-card-rule" aria-hidden="true" />
      <p className="gift-card-said">
        {name ? `I’ve given you a year of A Story: it asks about your life and keeps what you say, in your own words, with a hardcover of the book it makes.` : "A year of A Story, and the book it makes."}
      </p>
      {question.trim() ? (
        <p className="gift-card-q">
          <span>The first thing I’d love to hear</span>
          {smarten(question.trim())}
        </p>
      ) : null}
      <div className="gift-card-open">
        {code ? (
          <>
            <div>
              <p className="gift-card-codehead">To open it</p>
              <p className="gift-card-code" aria-label={`Gift code ${[...code].join(" ")}`}>
                {spacedGiftCode(code)}
              </p>
              <p className="gift-card-where">{link ? link.replace(/^https?:\/\//, "") : "app.astoryapp.com/gift/redeem"}</p>
            </div>
            {link ? <QrCode value={link} label={`A QR code that opens the gift for ${name || "them"}`} size={96} /> : null}
          </>
        ) : (
          <p className="gift-card-where faint">The code that opens it goes here once it’s paid.</p>
        )}
      </div>
    </article>
  );
}
