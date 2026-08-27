-- Exercise designated create/read/update/delete on the live schema. The probe
-- is removed in the same transaction and leaves only an audit ledger entry.

set lock_timeout = '10s';
set statement_timeout = '30s';

do $$
declare
  probe_key constant text := 'notification:00000000-0000-0000-0000-000000000000:relational-cutover-probe';
  observed jsonb;
begin
  perform public.upsert_designated_record(probe_key, '{"stage":"created"}'::jsonb);
  select payload into observed from public.app_notifications where source_key = probe_key;
  if observed is distinct from '{"stage":"created"}'::jsonb then
    raise exception 'Relational CRUD probe failed during create/read';
  end if;

  perform public.upsert_designated_record(probe_key, '{"stage":"updated"}'::jsonb);
  select payload into observed from public.app_notifications where source_key = probe_key;
  if observed is distinct from '{"stage":"updated"}'::jsonb then
    raise exception 'Relational CRUD probe failed during update/read';
  end if;

  perform public.delete_designated_record(probe_key);
  if exists (select 1 from public.app_notifications where source_key = probe_key) then
    raise exception 'Relational CRUD probe failed during delete';
  end if;

  if to_regclass('public.kv_store_6d579fee') is not null then
    raise exception 'Relational CRUD probe failed: legacy KV table still exists';
  end if;
  if exists (select 1 from public.app_unclassified) then
    raise exception 'Relational CRUD probe failed: unclassified records exist';
  end if;
end;
$$;

insert into public.kv_migration_runs(
  migration_name, status, source_counts, target_counts, quarantine_counts, completed_at
) values (
  '20260827231500_verify_relational_only_crud', 'verified',
  jsonb_build_object('legacy_kv_tables', 0),
  jsonb_build_object('crud_probe', 'passed', 'designated_records', (select count(*) from public.app_records)),
  jsonb_build_object('preserved_records', (select count(*) from public.kv_migration_quarantine)),
  now()
);
