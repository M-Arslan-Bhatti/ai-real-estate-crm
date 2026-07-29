import { HttpError } from "./http.js";

export function requireWorkflowSecret(request) {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) throw new HttpError(503, "N8N_WEBHOOK_SECRET is not configured");
  const supplied = request.headers.get("x-workflow-secret");
  if (supplied !== expected) throw new HttpError(401, "Invalid workflow secret");
}

export function requireIdempotencyKey(request) {
  const key = request.headers.get("idempotency-key");
  if (!key || key.length < 8) throw new HttpError(422, "A valid Idempotency-Key header is required");
  return key;
}
