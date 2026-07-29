import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["admin", "sales_agent"] }).notNull(),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  normalizedPhone: text("normalized_phone"),
  source: text("source", { enum: ["website", "whatsapp", "facebook", "manual"] }).notNull(),
  status: text("status", { enum: ["new", "qualified", "viewing", "negotiation", "won", "lost"] }).notNull().default("new"),
  score: integer("score").notNull().default(0),
  temperature: text("temperature", { enum: ["hot", "warm", "cold"] }).notNull().default("cold"),
  intent: text("intent"),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  preferredArea: text("preferred_area"),
  propertyType: text("property_type"),
  assignedAgentId: text("assigned_agent_id").references(() => profiles.id),
  nextFollowUpAt: integer("next_follow_up_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("leads_phone_idx").on(table.normalizedPhone),
  index("leads_agent_idx").on(table.assignedAgentId),
  index("leads_status_idx").on(table.status),
]);

export const timelineEvents = sqliteTable("timeline_events", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull().references(() => leads.id),
  actorId: text("actor_id").references(() => profiles.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  payload: text("payload", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [index("timeline_lead_idx").on(table.leadId)]);

export const messageDrafts = sqliteTable("message_drafts", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull().references(() => leads.id),
  channel: text("channel", { enum: ["whatsapp", "email", "sms"] }).notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "sent", "failed"] }).notNull().default("pending"),
  approvedBy: text("approved_by").references(() => profiles.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const workflowRuns = sqliteTable("workflow_runs", {
  id: text("id").primaryKey(),
  workflowName: text("workflow_name").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  status: text("status", { enum: ["queued", "running", "completed", "failed", "retrying"] }).notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  errorMessage: text("error_message"),
  durationMs: real("duration_ms"),
  nextRetryAt: integer("next_retry_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});
