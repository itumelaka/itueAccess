create type public.app_role as enum ('ADMIN', 'USER');
create type public.profile_status as enum ('PENDING', 'ACTIVE', 'SUSPENDED');
create type public.user_category as enum ('STAFF', 'PELATIH');
create type public.person_type as enum ('USER', 'GUEST');
create type public.visit_source as enum ('PWA', 'ADMIN', 'IMPORT');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role public.app_role not null default 'USER',
  category public.user_category,
  status public.profile_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique check (code ~ '^[A-Z0-9-]{3,32}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  person_type public.person_type not null,
  profile_id uuid references public.profiles(id),
  guest_name text,
  guest_organization text,
  guest_purpose text,
  location_id uuid not null references public.locations(id),
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  recorded_by uuid not null references public.profiles(id),
  source public.visit_source not null,
  check_in_request_id uuid not null unique,
  check_out_request_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out_at is null or check_out_at >= check_in_at),
  check (
    (person_type = 'USER' and profile_id is not null and guest_name is null)
    or (person_type = 'GUEST' and profile_id is null and length(trim(guest_name)) > 0)
  )
);

create unique index one_open_visit_per_user
  on public.visits(profile_id)
  where check_out_at is null and profile_id is not null;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_data jsonb not null,
  after_data jsonb not null,
  reason text not null check (length(trim(reason)) >= 5),
  created_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_sha256 text not null unique,
  source_rows integer not null check (source_rows >= 0),
  imported_rows integer not null default 0,
  issue_rows integer not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.import_issues (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_row integer not null,
  reason text not null,
  source_data jsonb not null,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'Pengguna'), '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
