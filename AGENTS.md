# APEC Lagos Workspace Rules

## Required account identity

This repository belongs only to the APEC Lagos service accounts recorded in
`project-identity.json`.

Before any GitHub push, Supabase mutation, or Vercel deployment:

1. Run `npm run account:check`.
2. Confirm the GitHub account is `officialahplagos`.
3. Confirm Supabase shows organization `officialahplagos Org`, project
   `apec-lagos`, and project ref `twjpsdtovbfetzbbmlaz`.
4. Confirm Vercel shows account `officialahplagos`, team
   `officialahplagos-projects`, and project `apec-lagos`.
5. Stop immediately when any account or project does not match.

The committed pre-push hook runs the identity check automatically. Keep this
repository configured with `core.hooksPath=.githooks`.

Browser sessions and Codex connectors are global and must be checked separately;
a correct browser login does not prove that a connector or CLI login is correct.

Never place a Supabase service-role or secret key in client code or in a
committed file.
