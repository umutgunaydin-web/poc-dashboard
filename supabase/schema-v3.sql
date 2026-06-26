-- POC Dashboard v3 — clean schema + seed
-- Run in Supabase Dashboard → SQL Editor
-- Then run fix-rls.sql if not already applied

drop table if exists poc_overrides cascade;
drop table if exists poc_audit cascade;

create table poc_overrides (
  tenant_id      text primary key,
  poc_owner      text,
  status         text default 'active'
                 check (status in ('active','waiting','won','lost','contract')),
  expected_win   date,
  notes          text,
  updated_by     text,
  updated_at     timestamptz default now()
);

create table poc_audit (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    text not null,
  field        text not null,
  old_val      text,
  new_val      text,
  changed_by   text,
  changed_at   timestamptz default now()
);

alter table poc_overrides enable row level security;
alter table poc_audit     enable row level security;

-- RLS helpers (avoid infinite recursion on user_roles)
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

create policy "public read" on poc_overrides for select using (true);
create policy "editor write" on poc_overrides for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());
create policy "public read audit" on poc_audit for select using (true);
create policy "editor insert audit" on poc_audit for insert
  with check (public.is_editor_or_admin());

insert into poc_overrides (tenant_id, poc_owner, status) values
('atayholding.alo-tech.com',           'Gülsüm Ügüt', 'active'),
('mobiliz.alo-tech.com',               'Gülsüm Ügüt', 'active'),
('oteldeode.alo-tech.com',             'Gülsüm Ügüt', 'active'),
('unlemsigorta.alo-tech.com',          'Gülsüm Ügüt', 'active'),
('mobilassistance.alo-tech.com',       'Gülsüm Ügüt', 'active'),
('climed.alo-tech.com',                'Gülsüm Ügüt', 'active'),
('tamfinans.alo-tech.com',             'Gülsüm Ügüt', 'active'),
('pronetsatis.alo-tech.com',           'Gülsüm Ügüt', 'active'),
('elysian.callcenterstudio.com',       'Eren Şirin',   'active'),
('tazecicek.alo-tech.com',             'Eren Şirin',   'active'),
('rsa.callcenterstudio.com',           'Eren Şirin',   'active'),
('excitepanacea.callcenterstudio.com', 'Eren Şirin',   'active'),
('castrotravel.callcenterstudio.com',  'Eren Şirin',   'active'),
('transcosmos.callcenterstudio.com',   'Eren Şirin',   'active'),
('lalamove.callcenterstudio.com',      'Eren Şirin',   'active'),
('spacedental.callcenterstudio.com',   'Ali Kahya',    'active'),
('shofco.callcenterstudio.com',        'Ali Kahya',    'active'),
('dunlop.callcenterstudio.com',        'Ali Kahya',    'active')
on conflict (tenant_id) do update
  set poc_owner = excluded.poc_owner;
