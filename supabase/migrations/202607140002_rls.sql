alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.visits enable row level security;
alter table public.audit_logs enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_issues enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
      and status = 'ACTIVE'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.locations to authenticated;
grant select on public.visits to authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert, update, delete on public.import_batches to authenticated;
grant select, insert, update, delete on public.import_issues to authenticated;

create policy profiles_select_self_or_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy visits_select_self_or_admin on public.visits
for select to authenticated
using (profile_id = auth.uid() or recorded_by = auth.uid() or public.is_admin());

create policy locations_select_active_or_admin on public.locations
for select to authenticated
using (is_active or public.is_admin());

create policy admin_all_profiles on public.profiles
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_all_locations on public.locations
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_all_import_batches on public.import_batches
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_all_import_issues on public.import_issues
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_select_audit_logs on public.audit_logs
for select to authenticated
using (public.is_admin());
