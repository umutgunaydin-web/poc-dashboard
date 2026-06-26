-- POC Portfolio Dashboard v2 — Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- Enable UUID
create extension if not exists "uuid-ossp";

-- POC overrides: manual data layered on top of Zoho
create table poc_overrides (
  tenant_id        text primary key,
  poc_owner        text,
  expected_win     date,
  outcome          text check (outcome in ('won','lost','active')),
  notes            text,
  platform         text check (platform in ('alotech','ccs')),
  go_live_date     date,
  first_invoice    text,
  updated_by       text,
  updated_at       timestamptz default now()
);

-- User roles: admin approves editors
create table user_roles (
  id               uuid primary key default uuid_generate_v4(),
  email            text unique not null,
  role             text not null default 'pending' check (role in ('pending','editor','admin')),
  approved_at      timestamptz,
  created_at       timestamptz default now()
);

-- Audit log
create table poc_audit (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        text not null,
  field_changed    text not null,
  old_value        text,
  new_value        text,
  changed_by       text,
  changed_at       timestamptz default now()
);

-- RLS Policies
alter table poc_overrides enable row level security;
alter table user_roles    enable row level security;
alter table poc_audit     enable row level security;

-- Everyone can read poc_overrides
create policy "public read overrides"
  on poc_overrides for select using (true);

-- Only editors/admins can write
create policy "editor write overrides"
  on poc_overrides for all
  using (
    exists (
      select 1 from user_roles
      where email = auth.jwt()->>'email'
      and role in ('editor','admin')
    )
  );

-- Only admin can manage roles
create policy "admin manage roles"
  on user_roles for all
  using (
    exists (
      select 1 from user_roles
      where email = auth.jwt()->>'email'
      and role = 'admin'
    )
  );

-- Editors can read audit
create policy "editor read audit"
  on poc_audit for select
  using (
    exists (
      select 1 from user_roles
      where email = auth.jwt()->>'email'
      and role in ('editor','admin')
    )
  );

-- Editors can insert audit
create policy "editor insert audit"
  on poc_audit for insert
  with check (
    exists (
      select 1 from user_roles
      where email = auth.jwt()->>'email'
      and role in ('editor','admin')
    )
  );

-- Insert your own user_roles row on first login (pending by default)
create policy "self insert role"
  on user_roles for insert
  with check (email = auth.jwt()->>'email');
