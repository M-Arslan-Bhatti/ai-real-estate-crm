import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the EstateFlow dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>EstateFlow AI/);
  assert.match(html, /Sales pipeline/);
  assert.match(html, /Needs your approval/);
  assert.match(html, /Priority leads/);
  assert.match(html, /Automation health/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships product metadata, schema and social preview", async () => {
  const [page, layout, schema, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Approve & send/);
  assert.match(page, /AI qualified a new lead/);
  assert.match(layout, /EstateFlow AI/);
  assert.match(layout, /summary_large_image/);
  assert.match(schema, /workflowRuns/);
  assert.match(schema, /idempotencyKey/);
  assert.match(packageJson, /"name": "ai-real-estate-crm"/);
  await access(new URL("../public/og.png", import.meta.url));
});
