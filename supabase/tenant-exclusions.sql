-- Hidden/excluded tenants (dashboard'dan kaldırılanlar)
-- Run in Supabase Dashboard → SQL Editor

create table if not exists tenant_exclusions (
  tenant_id    text primary key,
  reason       text,
  excluded_by  text,
  excluded_at  timestamptz default now()
);

alter table tenant_exclusions enable row level security;

create or replace function public.is_editor_or_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.user_roles
    where email = auth.jwt()->>'email' and role in ('editor', 'admin')
  );
$$;

drop policy if exists "public read exclusions" on tenant_exclusions;
drop policy if exists "editor exclude tenants" on tenant_exclusions;

create policy "public read exclusions"
  on tenant_exclusions for select using (true);

create policy "editor exclude tenants"
  on tenant_exclusions for insert
  with check (public.is_editor_or_admin());

-- Yanlış platform — lesacall.callcenterstudio.com zaten mevcut
insert into tenant_exclusions (tenant_id, reason, excluded_by) values
('lesacall.alo-tech.com', 'Yanlış platform — CCS tenant mevcut', 'system')
on conflict (tenant_id) do nothing;
