-- Remove partner/internal tenant accounts (not customer POCs)
delete from poc_overrides where tenant_id in (
  'nuevo.alo-tech.com',
  'teneo.alo-tech.com',
  'flowdesk.alo-tech.com'
);
