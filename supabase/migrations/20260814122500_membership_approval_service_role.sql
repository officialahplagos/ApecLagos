-- Edge Functions use the service role for privileged membership provisioning.
-- The baseline schema revokes all default table privileges, so grant only the
-- tables and operations required by review-membership-application.

grant select, insert, update on public.profiles to service_role;
grant select, update on public.membership_applications to service_role;
grant select, insert, update on public.member_organizations to service_role;
grant select, insert, update on public.organization_members to service_role;
