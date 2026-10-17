/**
 * The question a relative sent in, and who sent it, for the memories that
 * answered one (public.family_questions, linked by memory_id when the
 * storyteller answers). The book prints "The question … Asked by Dylan"
 * only from this; a memory nobody asked for prints no such line. Rows the
 * policy hides (a question somebody else asked of somebody else) simply
 * never arrive, and a database without the table reads as no questions.
 */
import { supabase } from "../../lib/supabase";
import type { Asked } from "./bookPages";

type Row = { memory_id: string | null; asker_name: string | null; question: string | null };

export async function loadAskedQuestions(memoryIds: string[]): Promise<Record<string, Asked>> {
  if (!memoryIds.length) return {};
  try {
    const { data, error } = await supabase().from("family_questions").select("memory_id, asker_name, question").in("memory_id", memoryIds).eq("status", "answered");
    if (error || !data) return {};
    const out: Record<string, Asked> = {};
    for (const r of data as Row[]) {
      if (r.memory_id && r.question) out[r.memory_id] = { q: r.question.trim(), by: (r.asker_name || "").trim() || "the family" };
    }
    return out;
  } catch {
    return {};
  }
}
