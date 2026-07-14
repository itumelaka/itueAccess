create or replace function public.check_in(p_location_code text, p_request_id uuid)
returns public.visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_location public.locations;
  v_visit public.visits;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found or v_profile.status <> 'ACTIVE' then
    raise exception 'Profile is not active';
  end if;

  select * into v_visit from public.visits where check_in_request_id = p_request_id;
  if found then
    if v_visit.profile_id = v_uid then return v_visit; end if;
    raise exception 'Request ID is already in use';
  end if;

  select * into v_location
  from public.locations
  where code = upper(trim(p_location_code)) and is_active;
  if not found then raise exception 'Active location not found'; end if;

  select * into v_visit
  from public.visits
  where profile_id = v_uid and check_out_at is null
  for update;
  if found then raise exception 'An open visit already exists'; end if;

  insert into public.visits (
    person_type, profile_id, location_id, recorded_by, source, check_in_request_id
  ) values (
    'USER', v_uid, v_location.id, v_uid, 'PWA', p_request_id
  ) returning * into v_visit;

  return v_visit;
end;
$$;

create or replace function public.check_out(p_request_id uuid)
returns public.visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_visit public.visits;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found or v_profile.status <> 'ACTIVE' then
    raise exception 'Profile is not active';
  end if;

  select * into v_visit from public.visits where check_out_request_id = p_request_id;
  if found then
    if v_visit.profile_id = v_uid then return v_visit; end if;
    raise exception 'Request ID is already in use';
  end if;

  select * into v_visit
  from public.visits
  where profile_id = v_uid and check_out_at is null
  for update;
  if not found then raise exception 'No open visit found'; end if;

  update public.visits
  set check_out_at = now(), check_out_request_id = p_request_id, updated_at = now()
  where id = v_visit.id
  returning * into v_visit;

  return v_visit;
end;
$$;

create or replace function public.register_guest(
  p_location_id uuid,
  p_name text,
  p_organization text,
  p_purpose text,
  p_request_id uuid
)
returns public.visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_location public.locations;
  v_visit public.visits;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Guest name is required'; end if;
  if nullif(trim(p_purpose), '') is null then raise exception 'Guest purpose is required'; end if;

  select * into v_visit from public.visits where check_in_request_id = p_request_id;
  if found then
    if v_visit.recorded_by = v_uid and v_visit.person_type = 'GUEST' then return v_visit; end if;
    raise exception 'Request ID is already in use';
  end if;

  select * into v_location from public.locations where id = p_location_id and is_active;
  if not found then raise exception 'Active location not found'; end if;

  insert into public.visits (
    person_type, guest_name, guest_organization, guest_purpose,
    location_id, recorded_by, source, check_in_request_id
  ) values (
    'GUEST', trim(p_name), nullif(trim(p_organization), ''), trim(p_purpose),
    v_location.id, v_uid, 'ADMIN', p_request_id
  ) returning * into v_visit;

  return v_visit;
end;
$$;

create or replace function public.admin_check_out_guest(p_visit_id uuid, p_request_id uuid)
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
    if v_visit.id = p_visit_id and v_visit.person_type = 'GUEST' then return v_visit; end if;
    raise exception 'Request ID is already in use';
  end if;

  select * into v_visit
  from public.visits
  where id = p_visit_id and person_type = 'GUEST' and check_out_at is null
  for update;
  if not found then raise exception 'Open guest visit not found'; end if;

  update public.visits
  set check_out_at = now(), check_out_request_id = p_request_id, updated_at = now()
  where id = v_visit.id
  returning * into v_visit;

  return v_visit;
end;
$$;

revoke all on function public.check_in(text, uuid) from public;
revoke all on function public.check_out(uuid) from public;
revoke all on function public.register_guest(uuid, text, text, text, uuid) from public;
revoke all on function public.admin_check_out_guest(uuid, uuid) from public;

grant execute on function public.check_in(text, uuid) to authenticated;
grant execute on function public.check_out(uuid) to authenticated;
grant execute on function public.register_guest(uuid, text, text, text, uuid) to authenticated;
grant execute on function public.admin_check_out_guest(uuid, uuid) to authenticated;
