-- Application Tracker
create table public.job_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  company          text not null,
  role_title       text not null,
  job_url          text,
  job_description  text,
  current_status   text not null default 'applied',
  applied_at       timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index job_applications_user_id_idx on public.job_applications(user_id);
create index job_applications_status_idx  on public.job_applications(user_id, current_status);
create index job_applications_applied_idx on public.job_applications(user_id, applied_at desc);
alter table public.job_applications enable row level security;
create policy "Users view own applications"   on public.job_applications for select using (auth.uid() = user_id);
create policy "Users insert own applications" on public.job_applications for insert with check (auth.uid() = user_id);
create policy "Users update own applications" on public.job_applications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own applications" on public.job_applications for delete using (auth.uid() = user_id);

create table public.application_events (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  from_status    text,
  to_status      text not null,
  note           text,
  occurred_at    timestamptz not null default now()
);
create index application_events_app_idx on public.application_events(application_id, occurred_at desc);
alter table public.application_events enable row level security;
create policy "Users view own events"   on public.application_events for select using (auth.uid() = user_id);
create policy "Users insert own events" on public.application_events for insert with check (auth.uid() = user_id);
