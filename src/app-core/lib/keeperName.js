// What to call somebody a story is shared with.
//
// A keeper row (story_managers) is an invitation: it has the address it was
// sent to and, once accepted, the account it went to. The family tree
// usually knows them by name, so the tree is asked first: by account, then
// by the address the tree has for them. Only then the row's own name, and
// last of all the front of the address, tidied ("linh.tran" → "Linh Tran").
// Shown as "linh" in the write sheet, the address read like a username.
//
// Pure, so it's tested.

function fromAddress(email) {
  const front = String(email || "").split("@")[0].replace(/[._-]+/g, " ").replace(/\d+/g, " ").trim();
  if (!front) return "";
  return front
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function keeperName(row, people = []) {
  if (!row) return "Somebody";
  const email = String(row.invited_email || "").trim().toLowerCase();
  const person =
    (row.user_id && people.find((p) => p && p.userId && p.userId === row.user_id)) ||
    (email && people.find((p) => p && p.email && String(p.email).toLowerCase() === email)) ||
    null;
  const given = person && String(person.givenName || "").trim();
  if (given) return given;
  const own = String(row.name || row.display_name || "").trim();
  if (own) return own;
  return fromAddress(email) || "Somebody";
}
