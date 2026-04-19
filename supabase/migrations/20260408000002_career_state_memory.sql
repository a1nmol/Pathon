-- =============================================================================
-- Career State Memory
--
-- Tracks how the user's career thinking evolves over time.
-- Three tables: path_snapshots, path_responses, behavior_log.
-- All append-only by convention — no row is ever deleted or updated.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum: path_response_action
-- ---------------------------------------------------------------------------

create type path_response_action as enum (
  'pursuing',
  'considering',
  'dismissed',
  'deferred'
);

-- ---------------------------------------------------------------------------
-- Enum: behavior_event_type
-- ---------------------------------------------------------------------------

create type behavior_event_type as enum (
  'analysis_generated',
  'path_pursued',
  'path_dismissed',
  'path_deferred',
  'advice_ignored',
  'direction_changed',
  'identity_updated',
  'credentials_updated',
  'path_revisited'
);

-- ---------------------------------------------------------------------------
-- Table: path_snapshots
-- One row per CareerPathAnalysis the engine produced.
-- ---------------------------------------------------------------------------

create table public.path_snapshots (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,

  -- Full CareerPathAnalysis stored verbatim. Never mutated after insert.
  analysis             jsonb not null,

  -- Mirrors analysis.context_snapshot_at — duplicated for query efficiency.
  context_snapshot_at  timestamptz not null,

  created_at           timestamptz not null default now()
);

create index path_snapshots_user_id_idx    on public.path_snapshots (user_id);
create index path_snapshots_created_at_idx on public.path_snapshots (user_id, created_at desc);

alter table public.path_snapshots enable row level security;

create policy "Users can view their own snapshots"
  on public.path_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert their own snapshots"
  on public.path_snapshots for insert
  with check (auth.uid() = user_id);

-- No update or delete policy — snapshots are immutable.

-- ---------------------------------------------------------------------------
-- Table: path_responses
-- One row per user action on a suggested path.
-- ---------------------------------------------------------------------------

create table public.path_responses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  snapshot_id   uuid not null references public.path_snapshots (id) on delete cascade,

  -- The CareerPath.name this response targets.
  -- Not a FK — path names have no stable ID.
  path_name     text not null,

  action        path_response_action not null,

  -- Optional note written at the time of response.
  note          text,

  responded_at  timestamptz not null default now()
);

create index path_responses_user_id_idx      on public.path_responses (user_id);
create index path_responses_snapshot_id_idx  on public.path_responses (snapshot_id);
-- Efficient lookup of the latest response per path_name
create index path_responses_path_name_idx    on public.path_responses (user_id, path_name, responded_at desc);

alter table public.path_responses enable row level security;

create policy "Users can view their own responses"
  on public.path_responses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own responses"
  on public.path_responses for insert
  with check (auth.uid() = user_id);

-- No update — new responses are new rows. History is preserved.

-- ---------------------------------------------------------------------------
-- Table: behavior_log
-- Discrete, observable events. Append-only.
-- ---------------------------------------------------------------------------

create table public.behavior_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  event_type   behavior_event_type not null,

  -- Structured metadata. Shape depends on event_type.
  -- See types/memory.ts BehaviorEventMeta for the per-type shapes.
  meta         jsonb not null default '{}'::jsonb,

  occurred_at  timestamptz not null default now()
);

create index behavior_log_user_id_idx     on public.behavior_log (user_id);
create index behavior_log_occurred_at_idx on public.behavior_log (user_id, occurred_at desc);
create index behavior_log_event_type_idx  on public.behavior_log (user_id, event_type);

alter table public.behavior_log enable row level security;

create policy "Users can view their own behavior log"
  on public.behavior_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own behavior log entries"
  on public.behavior_log for insert
  with check (auth.uid() = user_id);

-- No update or delete — the log is immutable.
