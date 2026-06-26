-- Fix poc_overrides write policy (run if status changes don't persist)
-- Supabase Dashboard → SQL Editor

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.user_roles
    where email = auth.jwt()->>'email' and role = 'admin'
  );
$$;

create or replace function public.is_editor_or_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.user_roles
    where email = auth.jwt()->>'email' and role in ('editor', 'admin')
  );
$$;

drop policy if exists "editor write" on poc_overrides;
drop policy if exists "editor write overrides" on poc_overrides;

create policy "editor write overrides"
  on poc_overrides for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy if exists "editor write audit" on poc_audit;
drop policy if exists "editor insert audit" on poc_audit;

create policy "editor insert audit"
  on poc_audit for insert
  with check (public.is_editor_or_admin());
