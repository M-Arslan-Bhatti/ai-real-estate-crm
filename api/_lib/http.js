export function json(response, status = 200) {
  return new Response(JSON.stringify(response), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function readJson(request) {
  try { return await request.json(); } catch { throw new HttpError(400, "Request body must be valid JSON"); }
}

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function handleError(error) {
  if (error instanceof HttpError) return json({ error: error.message, details: error.details }, error.status);
  console.error(error);
  return json({ error: "Internal server error" }, 500);
}

export function requireWebhookSecret(request) {
  const expected = process.env.CRM_WEBHOOK_SECRET;
  if (!expected) throw new HttpError(503, "CRM_WEBHOOK_SECRET is not configured");
  if (request.headers.get("x-crm-webhook-secret") !== expected) throw new HttpError(401, "Invalid webhook secret");
}
