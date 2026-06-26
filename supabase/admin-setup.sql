-- PART 11 — First admin setup (run once in Supabase SQL Editor)

insert into user_roles (email, role, approved_at)
values ('umut.gunaydin@alo-tech.com', 'admin', now())
on conflict (email) do update
set role = 'admin', approved_at = now();

-- Verify:
-- select email, role, approved_at from user_roles where role = 'admin';
