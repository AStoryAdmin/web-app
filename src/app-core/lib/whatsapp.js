// Reading a WhatsApp chat export.
//
// WhatsApp → a chat → ⋯ → Export chat → "Include media" gives a .zip with
// _chat.txt and every voice message, photo and video; "Without media" gives
// the .txt alone. A family group, or years of messages with a grandmother,
// is often the largest record of a family that exists — and the voice
// messages in it may be the only recordings of somebody's voice anywhere.
//
// The text has no fixed format. It depends on the phone and its language:
//
//   iPhone:   [31/12/2020, 21:15:03] Bà Rose: Happy new year con ơi
//   Android:  31/12/2020, 21:15 - Bà Rose: Happy new year con ơi
//   US:       12/31/20, 9:15 PM - Bà Rose: Happy new year con ơi
//
// and day-first or month-first is only knowable from the whole file (a 13
// anywhere in the first place settles it). Voice messages appear as
//   <attached: 00000012-AUDIO-2020-12-31-21-15-03.opus>   (iPhone)
//   PTT-20201231-WA0001.opus (file attached)               (Android)
// or "audio omitted" / "<Media omitted>" when exported without media.
//
// Pure, so it's tested.

const INVISIBLE = /[‎‏‪-‮⁦-⁩﻿]/g;
const SPACE = /[  ]/g;

const IOS = /^\[(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?\]\s+([^:]{1,60}?):\s?(.*)$/;
const ANDROID = /^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?\s+[-–]\s+([^:]{1,60}?):\s?(.*)$/;

const AUDIO_FILE = /([\w-]+\.(?:opus|ogg|m4a|mp3|aac|amr|wav))/i;
const ATTACHED = /<attached:\s*([^>]+)>|^(\S+\.\w{2,4})\s+\(file attached\)$/i;
const OMITTED = /^<?(?:media omitted|audio omitted|image omitted|video omitted|sticker omitted|gif omitted|document omitted)>?$/i;

/* Does this look like a WhatsApp export? Three message lines in the first
   forty is plenty; a diary never starts that way. */
export function looksLikeWhatsApp(text) {
  const lines = String(text || "").replace(INVISIBLE, "").replace(SPACE, " ").split(/\r?\n/).slice(0, 40);
  return lines.filter((l) => IOS.test(l) || ANDROID.test(l)).length >= 3;
}

/* Every message: { at (ms, read as local time), sender, text, audio } —
   audio is the voice message's file name when there is one. Lines that
   aren't messages ("Messages are end-to-end encrypted", "Linh added Bao")
   are dropped; a line with no timestamp continues the message above. */
export function parseWhatsApp(text) {
  const raw = [];
  for (const line0 of String(text || "").split(/\r?\n/)) {
    const line = line0.replace(INVISIBLE, "").replace(SPACE, " ");
    const m = IOS.exec(line) || ANDROID.exec(line);
    if (m) {
      raw.push({ a: +m[1], b: +m[2], c: +m[3], h: +m[4], min: +m[5], ampm: m[7] || "", sender: m[8].trim(), text: m[9] });
    } else if (raw.length && line.trim()) {
      raw[raw.length - 1].text += `\n${line}`;
    }
  }
  if (!raw.length) return [];

  // Day-first unless the file proves otherwise: a first number over 12
  // means day-first, a second number over 12 means month-first. A file
  // with neither is ambiguous; 12-hour clocks are the US habit, so those
  // read month-first.
  const yearFirst = raw.some((r) => r.a > 31);
  const dayFirst = yearFirst ? false : raw.some((r) => r.a > 12) ? true : raw.some((r) => r.b > 12) ? false : !raw.some((r) => r.ampm);

  const out = [];
  for (const r of raw) {
    const [y0, mo, d] = yearFirst ? [r.a, r.b, r.c] : dayFirst ? [r.c, r.b, r.a] : [r.c, r.a, r.b];
    const year = y0 < 100 ? 2000 + y0 : y0;
    let hour = r.h % 24;
    const pm = /^p/i.test(r.ampm);
    if (r.ampm) hour = (r.h % 12) + (pm ? 12 : 0);
    const at = new Date(year, mo - 1, d, hour, r.min).getTime();
    if (!Number.isFinite(at)) continue;

    const body = r.text.trim();
    const att = ATTACHED.exec(body);
    const file = att ? (att[1] || att[2] || "").trim() : "";
    const audio = file && AUDIO_FILE.test(file) && /audio|ptt|\.opus$/i.test(file) ? file : null;
    const isMedia = !!att || OMITTED.test(body);
    out.push({ at, sender: r.sender, text: isMedia ? "" : body, audio });
  }
  return out;
}

/* Who's in the chat, most messages first. */
export function whatsAppSenders(messages) {
  const n = new Map();
  for (const m of messages || []) n.set(m.sender, (n.get(m.sender) || 0) + 1);
  return [...n.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

/* Memories to offer: one per day, from the senders chosen (everyone when
   none are). One day is the natural unit of a chat — a conversation, an
   evening — and it keeps a ten-year chat to a list somebody can read.
   With one sender the words stand alone; with several, each line keeps
   its speaker's name. Voice messages ride along by file name. */
export function whatsAppEntries(messages, { senders = [] } = {}) {
  const chosen = new Set(senders);
  const keep = (m) => !chosen.size || chosen.has(m.sender);
  const days = new Map();
  for (const m of messages || []) {
    if (!keep(m)) continue;
    const d = new Date(m.at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!days.has(key)) days.set(key, { at: m.at, lines: [], audio: [] });
    const day = days.get(key);
    if (m.text) day.lines.push(m);
    if (m.audio) day.audio.push(m.audio);
  }
  const multi = chosen.size !== 1;
  return [...days.values()]
    .map((day) => ({
      title: "",
      body: day.lines.map((m) => (multi ? `${m.sender}: ${m.text}` : m.text)).join("\n"),
      timestamp: day.at,
      voiceNotes: day.audio,
    }))
    .filter((e) => e.body.trim().length >= 12 || e.voiceNotes.length);
}
