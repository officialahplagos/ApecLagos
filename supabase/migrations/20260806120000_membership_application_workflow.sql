-- Public membership applications with compliance review and invite-only access.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (
    role in (
      'super_admin',
      'secretary_admin',
      'compliance_officer',
      'committee_member',
      'member',
      'pending_member'
    )
  );

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'secretary_admin', 'compliance_officer', 'committee_member')
     from public.profiles
     where id = (select auth.uid())),
    false
  );
$$;

create or replace function private.can_review_membership()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'secretary_admin', 'compliance_officer')
     from public.profiles
     where id = (select auth.uid())),
    false
  );
$$;

revoke all on function private.can_review_membership() from public, anon;
grant execute on function private.can_review_membership() to authenticated;

create table if not exists public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  application_reference text not null unique
    check (application_reference ~ '^APEC-MA-[A-Z0-9]{8}$'),
  organization_name text not null check (char_length(trim(organization_name)) between 2 and 180),
  membership_category_id uuid references public.membership_categories(id),
  contact_full_name text not null check (char_length(trim(contact_full_name)) between 2 and 140),
  position_title text,
  email citext not null,
  phone text not null check (char_length(trim(phone)) between 7 and 30),
  lga text,
  address text,
  registration_number text,
  year_established integer check (
    year_established is null
    or year_established between 1900 and 2100
  ),
  services_offered text,
  consent_confirmed boolean not null default false check (consent_confirmed),
  status text not null default 'pending'
    check (status in ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  review_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  auth_user_id uuid references public.profiles(id),
  organization_id uuid references public.member_organizations(id),
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists membership_applications_open_email_idx
  on public.membership_applications(email)
  where status in ('pending', 'under_review');

create index if not exists membership_applications_status_idx
  on public.membership_applications(status, created_at desc);

drop trigger if exists set_membership_applications_updated_at
  on public.membership_applications;
create trigger set_membership_applications_updated_at
  before update on public.membership_applications
  for each row execute function private.set_updated_at();

alter table public.membership_applications enable row level security;

revoke all on public.membership_applications from public, anon, authenticated;
grant insert (
  application_reference,
  organization_name,
  membership_category_id,
  contact_full_name,
  position_title,
  email,
  phone,
  lga,
  address,
  registration_number,
  year_established,
  services_offered,
  consent_confirmed
) on public.membership_applications to anon, authenticated;
grant select, update on public.membership_applications to authenticated;

create policy "Public can submit membership applications"
  on public.membership_applications
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and consent_confirmed
    and reviewed_by is null
    and reviewed_at is null
    and auth_user_id is null
    and organization_id is null
    and invited_at is null
  );

create policy "Compliance staff can read membership applications"
  on public.membership_applications
  for select
  to authenticated
  using (private.can_review_membership());

create policy "Compliance staff can update membership applications"
  on public.membership_applications
  for update
  to authenticated
  using (private.can_review_membership())
  with check (private.can_review_membership());

grant select on public.membership_categories to anon;

create policy "Public can read active membership categories"
  on public.membership_categories
  for select
  to anon
  using (is_active);
