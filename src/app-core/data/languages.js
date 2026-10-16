// The languages A Story can speak on a call, and so the languages a memory
// can be written in: the ones the realtime voices speak well. Each is named
// in itself first, so the person who speaks it can find it, with its
// English name beside it for the relative setting the phone up.
//
// Keys are ISO 639-1, which is what the server passes to the voice. The
// list is the voice model's own set (fifty-odd languages); a language
// missing here is one the voice can't yet hold a conversation in, not an
// oversight about who the families are.
//
// No imports, so lib/callStyle.js and the tests can use it bare.

export const LANGUAGES = [
  { key: "af", name: "Afrikaans", note: "Afrikaans" },
  { key: "ar", name: "العربية", note: "Arabic" },
  { key: "hy", name: "Հայերեն", note: "Armenian" },
  { key: "az", name: "Azərbaycan dili", note: "Azerbaijani" },
  { key: "be", name: "Беларуская", note: "Belarusian" },
  { key: "bs", name: "Bosanski", note: "Bosnian" },
  { key: "bg", name: "Български", note: "Bulgarian" },
  { key: "ca", name: "Català", note: "Catalan" },
  { key: "zh", name: "中文", note: "Chinese (Mandarin)" },
  { key: "hr", name: "Hrvatski", note: "Croatian" },
  { key: "cs", name: "Čeština", note: "Czech" },
  { key: "da", name: "Dansk", note: "Danish" },
  { key: "nl", name: "Nederlands", note: "Dutch" },
  { key: "en", name: "English", note: "English" },
  { key: "et", name: "Eesti", note: "Estonian" },
  { key: "fi", name: "Suomi", note: "Finnish" },
  { key: "fr", name: "Français", note: "French" },
  { key: "gl", name: "Galego", note: "Galician" },
  { key: "de", name: "Deutsch", note: "German" },
  { key: "el", name: "Ελληνικά", note: "Greek" },
  { key: "he", name: "עברית", note: "Hebrew" },
  { key: "hi", name: "हिन्दी", note: "Hindi" },
  { key: "hu", name: "Magyar", note: "Hungarian" },
  { key: "is", name: "Íslenska", note: "Icelandic" },
  { key: "id", name: "Bahasa Indonesia", note: "Indonesian" },
  { key: "it", name: "Italiano", note: "Italian" },
  { key: "ja", name: "日本語", note: "Japanese" },
  { key: "kn", name: "ಕನ್ನಡ", note: "Kannada" },
  { key: "kk", name: "Қазақ тілі", note: "Kazakh" },
  { key: "ko", name: "한국어", note: "Korean" },
  { key: "lv", name: "Latviešu", note: "Latvian" },
  { key: "lt", name: "Lietuvių", note: "Lithuanian" },
  { key: "mk", name: "Македонски", note: "Macedonian" },
  { key: "ms", name: "Bahasa Melayu", note: "Malay" },
  { key: "mr", name: "मराठी", note: "Marathi" },
  { key: "mi", name: "Te Reo Māori", note: "Māori" },
  { key: "ne", name: "नेपाली", note: "Nepali" },
  { key: "no", name: "Norsk", note: "Norwegian" },
  { key: "fa", name: "فارسی", note: "Persian (Farsi)" },
  { key: "pl", name: "Polski", note: "Polish" },
  { key: "pt", name: "Português", note: "Portuguese" },
  { key: "ro", name: "Română", note: "Romanian" },
  { key: "ru", name: "Русский", note: "Russian" },
  { key: "sr", name: "Српски", note: "Serbian" },
  { key: "sk", name: "Slovenčina", note: "Slovak" },
  { key: "sl", name: "Slovenščina", note: "Slovenian" },
  { key: "es", name: "Español", note: "Spanish" },
  { key: "sw", name: "Kiswahili", note: "Swahili" },
  { key: "sv", name: "Svenska", note: "Swedish" },
  { key: "tl", name: "Tagalog", note: "Tagalog (Filipino)" },
  { key: "ta", name: "தமிழ்", note: "Tamil" },
  { key: "th", name: "ไทย", note: "Thai" },
  { key: "tr", name: "Türkçe", note: "Turkish" },
  { key: "uk", name: "Українська", note: "Ukrainian" },
  { key: "ur", name: "اردو", note: "Urdu" },
  { key: "vi", name: "Tiếng Việt", note: "Vietnamese" },
  { key: "cy", name: "Cymraeg", note: "Welsh" },
];

const BY_KEY = new Map(LANGUAGES.map((l) => [l.key, l]));

export function languageByKey(key) {
  return BY_KEY.get(String(key || "").toLowerCase()) || null;
}

/* "Español" for "es"; the key itself when it isn't one of ours. */
export function languageName(key) {
  return languageByKey(key)?.name || String(key || "");
}

/* The ISO 639-1 part of a locale ("en-US" → "en", "zh-Hant-TW" → "zh",
   "fil" → "tl"), or "" when there's nothing usable. */
export function languageFromLocale(locale) {
  const tag = String(locale || "").trim().toLowerCase().replace(/_/g, "-");
  if (!tag) return "";
  const base = tag.split("-")[0];
  const alias = { fil: "tl", nb: "no", nn: "no", iw: "he", in: "id", ji: "yi" };
  const key = alias[base] || base;
  return BY_KEY.has(key) ? key : "";
}

/* The languages to offer first: the phone's own, then the family's (the
   other stories' choices), then English, each once, in that order. */
export function suggestedLanguages({ device = [], family = [] } = {}) {
  const out = [];
  for (const k of [...device, ...family, "en"]) {
    const key = languageFromLocale(k) || (BY_KEY.has(k) ? k : "");
    if (key && !out.includes(key)) out.push(key);
  }
  return out.map((k) => BY_KEY.get(k));
}

/* The list a search box narrows: matches the native name, the English
   name or the key, from the start of any word. Empty query: everything. */
export function searchLanguages(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return LANGUAGES;
  const starts = (s) =>
    String(s)
      .toLowerCase()
      .split(/[\s()]+/)
      .some((w) => w.startsWith(q));
  return LANGUAGES.filter((l) => starts(l.name) || starts(l.note) || l.key === q);
}
