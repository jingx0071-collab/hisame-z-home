-- 驾 · Car Room
-- 跑这个之前表已经在 Supabase 建好，这里留作版本参考

create table if not exists v2_car_entries (
  id            uuid primary key default gen_random_uuid(),
  status        text not null default 'ongoing'  -- 'ongoing' | 'completed'
                  check (status in ('ongoing','completed')),
  start_location  text,
  end_location    text,
  start_battery   smallint,
  end_battery     smallint,
  distance_km     numeric(8,2),
  duration_min    numeric(8,1),
  route           jsonb not null default '[]'::jsonb,
  comments        jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS 先关掉，跟 feast/closet 保持一致
alter table v2_car_entries disable row level security;
