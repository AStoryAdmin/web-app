/**
 * Every word on the answer page, in the teller's language: Vietnamese
 * first, English second, English for anything else. Kept tiny on purpose.
 *
 * Vietnamese needs kinship words. The table follows lane L's (phone-app
 * src/lib/tellerWords.js): when the link says both what the asker is to her
 * ("cháu") and how to address her ("bà"), "Cháu Sam hỏi bà"; otherwise the
 * neutral forms ("Câu hỏi của Sam"), never a guessed pronoun and never "bạn".
 */

export type Lang = "vi" | "en";

export type WordsContext = {
  asker: string;
  teller: string;
  /** How the asker addresses the teller ("bà", "ông"); Vietnamese only. */
  title?: string | null;
  /** What the asker is to the teller, as the asker is named in Vietnamese ("cháu", "con"). */
  askerKin?: string | null;
  /** Who the server says it went to (the "done" reply); the asker otherwise. */
  sentTo?: string | null;
};

export type Words = {
  loading: string;
  askedYou: string;
  hear: string;
  pause: string;
  record: string;
  micNote: string;
  micGo: string;
  recording: string;
  level: string;
  stop: string;
  listen: string;
  again: string;
  againAsk: string;
  againYes: string;
  againNo: string;
  send: string;
  sending: string;
  sentTitle: string;
  thanks: string;
  sentVoice: string;
  sentText: string;
  writeInstead: string;
  writeLabel: string;
  writePlaceholder: string;
  micRefused: string;
  tryMic: string;
  expired: string;
  answered: string;
  notFound: string;
  loadError: string;
  serverError: string;
  sendFailed: string;
  tryAgain: string;
  photoAlt: string;
  pageTitle: string;
};

/** "vi", "vi-VN", "VI" → vi; anything else → en. */
export function pickLang(input: string | null | undefined): Lang {
  return String(input || "").trim().toLowerCase().startsWith("vi") ? "vi" : "en";
}

const cap = (s: string) => (s ? s[0].toLocaleUpperCase("vi") + s.slice(1) : s);

function vi(c: WordsContext): Words {
  // kin forms only when the link knows both sides (lane L, L-notes.md): "Cháu Sam hỏi bà"; otherwise neutral, no "bạn"
  const title = (c.title || "").trim().toLocaleLowerCase("vi");
  const kin = (c.askerKin || "").trim().toLocaleLowerCase("vi");
  const kinned = Boolean(title && kin && c.asker);
  const name = c.asker || "người nhà";
  const who = kinned ? `${kin} ${c.asker}` : name; // "cháu Sam" | "Sam"
  const Who = cap(who);
  const to = c.sentTo ? (kinned && c.sentTo === c.asker ? who : c.sentTo) : who;
  const of = (thing: string) => (kinned ? `${thing} của ${title}` : thing);
  return {
    loading: "Đang mở…",
    askedYou: kinned ? `${Who} hỏi ${title}` : c.asker ? `Câu hỏi của ${c.asker}` : "Câu hỏi của người nhà",
    hear: `Nghe ${who} hỏi`,
    pause: "Tạm dừng",
    record: "Trả lời bằng giọng nói",
    micNote: "Hãy cho phép dùng micrô để ghi âm câu trả lời.",
    micGo: "Bắt đầu ghi âm",
    recording: "Đang ghi âm. Cứ từ từ, dừng lại nghỉ cũng không sao.",
    level: "Âm lượng giọng nói",
    stop: "Xong rồi",
    listen: "Nghe lại",
    again: "Nói lại",
    againAsk: "Nói lại từ đầu? Phần vừa ghi âm sẽ không được giữ lại.",
    againYes: "Nói lại",
    againNo: "Giữ bản này",
    send: `Gửi cho ${who}`,
    sending: "Đang gửi…",
    sentTitle: `Đã gửi cho ${to}.`,
    thanks: kinned ? `Cảm ơn ${title}${c.teller ? ` ${c.teller}` : ""}.` : c.teller ? `Cảm ơn ${c.teller}.` : "Cảm ơn.",
    sentVoice: `${cap(to)} sẽ nhận được ${of("câu trả lời")}.`,
    sentText: `${cap(to)} sẽ nhận được ${of("câu trả lời")}.`,
    writeInstead: "Viết câu trả lời",
    writeLabel: cap(of("câu trả lời")),
    writePlaceholder: "Viết ở đây…",
    micRefused: kinned
      ? `A Story chưa nghe được ${title}. ${cap(title)} có thể viết câu trả lời ở đây.`
      : "A Story chưa nghe được. Có thể viết câu trả lời ở đây.",
    tryMic: "Thử ghi âm lại",
    expired: kinned ? `Câu hỏi này đã đóng. ${Who} có thể gửi ${title} câu hỏi mới.` : `Câu hỏi này đã đóng. ${cap(name)} có thể gửi câu hỏi mới.`,
    answered: `Câu hỏi này đã được trả lời rồi. ${Who} đã nhận được.`,
    notFound: "Đường dẫn này không còn dùng được. Hãy nhờ người nhà gửi lại.",
    loadError: "Chưa mở được câu hỏi. Hãy kiểm tra mạng rồi thử lại.",
    serverError: "A Story đang có trục trặc. Hãy thử lại sau ít phút.",
    sendFailed: "Chưa gửi được. Câu trả lời vẫn còn đây. Hãy thử lại.",
    tryAgain: "Thử lại",
    photoAlt: `Ảnh của ${who}`,
    pageTitle: `${kinned ? `${Who} hỏi ${title}` : c.asker ? `Câu hỏi của ${c.asker}` : "A Story"} · A Story`,
  };
}

function en(c: WordsContext): Words {
  const asker = c.asker || "Your family";
  const askerMid = c.asker || "your family";
  const to = c.sentTo || askerMid;
  return {
    loading: "Opening…",
    askedYou: `${asker} asked you`,
    hear: `Hear ${askerMid} ask`,
    pause: "Pause",
    record: "Answer in your voice",
    micNote: "Your phone will ask to use the microphone. Tap “Allow”.",
    micGo: "Start recording",
    recording: "Recording. Take your time; pauses are fine.",
    level: "How loud your voice is",
    stop: "I’m done",
    listen: "Listen back",
    again: "Say it again",
    againAsk: "Say it again? What you recorded won’t be kept.",
    againYes: "Yes, say it again",
    againNo: "Keep this one",
    send: `Send to ${askerMid}`,
    sending: "Sending…",
    sentTitle: `Sent to ${to}.`,
    thanks: c.teller ? `Thank you, ${c.teller}.` : "Thank you.",
    sentVoice: `${cap(to)} will hear your voice.`,
    sentText: `${cap(to)} will read your answer.`,
    writeInstead: "Write your answer",
    writeLabel: "Your answer",
    writePlaceholder: "Write here…",
    micRefused: "The microphone isn’t available. You can write your answer here.",
    tryMic: "Try the microphone again",
    expired: `This question has closed. ${asker} can send you a new one.`,
    answered: `You answered this one. ${asker} has it.`,
    notFound: "This link doesn’t open a question. Ask your family to send it again.",
    loadError: "This didn’t open just now. Check the internet and try again.",
    serverError: "Something went wrong on our side. Try again in a moment.",
    sendFailed: "It didn’t send yet. Your answer is still here. Try again.",
    tryAgain: "Try again",
    photoAlt: `A photograph of ${askerMid}`,
    pageTitle: `${asker} asked you · A Story`,
  };
}

export function wordsFor(lang: Lang, ctx: WordsContext): Words {
  return lang === "vi" ? vi(ctx) : en(ctx);
}
