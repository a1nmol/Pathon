-- =============================================================================
-- Proof Capsules
--
-- Users document growth through structured work stories.
-- Five sections capture context, constraints, reasoning, iterations,
-- and reflection. Each save writes a revision row — history is preserved.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: proof_capsules
-- ---------------------------------------------------------------------------

create table public.proof_capsules (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,

  -- Anchor
  claim               text not null default '',

  -- Five structured sections — all nullable until written
  context             text,
  constraints         text,
  decision_reasoning  text,
  iterations          text,
  reflection          text,

  -- Metadata
  tags                text[] not null default '{}',
  is_complete         boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index proof_capsules_user_id_idx on public.proof_capsules (user_id);
create index proof_capsules_updated_at_idx on public.proof_capsules (user_id, updated_at desc);

-- is_complete is true when all five sections have content
create or replace function public.set_proof_capsule_completeness()
returns trigger
language plpgsql
as $$
begin
  new.is_complete := (
    new.context             is not null and length(trim(new.context))             > 0 and
    new.constraints         is not null and length(trim(new.constraints))         > 0 and
    new.decision_reasoning  is not null and length(trim(new.decision_reasoning))  > 0 and
    new.iterations          is not null and length(trim(new.iterations))          > 0 and
    new.reflection          is not null and length(trim(new.reflection))          > 0
  );
  new.updated_at := now();
  return new;
end;
$$;

create trigger proof_capsules_completeness_and_updated_at
  before insert or update on public.proof_capsules
  for each row
  execute function public.set_proof_capsule_completeness();

-- ---------------------------------------------------------------------------
-- Row Level Security: proof_capsules
-- ---------------------------------------------------------------------------

alter table public.proof_capsules enable row level security;

create policy "Users can view their own capsules"
  on public.proof_capsules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own capsules"
  on public.proof_capsules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own capsules"
  on public.proof_capsules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy — capsules are permanent by default.

-- ---------------------------------------------------------------------------
-- Table: proof_capsule_revisions
-- Append-only. One row per autosave.
-- ---------------------------------------------------------------------------

create table public.proof_capsule_revisions (
  id          uuid primary key default gen_random_uuid(),
  capsule_id  uuid not null references public.proof_capsules (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,

  -- Full snapshot of all sections at save time
  snapshot    jsonb not null,

  -- Total word count across all sections at this revision
  word_count  integer not null default 0,

  saved_at    timestamptz not null default now()
);

create index proof_capsule_revisions_capsule_id_idx on public.proof_capsule_revisions (capsule_id, saved_at desc);
create index proof_capsule_revisions_user_id_idx    on public.proof_capsule_revisions (user_id);

alter table public.proof_capsule_revisions enable row level security;

create policy "Users can view their own revisions"
  on public.proof_capsule_revisions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own revisions"
  on public.proof_capsule_revisions for insert
  with check (auth.uid() = user_id);

-- No update or delete — revisions are immutable.
