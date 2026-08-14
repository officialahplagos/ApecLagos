-- Production public intake and reliable staff-side application editing.

alter table public.missing_elder_cases
  add column if not exists public_contact_phone text;

comment on column public.missing_elder_cases.public_contact_phone is
  'Officer-reviewed callback number displayed with a published missing elder alert.';

create or replace function public.submit_missing_elder_report(
  p_elder_name text,
  p_approximate_age integer,
  p_photo_path text,
  p_last_seen_location text,
  p_last_seen_at timestamptz,
  p_public_notes text,
  p_police_reference text,
  p_public_contact_phone text,
  p_submitter_name text,
  p_submitter_phone text,
  p_family_contact_name text,
  p_medical_risks text,
  p_private_notes text,
  p_consent_confirmed boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_case_id uuid;
  new_reference text := 'APEC-ME-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
begin
  if p_consent_confirmed is not true then
    raise exception 'Consent is required before submitting a report.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_elder_name, ''))) not between 2 and 180 then
    raise exception 'Enter the missing person''s full name.' using errcode = '22023';
  end if;

  if p_approximate_age is not null and p_approximate_age not between 50 and 120 then
    raise exception 'Enter an age between 50 and 120.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_last_seen_location, ''))) not between 3 and 500 then
    raise exception 'Enter the last seen location.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_public_contact_phone, ''))) not between 7 and 30 then
    raise exception 'Enter a valid callback number.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_submitter_name, ''))) not between 2 and 140
     or char_length(trim(coalesce(p_submitter_phone, ''))) not between 7 and 30 then
    raise exception 'Enter the reporter''s name and phone number.' using errcode = '22023';
  end if;

  if p_photo_path is not null
     and p_photo_path !~ '^public-intake/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$' then
    raise exception 'The uploaded photo path is invalid.' using errcode = '22023';
  end if;

  if char_length(coalesce(p_public_notes, '')) > 1500
     or char_length(coalesce(p_medical_risks, '')) > 1500
     or char_length(coalesce(p_private_notes, '')) > 1000 then
    raise exception 'One or more report details are too long.' using errcode = '22023';
  end if;

  insert into public.missing_elder_cases (
    public_reference,
    elder_name,
    approximate_age,
    photo_path,
    last_seen_location,
    last_seen_at,
    public_notes,
    police_reference,
    public_contact_phone,
    status,
    created_by
  ) values (
    new_reference,
    trim(p_elder_name),
    p_approximate_age,
    nullif(trim(coalesce(p_photo_path, '')), ''),
    trim(p_last_seen_location),
    p_last_seen_at,
    nullif(trim(coalesce(p_public_notes, '')), ''),
    nullif(trim(coalesce(p_police_reference, '')), ''),
    trim(p_public_contact_phone),
    'pending_review',
    null
  )
  returning id into new_case_id;

  insert into public.missing_elder_private_details (
    case_id,
    submitter_name,
    submitter_phone,
    family_contact_name,
    family_contact_phone,
    medical_risks,
    private_notes
  ) values (
    new_case_id,
    trim(p_submitter_name),
    trim(p_submitter_phone),
    nullif(trim(coalesce(p_family_contact_name, '')), ''),
    trim(p_public_contact_phone),
    nullif(trim(coalesce(p_medical_risks, '')), ''),
    nullif(trim(coalesce(p_private_notes, '')), '')
  );

  return new_reference;
end;
$$;

revoke all on function public.submit_missing_elder_report(
  text, integer, text, text, timestamptz, text, text, text,
  text, text, text, text, text, boolean
) from public;
grant execute on function public.submit_missing_elder_report(
  text, integer, text, text, timestamptz, text, text, text,
  text, text, text, text, text, boolean
) to anon, authenticated;

create or replace function public.update_membership_application_for_review(
  p_application_id uuid,
  p_organization_name text,
  p_contact_full_name text,
  p_position_title text,
  p_email text,
  p_phone text,
  p_lga text,
  p_address text,
  p_registration_number text,
  p_year_established integer,
  p_services_offered text
)
returns public.membership_applications
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_application public.membership_applications;
begin
  if not private.can_review_membership() then
    raise exception 'Compliance review access is required.' using errcode = '42501';
  end if;

  update public.membership_applications
  set organization_name = trim(p_organization_name),
      contact_full_name = trim(p_contact_full_name),
      position_title = nullif(trim(coalesce(p_position_title, '')), ''),
      email = lower(trim(p_email)),
      phone = trim(p_phone),
      lga = nullif(trim(coalesce(p_lga, '')), ''),
      address = nullif(trim(coalesce(p_address, '')), ''),
      registration_number = nullif(trim(coalesce(p_registration_number, '')), ''),
      year_established = p_year_established,
      services_offered = nullif(trim(coalesce(p_services_offered, '')), ''),
      status = 'under_review'
  where id = p_application_id
    and status in ('pending', 'under_review')
  returning * into updated_application;

  if updated_application.id is null then
    raise exception 'The application is no longer awaiting review.' using errcode = 'P0002';
  end if;

  return updated_application;
end;
$$;

revoke all on function public.update_membership_application_for_review(
  uuid, text, text, text, text, text, text, text, text, integer, text
) from public;
grant execute on function public.update_membership_application_for_review(
  uuid, text, text, text, text, text, text, text, text, integer, text
) to authenticated;

drop policy if exists "Public can upload missing elder intake photos" on storage.objects;
create policy "Public can upload missing elder intake photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'missing-elder-photos'
    and (storage.foldername(name))[1] = 'public-intake'
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  );

drop policy if exists "Public can read missing elder photos" on storage.objects;
drop policy if exists "Public can read published missing elder photos" on storage.objects;
create policy "Public can read published missing elder photos"
  on storage.objects
  for select
  to anon
  using (
    bucket_id = 'missing-elder-photos'
    and exists (
      select 1
      from public.missing_elder_cases
      where photo_path = storage.objects.name
        and status in ('active', 'found', 'closed')
        and published_at is not null
    )
  );
