/**
 * Usage events into our own database (analytics_events, supabase/analytics.sql),
 * read by the team and nobody else. Numbers, ids and short fixed labels;
 * never what anybody said or wrote (analyticsEvents.js cleanProps enforces
 * it). Fire and forget, batched; a failed send is dropped, never retried
 * into a pile, never shown. Off when "Help improve A Story" is off.
 *
 * Every event carries platform "web" so the team's views can tell the two
 * products apart (deploy-2026-10.md §5).
 */
import { getSupabase } from "./supabase";
import { cleanProps, isKnownEvent } from "../app-core/lib/analyticsEvents.js";

/** Events the web adds to the app's list (docs/PRD.md §9). */
const WEB_EVENTS = new Set([
  "account_created",
  "first_run_completed",
  "question_shown",
  "question_answered",
  "talk_wall_shown",
  "invite_sent",
  "join_completed",
  "contribution_sent",
  "contribution_approved",
  "claim_completed",
  "book_preview_opened",
  "book_pdf_downloaded",
  "book_checkout_started",
  "plans_viewed",
  "checkout_started",
  "digest_link_opened",
  "export_requested",
]);

const FLUSH_MS = 5000;
const MAX_BATCH = 25;
const MAX_QUEUE = 200;
const SESSION = Math.random().toString(36).slice(2, 12);
const APP_VERSION = "web";

let enabled = false;
let queue: Record<string, unknown>[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let tableMissing = false;

export function setAnalyticsUser(user: { id: string; settings?: { shareUsage?: boolean } } | null) {
  enabled = !!user?.id && user?.settings?.shareUsage !== false;
  if (!enabled) queue = [];
}

export function track(event: string, props: Record<string, unknown> = {}) {
  if (!enabled || tableMissing) return;
  if (!isKnownEvent(event) && !WEB_EVENTS.has(event)) {
    if (import.meta.env.DEV) console.warn(`analytics: unknown event "${event}"`);
    return;
  }
  queue.push({
    event,
    props: cleanProps({ ...props, source: "web" }),
    session_id: SESSION,
    platform: "web",
    app_version: APP_VERSION,
    created_at: new Date().toISOString(),
  });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  if (queue.length >= MAX_BATCH) void flush();
  else if (!timer) timer = setTimeout(() => void flush(), FLUSH_MS);
}

export async function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const sb = getSupabase();
  if (!enabled || !queue.length || !sb) return;
  const batch = queue.splice(0, MAX_BATCH);
  // user_id is filled in by the database from the session (default auth.uid()).
  const { error } = await sb.from("analytics_events").insert(batch);
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) tableMissing = true;
    else if (import.meta.env.DEV) console.warn("analytics:", error.message || error);
  }
  if (queue.length && !timer) timer = setTimeout(() => void flush(), FLUSH_MS);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
}
