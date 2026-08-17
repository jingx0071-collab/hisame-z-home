-- closet 房：宝宝的穿搭本子
-- 在 Supabase → SQL Editor 里跑一次，重复跑也安全

create table if not exists v2_closet_entries (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'Untitled',
  date        text,
  weekday     text,
  description text not null default '',
  images      jsonb not null default '[]'::jsonb,
  comments    jsonb not null default '[]'::jsonb,
  occasion    text,
  items       jsonb not null default '[]'::jsonb,
  rating      smallint,
  weather     text,
  temp_c      smallint,
  mode        text not null default 'log',
  pick_index  smallint,
  pick_reason text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists v2_closet_entries_created_idx
  on v2_closet_entries (created_at desc);

alter table v2_closet_entries enable row level security;
