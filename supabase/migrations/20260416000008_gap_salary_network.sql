create table public.gap_analysis_sessions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  job_descriptions       jsonb not null default '[]',
  recurring_requirements jsonb not null default '[]',
  profile_gaps           jsonb not null default '[]',
  roadmap_30             jsonb not null default '[]',
  roadmap_60             jsonb not null default '[]',
  roadmap_90             jsonb not null default '[]',
  pattern_summary        text,
  generated_at           timestamptz not null default now()
);
create index gap_analysis_user_id_idx on public.gap_analysis_sessions(user_id, generated_at desc);
alter table public.gap_analysis_sessions enable row level security;
create policy "Users manage own gap analyses" on public.gap_analysis_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.salary_sessions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  role_title               text not null,
  location                 text,
  years_of_exp             integer,
  company_size             text,
  range_low                integer,
  range_mid                integer,
  range_high               integer,
  rationale                text,
  data_caveats             text,
  negotiation_transcript   jsonb not null default '[]',
  created_at               timestamptz not null default now()
);
alter table public.salary_sessions enable row level security;
create policy "Users manage own salary sessions" on public.salary_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.network_connections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  first_name   text,
  last_name    text,
  company      text,
  position     text,
  connected_on text,
  email        text,
  imported_at  timestamptz not null default now()
);
create index network_connections_user_id_idx on public.network_connections(user_id);
create index network_connections_company_idx on public.network_connections(user_id, company);
alter table public.network_connections enable row level security;
create policy "Users manage own connections" on public.network_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
