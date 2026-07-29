# APEC Lagos Supabase Setup

Use this only for the `apec-lagos` Supabase project.

## Apply the schema

1. Open the APEC Supabase project.
2. Go to SQL Editor.
3. Open `supabase/migrations/20260729133000_initial_apec_lagos_schema.sql`.
4. Paste the full SQL into the editor.
5. Run it once.

The migration creates the membership tables, missing elder workflow, caregiver reference register, safeguarding incident workflow, renewal tracking, audit logs, private storage buckets, RLS policies, and starter membership categories.

## First admin user

After the first admin signs up in the app, run this in the SQL Editor with that user's email:

```sql
update public.profiles
set role = 'super_admin', status = 'active'
where email = 'replace-with-admin-email@example.com';
```

## Environment variables

Create `.env.local` when the app is ready to connect:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
# Legacy fallback if your dashboard still labels it as anon:
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Do not put the `service_role` key in the frontend or in chat.

## Security notes

- Keep `Automatically expose new tables` disabled.
- Keep RLS enabled.
- Public users can only read approved missing elder alert rows.
- Private missing elder details, caregiver references, safeguarding incidents, and documents require authenticated staff policies.
- NIN and BVN should be stored only as limited verification metadata, such as last four digits plus consent/document records.
