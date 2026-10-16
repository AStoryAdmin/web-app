/**
 * The left page of the spread: the photograph the family chose, large; the
 * others as polaroids that swap in when clicked; a dashed box to add one.
 * On a phone the large one becomes the header and the polaroids sit in the
 * words (PhonePolaroids), after the first paragraph.
 */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { PhotoIcon } from "../icons";
import { usePhotoUrl } from "../../lib/photoUrls";
import { useHeroArrival, usePolaroidArrival } from "./motion";
import type { Memory, Story } from "../../data/stories";

const TILTS = [-3, 2.5, -1.5, 3, -2.5, 1.5];

function Polaroid({ url, caption, tilt, onPick, label }: { url: string; caption: string; tilt: number; onPick: () => void; label: string }) {
  const src = usePhotoUrl(url);
  return (
    <button type="button" className="polaroid" style={{ ["--tilt" as string]: `${tilt}deg` }} onClick={onPick} aria-label={label} data-polaroid>
      {src ? <img src={src} alt="" loading="lazy" /> : <span className="ph" aria-hidden="true" />}
      <span className="cap">{caption}</span>
    </button>
  );
}

function Hero({ memory, story, shown, paper }: { memory: Memory; story: Story; shown: string | null; paper: string }) {
  const src = usePhotoUrl(shown);
  const img = useRef<HTMLImageElement>(null);
  useHeroArrival(img, src);
  if (!shown) {
    return (
      <div className={`mp-hero mp-nophoto ${paper}`} aria-hidden="true">
        {memory.era}
      </div>
    );
  }
  const alt = `${story.name}'s photograph for "${memory.title || "this memory"}"`;
  return <figure className="mp-hero">{src ? <img ref={img} src={src} alt={alt} key={src} /> : null}</figure>;
}

type Props = { memory: Memory; story: Story; paper: string; photos: string[]; current: string | null; onPick: (url: string) => void };

export default function Photographs({ memory, story, paper, photos, current, onPick }: Props) {
  const strip = useRef<HTMLDivElement>(null);
  const others = photos.filter((p) => p !== current);
  usePolaroidArrival(strip, memory.id);

  return (
    <div className="mp-left">
      <Hero memory={memory} story={story} shown={current} paper={paper} />
      {others.length > 0 && (
        <div className="mp-polaroids" role="group" aria-label="More photographs" ref={strip}>
          {others.map((url, k) => (
            <Polaroid key={url} url={url} tilt={TILTS[k % TILTS.length]} caption={memory.period || ""} onPick={() => onPick(url)} label={`Show photograph ${photos.indexOf(url) + 1} of ${photos.length} large`} />
          ))}
        </div>
      )}
      <Link className="mp-addphoto" to={`/write?edit=${memory.id}&photo=1`}>
        <PhotoIcon />
        {photos.length ? "Add a photograph to this memory" : "Add the first photograph"}
      </Link>
    </div>
  );
}

/** The phone's polaroids, inside the words. */
export function PhonePolaroids({ memory, photos, onPick }: { memory: Memory; photos: string[]; onPick: (url: string) => void }) {
  if (!photos.length) return null;
  return (
    <div className="mp-m-polaroids" role="group" aria-label="More photographs">
      {photos.map((url, k) => (
        <Polaroid key={url} url={url} tilt={TILTS[k % TILTS.length]} caption={memory.period || ""} onPick={() => onPick(url)} label="Show this photograph at the top" />
      ))}
    </div>
  );
}
