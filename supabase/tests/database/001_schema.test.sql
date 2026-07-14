begin;

select plan(8);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'locations', 'locations exists');
select has_table('public', 'visits', 'visits exists');
select has_table('public', 'audit_logs', 'audit_logs exists');
select has_table('public', 'import_batches', 'import_batches exists');
select has_table('public', 'import_issues', 'import_issues exists');
select col_is_unique('public', 'locations', 'code', 'location code is unique');
select col_not_null('public', 'visits', 'check_in_at', 'check-in time is required');

select * from finish();

rollback;
