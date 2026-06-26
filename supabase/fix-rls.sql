-- Fix: infinite recursion in user_roles RLS (error 42P17)
-- Run in Supabase Dashboard → SQL Editor

-- Helper functions bypass RLS (security definer)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where email = auth.jwt()->>'email'
    and role = 'admin'
  );
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where email = auth.jwt()->>'email'
    and role in ('editor', 'admin')
  );
$$;

-- ── user_roles: drop recursive policies ──
drop policy if exists "admin manage roles" on user_roles;
drop policy if exists "self insert role" on user_roles;

create policy "read own role"
  on user_roles for select
  using (email = auth.jwt()->>'email');

create policy "admin read all roles"
  on user_roles for select
  using (public.is_admin());

create policy "self insert role"
  on user_roles for insert
  with check (email = auth.jwt()->>'email');

create policy "admin update roles"
  on user_roles for update
  using (public.is_admin());

create policy "admin delete roles"
  on user_roles for delete
  using (public.is_admin());

-- ── poc_overrides: fix editor policy ──
drop policy if exists "editor write overrides" on poc_overrides;

create policy "editor write overrides"
  on poc_overrides for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- ── poc_audit: fix editor policies ──
drop policy if exists "editor read audit" on poc_audit;
drop policy if exists "editor insert audit" on poc_audit;

create policy "editor read audit"
  on poc_audit for select
  using (public.is_editor_or_admin());

create policy "editor insert audit"
  on poc_audit for insert
  with check (public.is_editor_or_admin());
