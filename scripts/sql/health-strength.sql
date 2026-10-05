-- health 房 · 力量训练：计划模板 + 训练记录
-- 在 Supabase → SQL Editor 里跑一次，重复跑也安全
-- 三个预设 Plan（Day A/B/C）不在这里写入：首次进入力量训练页时由
-- /api/v2/health/strength 在表为空时自动写入。

create table if not exists v2_workout_plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  exercises   jsonb not null default '[]'::jsonb,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists v2_workout_logs (
  id          uuid primary key default gen_random_uuid(),
  date        timestamptz not null default now(),
  plan_id     uuid references v2_workout_plans(id) on delete set null,
  exercises   jsonb not null default '[]'::jsonb,
  duration    integer,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists v2_workout_logs_date_idx
  on v2_workout_logs (date desc);

alter table v2_workout_plans enable row level security;
alter table v2_workout_logs enable row level security;
