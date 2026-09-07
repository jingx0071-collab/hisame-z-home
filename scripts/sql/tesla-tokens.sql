-- Tesla token 存储（单行 singleton）
create table if not exists tesla_tokens (
  id                text primary key default 'singleton',
  access_token      text,
  refresh_token     text,
  expires_at        timestamptz,
  vehicle_id        text,
  last_shift_state  text,
  updated_at        timestamptz not null default now()
);

alter table tesla_tokens disable row level security;
