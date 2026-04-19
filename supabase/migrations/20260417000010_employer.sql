-- ── User type (applicant | employer) ─────────────────────────────────────────
create table if not exists public.user_profiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  user_type text not null default 'applicant'
    check (user_type in ('applicant', 'employer')),
  created_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
create policy "users manage own profile"
  on public.user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Company profiles ──────────────────────────────────────────────────────────
create table if not exists public.company_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique not null references auth.users(id) on delete cascade,
  name         text not null,
  size         text,
  industry     text,
  tech_stack   text[] default '{}',
  culture_tags text[] default '{}',
  website      text,
  created_at   timestamptz not null default now()
);
alter table public.company_profiles enable row level security;
create policy "employers manage own company"
  on public.company_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Job postings ──────────────────────────────────────────────────────────────
create table if not exists public.job_postings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  description     text not null default '',
  requirements    text[] default '{}',
  nice_to_haves   text[] default '{}',
  salary_min      integer,
  salary_max      integer,
  location        text,
  remote_ok       boolean default false,
  employment_type text default 'full-time',
  status          text default 'draft'
    check (status in ('draft', 'active', 'closed')),
  created_at      timestamptz not null default now()
);
create index job_postings_user_id_idx on public.job_postings(user_id, created_at desc);
alter table public.job_postings enable row level security;
create policy "employers manage own jobs"
  on public.job_postings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Candidate pipeline ────────────────────────────────────────────────────────
create table if not exists public.pipeline_candidates (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.job_postings(id) on delete cascade,
  employer_id uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  email       text,
  resume_text text,
  linkedin_url text,
  stage       text not null default 'applied'
    check (stage in ('applied','reviewed','phone_screen','interview','decision','hired','passed')),
  ai_score    integer,
  ai_summary  text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index pipeline_employer_idx on public.pipeline_candidates(employer_id, created_at desc);
alter table public.pipeline_candidates enable row level security;
create policy "employers manage own pipeline"
  on public.pipeline_candidates for all
  using (auth.uid() = employer_id)
  with check (auth.uid() = employer_id);
