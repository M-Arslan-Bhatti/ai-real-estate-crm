import { HttpError } from "./http.js";

const sources = new Set(["website", "whatsapp", "facebook", "manual"]);

export function normalizePhone(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) throw new HttpError(422, "Phone number must contain 7 to 15 digits");
  return `+${digits}`;
}

export function normalizeLead(input = {}) {
  const fullName = String(input.full_name ?? input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase() || null;
  const phone = String(input.phone ?? input.wa_id ?? "").trim() || null;
  const source = String(input.source ?? "website").toLowerCase();
  if (!fullName) throw new HttpError(422, "full_name is required");
  if (!email && !phone) throw new HttpError(422, "Email or phone is required");
  if (!sources.has(source)) throw new HttpError(422, "Unsupported lead source");
  return {
    full_name: fullName, email, phone, normalized_phone: normalizePhone(phone), source,
    intent: String(input.intent ?? input.message ?? "").trim() || null,
    budget_min: Number(input.budget_min ?? 0) || null,
    budget_max: Number(input.budget_max ?? input.budget ?? 0) || null,
    preferred_area: String(input.preferred_area ?? input.area ?? "").trim() || null,
    property_type: String(input.property_type ?? "").trim() || null,
    purchase_timeline: String(input.purchase_timeline ?? input.timeline ?? "").trim() || null,
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {},
  };
}

export function scoreLead(lead) {
  let score = 20;
  const reasons = [];
  const context = `${lead.purchase_timeline ?? ""} ${lead.intent ?? ""}`.toLowerCase();
  if ((lead.budget_max ?? 0) >= 1_000_000) { score += 25; reasons.push("Budget matches premium inventory"); }
  else if ((lead.budget_max ?? 0) >= 600_000) { score += 17; reasons.push("Budget is within active inventory"); }
  if (/immediate|week|30 days|month/.test(context)) { score += 25; reasons.push("Short purchase timeline"); }
  else if (/three months|90 days|quarter/.test(context)) { score += 14; reasons.push("Medium purchase timeline"); }
  if (lead.preferred_area) { score += 10; reasons.push("Preferred area supplied"); }
  if (lead.property_type) { score += 8; reasons.push("Property type supplied"); }
  score += lead.email && lead.phone ? 12 : 6;
  score = Math.min(score, 100);
  return {
    score,
    temperature: score >= 80 ? "hot" : score >= 55 ? "warm" : "cold",
    score_reason: reasons.join(" · ") || "More qualification details required",
    status: score >= 55 ? "qualified" : "new",
  };
}

export function nextFollowUp(score, now = new Date()) {
  const minutes = score >= 80 ? 15 : score >= 55 ? 240 : 1440;
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

export function followUpDraft(lead) {
  const area = lead.preferred_area ? ` in ${lead.preferred_area}` : "";
  return `Hi ${lead.full_name}, thank you for your interest in Dubai property${area}. A property consultant will review your requirements and contact you shortly.`;
}

export async function findDuplicate(supabase, lead) {
  if (lead.normalized_phone) {
    const result = await supabase.from("leads").select("*").eq("normalized_phone", lead.normalized_phone).maybeSingle();
    if (result.error) throw result.error;
    if (result.data) return result.data;
  }
  if (lead.email) {
    const result = await supabase.from("leads").select("*").ilike("email", lead.email).maybeSingle();
    if (result.error) throw result.error;
    if (result.data) return result.data;
  }
  return null;
}

export async function chooseAgent(supabase, lead) {
  const { data: rules, error: rulesError } = await supabase.from("assignment_rules").select("target_agent_id, conditions, priority").eq("active", true).order("priority");
  if (rulesError) throw rulesError;
  const matching = rules?.find(({ conditions = {} }) =>
    (!conditions.source || conditions.source === lead.source) &&
    (!conditions.preferred_area || conditions.preferred_area === lead.preferred_area) &&
    (!conditions.property_type || conditions.property_type === lead.property_type));
  if (matching?.target_agent_id) return matching.target_agent_id;
  const { data: agents, error } = await supabase.from("profiles").select("id").eq("role", "sales_agent").eq("status", "active");
  if (error) throw error;
  if (!agents?.length) return null;
  const counts = await Promise.all(agents.map(async ({ id }) => {
    const result = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("assigned_agent_id", id);
    return { id, count: result.count ?? 0 };
  }));
  return counts.sort((a, b) => a.count - b.count || a.id.localeCompare(b.id))[0].id;
}
