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
