alter table public.visits
  add column if not exists guest_host_name text;

alter table public.visits
  drop constraint if exists visits_guest_host_name_length;

alter table public.visits
  add constraint visits_guest_host_name_length
  check (
    guest_host_name is null
    or length(trim(guest_host_name)) between 2 and 160
  );

-- Expand-only staged rollout: both RPC signatures intentionally coexist.
-- The existing six-argument function remains available for the currently
-- deployed application. Remove it in a separate cleanup migration only after
-- the seven-argument application has been deployed and production smoke tests pass.

create function public.register_guest_self_service(
  p_location_code text,
  p_name text,
  p_organization text,
  p_host_name text,
  p_purpose text,
  p_token_hash text,
  p_request_id uuid
)
returns public.visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location public.locations;
  v_visit public.visits;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Guest name is required';
  end if;
  if length(trim(coalesce(p_organization, ''))) < 2 then
    raise exception 'Guest organization is required';
  end if;
  if length(trim(coalesce(p_host_name, ''))) < 2 then
    raise exception 'Guest host name is required';
  end if;
  if length(trim(coalesce(p_purpose, ''))) < 3 then
    raise exception 'Guest purpose is required';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid guest token';
  end if;

  select * into v_visit
  from public.visits
  where check_in_request_id = p_request_id;
  if found then
    if v_visit.person_type = 'GUEST' and v_visit.source = 'SELF_SERVICE' then
      insert into public.guest_self_service_tokens (visit_id, token_hash)
      values (v_visit.id, p_token_hash)
      on conflict (visit_id) do update
      set token_hash = excluded.token_hash,
          expires_at = now() + interval '24 hours';
      return v_visit;
    end if;
    raise exception 'Request ID is already in use';
  end if;

  select * into v_location
  from public.locations
  where code = upper(trim(p_location_code))
    and is_active;
  if not found then raise exception 'Active location not found'; end if;

  insert into public.visits (
    person_type,
    guest_name,
    guest_organization,
    guest_host_name,
    guest_purpose,
    location_id,
    recorded_by,
    source,
    check_in_request_id
  ) values (
    'GUEST',
    trim(p_name),
    trim(p_organization),
    trim(p_host_name),
    trim(p_purpose),
    v_location.id,
    null,
    'SELF_SERVICE',
    p_request_id
  )
  returning * into v_visit;

  insert into public.guest_self_service_tokens (visit_id, token_hash)
  values (v_visit.id, p_token_hash);

  return v_visit;
end;
$$;

revoke all on function public.register_guest_self_service(text, text, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.register_guest_self_service(text, text, text, text, text, text, uuid)
  to service_role;