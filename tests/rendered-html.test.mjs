import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const port = 3400 + (process.pid % 400);
const baseUrl = `http://127.0.0.1:${port}`;
const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
let server;
let serverOutput = "";

before(async () => {
  server = spawn(process.execPath, [nextCli, "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next server exited before testing.\n${serverOutput}`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await delay(250);
  }

  throw new Error(`Next server did not become ready.\n${serverOutput}`);
});

after(() => {
  server?.kill();
});

async function render(pathname = "/") {
  return fetch(`${baseUrl}${pathname}`, {
    headers: { accept: "text/html" },
  });
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
  assert.match(html, /Likely medical conditions/);
  assert.match(html, /Public callback number/);
  assert.match(html, /Submit for Officer Review/);
  assert.match(html, /Caregiver Reference and Safeguarding Register/);
  assert.match(html, /Caregiver Vetting Workflow/);
  assert.match(html, /Policies and Guidance/);
  assert.match(html, />Login</);
  assert.doesNotMatch(html, /Apply Now/);
  assert.match(html, /href="\/apply"/);
  assert.match(html, /href="\/portal"/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /mobile-web-app-capable/);
  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Your site is taking shape/i,
  );
});

test("serves an installable and privacy-safe web app shell", async () => {
  const [manifestResponse, workerResponse, offlineResponse] = await Promise.all([
    fetch(`${baseUrl}/manifest.webmanifest`),
    fetch(`${baseUrl}/sw.js`),
    fetch(`${baseUrl}/offline.html`),
  ]);

  assert.equal(manifestResponse.status, 200);
  assert.match(
    manifestResponse.headers.get("content-type") ?? "",
    /^application\/manifest\+json/i,
  );
  const manifest = await manifestResponse.json();
  assert.equal(manifest.name, "APEC Lagos");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));

  assert.equal(workerResponse.status, 200);
  assert.match(workerResponse.headers.get("service-worker-allowed") ?? "", /^\/$/);
  const worker = await workerResponse.text();
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /fetch\(request\)\.catch/);
  assert.doesNotMatch(worker, /supabase|\/portal|localStorage/i);

  assert.equal(offlineResponse.status, 200);
  assert.match(await offlineResponse.text(), /You are offline/);

  const homeResponse = await fetch(baseUrl);
  assert.equal(homeResponse.headers.get("x-content-type-options"), "nosniff");
  assert.equal(homeResponse.headers.get("x-frame-options"), "DENY");
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

test("keeps APEC branding and uses production safeguarding workflows", async () => {
  const [css, page, publicIntake, policyResources, portal, application, installApp, mobileMenu, manifest, serviceWorker, nextConfig, migration, productionMigration, policyMigration, serviceRoleMigration, reviewFunction, layout, packageJson, readme] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PublicMissingElderRegistry.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PolicyResources.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PortalApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/MembershipApplicationForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/InstallApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/MobileMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../supabase/migrations/20260806120000_membership_application_workflow.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../supabase/migrations/20260814150000_public_missing_elder_intake_and_application_edits.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../supabase/migrations/20260816090000_policy_resources_and_admin_lockdown.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../supabase/migrations/20260814122500_membership_approval_service_role.sql",
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
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);

  assert.match(css, /--teal:\s*#0f766e/);
  assert.match(css, /--navy:\s*#162b45/);
  assert.match(css, /--gold:\s*#d9a441/);
  assert.match(css, /\.mobile-drawer/);
  assert.match(css, /\.footer-icon-strip/);
  assert.match(css, /\.portal-shell/);
  assert.match(css, /\.resource-grid/);
  assert.match(css, /\.password-visibility-button/);
  assert.match(css, /\.install-app-button/);
  assert.match(css, /\.mobile-menu-open \.install-app-button/);
  assert.match(css, /\.install-dialog/);
  assert.match(page, /PublicMissingElderRegistry/);
  assert.match(page, /PolicyResources/);
  assert.match(page, /vettingSteps/);
  assert.match(publicIntake, /submit_missing_elder_report/);
  assert.match(publicIntake, /Likely medical conditions/);
  assert.match(publicIntake, /consentConfirmed/);
  assert.match(publicIntake, /toISOString\(\)/);
  assert.match(publicIntake, /remove\(\[photoPath\]\)/);
  assert.match(policyResources, /apec-public-resources|storage_bucket/);
  assert.match(policyResources, /No APEC policy documents have been published yet/);
  assert.match(policyResources, /Published policies could not be loaded/);
  assert.match(portal, /createBrowserSupabaseClient/);
  assert.match(portal, /member_organizations/);
  assert.match(portal, /missing_elder_cases/);
  assert.match(portal, /Likely medical conditions/);
  assert.match(portal, /medicalConditions/);
  assert.match(portal, /medicalRisksOther/);
  assert.match(portal, /buildMedicalRisks/);
  assert.match(portal, /submit_missing_elder_report/);
  assert.match(portal, /public-intake\/\$\{crypto\.randomUUID\(\)\}/);
  assert.match(portal, /photo\.size > 5 \* 1024 \* 1024/);
  assert.match(portal, /remove\(\[photoPath\]\)/);
  assert.match(portal, /p_consent_confirmed/);
  assert.doesNotMatch(portal, /buildReference/);
  assert.match(portal, /compliance_officer/);
  assert.match(portal, /review-membership-application/);
  assert.match(portal, /Edit Application/);
  assert.match(portal, /Secure invitation link/);
  assert.match(portal, /FunctionsHttpError/);
  assert.match(portal, /handleMembershipApplicationUpdate/);
  assert.match(portal, /update_membership_application_for_review/);
  assert.match(portal, /exchangeCodeForSession/);
  assert.match(portal, /PASSWORD_RECOVERY/);
  assert.match(portal, /resetPasswordForEmail/);
  assert.match(portal, /Send Password Setup Email/);
  assert.match(portal, /password_setup/);
  assert.match(portal, /PasswordField/);
  assert.match(portal, /Publish Announcement/);
  assert.match(portal, /Publish Policy/);
  assert.match(portal, /apec-public-resources/);
  assert.match(portal, /file\.size > 10 \* 1024 \* 1024/);
  assert.match(portal, /file\.type !== contentType/);
  assert.match(portal, /You cannot change your own role or access status/);
  assert.match(portal, /status: "under_review"/);
  assert.match(portal, /update\(\{ status: "active" \}\)/);
  assert.doesNotMatch(portal, /Claim First Admin|handleClaimFirstAdmin/);
  assert.match(portal, /applicationEditDirty/);
  assert.match(portal, /form\.reportValidity\(\)/);
  assert.match(portal, /disabled=\{isWorking \|\| !applicationEditDirty\}/);
  assert.doesNotMatch(portal, /if \(isEditing\) void handleMembershipApplicationUpdate/);
  assert.match(application, /membership_applications/);
  assert.match(application, /Membership categories could not be loaded/);
  assert.match(installApp, /beforeinstallprompt/);
  assert.match(installApp, /navigator\.serviceWorker\.register/);
  assert.match(installApp, /Add to Home Screen/);
  assert.match(installApp, /document\.body\.style\.overflow = "hidden"/);
  assert.match(installApp, /installButtonRef\.current\?\.focus/);
  assert.match(mobileMenu, /mobile-menu-open/);
  assert.match(manifest, /"display": "standalone"/);
  assert.match(serviceWorker, /offline\.html/);
  assert.match(nextConfig, /X-Content-Type-Options/);
  assert.match(migration, /Public can submit membership applications/);
  assert.match(migration, /private\.can_review_membership/);
  assert.match(serviceRoleMigration, /membership_applications to service_role/);
  assert.match(serviceRoleMigration, /member_organizations to service_role/);
  assert.match(productionMigration, /submit_missing_elder_report/);
  assert.match(productionMigration, /Public can read published missing elder photos/);
  assert.match(productionMigration, /update_membership_application_for_review/);
  assert.match(policyMigration, /Public can read published policy documents/);
  assert.match(policyMigration, /apec-public-resources/);
  assert.match(policyMigration, /revoke all on function public\.claim_first_admin/);
  assert.match(reviewFunction, /2026-08-19-custom-domain/);
  assert.match(reviewFunction, /https:\/\/www\.apeclagos\.org\.ng/);
  assert.match(reviewFunction, /generateLink/);
  assert.doesNotMatch(page + css, /footer-photo-strip|module-photo|demo-banner/);
  assert.match(layout, /APEC Lagos \| Elderly Care Provider Platform/);
  assert.match(layout, /metadataBase: new URL\("https:\/\/www\.apeclagos\.org\.ng"\)/);
  assert.match(layout, /InstallApp/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(packageJson, /lucide-react/);
  assert.doesNotMatch(packageJson, /vinext|wrangler|cloudflare|drizzle/i);
  assert.match(readme, /APEC Lagos Platform/);
  assert.doesNotMatch(readme, /vinext-starter|ChatGPT Sign-In|OpenAI workspace/i);
  assert.doesNotMatch(
    page + portal + layout + packageJson,
    /codex-preview|_sites-preview|react-loading-skeleton|Starter Project|fictional|sample data|demo portal|pilot build/i,
  );
});
