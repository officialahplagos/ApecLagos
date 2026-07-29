import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the APEC Lagos platform shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>APEC Lagos \| Elderly Care Provider Platform<\/title>/i,
  );
  assert.match(html, /APEC Lagos member and safeguarding system/);
  assert.match(html, /Missing Elders Registry/);
  assert.match(html, /Caregiver Reference and Safeguarding Register/);
  assert.match(html, /Caregiver Vetting Workflow/);
  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Your site is taking shape/i,
  );
});

test("keeps APEC branding and removes starter preview code", async () => {
  const [css, page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(css, /--teal:\s*#0f766e/);
  assert.match(css, /--navy:\s*#1e3a5f/);
  assert.match(css, /--gold:\s*#d9a441/);
  assert.match(page, /missingElders/);
  assert.match(page, /vettingSteps/);
  assert.match(page, /referenceRows/);
  assert.match(layout, /APEC Lagos \| Elderly Care Provider Platform/);
  assert.doesNotMatch(
    page + layout + packageJson,
    /codex-preview|_sites-preview|react-loading-skeleton|Starter Project/,
  );
});
