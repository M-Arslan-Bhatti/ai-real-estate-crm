import test from "node:test";
import assert from "node:assert/strict";
import { followUpDraft, nextFollowUp, normalizeLead, normalizePhone, scoreLead } from "../api/_lib/lead-automation.js";

test("normalizes a website lead and phone number", () => {
  const lead = normalizeLead({ name: "  Sara Khan ", email: " SARA@EXAMPLE.COM ", phone: "+971 50 123 4567", source: "website" });
  assert.equal(lead.full_name, "Sara Khan");
  assert.equal(lead.email, "sara@example.com");
  assert.equal(lead.normalized_phone, "+971501234567");
});

test("rejects invalid phone numbers", () => {
  assert.throws(() => normalizePhone("123"), /7 to 15 digits/);
});

test("scores an urgent premium lead as hot", () => {
  const result = scoreLead(normalizeLead({
    name: "Omar", phone: "+971501234567", source: "whatsapp",
    budget: 1_500_000, timeline: "immediate", area: "Dubai Marina", property_type: "Apartment",
  }));
  assert.equal(result.temperature, "hot");
  assert.ok(result.score >= 80);
});

test("creates deterministic reminder and approval draft", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(nextFollowUp(90, now), "2026-01-01T00:15:00.000Z");
  assert.match(followUpDraft({ full_name: "Ali", preferred_area: "Downtown" }), /Ali/);
});
