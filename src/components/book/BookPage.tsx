/**
 * One page of the book on screen, as astoryapp.com/samples prints it:
 * Cormorant Garamond for titles, EB Garamond for the words, Montserrat
 * small caps for the marks and labels, the script for the names. Every
 * size inside a page is in container units, so the page scales like print.
 */
import { usePhotoUrl } from "../../lib/photoUrls";
import QrCode from "../QrCode";
import { LAYERS, type Board, type Page, type Source, type Strip } from "./bookPages";

const PRINT_SPOTS: [number, number, number, number, number][] = [
  [10, 10, 48, 60, -2.5],
  [40, 0, 48, 60, 2],
  [36, 36, 44, 56, -1],
];

function Plate({ url, alt }: { url: string; alt: string }) {
  const src = usePhotoUrl(url);
  return <span className="sb-photo">{src ? <img src={src} alt={alt} loading="lazy" /> : <span className="sb-photo-wait" aria-hidden="true" />}</span>;
}

function Print({ url, i }: { url: string; i: number }) {
  const src = usePhotoUrl(url);
  const [l, t, w, h, r] = PRINT_SPOTS[i] || PRINT_SPOTS[0];
  return (
    <span className="sb-print" style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, transform: `rotate(${r}deg)`, zIndex: [3, 1, 2][i] || 1 }}>
      {src && <img src={src} alt="" />}
    </span>
  );
}

function Layers({ on }: { on: number[] }) {
  return (
    <span className="sb-layers" aria-label={`Story layers on this page: ${LAYERS.filter((_, i) => on.includes(i)).join(", ") || "none"}`}>
      {LAYERS.map((l, i) => (
        <span key={l} className={on.includes(i) ? "on" : ""}>
          <i />
          {l}
        </span>
      ))}
    </span>
  );
}

const SrcTag = ({ source }: { source: Source }) => (
  <span className={`sb-src s-${source.kind}`}>
    <i />
    {source.label}
  </span>
);

const Grain = () => <span className="sb-grain" aria-hidden="true" />;
const Linen = () => <span className="sb-linen" aria-hidden="true" />;
const Mark = ({ w }: { w: number }) => <span className="sb-mark" style={{ width: `${w}cqw`, height: `${(w * 1.1).toFixed(2)}cqw` }} aria-hidden="true" />;
const Folio = ({ n }: { n: number }) => (n > 0 ? <span className="sb-folio">{n}</span> : null);

function StripBlock({ strip }: { strip: Strip }) {
  return (
    <div className="sb-strip">
      <QrCode value={strip.url} label={`A code to scan. ${strip.line}`} />
      <div>
        <div className="tabs">{strip.tabs}</div>
        <p>{strip.line}</p>
        <span className="rec">{strip.rec}</span>
      </div>
    </div>
  );
}

/**
 * A material cover, as the printed book draws it (app-core legacyBook coverHtml): Photo wrap is their photograph
 * across the board with the words at its foot; Photo plate sets one into the linen under the title; Clothbound,
 * Heirloom and every bare board are the foil-blocked board (Heirloom with its second frame).
 */
function BoardCover({ board: b, side, teller }: { board: Board; side: "left" | "right"; teller: string }) {
  const src = usePhotoUrl(b.photo);
  const shape = b.photo ? b.style : "bare";
  const words = (
    <>
      <p className="sb-bd-title">{b.title}</p>
      {shape !== "wrap" && shape !== "tipped" && <span className="sb-bd-rule" aria-hidden="true" />}
      <p className="sb-bd-sub">{b.sub}</p>
    </>
  );
  return (
    <section className={`bk-page ${side} cover sb-board sb-bd-${b.style}${b.photo ? "" : " sb-bd-bare"}`} aria-label="Front cover" style={{ ["--bd-foil" as string]: b.foil, ["--bd-soft" as string]: b.soft }}>
      {shape === "wrap" && <span className="sb-bd-wrap" role="img" aria-label={`${teller}’s photograph`} style={src ? { backgroundImage: `url("${src}")` } : undefined} />}
      {shape !== "wrap" && shape !== "tipped" && <Linen />}
      {shape !== "wrap" && <span className="sb-bd-frame" aria-hidden="true" />}
      {b.style === "heirloom" && shape !== "wrap" && <span className="sb-bd-frame inner" aria-hidden="true" />}
      <div className={shape === "wrap" ? "sb-bd-foot" : "sb-bd-words"}>
        {shape !== "tipped" && <Mark w={shape === "wrap" ? 5 : 8} />}
        {words}
        {shape === "tipped" && (
          <span className="sb-bd-plate" role="img" aria-label={`${teller}’s photograph`}>
            {src && <img src={src} alt="" />}
          </span>
        )}
        {b.span && <p className="sb-bd-span">{b.span}</p>}
      </div>
      <span className="sb-bevel" aria-hidden="true" />
    </section>
  );
}

const quoted = (s: string) => (/^[“"]/.test(s.trim()) ? s : `“${s}”`);

export default function BookPage({ page, side, teller }: { page: Page | null; side: "left" | "right"; teller: string }) {
  if (!page || page.kind === "blank") return <div className={`bk-page ${side} blank`} aria-hidden="true" />;

  if (page.kind === "cover" && page.board) return <BoardCover board={page.board} side={side} teller={teller} />;

  if (page.kind === "cover") {
    const size = Math.min(6.5, 85 / (0.72 * Math.max(10, page.title.length)));
    return (
      <section className={`bk-page ${side} cover`} aria-label="Front cover">
        <Linen />
        <p className="sb-cv-title" style={{ fontSize: `${size.toFixed(2)}cqw` }}>
          {page.title}
        </p>
        <p className="sb-cv-date">{page.line}</p>
        {page.photos.length ? (
          <div className={`sb-cv-collage${page.bw ? " bw" : ""}`} role="img" aria-label={`${teller}’s photographs`}>
            {page.photos.slice(0, 3).map((u, i) => (
              <Print key={`${u}-${i}`} url={u} i={i} />
            ))}
          </div>
        ) : (
          <span className="sb-cv-frame" aria-hidden="true" />
        )}
        <p className="sb-cv-names script">{page.names}</p>
        <p className="sb-cv-motto script">{page.motto}</p>
        <span className="sb-bevel" aria-hidden="true" />
      </section>
    );
  }

  if (page.kind === "back") {
    return (
      <section className={`bk-page ${side} cover back`} aria-label="Back cover">
        <Linen />
        <div className="sb-back-cv">
          <div className="ded">Dedicated to</div>
          <div className="r1" />
          <div className="fam script">{page.fam}</div>
          <div className="q">{quoted(page.quote)}</div>
          <div className="mark">
            <Mark w={4.2} />
          </div>
        </div>
        <span className="sb-bevel" aria-hidden="true" />
      </section>
    );
  }

  if (page.kind === "endpaper") {
    return (
      <section className={`bk-page ${side} endpaper`} aria-label="Endpaper">
        <span className="sb-pattern" aria-hidden="true" />
        <Linen />
      </section>
    );
  }

  if (page.kind === "colophon") {
    return (
      <section className={`bk-page ${side} colophon`} aria-label="Colophon">
        <Grain />
        <div className="sb-pg sb-colophon">
          <div className="sb-body">
            <b>{page.title}</b>
            {page.lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (page.kind === "title") {
    return (
      <section className={`bk-page ${side} titlepage`} aria-label="Title page">
        <Grain />
        <div className="sb-pg sb-titlepg">
          <Mark w={6.5} />
          <div className="t1">{page.t1}</div>
          <div className="t2">{page.t2}</div>
          {page.t3 && <div className="t3 smallcaps">{page.t3}</div>}
          {page.t4 && <div className="t4 smallcaps">{page.t4}</div>}
        </div>
      </section>
    );
  }

  if (page.kind === "dedication") {
    return (
      <section className={`bk-page ${side} dedication`} aria-label="Dedication">
        <Grain />
        <div className="sb-pg sb-ded">
          <div className="dq">{page.text}</div>
          {page.sig && <div className="sig script">{page.sig}</div>}
        </div>
      </section>
    );
  }

  if (page.kind === "contents") {
    return (
      <section className={`bk-page ${side} contents`} aria-label="Contents">
        <Grain />
        <div className="sb-pg">
          <span className="kicker">Contents</span>
          <ol className="sb-toc">
            {page.entries.map((e) => (
              <li key={`${e.num}-${e.name}`}>
                <span className="n">{e.num}</span>
                <span className="t">
                  {e.name}
                  {e.sub && <i>{e.sub}</i>}
                </span>
                <span className="p">{e.page}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  if (page.kind === "opener") {
    return (
      <section className={`bk-page ${side} opener`} aria-label={`${page.chapter}, chapter opener`}>
        <Grain />
        <div className="sb-pg sb-opener">
          <div>
            <span className="kicker">{page.kicker}</span>
            <h2 className="h-chap">{page.chapter}</h2>
          </div>
          <div className="num" aria-hidden="true">
            {page.num}
          </div>
          <div>
            <div className="qlabel">{page.qlabel}</div>
            <div className="question">{page.line}</div>
          </div>
        </div>
        <Folio n={page.folio} />
      </section>
    );
  }

  if (page.kind === "deeper") {
    return (
      <section className={`bk-page ${side} mem deep`} aria-label="Going deeper">
        <Grain />
        <div className="sb-pg sb-deep">
          <div className="sb-mhead">
            <span className="kicker">Going deeper</span>
            <Layers on={page.layers} />
          </div>
          {page.deepQ && (
            <>
              <div className="sb-dlabel">{page.deepLabel}</div>
              <div className="sb-dq">{quoted(page.deepQ)}</div>
              <div className="sb-da">{page.deepA}</div>
            </>
          )}
          <div className="sb-lessonbox">
            <div className="ll">{page.lessonLabel}</div>
            <div className="lt">{page.lesson}</div>
            {page.lessonVi && <div className="lv">{page.lessonVi}</div>}
          </div>
          <div className="sb-passed">
            {page.passed.map(([a, b]) => (
              <div key={a + b}>
                <b>{a}</b>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
        {page.strip && <StripBlock strip={page.strip} />}
        <Folio n={page.folio} />
      </section>
    );
  }

  if (page.kind === "little") {
    return (
      <section className={`bk-page ${side} little`} aria-label={page.title}>
        <Grain />
        <div className="sb-pg sb-little">
          <div className="sb-mhead">
            <span className="kicker">{page.title}</span>
            <span className="sb-src s-little">
              <i />
              Little question
            </span>
          </div>
          <div className="sb-lq-grid">
            {page.items.map(([d, q, a]) => (
              <div key={d + q} className="sb-lq">
                <span className="d">{d}</span>
                <span className="q">{q}</span>
                <span className="a">{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sb-lq-foot">
          <QrCode value={page.url} label="A code to scan: every little question" />
          <p>{page.note}</p>
        </div>
        <Folio n={page.folio} />
      </section>
    );
  }

  if (page.kind === "final") {
    return (
      <section className={`bk-page ${side} final`} aria-label="The last page">
        <Grain />
        <div className="sb-pg sb-final">
          <Mark w={9} />
          <div className="wm">A Story</div>
          <div className="tag">Where life becomes legacy</div>
        </div>
        {page.url && (
          <div className="sb-archive-end">
            <QrCode value={page.url} label="A code to scan: the archive" />
            <p>
              <b>The story keeps going</b>
              {page.text}
            </p>
          </div>
        )}
      </section>
    );
  }

  // A memory, or the continuation of one.
  return (
    <section className={`bk-page ${side} mem`} aria-label={page.title ? page.title : `${page.chapter}, continued`}>
      <Grain />
      <div className={`sb-pg sb-mem${page.strip ? " has-strip" : ""}`}>
        {page.title || page.dateline ? (
          <div className="sb-mhead">
            <span className="sb-pill">{page.chapter}</span>
            <Layers on={page.layers} />
          </div>
        ) : (
          <span className="sb-run">{page.chapter}</span>
        )}
        {page.title && <h3 className="sb-mtitle">{page.title}</h3>}
        {page.dateline && <span className="sb-mmeta">{page.dateline}</span>}
        {page.summary ? (
          <div className="sb-summary">
            <div className="lab">
              Summary
              {page.source && <SrcTag source={page.source} />}
            </div>
            <p>{page.summary}</p>
          </div>
        ) : (
          page.source && (
            <div className="sb-srcline">
              <SrcTag source={page.source} />
            </div>
          )
        )}
        {page.asked && (
          <div className="sb-askline">
            <b>The question</b> {quoted(page.asked.q)} <span>Asked by {page.asked.by}</span>
          </div>
        )}
        {page.photos.length > 0 && (
          <div className={`sb-plate ${page.photos.length === 1 ? "one" : "many"}`}>
            {page.photos.slice(0, 4).map((u, i) => (
              <Plate key={`${u}-${i}`} url={u} alt={`A photograph from ${teller}’s story`} />
            ))}
          </div>
        )}
        <div className="sb-body">
          {page.paragraphs.map((p, i) => (
            <p key={i} className={i === 0 && page.drop ? "drop" : ""}>
              {p}
            </p>
          ))}
        </div>
        {page.credit && <p className="sb-credit">{page.credit}</p>}
        {page.sides.length > 0 && (
          <aside className="sb-notes" aria-label="From the family">
            <span className="kicker">From the family</span>
            {page.sides.map((s, i) => (
              <div key={i} className="sb-notecard">
                <p>{s.body}</p>
                <div className="who">
                  <b>{s.who}</b>
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>
      {page.strip && <StripBlock strip={page.strip} />}
      <Folio n={page.folio} />
    </section>
  );
}
