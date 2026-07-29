-- APEC Lagos initial Supabase schema.
-- Apply this only to the APEC project, not to Naija Seniors or any other app.

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique,
  full_name text,
  phone text,
  role text not null default 'pending_member'
    check (role in ('super_admin', 'secretary_admin', 'committee_member', 'member', 'pending_member')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  annual_dues numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.member_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.membership_categories(id),
  membership_number text unique,
  contact_person text,
  position_title text,
  services_offered text[] not null default '{}',
  phone text,
  email citext,
  lga text,
  address text,
  cac_registered boolean,
  state_registered text,
  year_established integer,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'rejected', 'archived')),
  date_joined date,
  renewal_due_date date,
  remarks text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.member_organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_role text not null default 'contact'
    check (organization_role in ('owner', 'admin_contact', 'contact', 'staff')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_audience text not null default 'members'
    check (target_audience in ('public', 'members', 'admins', 'committee')),
  is_pinned boolean not null default false,
  is_urgent boolean not null default false,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.missing_elder_cases (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  elder_name text not null,
  approximate_age integer,
  photo_path text,
  last_seen_location text not null,
  last_seen_at timestamptz,
  clothing_description text,
  public_notes text,
  police_reference text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'active', 'found', 'closed', 'rejected')),
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.missing_elder_private_details (
  case_id uuid primary key references public.missing_elder_cases(id) on delete cascade,
  submitter_name text,
  submitter_phone text,
  family_contact_name text,
  family_contact_phone text,
  medical_risks text,
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.caregiver_profiles (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  phone text,
  email citext,
  nin_last4 text check (nin_last4 is null or nin_last4 ~ '^[0-9]{4}$'),
  bvn_last4 text check (bvn_last4 is null or bvn_last4 ~ '^[0-9]{4}$'),
  consent_obtained boolean not null default false,
  consent_document_path text,
  created_by_organization_id uuid references public.member_organizations(id),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'under_review', 'restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.caregiver_employment_references (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.caregiver_profiles(id) on delete cascade,
  organization_id uuid references public.member_organizations(id),
  role_title text not null,
  start_date date,
  end_date date,
  supervisor_name text,
  supervisor_contact text,
  conduct_summary text,
  rehire_eligible boolean,
  consent_verified boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'disputed', 'rejected')),
  verified_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.caregiver_vetting_checks (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.caregiver_profiles(id) on delete cascade,
  check_type text not null
    check (check_type in (
      'nin', 'bvn', 'police_character_certificate', 'home_address',
      'employment_reference', 'guarantor', 'qualification_license',
      'competency_interview', 'practical_assessment', 'medical_fitness',
      'probation_review'
    )),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'passed', 'failed', 'expired', 'waived')),
  completed_at timestamptz,
  expires_at timestamptz,
  document_path text,
  notes text,
  completed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.caregiver_safeguarding_incidents (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.caregiver_profiles(id) on delete cascade,
  reporting_organization_id uuid references public.member_organizations(id),
  incident_category text not null,
  incident_date date,
  summary text not null,
  evidence_document_path text,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'confirmed', 'dismissed', 'appealed', 'closed')),
  do_not_rehire_recommendation boolean not null default false,
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.caregiver_incident_responses (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.caregiver_safeguarding_incidents(id) on delete cascade,
  respondent_name text not null,
  response_text text not null,
  submitted_by uuid references public.profiles(id),
  submitted_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  document_type text not null,
  storage_bucket text not null default 'apec-private-documents',
  storage_path text not null,
  access_level text not null default 'restricted'
    check (access_level in ('public', 'members', 'admin', 'restricted')),
  organization_id uuid references public.member_organizations(id),
  missing_elder_case_id uuid references public.missing_elder_cases(id),
  caregiver_id uuid references public.caregiver_profiles(id),
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.renewals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.member_organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount_due numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'partial', 'paid', 'waived', 'overdue')),
  recorded_by uuid references public.profiles(id),
  recorded_at timestamptz not null default now(),
  notes text
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'secretary_admin', 'committee_member')
     from public.profiles
     where id = (select auth.uid())),
    false
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'secretary_admin')
     from public.profiles
     where id = (select auth.uid())),
    false
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.current_user_role() from public, anon;
revoke all on function private.is_staff() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_admin() to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger set_member_organizations_updated_at before update on public.member_organizations
  for each row execute function private.set_updated_at();
create trigger set_announcements_updated_at before update on public.announcements
  for each row execute function private.set_updated_at();
create trigger set_missing_elder_cases_updated_at before update on public.missing_elder_cases
  for each row execute function private.set_updated_at();
create trigger set_missing_elder_private_details_updated_at before update on public.missing_elder_private_details
  for each row execute function private.set_updated_at();
create trigger set_caregiver_profiles_updated_at before update on public.caregiver_profiles
  for each row execute function private.set_updated_at();
create trigger set_caregiver_employment_references_updated_at before update on public.caregiver_employment_references
  for each row execute function private.set_updated_at();
create trigger set_caregiver_vetting_checks_updated_at before update on public.caregiver_vetting_checks
  for each row execute function private.set_updated_at();
create trigger set_caregiver_safeguarding_incidents_updated_at before update on public.caregiver_safeguarding_incidents
  for each row execute function private.set_updated_at();

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists member_organizations_status_idx on public.member_organizations(status);
create index if not exists member_organizations_category_idx on public.member_organizations(category_id);
create index if not exists member_organizations_created_by_idx on public.member_organizations(created_by);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists announcements_publish_idx on public.announcements(target_audience, publish_at desc);
create index if not exists announcements_created_by_idx on public.announcements(created_by);
create index if not exists missing_elder_cases_status_idx on public.missing_elder_cases(status, published_at desc);
create index if not exists missing_elder_cases_created_by_idx on public.missing_elder_cases(created_by);
create index if not exists missing_elder_cases_reviewed_by_idx on public.missing_elder_cases(reviewed_by);
create index if not exists caregiver_references_caregiver_idx on public.caregiver_employment_references(caregiver_id);
create index if not exists caregiver_references_organization_idx on public.caregiver_employment_references(organization_id);
create index if not exists caregiver_references_verified_by_idx on public.caregiver_employment_references(verified_by);
create index if not exists caregiver_vetting_caregiver_idx on public.caregiver_vetting_checks(caregiver_id, check_type);
create index if not exists caregiver_vetting_completed_by_idx on public.caregiver_vetting_checks(completed_by);
create index if not exists caregiver_incidents_caregiver_idx on public.caregiver_safeguarding_incidents(caregiver_id);
create index if not exists caregiver_incidents_created_by_idx on public.caregiver_safeguarding_incidents(created_by);
create index if not exists caregiver_incidents_reporting_org_idx on public.caregiver_safeguarding_incidents(reporting_organization_id);
create index if not exists caregiver_incidents_reviewed_by_idx on public.caregiver_safeguarding_incidents(reviewed_by);
create index if not exists caregiver_profiles_created_by_org_idx on public.caregiver_profiles(created_by_organization_id);
create index if not exists caregiver_incident_responses_incident_idx on public.caregiver_incident_responses(incident_id);
create index if not exists caregiver_incident_responses_submitted_by_idx on public.caregiver_incident_responses(submitted_by);
create index if not exists documents_org_idx on public.documents(organization_id);
create index if not exists documents_caregiver_idx on public.documents(caregiver_id);
create index if not exists documents_missing_elder_case_idx on public.documents(missing_elder_case_id);
create index if not exists documents_uploaded_by_idx on public.documents(uploaded_by);
create index if not exists renewals_org_period_idx on public.renewals(organization_id, period_end desc);
create index if not exists renewals_recorded_by_idx on public.renewals(recorded_by);
create index if not exists audit_logs_actor_created_idx on public.audit_logs(actor_id, created_at desc);

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;

insert into public.membership_categories (name, description, annual_dues)
values
  ('Residential Care Home', 'Licensed or registered care home operators.', 0),
  ('Home Care Provider', 'Organisations providing care in elders'' homes.', 0),
  ('Day Care / Respite Provider', 'Providers offering day support or respite care.', 0),
  ('Associate Member', 'Professional or allied organisations supporting elderly care.', 0)
on conflict (name) do nothing;

alter table public.profiles enable row level security;
alter table public.membership_categories enable row level security;
alter table public.member_organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.announcements enable row level security;
alter table public.missing_elder_cases enable row level security;
alter table public.missing_elder_private_details enable row level security;
alter table public.caregiver_profiles enable row level security;
alter table public.caregiver_employment_references enable row level security;
alter table public.caregiver_vetting_checks enable row level security;
alter table public.caregiver_safeguarding_incidents enable row level security;
alter table public.caregiver_incident_responses enable row level security;
alter table public.documents enable row level security;
alter table public.renewals enable row level security;
alter table public.audit_logs enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.announcements, public.missing_elder_cases to anon;
grant select, insert, update on public.membership_categories to authenticated;
grant select on public.announcements, public.missing_elder_cases to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.member_organizations, public.organization_members to authenticated;
grant select, insert, update on public.missing_elder_private_details to authenticated;
grant select, insert, update on public.caregiver_profiles, public.caregiver_employment_references to authenticated;
grant select, insert, update on public.caregiver_vetting_checks, public.caregiver_safeguarding_incidents to authenticated;
grant select, insert on public.caregiver_incident_responses, public.documents, public.renewals, public.audit_logs to authenticated;
grant insert, update on public.announcements to authenticated;

create policy "Public can read active missing elder alerts"
  on public.missing_elder_cases
  for select
  to anon
  using (status in ('active', 'found', 'closed') and published_at is not null);

create policy "Authenticated users can read public missing elder alerts"
  on public.missing_elder_cases
  for select
  to authenticated
  using (
    (status in ('active', 'found', 'closed') and published_at is not null)
    or private.is_staff()
    or created_by = (select auth.uid())
  );

create policy "Authenticated users can submit missing elder cases"
  on public.missing_elder_cases
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "Staff can manage missing elder cases"
  on public.missing_elder_cases
  for update
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Staff can manage missing elder private details"
  on public.missing_elder_private_details
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Users can read their own profile or staff can read all"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or private.is_staff());

create policy "Users can update their profile without changing role"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = private.current_user_role());

create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Members can read active categories"
  on public.membership_categories
  for select
  to authenticated
  using (is_active or private.is_staff());

create policy "Staff can manage categories"
  on public.membership_categories
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Members can read active organizations"
  on public.member_organizations
  for select
  to authenticated
  using (
    status = 'active'
    or private.is_staff()
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = id and om.user_id = (select auth.uid())
    )
  );

create policy "Authenticated users can submit organizations"
  on public.member_organizations
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "Staff can manage organizations"
  on public.member_organizations
  for update
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Organization members can read their links"
  on public.organization_members
  for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_staff());

create policy "Staff can manage organization members"
  on public.organization_members
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Public can read public announcements"
  on public.announcements
  for select
  to anon
  using (
    target_audience = 'public'
    and publish_at <= now()
    and (expires_at is null or expires_at > now())
  );

create policy "Authenticated users can read relevant announcements"
  on public.announcements
  for select
  to authenticated
  using (
    publish_at <= now()
    and (expires_at is null or expires_at > now())
    and (
      target_audience in ('public', 'members')
      or private.is_staff()
    )
  );

create policy "Staff can manage announcements"
  on public.announcements
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Staff can manage caregiver profiles"
  on public.caregiver_profiles
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Staff can manage caregiver references"
  on public.caregiver_employment_references
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Staff can manage caregiver vetting checks"
  on public.caregiver_vetting_checks
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Staff can manage safeguarding incidents"
  on public.caregiver_safeguarding_incidents
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Staff can manage incident responses"
  on public.caregiver_incident_responses
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Staff can manage documents"
  on public.documents
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Organization members can read their renewals"
  on public.renewals
  for select
  to authenticated
  using (
    private.is_staff()
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = renewals.organization_id
        and om.user_id = (select auth.uid())
    )
  );

create policy "Staff can manage renewals"
  on public.renewals
  for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "Staff can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (private.is_admin());

create policy "Authenticated users can create audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (actor_id = (select auth.uid()) or private.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'apec-private-documents',
    'apec-private-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'missing-elder-photos',
    'missing-elder-photos',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

create policy "Authenticated users can upload to their folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('apec-private-documents', 'missing-elder-photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Authenticated users can read their folder"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('apec-private-documents', 'missing-elder-photos')
    and (
      private.is_staff()
      or (storage.foldername(name))[1] = (select auth.uid())::text
    )
  );

create policy "Staff can update stored files"
  on storage.objects
  for update
  to authenticated
  using (bucket_id in ('apec-private-documents', 'missing-elder-photos') and private.is_staff())
  with check (bucket_id in ('apec-private-documents', 'missing-elder-photos') and private.is_staff());

create policy "Staff can delete stored files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id in ('apec-private-documents', 'missing-elder-photos') and private.is_staff());
