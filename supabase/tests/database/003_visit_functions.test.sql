begin;

select plan(9);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('20000000-0000-0000-0000-000000000001', 'pending@example.test', '{"full_name":"Pending"}'),
  ('20000000-0000-0000-0000-000000000002', 'active@example.test', '{"full_name":"Active"}'),
  ('20000000-0000-0000-0000-000000000003', 'admin2@example.test', '{"full_name":"Admin Two"}');

update public.profiles set status = 'ACTIVE'
where id in ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003');
update public.profiles set role = 'ADMIN'
where id = '20000000-0000-0000-0000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select public.check_in('AUDITORIUM', '21000000-0000-0000-0000-000000000001')$$,
  'P0001', 'Profile is not active', 'pending user cannot check in'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select results_eq(
  $$select (public.check_in('AUDITORIUM', '21000000-0000-0000-0000-000000000002')).profile_id$$,
  $$values ('20000000-0000-0000-0000-000000000002'::uuid)$$,
  'active user can check in'
);
select throws_ok(
  $$select public.check_in('AUDITORIUM', '21000000-0000-0000-0000-000000000003')$$,
  'P0001', 'An open visit already exists', 'second check-in is rejected'
);
select results_eq(
  $$select (public.check_in('AUDITORIUM', '21000000-0000-0000-0000-000000000002')).check_in_request_id$$,
  $$values ('21000000-0000-0000-0000-000000000002'::uuid)$$,
  'repeated check-in request is idempotent'
);
select results_eq(
  $$select (public.check_out('22000000-0000-0000-0000-000000000001')).check_out_request_id$$,
  $$values ('22000000-0000-0000-0000-000000000001'::uuid)$$,
  'check-out closes the open visit'
);
select results_eq(
  $$select (public.check_out('22000000-0000-0000-0000-000000000001')).check_out_request_id$$,
  $$values ('22000000-0000-0000-0000-000000000001'::uuid)$$,
  'repeated check-out request is idempotent'
);
select throws_ok(
  $$select public.register_guest(
    (select id from public.locations where code = 'AUDITORIUM'),
    'Tetamu', 'Organisasi', 'Mesyuarat', '23000000-0000-0000-0000-000000000001'
  )$$,
  'P0001', 'Admin access required', 'non-admin cannot register a guest'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000003', true);
select results_eq(
  $$select (public.register_guest(
    (select id from public.locations where code = 'AUDITORIUM'),
    'Tetamu', 'Organisasi', 'Mesyuarat', '23000000-0000-0000-0000-000000000002'
  )).person_type::text$$,
  $$values ('GUEST')$$,
  'admin can register a guest'
);
select results_eq(
  $$select (public.admin_check_out_guest(
    (select id from public.visits where check_in_request_id = '23000000-0000-0000-0000-000000000002'),
    '24000000-0000-0000-0000-000000000001'
  )).check_out_request_id$$,
  $$values ('24000000-0000-0000-0000-000000000001'::uuid)$$,
  'admin can check out a guest'
);

rollback;
