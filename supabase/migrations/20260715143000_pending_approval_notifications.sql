alter table public.profiles
add column if not exists admin_notified_at timestamptz;

create or replace function public.mark_pending_profile_notified(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_profile_id then
    return false;
  end if;

  update public.profiles
  set
    admin_notified_at = coalesce(admin_notified_at, now()),
    updated_at = now()
  where id = p_profile_id
    and status = 'PENDING'
    and admin_notified_at is null;

  return found;
end;
$$;

revoke all on function public.mark_pending_profile_notified(uuid) from public;
grant execute on function public.mark_pending_profile_notified(uuid) to authenticated;
