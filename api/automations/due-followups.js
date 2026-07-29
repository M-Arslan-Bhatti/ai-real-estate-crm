import { getSupabaseAdmin } from "../_lib/supabase-admin.js";
import { handleError, json } from "../_lib/http.js";
import { requireIdempotencyKey, requireWorkflowSecret } from "../_lib/workflow-auth.js";

export const config = { runtime: "nodejs" };

export async function POST(request) {
  try {
    requireWorkflowSecret(request);
    const idempotencyKey = requireIdempotencyKey(request);
    const supabase = getSupabaseAdmin();
    const existing = await supabase.from("workflow_runs").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing.data) return json({ replay: true, workflow: existing.data, reminders: [] });
    const started = Date.now();
    const { data: run, error: runError } = await supabase.from("workflow_runs").insert({
      workflow_name: "follow-up-reminders",
      entity_type: "task",
      status: "running",
      attempt_count: 1,
      idempotency_key: idempotencyKey,
      started_at: new Date().toISOString(),
    }).select().single();
    if (runError) throw runError;
    try {
      const { data: reminders, error } = await supabase.from("tasks")
        .select("id, title, due_at, priority, lead_id, assigned_to")
        .eq("status", "open").lte("due_at", new Date().toISOString())
        .order("due_at").limit(100);
      if (error) throw error;
      await supabase.from("workflow_runs").update({
        status: "completed", completed_at: new Date().toISOString(), duration_ms: Date.now() - started,
      }).eq("id", run.id);
      return json({ replay: false, workflow_id: run.id, reminders: reminders ?? [] });
    } catch (error) {
      await supabase.from("workflow_runs").update({
        status: "failed", error_message: error.message,
        next_retry_at: new Date(Date.now() + 5 * 60_000).toISOString(),
        duration_ms: Date.now() - started,
      }).eq("id", run.id);
      throw error;
    }
  } catch (error) { return handleError(error); }
}
