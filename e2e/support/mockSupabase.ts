/**
 * A Supabase that lives in the test: auth, PostgREST tables and rpc, storage and edge functions, answered from
 * memory by route interception, for the specs in e2e/flow. The app is pointed at https://flow-test.supabase.co
 * (playwright.config.ts); every request there lands here, and every request to any other host is refused and
 * noted, so a test can never reach a real server, Stripe or an inbox.
 *
 * What it models is what the web app calls (src/data/*.ts, src/lib/supabase.ts):
 * - auth: signUp (a user, no session: the code must be typed), verifyOtp (signup, email, recovery), signInWithOtp,
 *   password sign-in, refresh, getUser, updateUser, the PKCE exchange a reset link makes, resend, recover, logout;
 * - tables: select with eq/neq/is/in/order/limit, the stories select with its memories, photos and clips embedded,
 *   maybeSingle/single, insert, upsert, update, delete, head counts;
 * - rpc: per-name handlers; a name with none answers PGRST202, which the app reads as "an older database";
 * - storage and functions: quiet empty answers unless a handler is given.
 * There is no row-level security: a test seeds only what the signed-in person may see. A row can be held back
 * until an rpc lets it in (`hideUntil`), which is how an invitation that sign-in accepts is played.
 *
 * Every request is kept in `calls`, so a test can say what was sent and that an email never rode in a URL.
 */
import type { BrowserContext, Page, Request, Route } from "@playwright/test";

export const HOST = "https://flow-test.supabase.co";
export const ANON_KEY = "anon-flow-test-key";
/** The app's storage key for the session (src/lib/supabase.ts AUTH_STORAGE_KEY). */
export const AUTH_STORAGE_KEY = "astory-app-auth";
/** The one code the mock's emails "carry". Any other six digits are refused as Supabase refuses them. */
export const OTP = "246810";

export type Row = Record<string, unknown>;

export type MockUser = {
  id: string;
  email: string;
  password: string | null;
  confirmed: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type Call = { method: string; url: string; path: string; body: unknown };

type Ctx = { user: MockUser | null; mock: MockSupabase };
type Answer = { status?: number; body?: unknown; delayMs?: number };
/** An rpc or function: the value it returns, or a full answer (status, body, delay). */
export type Handler = (args: Row, ctx: Ctx) => unknown | Answer | Promise<unknown | Answer>;
const isAnswer = (v: unknown): v is Answer =>
  !!v && typeof v === "object" && ("status" in (v as object) || "delayMs" in (v as object)) && Object.keys(v as object).every((k) => ["status", "body", "delayMs"].includes(k));

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Range, X-Supabase-Api-Version",
};

const PNG_1PX = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+v9/PQAJYQPa9kWZ3wAAAABJRU5ErkJggg==", "base64");

let seq = 0;
/** A uuid-shaped id that is stable within a run and easy to read in a failure. */
export const id = (prefix = "0") => {
  seq += 1;
  const hex = (prefix.replace(/[^0-9a-f]/gi, "").slice(0, 8) + "00000000").slice(0, 8).toLowerCase();
  return `${hex}-0000-4000-8000-${String(seq).padStart(12, "0")}`;
};

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

/** A JWT the browser can decode (the app and supabase-js only ever read it; nothing checks the signature). */
export function fakeJwt(user: MockUser, ttlSeconds = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: "authenticated",
    role: "authenticated",
    sub: user.id,
    email: user.email,
    exp: now + ttlSeconds,
    iat: now,
    session_id: `sess-${user.id}`,
    user_metadata: user.metadata,
    app_metadata: { provider: "email", providers: ["email"] },
  };
  return `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.${Buffer.from("flow-test").toString("base64url")}`;
}

function userJson(u: MockUser) {
  return {
    id: u.id,
    aud: "authenticated",
    role: "authenticated",
    email: u.email,
    email_confirmed_at: u.confirmed ? u.createdAt : null,
    confirmed_at: u.confirmed ? u.createdAt : null,
    phone: "",
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: u.metadata,
    identities: [
      {
        identity_id: `ident-${u.id}`,
        id: u.id,
        user_id: u.id,
        identity_data: { email: u.email, sub: u.id, email_verified: u.confirmed },
        provider: "email",
        email: u.email,
        created_at: u.createdAt,
        updated_at: u.createdAt,
        last_sign_in_at: u.createdAt,
      },
    ],
    created_at: u.createdAt,
    updated_at: u.createdAt,
    is_anonymous: false,
  };
}

export function sessionJson(u: MockUser) {
  const expiresIn = 3600;
  return {
    access_token: fakeJwt(u, expiresIn),
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    refresh_token: `refresh-${u.id}`,
    user: userJson(u),
  };
}

/* ── Fixture rows, in the columns the app reads (src/data/stories.ts, app-core/data/rows.js, familyRows.js) ── */

export const fixtures = {
  profile(u: MockUser, extra: Row = {}): Row {
    return {
      id: u.id,
      first_name: String(u.metadata.first_name ?? ""),
      last_name: String(u.metadata.last_name ?? ""),
      avatar_url: null,
      referral_code: "RFLOW1",
      phone: "",
      gender: "",
      date_of_birth: "",
      language: "United States",
      plan: "free",
      onboarding_complete: false,
      active_story_id: null,
      created_at: u.createdAt,
      ...extra,
    };
  },
  story(ownerId: string, extra: Row = {}): Row {
    return {
      id: id("5"),
      owner_id: ownerId,
      household_id: null,
      name: "Rose",
      last_name: "Hartley",
      relationship: "Mother",
      relationship_other: "",
      nickname: "",
      birth_year: "1945",
      intro: "",
      is_public: false,
      contributions_open: false,
      sessions_completed: 0,
      streak_days: 0,
      last_memory_date: null,
      done_topics_today: { date: "", eras: [] },
      created_at: "2026-09-01T10:00:00.000Z",
      ...extra,
    };
  },
  memory(storyId: string, extra: Row = {}): Row {
    return {
      id: id("3"),
      story_id: storyId,
      title: "The kitchen on Elm Street",
      body: "The radio was always on, and the window over the sink looked out on the pear tree.",
      excerpt: "The radio was always on.",
      era: "Childhood",
      period: "the 50s",
      privacy: "shared",
      status: "saved",
      color: "",
      contributor: "",
      created_at: "2026-09-02T10:00:00.000Z",
      ...extra,
    };
  },
  person(householdId: string, extra: Row = {}): Row {
    return {
      id: id("7"),
      household_id: householdId,
      given_name: "Rose",
      family_name: "Hartley",
      source: "manual",
      created_at: "2026-09-01T10:00:00.000Z",
      ...extra,
    };
  },
};

/* ── PostgREST, as far as the app asks it ──────────────────────────────── */

const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);

function parseList(v: string): string[] {
  return v
    .replace(/^\(|\)$/g, "")
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""));
}

function matches(row: Row, col: string, expr: string): boolean {
  const dot = expr.indexOf(".");
  let op = expr.slice(0, dot);
  let val = expr.slice(dot + 1);
  let negate = false;
  if (op === "not") {
    negate = true;
    const d2 = val.indexOf(".");
    op = val.slice(0, d2);
    val = val.slice(d2 + 1);
  }
  const have = row[col];
  const s = have == null ? null : String(have);
  let ok: boolean;
  switch (op) {
    case "eq":
      ok = s === val;
      break;
    case "neq":
      ok = s !== val;
      break;
    case "is":
      ok = val === "null" ? have == null : val === "true" ? have === true : val === "false" ? have === false : false;
      break;
    case "in":
      ok = s !== null && parseList(val).includes(s);
      break;
    case "gt":
      ok = s !== null && s > val;
      break;
    case "gte":
      ok = s !== null && s >= val;
      break;
    case "lt":
      ok = s !== null && s < val;
      break;
    case "lte":
      ok = s !== null && s <= val;
      break;
    default:
      ok = true; // a filter this mock doesn't know narrows nothing
  }
  return negate ? !ok : ok;
}

function filtersOf(q: URLSearchParams): [string, string][] {
  return [...q.entries()].filter(([k]) => !RESERVED.has(k));
}

export class MockSupabase {
  users: MockUser[] = [];
  tables: Record<string, Row[]> = {};
  rpcs: Record<string, Handler> = {};
  functions: Record<string, Handler> = {};
  calls: Call[] = [];
  /** Requests to any host but the app's and the mock's, refused. */
  blocked: string[] = [];
  /** Rows kept out of reads until the named rpc runs: table → rpc name → row ids. */
  private held: { table: string; rowId: string; rpc: string }[] = [];

  constructor() {
    // The sign-in links the app runs every time (data/session.ts): nothing to accept by default.
    this.rpcs.accept_story_invites = () => 0;
    this.rpcs.claim_people = () => 0;
    this.rpcs.claim_contributions = () => 0;
    this.rpcs.touch_active = () => null;
  }

  /* ── seeding ─────────────────────────────────────────────────────────── */

  table(name: string): Row[] {
    return (this.tables[name] ??= []);
  }

  insert(name: string, ...rows: Row[]): Row[] {
    this.table(name).push(...rows);
    return rows;
  }

  /** An account as the phone app (or this site) made it, with the profiles row handle_new_user() writes. */
  addUser(input: { email: string; password?: string | null; firstName?: string; lastName?: string; confirmed?: boolean; profile?: Row }): MockUser {
    const u: MockUser = {
      id: id("a"),
      email: input.email.toLowerCase(),
      password: input.password ?? null,
      confirmed: input.confirmed ?? true,
      metadata: { first_name: input.firstName ?? "", last_name: input.lastName ?? "" },
      createdAt: "2026-08-01T10:00:00.000Z",
    };
    this.users.push(u);
    this.insert("profiles", fixtures.profile(u, input.profile));
    return u;
  }

  userByEmail(email: string): MockUser | undefined {
    return this.users.find((u) => u.email === email.trim().toLowerCase());
  }

  /** A row that reads as absent until `rpc` has been called (an invitation accept_story_invites() opens). */
  holdUntil(table: string, row: Row, rpc: string) {
    this.insert(table, row);
    this.held.push({ table, rowId: String(row.id), rpc });
  }

  private release(rpc: string) {
    const n = this.held.filter((h) => h.rpc === rpc).length;
    this.held = this.held.filter((h) => h.rpc !== rpc);
    return n;
  }

  private visible(table: string): Row[] {
    const hidden = new Set(this.held.filter((h) => h.table === table).map((h) => h.rowId));
    return this.table(table).filter((r) => !hidden.has(String(r.id)));
  }

  /** The requests to one endpoint, newest last: `mock.sent("/auth/v1/otp")`. */
  sent(pathStart: string, method?: string): Call[] {
    return this.calls.filter((c) => c.path.startsWith(pathStart) && (!method || c.method === method));
  }

  /**
   * Signed in before the first page loads: the session in the app's storage key, as supabase-js writes it. Set
   * once per tab, so a sign-out in the test stays signed out across reloads.
   */
  async signedIn(page: Page, user: MockUser) {
    const value = JSON.stringify(sessionJson(user));
    await page.addInitScript(
      ([key, v]) => {
        try {
          if (window.sessionStorage.getItem("flow-seeded")) return;
          window.sessionStorage.setItem("flow-seeded", "1");
          window.localStorage.setItem(key, v);
        } catch {
          /* storage refused: the test will show it signed out */
        }
      },
      [AUTH_STORAGE_KEY, value] as const,
    );
  }

  /* ── wiring ──────────────────────────────────────────────────────────── */

  async install(target: Page | BrowserContext) {
    const context = "context" in target ? target.context() : target;
    await context.route(
      () => true,
      async (route) => {
        const url = route.request().url();
        if (url.startsWith(HOST)) return this.answer(route);
        const u = new URL(url);
        if (u.hostname === "127.0.0.1" || u.hostname === "localhost") return route.continue();
        // index.html's web fonts: refused too, but expected, so not noted (the pages fall back to their system serif)
        if (!/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) this.blocked.push(url);
        return route.abort("blockedbyclient");
      },
    );
  }

  private userFrom(req: Request): MockUser | null {
    const auth = req.headers()["authorization"] || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
      const sub = JSON.parse(Buffer.from(parts[1], "base64url").toString()).sub as string;
      return this.users.find((u) => u.id === sub) ?? null;
    } catch {
      return null;
    }
  }

  private async answer(route: Route) {
    const req = route.request();
    const method = req.method();
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(req.url());
    const path = url.pathname;
    let body: unknown;
    try {
      body = req.postData() ? req.postDataJSON() : null;
    } catch {
      body = req.postData();
    }
    this.calls.push({ method, url: req.url(), path: path + url.search, body });
    const json = (status: number, data: unknown, headers: Record<string, string> = {}) =>
      route.fulfill({ status, headers: { ...CORS, ...headers }, contentType: "application/json", body: data === undefined ? "" : JSON.stringify(data) });

    try {
      if (path.startsWith("/auth/v1/")) {
        const [status, data] = this.auth(path.slice("/auth/v1/".length), url.searchParams, method, (body || {}) as Row, req);
        return json(status, data);
      }
      if (path.startsWith("/rest/v1/rpc/")) {
        const name = path.slice("/rest/v1/rpc/".length);
        const a = await this.call(this.rpcs[name], (body || {}) as Row, req);
        if (a === null) return json(404, { code: "PGRST202", message: `Could not find the function public.${name}` });
        if (a.status === undefined || a.status < 400) this.release(name);
        return json(a.status ?? 200, a.body ?? null);
      }
      if (path.startsWith("/rest/v1/")) return this.rest(route, path.slice("/rest/v1/".length), url.searchParams, method, body, req);
      if (path.startsWith("/functions/v1/")) {
        const name = path.slice("/functions/v1/".length).split("?")[0];
        const a = await this.call(this.functions[name], (body || {}) as Row, req);
        return json(a?.status ?? 200, a ? a.body ?? {} : {});
      }
      if (path.startsWith("/storage/v1/")) {
        if (path.includes("/object/sign/")) {
          const paths = ((body as Row)?.paths as string[]) || [];
          if (paths.length) return json(200, paths.map((p) => ({ path: p, signedURL: null, error: "Object not found" })));
          return json(400, { statusCode: "404", error: "not_found", message: "Object not found" });
        }
        if (method === "GET") return route.fulfill({ status: 200, headers: CORS, contentType: "image/png", body: PNG_1PX });
        return json(200, { Key: path, Id: id("f") });
      }
      return json(404, { message: "not in the flow mock" });
    } catch (err) {
      return json(500, { message: `flow mock: ${(err as Error).message}` });
    }
  }

  private async call(h: Handler | undefined, args: Row, req: Request): Promise<Answer | null> {
    if (!h) return null;
    const out = await h(args, { user: this.userFrom(req), mock: this });
    const a: Answer = isAnswer(out) ? out : { status: 200, body: out };
    if (a.delayMs) await new Promise((r) => setTimeout(r, a.delayMs));
    return a;
  }

  /* ── GoTrue ──────────────────────────────────────────────────────────── */

  private auth(endpoint: string, q: URLSearchParams, method: string, b: Row, req: Request): [number, unknown] {
    const bad = (status: number, code: string, msg: string): [number, unknown] => [status, { code: status, error_code: code, msg, message: msg }];
    const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";

    if (endpoint === "signup") {
      const have = this.userByEmail(email);
      // A confirmed address answers a user with no identities (Supabase's way of not saying it exists).
      if (have?.confirmed) return [200, { ...userJson(have), identities: [] }];
      const meta = ((b.data as Row) || {}) as Record<string, unknown>;
      const u = have ?? this.addUser({ email, password: String(b.password || ""), confirmed: false, firstName: String(meta.first_name || ""), lastName: String(meta.last_name || "") });
      u.metadata = { ...u.metadata, ...meta };
      return [200, userJson(u)];
    }

    if (endpoint === "otp") {
      const opts = b;
      const create = opts.create_user !== false;
      let u = this.userByEmail(email);
      if (!u && !create) return bad(422, "otp_disabled", "Signups not allowed for otp");
      if (!u) {
        const meta = ((opts.data as Row) || {}) as Record<string, unknown>;
        u = this.addUser({ email, confirmed: false, firstName: String(meta.first_name || ""), lastName: String(meta.last_name || "") });
        u.metadata = { ...u.metadata, ...meta };
      }
      return [200, {}];
    }

    if (endpoint === "verify") {
      const u = this.userByEmail(email);
      if (!u || String(b.token) !== OTP) return bad(403, "otp_expired", "Token has expired or is invalid");
      u.confirmed = true;
      return [200, sessionJson(u)];
    }

    if (endpoint === "token") {
      const grant = q.get("grant_type");
      if (grant === "password") {
        const u = this.userByEmail(email);
        if (!u || !u.password || u.password !== b.password) return bad(400, "invalid_credentials", "Invalid login credentials");
        if (!u.confirmed) return bad(400, "email_not_confirmed", "Email not confirmed");
        return [200, sessionJson(u)];
      }
      if (grant === "refresh_token") {
        const uid = String(b.refresh_token || "").replace(/^refresh-/, "");
        const u = this.users.find((x) => x.id === uid);
        return u ? [200, sessionJson(u)] : bad(400, "refresh_token_not_found", "Invalid Refresh Token: Refresh Token Not Found");
      }
      if (grant === "pkce") {
        const code = String(b.auth_code || "");
        const u = this.users.find((x) => code === `recovery-${x.id}`);
        return u ? [200, sessionJson(u)] : bad(403, "flow_state_not_found", "invalid flow state, no valid flow state found");
      }
      return bad(400, "unsupported_grant_type", "unsupported grant type");
    }

    if (endpoint === "user") {
      const u = this.userFrom(req);
      if (!u) return bad(401, "bad_jwt", "invalid JWT: unable to parse or verify signature");
      if (method === "PUT") {
        if (typeof b.password === "string") {
          if (b.password.length < 8) return bad(422, "weak_password", "Password should be at least 8 characters.");
          u.password = b.password;
        }
        if (b.data && typeof b.data === "object") u.metadata = { ...u.metadata, ...(b.data as Row) };
      }
      return [200, userJson(u)];
    }

    if (endpoint === "logout") return [204, undefined];
    if (endpoint === "recover" || endpoint === "resend" || endpoint === "reauthenticate") return [200, {}];
    return bad(404, "not_found", `flow mock has no auth endpoint ${endpoint}`);
  }

  /* ── PostgREST ───────────────────────────────────────────────────────── */

  private embed(table: string, select: string, rows: Row[]): Row[] {
    if (table !== "stories" || !/memories\s*\(/.test(select)) return rows;
    const memories = this.visible("memories");
    const photos = this.visible("memory_photos");
    const audio = this.visible("memory_audio");
    return rows.map((s) => ({
      ...s,
      memories: memories
        .filter((m) => m.story_id === s.id)
        .map((m) => ({ ...m, memory_photos: photos.filter((p) => p.memory_id === m.id), memory_audio: audio.filter((a) => a.memory_id === m.id) })),
    }));
  }

  private rest(route: Route, table: string, q: URLSearchParams, method: string, body: unknown, req: Request) {
    const headers = req.headers();
    const prefer = headers["prefer"] || "";
    const wantsObject = (headers["accept"] || "").includes("vnd.pgrst.object");
    const representation = prefer.includes("return=representation");
    const filters = filtersOf(q);
    const where = (rows: Row[]) => rows.filter((r) => filters.every(([c, e]) => matches(r, c, e)));
    const send = (status: number, data: unknown, extra: Record<string, string> = {}) =>
      route.fulfill({ status, headers: { ...CORS, ...extra }, contentType: "application/json", body: data === undefined ? "" : JSON.stringify(data) });
    const shaped = (rows: Row[], status = 200) => {
      if (wantsObject) {
        if (rows.length !== 1)
          return send(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${rows.length} rows` });
        return send(status, rows[0]);
      }
      return send(status, rows, { "Content-Range": `0-${Math.max(0, rows.length - 1)}/${rows.length}` });
    };

    if (method === "GET" || method === "HEAD") {
      let rows = where(this.visible(table));
      const order = q.get("order");
      if (order) {
        const [col, dir] = order.split(",")[0].split(".");
        rows = [...rows].sort((a, b) => String(a[col] ?? "").localeCompare(String(b[col] ?? "")) * (dir === "desc" ? -1 : 1));
      }
      const limit = Number(q.get("limit") || 0);
      if (limit) rows = rows.slice(0, limit);
      if (method === "HEAD") return route.fulfill({ status: 200, headers: { ...CORS, "Content-Range": `*/${rows.length}` }, body: "" });
      return shaped(this.embed(table, q.get("select") || "*", rows));
    }

    if (method === "POST") {
      const incoming = (Array.isArray(body) ? body : [body]) as Row[];
      const merge = prefer.includes("resolution=merge-duplicates");
      const ignore = prefer.includes("resolution=ignore-duplicates");
      const key = q.get("on_conflict") || "id";
      const out: Row[] = [];
      for (const r of incoming) {
        const row: Row = { created_at: new Date().toISOString(), ...r, id: r.id ?? id("e") };
        const at = this.table(table).findIndex((x) => x[key] != null && x[key] === row[key]);
        if (at >= 0) {
          if (ignore) continue;
          if (!merge) return send(409, { code: "23505", message: `duplicate key value violates unique constraint "${table}_pkey"` });
          this.table(table)[at] = { ...this.table(table)[at], ...row };
          out.push(this.table(table)[at]);
        } else {
          this.table(table).push(row);
          out.push(row);
        }
      }
      return representation ? shaped(out, 201) : send(201, undefined);
    }

    if (method === "PATCH") {
      const patch = (body || {}) as Row;
      const hit = where(this.table(table));
      for (const r of hit) Object.assign(r, patch);
      return representation ? shaped(hit) : send(204, undefined);
    }

    if (method === "DELETE") {
      const hit = new Set(where(this.table(table)));
      this.tables[table] = this.table(table).filter((r) => !hit.has(r));
      return representation ? shaped([...hit]) : send(204, undefined);
    }

    return send(405, { message: `flow mock: ${method} ${table}` });
  }
}

/** A mock already wired to the page, with Google Fonts refused like every other outside host. */
export async function mockSupabase(page: Page): Promise<MockSupabase> {
  const mock = new MockSupabase();
  await mock.install(page);
  return mock;
}
