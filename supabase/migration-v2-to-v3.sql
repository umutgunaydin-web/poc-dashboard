-- v2 → v3 migration (non-destructive — keeps existing data)
-- Run in Supabase Dashboard → SQL Editor
-- Fixes: "Could not find the 'status' column of 'poc_overrides'"

-- ── poc_overrides: add status, migrate from outcome ──
alter table poc_overrides
  add column if not exists status text default 'active';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'poc_overrides'
      and column_name = 'outcome'
  ) then
    update poc_overrides
    set status = coalesce(outcome, 'active');

    alter table poc_overrides drop constraint if exists poc_overrides_outcome_check;
    alter table poc_overrides drop column outcome;
  end if;
end $$;

alter table poc_overrides drop constraint if exists poc_overrides_status_check;
alter table poc_overrides
  add constraint poc_overrides_status_check
  check (status in ('active','waiting','won','lost','contract'));

update poc_overrides set status = 'active' where status is null;

-- ── poc_audit: rename v2 columns to v3 names ──
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'poc_audit'
      and column_name = 'field_changed'
  ) then
    alter table poc_audit rename column field_changed to field;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'poc_audit'
      and column_name = 'old_value'
  ) then
    alter table poc_audit rename column old_value to old_val;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'poc_audit'
      and column_name = 'new_value'
  ) then
    alter table poc_audit rename column new_value to new_val;
  end if;
end $$;

-- ── RLS fix (write permissions) ──
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
