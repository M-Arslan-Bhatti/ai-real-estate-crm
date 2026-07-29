import { assertAdmin, getSupabaseAdmin } from "./_lib/supabase-admin.js";
import { handleError, HttpError, json, readJson } from "./_lib/http.js";

export const config = { runtime: "nodejs" };

export async function POST(request) {
  try {
    const actor = await assertAdmin(request);
    const { draft_id: draftId, action, rejection_reason: rejectionReason } = await readJson(request);
    if (!draftId || !["approve", "reject"].includes(action)) {
      throw new HttpError(422, "draft_id and approve/reject action are required");
    }
    const supabase = getSupabaseAdmin();
    const next = action === "approve"
      ? { status: "approved", approved_by: actor.id, approved_at: new Date().toISOString(), rejection_reason: null }
      : { status: "rejected", rejection_reason: rejectionReason || "Rejected by reviewer" };
    const { data: draft, error } = await supabase.from("message_drafts")
      .update(next).eq("id", draftId).eq("status", "pending").select().maybeSingle();
    if (error) throw error;
    if (!draft) throw new HttpError(409, "Only pending drafts can be reviewed");
    await supabase.from("timeline_events").insert({
      lead_id: draft.lead_id,
      actor_id: actor.id,
      event_type: `message_${draft.status}`,
      title: action === "approve" ? "Follow-up approved" : "Follow-up rejected",
      payload: { draft_id: draft.id, channel: draft.channel },
    });

    if (action === "approve" && process.env.N8N_WEBHOOK_URL) {
      const response = await fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-workflow-secret": process.env.N8N_WEBHOOK_SECRET || "",
          "idempotency-key": `draft-${draft.id}`,
        },
        body: JSON.stringify({ event: "message.approved", draft }),
      });
      if (!response.ok) throw new HttpError(502, "n8n did not accept the approved message");
    }
    return json({ draft, queued: action === "approve" && Boolean(process.env.N8N_WEBHOOK_URL) });
  } catch (error) { return handleError(error); }
}
