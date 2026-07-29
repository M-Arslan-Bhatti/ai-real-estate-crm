export type LeadScoreInput = {
  budget?: number;
  timeline?: string;
  preferredArea?: string;
  propertyType?: string;
  email?: string;
  phone?: string;
  message?: string;
};

export function qualifyLead(input: LeadScoreInput) {
  let score = 20;
  const reasons: string[] = [];
  const timeline = input.timeline?.toLowerCase() ?? "";
  const message = input.message?.toLowerCase() ?? "";

  if ((input.budget ?? 0) >= 1_000_000) {
    score += 25;
    reasons.push("Budget matches premium inventory");
  } else if ((input.budget ?? 0) >= 600_000) {
    score += 17;
    reasons.push("Budget is within active inventory");
  }

  if (/immediate|week|30 days|month/.test(timeline + message)) {
    score += 25;
    reasons.push("Short purchase timeline");
  } else if (/three months|90 days|quarter/.test(timeline + message)) {
    score += 14;
    reasons.push("Medium purchase timeline");
  }

  if (input.preferredArea) {
    score += 10;
    reasons.push("Preferred area supplied");
  }
  if (input.propertyType) {
    score += 8;
    reasons.push("Property type supplied");
  }
  if (input.email && input.phone) {
    score += 12;
    reasons.push("Complete contact details");
  } else if (input.email || input.phone) {
    score += 6;
  }

  score = Math.min(100, score);
  return {
    score,
    temperature: score >= 80 ? "hot" : score >= 55 ? "warm" : "cold",
    reason: reasons.join(" · ") || "More qualification details required",
    recommendedAction:
      score >= 80 ? "Call within 15 minutes" : score >= 55 ? "Follow up today" : "Add to nurture sequence",
  } as const;
}
