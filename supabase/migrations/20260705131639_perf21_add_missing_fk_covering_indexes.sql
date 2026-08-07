-- PERF-21: add covering indexes for the two FKs flagged by the performance
-- advisor as unindexed. Purely additive, no behavior change.
create index if not exists cms_media_assets_created_by_idx on public.cms_media_assets (created_by);
create index if not exists story_cast_act_id_idx on public.story_cast (act_id);
