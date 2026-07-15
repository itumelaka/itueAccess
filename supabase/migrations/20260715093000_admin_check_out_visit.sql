create or replace function public.admin_check_out_visit(p_visit_id uuid, p_request_id uuid)
returns public.visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visit public.visits;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;

  select * into v_visit from public.visits where check_out_request_id = p_request_id;
  if found then
    if v_visit.id = p_visit_id then return v_visit; end if;
    raise exception 'Request ID is already in use';
  end if;

  select * into v_visit
  from public.visits
  where id = p_visit_id and check_out_at is null
  for update;
  if not found then raise exception 'Open visit not found'; end if;

  update public.visits
  set check_out_at = now(), check_out_request_id = p_request_id, updated_at = now()
  where id = v_visit.id
  returning * into v_visit;

  return v_visit;
end;
$$;

revoke all on function public.admin_check_out_visit(uuid, uuid) from public;
grant execute on function public.admin_check_out_visit(uuid, uuid) to authenticated;
