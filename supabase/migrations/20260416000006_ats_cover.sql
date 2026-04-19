create table public.ats_scan_results (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  input_hash        text not null,
  job_description   text not null,
  match_score       integer not null check (match_score between 0 and 100),
  keyword_gaps      jsonb not null default '[]',
  formatting_issues jsonb not null default '[]',
  specific_fixes    jsonb not null default '[]',
  summary           text not null,
  generated_at      timestamptz not null default now(),
  constraint ats_scan_user_hash unique (user_id, input_hash)
);
alter table public.ats_scan_results enable row level security;
create policy "Users manage own ats scans" on public.ats_scan_results for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.cover_letters (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  input_hash        text not null,
  job_description   text not null,
  company           text,
  role_title        text,
  letter_text       text not null,
  generated_at      timestamptz not null default now(),
  constraint cover_letters_user_hash unique (user_id, input_hash)
);
alter table public.cover_letters enable row level security;
create policy "Users manage own cover letters" on public.cover_letters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
