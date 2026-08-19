# APEC Lagos Platform

Public safeguarding, membership onboarding, and role-based association tools
for the Association of Providers of Elderly Care in Lagos State.

## Application Areas

- Public, officer-reviewed missing elder reporting
- Membership applications and invitation-based portal access
- Compliance review and member organisation records
- Caregiver employment references and safeguarding incident workflows
- APEC policy publishing and public resource access
- Administrator announcements
- Installable Progressive Web App for supported phones and computers

## Technology

- Next.js and React
- Supabase Authentication, Postgres, Row Level Security, Storage, and Edge Functions
- Vercel production hosting

## Local Development

Requires Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and provide the APEC Supabase publishable
key. Never place a Supabase secret or service-role key in a browser environment
variable or committed file.

## Verification

```bash
npm run account:check
npm run lint
npm run typecheck
npm test
```

`npm test` creates a production Next.js build and verifies the public pages,
portal shell, security headers, web app manifest, service worker, and offline
fallback.

## Deployment Identity

Provider mutations and deployments must pass the repository identity checks in
`AGENTS.md` and `project-identity.json`.

- GitHub: `officialahplagos/ApecLagos`
- Supabase project ref: `twjpsdtovbfetzbbmlaz`
- Vercel team/project: `officialahplagos-projects/apec-lagos`
- Production: `https://www.apeclagos.org.ng`
- Vercel fallback: `https://apec-lagos.vercel.app`

The production PWA is installed directly from the website. Android and
Chromium browsers can show a native install prompt; iPhone and iPad users add
it from the browser Share menu.
