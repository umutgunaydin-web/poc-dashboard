-- Alpha BPO tenants (28 Apr 2026) — run in Supabase SQL Editor

insert into poc_overrides (tenant_id, poc_owner, status) values
('nexuro.callcenterstudio.com', 'Ali Kahya', 'active'),
('meassociates.callcenterstudio.com', 'Ali Kahya', 'active')
on conflict (tenant_id) do update
  set poc_owner = excluded.poc_owner,
      status = excluded.status;
