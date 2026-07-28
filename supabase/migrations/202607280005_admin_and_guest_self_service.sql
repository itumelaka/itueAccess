alter table public.visits
  alter column recorded_by drop not null;

alter table public.visits
  add constraint visits_recorder_required_for_managed_visits
  check (
    (person_type = 'USER' and recorded_by is not null)
    or (
      person_type = 'GUEST'
      and (recorded_by is not null or source in ('IMPORT', 'SELF_SERVICE'))
    )
  );

create table public.guest_self_service_tokens (
  visit_id uuid primary key references public.visits(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

alter table public.guest_self_service_tokens enable row level security;
revoke all on public.guest_self_service_tokens from public, anon, authenticated;

create or replace function public.admin_check_out_user(
  p_visit_id uuid,
  p_request_id uuid,
  p_reason text
)
returns public.visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits;
  v_before jsonb;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if length(v_reason) < 5 then raise exception 'Checkout reason must be at least 5 characters'; end if;

  select * into v_visit
  from public.visits
  where check_out_request_id = p_request_id;
  if found then
    if v_visit.id = p_visit_id and v_visit.person_type = 'USER' then return v_visit; end if;
    raise exception 'Request ID is already in use';
  end if;

  select * into v_visit
  from public.visits
  where id = p_visit_id
    and person_type = 'USER'
    and check_out_at is null
  for update;
  if not found then raise exception 'Open user visit not found'; end if;

  v_before := to_jsonb(v_visit);

  update public.visits
  set check_out_at = now(),
      check_out_request_id = p_request_id,
      updated_at = now()
  where id = v_visit.id
  returning * into v_visit;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  ) values (
    v_actor,
    'ADMIN_CHECK_OUT_USER',
    'visits',
    v_visit.id,
    v_before,
    to_jsonb(v_visit),
    v_reason
  );

  return v_visit;
end;
$$;

create or replace function public.register_guest_self_service(
  p_location_code text,
  p_name text,
  p_organization text,
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
    guest_purpose,
    location_id,
    recorded_by,
    source,
    check_in_request_id
  ) values (
    'GUEST',
    trim(p_name),
    trim(p_organization),
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

create or replace function public.check_out_guest_self_service(
  p_token_hash text,
  p_request_id uuid
)
returns public.visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visit public.visits;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid guest token';
  end if;

  select visits.* into v_visit
  from public.visits visits
  join public.guest_self_service_tokens tokens on tokens.visit_id = visits.id
  where tokens.token_hash = p_token_hash
    and visits.person_type = 'GUEST'
    and visits.source = 'SELF_SERVICE'
    and visits.check_out_at is not null;
  if found then return v_visit; end if;

  select visits.* into v_visit
  from public.visits visits
  join public.guest_self_service_tokens tokens on tokens.visit_id = visits.id
  where tokens.token_hash = p_token_hash
    and tokens.expires_at > now()
    and visits.person_type = 'GUEST'
    and visits.source = 'SELF_SERVICE'
    and visits.check_out_at is null
  for update of visits;
  if not found then raise exception 'Open self-service guest visit not found'; end if;

  update public.visits
  set check_out_at = now(),
      check_out_request_id = p_request_id,
      updated_at = now()
  where id = v_visit.id
  returning * into v_visit;

  return v_visit;
end;
$$;

revoke all on function public.admin_check_out_user(uuid, uuid, text) from public;
revoke all on function public.register_guest_self_service(text, text, text, text, text, uuid) from public;
revoke all on function public.check_out_guest_self_service(text, uuid) from public;

grant execute on function public.admin_check_out_user(uuid, uuid, text) to authenticated;
grant execute on function public.register_guest_self_service(text, text, text, text, text, uuid) to service_role;
grant execute on function public.check_out_guest_self_service(text, uuid) to service_role;
