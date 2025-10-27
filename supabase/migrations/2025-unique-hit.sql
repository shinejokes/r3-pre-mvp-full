do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'uniq_hits_share_viewer'
  ) then
    create unique index uniq_hits_share_viewer
      on r3_hits (share_id, viewer_fingerprint);
  end if;
end $$;
