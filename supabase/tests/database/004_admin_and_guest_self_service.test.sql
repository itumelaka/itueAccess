begin;

select plan(9);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('30000000-0000-0000-0000-000000000001', 'user-checkout@example.test', '{"full_name":"User Checkout"}'),
  ('30000000-0000-0000-0000-000000000002', 'admin-checkout@example.test', '{"full_name":"Admin Checkout"}');

update public.profiles
set status = 'ACTIVE', category = 'STAFF'
where id = '30000000-0000-0000-0000-000000000001';

update public.profiles
set status = 'ACTIVE', role = 'ADMIN'
where id = '30000000-0000-0000-0000-000000000002';

insert into public.locations (name, code)
values ('Test Self Service', 'TEST-SELF-SERVICE')
on conflict (code) do update set name = excluded.name, is_active = true;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);

select public.check_in(
  'TEST-SELF-SERVICE',
  '31000000-0000-0000-0000-000000000001'
);

select throws_ok(
  $$select public.admin_check_out_user(
    (select id from public.visits where check_in_request_id = '31000000-0000-0000-0000-000000000001'),
    '32000000-0000-0000-0000-000000000001',
    'Terlupa daftar keluar'
  )$$,
  'P0001',
  'Admin access required',
  'non-admin cannot force checkout'
);

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$select public.admin_check_out_user(
    (select id from public.visits where check_in_request_id = '31000000-0000-0000-0000-000000000001'),
    '32000000-0000-0000-0000-000000000002',
    'lupa'
  )$$,
  'P0001',
  'Checkout reason must be at least 5 characters',
  'force checkout requires a meaningful reason'
);

select results_eq(
  $$select (public.admin_check_out_user(
    (select id from public.visits where check_in_request_id = '31000000-0000-0000-0000-000000000001'),
    '32000000-0000-0000-0000-000000000003',
    'Terlupa daftar keluar'
  )).check_out_request_id$$,
  $$values ('32000000-0000-0000-0000-000000000003'::uuid)$$,
  'admin can force checkout a user'
);

select results_eq(
  $$select count(*)::integer
    from public.audit_logs
    where action = 'ADMIN_CHECK_OUT_USER'
      and entity_id = (
        select id from public.visits
        where check_in_request_id = '31000000-0000-0000-0000-000000000001'
      )$$,
  $$values (1)$$,
  'force checkout writes one audit log'
);

select results_eq(
  $$select (public.admin_check_out_user(
    (select id from public.visits where check_in_request_id = '31000000-0000-0000-0000-000000000001'),
    '32000000-0000-0000-0000-000000000003',
    'Terlupa daftar keluar'
  )).check_out_request_id$$,
  $$values ('32000000-0000-0000-0000-000000000003'::uuid)$$,
  'repeated admin checkout is idempotent'
);

set local role service_role;

select results_eq(
  $$select (public.register_guest_self_service(
    'TEST-SELF-SERVICE',
    'Tetamu Kendiri',
    'Organisasi',
    'Lawatan',
    repeat('a', 64),
    '33000000-0000-0000-0000-000000000001'
  )).source::text$$,
  $$values ('SELF_SERVICE')$$,
  'service role can register a self-service guest'
);

select results_eq(
  $$select count(*)::integer
    from public.guest_self_service_tokens
    where token_hash = repeat('a', 64)$$,
  $$values (1)$$,
  'guest token hash is stored'
);

select results_eq(
  $$select (public.check_out_guest_self_service(
    repeat('a', 64),
    '34000000-0000-0000-0000-000000000001'
  )).check_out_request_id$$,
  $$values ('34000000-0000-0000-0000-000000000001'::uuid)$$,
  'guest can check out with the session token'
);

select results_eq(
  $$select (public.check_out_guest_self_service(
    repeat('a', 64),
    '34000000-0000-0000-0000-000000000002'
  )).check_out_request_id$$,
  $$values ('34000000-0000-0000-0000-000000000001'::uuid)$$,
  'a retry with the same token returns the completed checkout without duplicating it'
);

rollback;
