import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const identity = JSON.parse(
  readFileSync(path.join(root, "project-identity.json"), "utf8"),
);
const checkServices = process.argv.includes("--services");
const results = [];

function run(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }).trim();
  } catch {
    return null;
  }
}

function record(type, label, details) {
  results.push({ type, label, details });
}

function normalizeRemote(value) {
  return value?.replace(/\.git$/i, "").replace(/\\/g, "/").toLowerCase();
}

const remote = run("git", ["config", "--get", "remote.origin.url"]);
if (normalizeRemote(remote) === normalizeRemote(identity.github.remote)) {
  record("OK", "GitHub remote", remote);
} else {
  record("FAIL", "GitHub remote", remote ?? "not configured");
}

const commitName = run("git", ["config", "--local", "--get", "user.name"]);
if (commitName === identity.github.commitName) {
  record("OK", "Git commit name", commitName);
} else {
  record("FAIL", "Git commit name", commitName ?? "not configured locally");
}

const commitEmail = run("git", ["config", "--local", "--get", "user.email"]);
if (commitEmail === identity.github.commitEmail) {
  record("OK", "Git commit email", commitEmail);
} else {
  record("FAIL", "Git commit email", commitEmail ?? "not configured locally");
}

const githubAccount = run("gh", ["api", "user", "--jq", ".login"]);
if (githubAccount === identity.github.account) {
  record("OK", "GitHub CLI account", githubAccount);
} else {
  record("FAIL", "GitHub CLI account", githubAccount ?? "not authenticated");
}

const envExample = readFileSync(path.join(root, ".env.example"), "utf8");
const supabaseUrl = envExample.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1];
if (supabaseUrl === identity.supabase.projectUrl) {
  record("OK", "Supabase project URL", supabaseUrl);
} else {
  record("FAIL", "Supabase project URL", supabaseUrl ?? "not configured");
}

const vercelLinkPath = path.join(root, ".vercel", "project.json");
if (existsSync(vercelLinkPath)) {
  const vercelLink = JSON.parse(readFileSync(vercelLinkPath, "utf8"));
  if (!vercelLink.projectName || vercelLink.projectName === identity.vercel.project) {
    record("OK", "Vercel project link", vercelLink.projectName ?? vercelLink.projectId);
  } else {
    record("FAIL", "Vercel project link", vercelLink.projectName);
  }
} else {
  record("WARN", "Vercel project link", "run vercel link after CLI authentication");
}

if (checkServices) {
  const vercelAccount = run("vercel", ["whoami"]);
  if (vercelAccount === identity.vercel.account) {
    record("OK", "Vercel CLI account", vercelAccount);
  } else {
    record("FAIL", "Vercel CLI account", vercelAccount ?? "not authenticated");
  }
}

for (const result of results) {
  console.log(`[${result.type}] ${result.label}: ${result.details}`);
}

const failures = results.filter((result) => result.type === "FAIL");
if (failures.length > 0) {
  console.error(`\nIdentity check blocked: ${failures.length} mismatch(es) found.`);
  process.exitCode = 1;
} else {
  console.log("\nIdentity check passed.");
}
