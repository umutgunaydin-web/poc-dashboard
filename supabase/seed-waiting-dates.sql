-- Waiting POC'lar — tahmini bitiş tarihleri
-- Run in Supabase Dashboard → SQL Editor

insert into poc_overrides (tenant_id, expected_win, status) values
('elysian.callcenterstudio.com',      '2026-07-31', 'waiting'),
('climed.alo-tech.com',               '2026-07-31', 'waiting'),
('tamfinans.alo-tech.com',            '2026-07-31', 'waiting'),
('sigortaladim.alo-tech.com',         '2026-07-31', 'waiting'),
('cibi.callcenterstudio.com',         '2026-06-30', 'waiting')
on conflict (tenant_id) do update
  set expected_win = excluded.expected_win,
      status = coalesce(poc_overrides.status, excluded.status);
