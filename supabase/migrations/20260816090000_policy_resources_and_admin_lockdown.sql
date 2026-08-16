-- Publish approved APEC policy documents while retiring bootstrap admin access.

alter table public.documents
  add column if not exists summary text;

grant select on public.documents to anon;
grant select, insert, update, delete on public.documents to authenticated;

drop policy if exists "Public can read published policy documents" on public.documents;
create policy "Public can read published policy documents"
  on public.documents
  for select
  to anon
  using (document_type = 'policy' and access_level = 'public');

drop policy if exists "Members can read association resources" on public.documents;
create policy "Members can read association resources"
  on public.documents
  for select
  to authenticated
  using (access_level in ('public', 'members') or private.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'apec-public-resources',
  'apec-public-resources',
  true,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff can upload public resources" on storage.objects;
create policy "Staff can upload public resources"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'apec-public-resources' and private.is_staff());

drop policy if exists "Staff can update public resources" on storage.objects;
create policy "Staff can update public resources"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'apec-public-resources' and private.is_staff())
  with check (bucket_id = 'apec-public-resources' and private.is_staff());

drop policy if exists "Staff can delete public resources" on storage.objects;
create policy "Staff can delete public resources"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'apec-public-resources' and private.is_staff());

do $$
begin
  if to_regprocedure('public.claim_first_admin()') is not null then
    revoke all on function public.claim_first_admin() from public, anon, authenticated;
  end if;
end;
$$;
