-- Image-enabled public updates managed through the existing announcements workflow.

alter table public.announcements
  add column if not exists image_path text,
  add column if not exists image_alt text;

alter table public.announcements
  drop constraint if exists announcements_image_path_check;

alter table public.announcements
  add constraint announcements_image_path_check
  check (
    image_path is null
    or image_path ~ '^posts/[0-9a-fA-F-]{36}\.(jpg|png|webp)$'
  );

alter table public.announcements
  drop constraint if exists announcements_image_alt_length_check;

alter table public.announcements
  add constraint announcements_image_alt_length_check
  check (image_alt is null or char_length(image_alt) <= 200);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'apec-public-post-images',
  'apec-public-post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read APEC post images" on storage.objects;
create policy "Public can read APEC post images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'apec-public-post-images');

drop policy if exists "Staff can upload APEC post images" on storage.objects;
create policy "Staff can upload APEC post images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'apec-public-post-images'
    and private.is_admin()
    and (storage.foldername(name))[1] = 'posts'
    and lower(storage.extension(name)) in ('jpg', 'png', 'webp')
  );

drop policy if exists "Staff can update APEC post images" on storage.objects;
create policy "Staff can update APEC post images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'apec-public-post-images' and private.is_admin())
  with check (bucket_id = 'apec-public-post-images' and private.is_admin());

drop policy if exists "Staff can delete APEC post images" on storage.objects;
create policy "Staff can delete APEC post images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'apec-public-post-images' and private.is_admin());
