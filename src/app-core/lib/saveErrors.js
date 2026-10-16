// What went wrong with a save, in words a person can act on.
//
// The save banner used to say "you're offline or the server didn't answer"
// whatever the reason, and stayed up for good when the reason was one a retry
// can't fix: a column the database doesn't have yet, a write the database
// refuses. A tester saw it for days on perfectly good wifi. This tells the
// kinds apart, says which part didn't save, and works out what did land, so
// one stuck part no longer holds everything else back.

// Where a save can fail. Stories, memories, photos and recordings are one
// chain (a memory needs its story, a photo its memory); the family tree and
// the account's own settings each stand alone.
export const SAVE_GROUPS = { stories: "stories", memories: "stories", photos: "stories", audio: "stories", family: "family", profile: "profile" };

const NETWORK = /network|failed to fetch|load failed|fetch failed|timed? ?out|timeout|aborted|offline|socket|ECONN|ENOTFOUND|EAI_AGAIN/i;

/* 'offline'  — nothing came back, or the server was down for a moment. A retry helps.
   'refused'  — the database said no: row-level security, an expired sign-in.
   'behind'   — the database is a migration behind the app (a column, table or function missing).
   'conflict' — a duplicate or a broken link between rows.
   'other'    — anything else. */
export function classifySaveError(err) {
  if (!err) return "other";
  const code = String(err.code || "");
  const status = Number(err.status || err.statusCode || 0);
  const msg = String(err.message || err.details || err || "");
  if (["42703", "PGRST204", "42P01", "PGRST205", "PGRST202", "42883"].includes(code)) return "behind";
  if (code === "42501" || code.startsWith("PGRST3") || status === 401 || status === 403 || /row-level security|permission denied|JWT expired/i.test(msg)) return "refused";
  if (code.startsWith("23")) return "conflict";
  if (["PGRST000", "PGRST001", "PGRST002", "57014", "08006", "08001", "53300"].includes(code)) return "offline";
  if (status >= 500 || status === 408 || status === 429) return "offline";
  if (!code && (err.name === "TypeError" || err.name === "AbortError" || NETWORK.test(msg))) return "offline";
  return "other";
}

/* The column a "behind" error names, so a save can go again without just
   that one. PostgREST: "Could not find the 'person_ids' column of 'memories'
   in the schema cache". Postgres: 'column "sex" of relation "people" does not
   exist', or 'column people.sex does not exist'. */
export function missingColumnName(err) {
  const msg = String(err?.message || "");
  const m =
    msg.match(/could not find the '([^']+)' column/i) ||
    msg.match(/column "([^"]+)"(?: of relation "[^"]+")? does not exist/i) ||
    msg.match(/column ([\w.]+) does not exist/i);
  if (!m) return null;
  const name = m[1].split(".").pop();
  return name || null;
}

/* Write `rows` with `write`; when the database says a column isn't there,
   drop that column and go again, up to `limit` times. Only columns in
   `optional` may be dropped: losing an optional field is better than losing
   the memory, but losing its title or its story is not. Returns the names
   dropped. Throws whatever error is left. */
export async function writeDroppingMissing(rows, write, optional, limit = 4) {
  const dropped = [];
  let current = rows;
  for (let i = 0; i <= limit; i++) {
    const { error } = await write(current);
    if (!error) return dropped;
    const kind = classifySaveError(error);
    const name = kind === "behind" ? missingColumnName(error) : null;
    const has = (r) => r && Object.prototype.hasOwnProperty.call(r, name);
    const present = Array.isArray(current) ? current.some(has) : has(current);
    if (!name || !optional.includes(name) || !present || i === limit) throw error;
    dropped.push(name);
    const strip = (r) => {
      const out = { ...r };
      delete out[name];
      return out;
    };
    current = Array.isArray(current) ? current.map(strip) : strip(current);
  }
  return dropped;
}

/* Tag an error with the part of the save it came from. */
export function tagSaveError(err, part) {
  const e = err instanceof Error ? err : Object.assign(new Error(String(err?.message || err || "save failed")), err || {});
  if (!e.part) e.part = part;
  return e;
}

/* Several parts can fail in one save; the banner talks about the one that
   matters most. A refusal or an out-of-date server won't fix itself, so it
   outranks being offline. */
const RANK = { refused: 4, behind: 3, conflict: 2, other: 1, offline: 0 };
export function summariseFailures(errors) {
  const list = (errors || []).map((e) => ({ part: e?.part || "stories", kind: classifySaveError(e), message: String(e?.message || "") }));
  if (!list.length) return null;
  list.sort((a, b) => RANK[b.kind] - RANK[a.kind]);
  const top = list[0];
  return {
    kind: top.kind,
    part: top.part,
    parts: [...new Set(list.map((f) => f.part))],
    groups: [...new Set(list.map((f) => SAVE_GROUPS[f.part] || "stories"))],
    message: top.message,
  };
}

/* The tree the server now holds, after a save in which `failedGroups`
   didn't land and everything else did. The next save sends only what's
   still missing, and a part that landed is never sent twice. */
export function syncedAfter(state, baseline, failedGroups) {
  const failed = new Set(failedGroups || []);
  if (!failed.size) return state;
  if (!baseline) {
    // Nothing was known before this save, so there is nothing safe to keep
    // as "landed" for the failed parts: send all of them again.
    return {
      ...state,
      stories: failed.has("stories") ? [] : state.stories,
      family: failed.has("family") ? undefined : state.family,
      ...(failed.has("profile") ? { onboardingComplete: undefined, activeStoryId: undefined } : {}),
    };
  }
  return {
    ...state,
    stories: failed.has("stories") ? baseline.stories : state.stories,
    family: failed.has("family") ? baseline.family : state.family,
    onboardingComplete: failed.has("profile") ? baseline.onboardingComplete : state.onboardingComplete,
    activeStoryId: failed.has("profile") ? baseline.activeStoryId : state.activeStoryId,
  };
}

const PART_WORDS = {
  stories: "a story's details",
  memories: "a memory",
  photos: "a memory's photos",
  audio: "a recording",
  family: "a change to the family tree",
  profile: "your settings",
};

/* The banner's words, and which buttons it offers. `undo` is offered only
   when trying again can never work: the database refused it. */
export function saveBannerCopy(failure) {
  if (!failure) return null;
  const what = PART_WORDS[failure.part] || "your change";
  switch (failure.kind) {
    case "offline":
      return {
        text: `Not saved yet: ${what}. The connection dropped. It's kept on this phone, and A Story will try again.`,
        retry: true,
        undo: false,
      };
    case "refused":
      return {
        text: `A Story couldn't save ${what}: this account isn't allowed to change it any more. Somebody may have changed who can.`,
        retry: true,
        undo: true,
      };
    case "behind":
      return {
        text: `A Story couldn't save ${what} yet: our server needs an update first. It's kept on this phone; we'll try again.`,
        retry: true,
        undo: false,
      };
    case "conflict":
      return {
        text: `A Story couldn't save ${what}: it clashes with something already saved, perhaps from another phone.`,
        retry: true,
        undo: true,
      };
    default:
      return {
        text: `Not saved yet: ${what}. It's kept on this phone. Try again in a moment.`,
        retry: true,
        undo: false,
      };
  }
}
