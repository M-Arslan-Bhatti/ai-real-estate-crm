# n8n workflows

The workflow exports in this directory are credential-free templates.

1. Lead capture receives website/Meta payloads and invokes the secured CRM lead API.
2. Follow-up reminders poll due tasks every 15 minutes with idempotent workflow runs.
3. Approved-message dispatch only accepts drafts already approved by a human.
4. HTTP nodes apply bounded retries and failed runs remain visible in the CRM.

Copy `.env.example` to `.env`, generate the two random secrets, then run
`docker compose up -d`. Import the three JSON files and publish the workflows.
Every internal request includes `X-Workflow-Secret` and an idempotency key.
Configure channel credentials inside n8n rather than editing exported JSON.
