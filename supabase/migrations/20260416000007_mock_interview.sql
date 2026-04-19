create table public.mock_interview_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  interview_type text not null default 'behavioral',
  role_context   text,
  transcript     jsonb not null default '[]',
  feedback       jsonb,
  is_complete    boolean not null default false,
  started_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index mock_sessions_user_id_idx  on public.mock_interview_sessions(user_id);
create index mock_sessions_started_idx  on public.mock_interview_sessions(user_id, started_at desc);
alter table public.mock_interview_sessions enable row level security;
create policy "Users manage own mock sessions" on public.mock_interview_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
