-- Fix gap_analysis_sessions to match GapAnalysisSession type
drop table if exists public.gap_analysis_sessions cascade;
create table public.gap_analysis_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  target_role      text not null,
  target_company   text,
  gaps             jsonb not null default '[]',
  readiness_score  integer not null default 0 check (readiness_score between 0 and 100),
  readiness_summary text not null default '',
  created_at       timestamptz not null default now()
);
create index gap_sessions_user_id_idx on public.gap_analysis_sessions(user_id, created_at desc);
alter table public.gap_analysis_sessions enable row level security;
create policy "Users manage own gap analyses"
  on public.gap_analysis_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fix ats_scan_results to match ATSScanResult type (store full result as jsonb)
drop table if exists public.ats_scan_results cascade;
create table public.ats_scan_results (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  input_hash      text not null,
  job_description text not null,
  resume_text     text not null default '',
  result          jsonb not null,
  generated_at    timestamptz not null default now(),
  constraint ats_scan_user_hash unique (user_id, input_hash)
);
alter table public.ats_scan_results enable row level security;
create policy "Users manage own ats scans"
  on public.ats_scan_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fix cover_letters to store full result as jsonb
drop table if exists public.cover_letters cascade;
create table public.cover_letters (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  input_hash      text not null,
  company         text not null default '',
  role_title      text not null default '',
  result          jsonb not null,
  generated_at    timestamptz not null default now(),
  constraint cover_letters_user_hash unique (user_id, input_hash)
);
alter table public.cover_letters enable row level security;
create policy "Users manage own cover letters"
  on public.cover_letters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fix mock_interview_sessions — rebuild with correct schema matching MockInterviewSession type
drop table if exists public.mock_interview_sessions cascade;
create table public.mock_interview_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  role_title     text not null,
  interview_type text not null default 'behavioral',
  transcript     jsonb not null default '[]',
  feedback       jsonb,
  is_complete    boolean not null default false,
  created_at     timestamptz not null default now()
);
create index mock_sessions_user_id_idx on public.mock_interview_sessions(user_id, created_at desc);
alter table public.mock_interview_sessions enable row level security;
create policy "Users manage own mock sessions"
  on public.mock_interview_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
