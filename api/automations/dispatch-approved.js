import { getSupabaseAdmin } from "../_lib/supabase-admin.js";
import { handleError, HttpError, json, readJson } from "../_lib/http.js";
import { requireIdempotencyKey, requireWorkflowSecret } from "../_lib/workflow-auth.js";

export const config = { runtime: "nodejs" };

export async function POST(request) {
  try {
    requireWorkflowSecret(request);
    const idempotencyKey = requireIdempotencyKey(request);
    const { draft_id: draftId, external_message_id: externalId } = await readJson(request);
    if (!draftId) throw new HttpError(422, "draft_id is required");
    const supabase = getSupabaseAdmin();
    const previous = await supabase.from("workflow_runs").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (previous.data?.status === "completed") return json({ replay: true });
    const { data: draft, error } = await supabase.from("message_drafts").update({
      status: "sent", sent_at: new Date().toISOString(),
      external_message_id: externalId || `n8n-${Date.now()}`,
    }).eq("id", draftId).eq("status", "approved").select().maybeSingle();
    if (error) throw error;
    if (!draft) throw new HttpError(409, "Draft must be approved before it can be marked sent");
    await supabase.from("workflow_runs").upsert({
      workflow_name: "dispatch-approved-message", entity_type: "message_draft", entity_id: draft.id,
      status: "completed", attempt_count: 1, idempotency_key: idempotencyKey,
      started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
    }, { onConflict: "idempotency_key" });
    await supabase.from("timeline_events").insert({
      lead_id: draft.lead_id, event_type: "message_sent", title: `${draft.channel} follow-up sent`,
      payload: { draft_id: draft.id, external_message_id: draft.external_message_id },
    });
    return json({ replay: false, draft });
  } catch (error) { return handleError(error); }
}
