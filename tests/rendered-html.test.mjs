import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
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
  assert.match(html, /Trusted infrastructure for elderly care providers/);
  assert.match(html, /Missing Elders Registry/);
  assert.match(html, /Last known photo/);
  assert.match(html, /Contact number if found/);
  assert.match(html, /If found call/);
  assert.match(html, /Caregiver Reference and Safeguarding Register/);
  assert.match(html, /Caregiver Vetting Workflow/);
  assert.match(html, /href="\/apply"/);
  assert.match(html, /href="\/portal"/);
  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Your site is taking shape/i,
  );
});

test("server-renders the Supabase-backed portal route", async () => {
  const response = await render("/portal");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Member access, applications, and safeguarding intake/);
  assert.match(
    html,
    /Sign in to the portal|Supabase key needed|Supabase project connected|Loading portal/,
  );
  assert.match(html, /Missing Elder Alerts/);
  assert.match(html, /Apply for Membership/);
});

test("server-renders the public membership application route", async () => {
  const response = await render("/apply");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Apply for APEC Lagos membership/);
  assert.match(html, /Compliance review/);
  assert.match(html, /Receive invitation/);
  assert.match(html, /consentConfirmed/);
  assert.doesNotMatch(html, /Create member account|Choose a temporary password/i);
});

test("keeps APEC branding and removes starter preview code", async () => {
  const [css, page, portal, application, migration, reviewFunction, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PortalApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/MembershipApplicationForm.tsx", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../supabase/migrations/20260806120000_membership_application_workflow.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../supabase/functions/review-membership-application/index.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(css, /--teal:\s*#0f766e/);
  assert.match(css, /--navy:\s*#162b45/);
  assert.match(css, /--gold:\s*#d9a441/);
  assert.match(css, /\.mobile-drawer/);
  assert.match(css, /\.footer-icon-strip/);
  assert.match(css, /\.portal-shell/);
  assert.match(page, /missingElders/);
  assert.match(page, /vettingSteps/);
  assert.match(page, /referenceRows/);
  assert.match(portal, /createBrowserSupabaseClient/);
  assert.match(portal, /member_organizations/);
  assert.match(portal, /missing_elder_cases/);
  assert.match(portal, /compliance_officer/);
  assert.match(portal, /review-membership-application/);
  assert.match(portal, /Edit Application/);
  assert.match(portal, /Secure invitation link/);
  assert.match(portal, /FunctionsHttpError/);
  assert.match(portal, /handleMembershipApplicationUpdate/);
  assert.match(application, /membership_applications/);
  assert.match(migration, /Public can submit membership applications/);
  assert.match(migration, /private\.can_review_membership/);
  assert.match(reviewFunction, /2026-08-14-approval-fallback/);
  assert.match(reviewFunction, /generateLink/);
  assert.doesNotMatch(page + css, /footer-photo-strip|module-photo/);
  assert.match(layout, /APEC Lagos \| Elderly Care Provider Platform/);
  assert.doesNotMatch(
    page + layout + packageJson,
    /codex-preview|_sites-preview|react-loading-skeleton|Starter Project/,
  );
});
