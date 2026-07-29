update storage.buckets
set public = true
where id = 'missing-elder-photos';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read missing elder photos'
  ) then
    create policy "Public can read missing elder photos"
      on storage.objects
      for select
      to anon
      using (bucket_id = 'missing-elder-photos');
  end if;
end;
$$;

create or replace function public.claim_first_admin()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  claimed_profile public.profiles;
begin
  if requester is null then
    raise exception 'You must be signed in to claim the first admin account.';
  end if;

  perform pg_advisory_xact_lock(76200401);

  if exists (
    select 1
    from public.profiles
    where role in ('super_admin', 'secretary_admin')
  ) then
    raise exception 'An admin profile already exists.';
  end if;

  insert into public.profiles (id, email, full_name, role, status)
  values (
    requester,
    nullif(auth.jwt()->>'email', '')::citext,
    coalesce(nullif(auth.jwt()->>'email', ''), 'APEC Admin'),
    'super_admin',
    'active'
  )
  on conflict (id) do update
    set role = 'super_admin',
        status = 'active',
        updated_at = now()
  returning * into claimed_profile;

  return claimed_profile;
end;
$$;

revoke all on function public.claim_first_admin() from public, anon;
grant execute on function public.claim_first_admin() to authenticated;
