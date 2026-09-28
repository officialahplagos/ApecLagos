-- Private caregiver profile photos for the staff-only reference register.

alter table public.caregiver_profiles
  add column if not exists photo_path text;

alter table public.caregiver_profiles
  drop constraint if exists caregiver_profiles_photo_path_check;

alter table public.caregiver_profiles
  add constraint caregiver_profiles_photo_path_check
  check (
    photo_path is null
    or photo_path ~ '^[0-9a-fA-F-]{36}/caregivers/[0-9a-fA-F-]{36}\.(jpg|png|webp)$'
  );

comment on column public.caregiver_profiles.photo_path is
  'Private caregiver reference photo path. Readable only by authorised staff.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'caregiver-photos',
  'caregiver-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff can upload caregiver photos" on storage.objects;
create policy "Staff can upload caregiver photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'caregiver-photos'
    and private.is_staff()
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'caregivers'
    and lower(storage.extension(name)) in ('jpg', 'png', 'webp')
  );

drop policy if exists "Staff can read caregiver photos" on storage.objects;
create policy "Staff can read caregiver photos"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'caregiver-photos' and private.is_staff());

drop policy if exists "Staff can update caregiver photos" on storage.objects;
create policy "Staff can update caregiver photos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'caregiver-photos' and private.is_staff())
  with check (bucket_id = 'caregiver-photos' and private.is_staff());

drop policy if exists "Staff can delete caregiver photos" on storage.objects;
create policy "Staff can delete caregiver photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'caregiver-photos' and private.is_staff());
