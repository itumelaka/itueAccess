begin;

select plan(4);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'user-a@example.test', '{"full_name":"User A"}'),
  ('10000000-0000-0000-0000-000000000002', 'user-b@example.test', '{"full_name":"User B"}'),
  ('10000000-0000-0000-0000-000000000003', 'admin@example.test', '{"full_name":"Admin"}');

update public.profiles
set status = 'ACTIVE',
    role = case when id = '10000000-0000-0000-0000-000000000003' then 'ADMIN'::public.app_role else 'USER'::public.app_role end;

insert into public.visits (
  person_type, profile_id, location_id, recorded_by, source, check_in_request_id
)
select
  'USER',
  user_id,
  (select id from public.locations where code = 'AUDITORIUM'),
  user_id,
  'PWA',
  request_id
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, '11000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-000000000002'::uuid, '11000000-0000-0000-0000-000000000002'::uuid)
) as seeded(user_id, request_id);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select is((select count(*) from public.visits), 1::bigint, 'user sees only their own visits');

update public.profiles set role = 'ADMIN' where id = '10000000-0000-0000-0000-000000000001';
select is((select role::text from public.profiles where id = auth.uid()), 'USER', 'user cannot promote their own profile');

select throws_ok(
  $$update public.visits set check_out_at = now() where profile_id = auth.uid()$$,
  '42501', 'permission denied for table visits', 'user cannot update a visit directly'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select is((select count(*) from public.visits), 2::bigint, 'admin can read all visits');

rollback;
