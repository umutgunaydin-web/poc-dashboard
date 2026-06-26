-- Add Go-Live and 1st Invoice fields to poc_overrides
-- Run in Supabase Dashboard → SQL Editor

alter table poc_overrides
  add column if not exists go_live_date date,
  add column if not exists first_invoice text;
