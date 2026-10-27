// When a photograph was taken.
//
// The archive is built on years, and this is the one date in the app that
// arrives without anyone typing it: cameras write it into the file. Worth
// reading, worth offering — and never worth applying on its own, because a
// scanned print carries the date it was scanned, not the day at the lake.

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* "June 1975" from an expo-image-picker asset, or null.

   EXIF writes dates as "1975:06:14 10:32:00" — colons in the date part, which
   Date.parse won't touch — so the year and month come straight out of the
   string. iOS nests the same field under "{Exif}". Falls back to the media
   library's own creationTime. Anything before photography or in the future is
   a camera with a flat battery, not a date. */
export function photoTakenLabel(asset) {
  const exif = asset?.exif || {};
  const raw =
    exif.DateTimeOriginal ||
    exif.DateTimeDigitized ||
    exif["{Exif}"]?.DateTimeOriginal ||
    null;

  let year = null;
  let month = null;

  const parts = typeof raw === "string" ? raw.match(/^(\d{4})[:-](\d{2})/) : null;
  if (parts) {
    year = Number(parts[1]);
    month = Number(parts[2]);
  } else if (asset?.creationTime) {
    const d = new Date(asset.creationTime);
    if (!Number.isNaN(d.getTime())) {
      year = d.getFullYear();
      month = d.getMonth() + 1;
    }
  }

  if (!year || year < 1900 || year > new Date().getFullYear()) return null;
  if (!month || month < 1 || month > 12) return String(year);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/* Whether a photo's own date is worth offering on the "Roughly when was
   this?" slip (DECISIONS M-J1-7): only inside her life, and more than a
   year before today, because a picture taken today of a 1966 album print
   says October 2026. Offered, never applied. The label as given, or "". */
export function believablePhotoDate(label, story, now = new Date()) {
  const year = Number(String(label || "").match(/\d{4}/)?.[0]);
  if (!year) return "";
  const birth = Number(String(story?.birthYear || "").match(/\d{4}/)?.[0]);
  if (birth && year < birth) return "";
  if (year > now.getFullYear() - 1) return "";
  const died = Number(String(story?.deathYear || "").match(/\d{4}/)?.[0]);
  if (died && year > died) return "";
  return String(label);
}
