/**
 * How a memory opens on the sheet: the photograph large, as a white-
 * bordered print (16:10, rounded, developing as it loads), or, when there
 * is none, a typed card on the memory's paper with the first sentence set
 * large in the book's display face. Under it the caption band: the title
 * in Cormorant and the dateline on a band of the same paper, with the
 * chapter and the people in it.
 */
import { Link } from "react-router-dom";
import { usePhotoUrl } from "../../lib/photoUrls";
import { Avatar } from "../ui";
import type { Person } from "../../data/family";

function Face({ person }: { person: Person }) {
  const src = usePhotoUrl(person.photo);
  return <Avatar src={src} name={person.givenName || person.familyName || "?"} size={28} />;
}

export function Photograph({ url, paper }: { url: string; paper: string }) {
  const src = usePhotoUrl(url);
  return (
    <figure className={`lead-print${paper ? ` ${paper}` : ""}`}>
      <img className="lead-photo" src={src ?? undefined} alt="" data-develop />
    </figure>
  );
}

/** When there is no photograph the first sentence is the picture. */
export function TypedCard({ line, chapter, paper }: { line: string; chapter: string; paper: string }) {
  return (
    <div className={`lead-typed${paper ? ` ${paper}` : ""}`} aria-hidden="true">
      {chapter && <span className="lead-kicker">{chapter}</span>}
      <p>{line}</p>
    </div>
  );
}

export function CaptionBand({
  title,
  date,
  dated,
  editTo,
  chapter,
  paper,
  people,
  stillWriting,
}: {
  title: string;
  date: string;
  dated: boolean;
  editTo: string;
  chapter: string;
  paper: string;
  people: Person[];
  stillWriting: boolean;
}) {
  return (
    <div className={`lead-caption${paper ? ` ${paper}` : ""}`} data-rise>
      <div className="lead-caption-main">
        <h1 className="lead-title">{title}</h1>
        <p className="lead-date">
          {dated ? <span className="dated">{date}</span> : <Link to={editTo}>No date yet · add one</Link>}
          {chapter && (
            <>
              <i aria-hidden="true">|</i>
              <span>{chapter}</span>
            </>
          )}
          {stillWriting && (
            <>
              <i aria-hidden="true">|</i>
              <span>Still being written up</span>
            </>
          )}
        </p>
      </div>
      {people.length > 0 && (
        <div className="lead-people" aria-label="Who is in this memory">
          {people.map((p) => (
            <Link key={p.id} to={`/family/${p.id}`} className="lead-person">
              <Face person={p} />
              <span>{p.givenName || p.familyName || "Someone"}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
