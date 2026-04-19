-- Drop and recreate gap_analysis_sessions with correct schema
drop table if exists public.gap_analysis_sessions cascade;

create table public.gap_analysis_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  target_role       text not null,
  target_company    text,
  constraints       jsonb not null default '{}',
  oracle_data       jsonb,
  gaps              jsonb not null default '[]',
  readiness_score   integer not null default 0,
  readiness_summary text not null default '',
  critique          jsonb,
  syllabus          jsonb not null default '[]',
  created_at        timestamptz not null default now()
);

create index gap_analysis_sessions_user_idx
  on public.gap_analysis_sessions(user_id, created_at desc);

alter table public.gap_analysis_sessions enable row level security;

create policy "Users manage own gap sessions"
  on public.gap_analysis_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Oracle cache — 24-hour TTL per role+company pair
create table if not exists public.oracle_cache (
  id          uuid primary key default gen_random_uuid(),
  cache_key   text not null unique,
  role_query  text not null,
  company     text,
  data        jsonb not null,
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

create index oracle_cache_key_idx on public.oracle_cache(cache_key);
create index oracle_cache_expires_idx on public.oracle_cache(expires_at);
