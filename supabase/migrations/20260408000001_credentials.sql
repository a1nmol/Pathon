-- =============================================================================
-- Credentials
-- Raw career background: resume text, GitHub URL, project descriptions.
-- No analysis or scoring — source material only.
-- =============================================================================

create table public.credentials (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,

  -- Resume
  resume_text           text,
  resume_file_path      text,                        -- path in 'resumes' storage bucket
  resume_source         text check (
                          resume_source in ('pdf', 'text', 'paste')
                        ),

  -- Links
  github_url            text,

  -- Projects: [{title: string, description: string}]
  project_descriptions  jsonb not null default '[]'::jsonb,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- One credentials row per user
  constraint credentials_user_id_unique unique (user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index credentials_user_id_idx on public.credentials (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses function created in migration 000000)
-- ---------------------------------------------------------------------------

create trigger credentials_set_updated_at
  before update on public.credentials
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.credentials enable row level security;

create policy "Users can view their own credentials"
  on public.credentials
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own credentials"
  on public.credentials
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own credentials"
  on public.credentials
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket (run manually in Supabase dashboard or via CLI)
-- ---------------------------------------------------------------------------
-- bucket name : resumes
-- public      : false
-- allowed MIME: application/pdf, text/plain
--
-- RLS policy for storage (paste into Storage → Policies):
--   select: (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
--   insert: (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
--   update: same as insert
-- ---------------------------------------------------------------------------
