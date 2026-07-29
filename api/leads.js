import { handleError, HttpError, json, readJson, requireWebhookSecret } from "./_lib/http.js";
import { getSupabaseAdmin } from "./_lib/supabase-admin.js";
import { chooseAgent, findDuplicate, followUpDraft, nextFollowUp, normalizeLead, scoreLead } from "./_lib/lead-automation.js";

export const config = { runtime: "nodejs" };

export function GET() {
  return json({ service: "EstateFlow lead automation", status: "ready" });
}

export async function POST(request) {
  try {
    requireWebhookSecret(request);
    const supabase = getSupabaseAdmin();
    const lead = normalizeLead(await readJson(request));
    const duplicate = await findDuplicate(supabase, lead);
    if (duplicate) {
      await supabase.from("timeline_events").insert({
        lead_id: duplicate.id, event_type: "duplicate_received",
        title: `Duplicate ${lead.source} enquiry received`, description: lead.intent,
        payload: { incoming: lead },
      });
      return json({ duplicate: true, lead: duplicate });
    }
    const qualification = scoreLead(lead);
    const assignedAgent = await chooseAgent(supabase, lead);
    const { data: created, error } = await supabase.from("leads").insert({
      ...lead, ...qualification, assigned_agent_id: assignedAgent,
      next_follow_up_at: nextFollowUp(qualification.score), summary: lead.intent,
    }).select().single();
    if (error) throw new HttpError(500, "Could not create lead", error.message);
    await supabase.from("timeline_events").insert({
      lead_id: created.id, event_type: "lead_created", title: `Lead captured from ${created.source}`,
      description: qualification.score_reason, payload: { score: created.score, temperature: created.temperature },
    });
    await supabase.from("tasks").insert({
      lead_id: created.id, assigned_to: assignedAgent,
      title: qualification.score >= 80 ? "Call hot lead" : "Follow up with new lead",
      due_at: created.next_follow_up_at, priority: qualification.score >= 80 ? "high" : "medium",
    });
    await supabase.from("message_drafts").insert({
      lead_id: created.id, channel: created.source === "whatsapp" ? "whatsapp" : "email",
      content: followUpDraft(created), status: "pending", generated_by: "rules",
    });
    return json({ duplicate: false, lead: created }, 201);
  } catch (error) { return handleError(error); }
}
