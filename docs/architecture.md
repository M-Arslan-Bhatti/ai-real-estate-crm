# Architecture

EstateFlow separates intake, business logic, automation and delivery.

```text
Channels → Webhook gateway → CRM API → Database
                              ↓
                         LLM service
                              ↓
                      Approval outbox
                              ↓
                    n8n → Channel API
```

## Design decisions

- Incoming channel payloads are normalized before entering the domain model.
- Duplicate detection runs before expensive AI calls.
- AI output is validated against a JSON schema.
- Assignment uses deterministic rules with round-robin fallback.
- Sending is an outbox operation and never happens inside generation.
- Timeline records are append-only.
- Retries reuse an idempotency key and cannot create duplicate messages.

## Production services

The deployable showcase uses Cloudflare-compatible storage. The full service target uses Supabase Auth/Postgres with row-level security, a TypeScript API and n8n orchestration. AWS can host the frontend, API containers, secrets and observability without replacing the database layer.
