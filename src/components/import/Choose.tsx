/**
 * The way in: paste the words, or choose a file (or drop one on its card).
 * Two kinds of file, as on the phone: a memoir, read by chapter, and
 * everything else (a diary or notes export, a WhatsApp chat, a family tree).
 */
import { useId, useRef, useState, type DragEvent } from "react";
import { Button } from "../ui";

const MEMOIR_TYPES = ".docx,.txt,.md,.markdown,.pdf,.doc";
const EXPORT_TYPES = ".txt,.md,.markdown,.json,.csv,.ged,.gedcom,.zip,.js";

function FileCard({
  title,
  line,
  accept,
  busy,
  onFile,
}: {
  title: string;
  line: string;
  accept: string;
  busy: boolean;
  onFile: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [over, setOver] = useState(false);
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !busy) onFile(file);
  };
  return (
    <div
      className="im-file"
      data-over={over || undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <h3 id={`${id}-t`}>{title}</h3>
      <p className="im-help">{line}</p>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        aria-labelledby={`${id}-t`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // cleared so choosing the same file again still reads it
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
      <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}>
        Choose a file
      </Button>
      <p className="im-drop">or drop it here</p>
    </div>
  );
}

export default function Choose({ busy, onPaste, onFile }: { busy: boolean; onPaste: (text: string) => void; onFile: (file: File, asMemoir: boolean) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="im-choose">
      <section className="im-section" aria-labelledby="im-paste-title">
        <h2 id="im-paste-title">Paste it in</h2>
        <p className="im-lead">From your notes, an email or a document. A blank line, or a line that starts with a date, begins the next memory.</p>
        <textarea
          className="im-paste"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="1962: We left Huế on the morning train…"
          aria-labelledby="im-paste-title"
          disabled={busy}
        />
        <div className="im-acts">
          <Button onClick={() => onPaste(text)} disabled={busy || !text.trim()} loading={busy}>
            Read it
          </Button>
        </div>
      </section>

      <section className="im-section" aria-labelledby="im-files-title">
        <h2 id="im-files-title">Or choose a file</h2>
        <div className="im-files">
          <FileCard
            title="A memoir they wrote"
            line="A Word or text file. Each chapter becomes a memory, in their own words."
            accept={MEMOIR_TYPES}
            busy={busy}
            onFile={(f) => onFile(f, true)}
          />
          <FileCard
            title="A diary, a chat or a family tree"
            line="An export from a diary or notes app, Facebook or Instagram posts, a WhatsApp chat, or a tree from Ancestry, MyHeritage or FamilySearch (.ged)."
            accept={EXPORT_TYPES}
            busy={busy}
            onFile={(f) => onFile(f, false)}
          />
        </div>
        <p className="im-help">Nothing is kept until you’ve looked it over.</p>
      </section>
    </div>
  );
}
