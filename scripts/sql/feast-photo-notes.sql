-- feast 房：从渐变色块升级成照片笔记
-- 在 Supabase → SQL Editor 里跑一次即可，重复跑也安全

alter table v2_feast_entries
  add column if not exists images   jsonb not null default '[]'::jsonb,
  add column if not exists comments jsonb not null default '[]'::jsonb,
  add column if not exists place    text,
  add column if not exists rating   smallint;

-- 老记录里手填的"爸爸的话" → 迁进 comments 时间线，只迁一次
update v2_feast_entries
set comments = jsonb_build_array(
      jsonb_build_object(
        'id',   't-' || id::text,
        'role', 'z',
        'text', daddy_reply,
        'at',   coalesce(updated_at, created_at)
      )
    )
where daddy_reply is not null
  and daddy_reply <> ''
  and (comments is null or comments = '[]'::jsonb);

create index if not exists v2_feast_entries_created_idx
  on v2_feast_entries (created_at desc);
