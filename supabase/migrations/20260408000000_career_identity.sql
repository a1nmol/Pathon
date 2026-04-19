-- =============================================================================
-- Career Identity
-- Represents how a user thinks, learns, and operates.
-- Each column is a signal for AI reasoning — not decoration.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

create type thinking_style as enum (
  'analytical',
  'creative',
  'strategic',
  'pragmatic',
  'systems_thinker'
);

create type decision_approach as enum (
  'data_driven',
  'intuition_led',
  'consensus_seeking',
  'structured_process'
);

create type learning_mode as enum (
  'building',
  'reading',
  'discussing',
  'observing',
  'teaching'
);

create type work_rhythm as enum (
  'deep_focus',
  'collaborative',
  'sprint_rest',
  'steady_pace'
);

create type energy_source as enum (
  'introvert',
  'extrovert',
  'ambivert'
);

create type collaboration_style as enum (
  'independent',
  'pair',
  'small_team',
  'large_team'
);

create type communication_style as enum (
  'direct',
  'diplomatic',
  'detailed',
  'high_level'
);

create type feedback_preference as enum (
  'blunt',
  'balanced',
  'encouraging'
);

create type career_stage as enum (
  'early',
  'mid',
  'senior',
  'lead',
  'executive',
  'founder'
);

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table public.career_identity (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,

  -- Cognitive
  thinking_style       thinking_style not null,
  decision_approach    decision_approach not null,
  problem_framing      text,                        -- user's own words; no enum

  -- Learning
  primary_learning_mode learning_mode not null,
  knowledge_domains    text[] not null default '{}',
  currently_exploring  text[] not null default '{}',

  -- Work patterns
  work_rhythm          work_rhythm not null,
  energy_source        energy_source not null,
  collaboration_style  collaboration_style not null,

  -- Values & motivation
  core_values          text[] not null default '{}',
  motivated_by         text,

  -- Strengths & growth
  strengths            text[] not null default '{}',
  growth_areas         text[] not null default '{}',

  -- Career
  "current_role"       text,
  career_stage         career_stage not null,
  industries           text[] not null default '{}',
  career_direction     text,

  -- Communication
  communication_style  communication_style not null,
  feedback_preference  feedback_preference not null,

  -- AI context
  ai_context           text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- One identity per user
  constraint career_identity_user_id_unique unique (user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Primary lookup: fetch a user's identity
create index career_identity_user_id_idx on public.career_identity (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger career_identity_set_updated_at
  before update on public.career_identity
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Users can only read and write their own identity row.
-- ---------------------------------------------------------------------------

alter table public.career_identity enable row level security;

create policy "Users can view their own identity"
  on public.career_identity
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own identity"
  on public.career_identity
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own identity"
  on public.career_identity
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy — identity is permanent; soft-delete via application logic if needed.
