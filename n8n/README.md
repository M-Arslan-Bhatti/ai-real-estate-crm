# n8n workflows

The workflow exports in this directory are credential-free templates.

1. New lead qualification validates the event, invokes the CRM API and records the outcome.
2. Follow-up reminders poll due tasks and create approval requests.
3. Error handling applies bounded retries and alerts an administrator after the final attempt.

Every request must include `X-Workflow-Secret` and an idempotency key. Configure credentials inside n8n rather than editing exported JSON.
