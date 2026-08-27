-- Collapse duplicate prefix indexes created for the generic KV table.
-- Keep one explicitly named index for LIKE 'prefix%' queries and preserve the
-- primary key and any indexes with a different definition.
create index if not exists idx_kv_store_key_prefix
  on public.kv_store_6d579fee using btree (key text_pattern_ops);

do $$
declare
  duplicate_index record;
begin
  for duplicate_index in
    select namespace.nspname as schema_name, index_class.relname as index_name
    from pg_catalog.pg_class as index_class
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = index_class.relnamespace
    join pg_catalog.pg_index as index_metadata
      on index_metadata.indexrelid = index_class.oid
    where namespace.nspname = 'public'
      and index_metadata.indrelid = 'public.kv_store_6d579fee'::regclass
      and index_class.relname <> 'idx_kv_store_key_prefix'
      and pg_catalog.pg_get_indexdef(index_class.oid)
        like '% USING btree (key text_pattern_ops)%'
  loop
    execute format(
      'drop index if exists %I.%I',
      duplicate_index.schema_name,
      duplicate_index.index_name
    );
  end loop;
end $$;
