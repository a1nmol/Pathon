-- Mentor conversation persistence
-- One active conversation per user; messages is a JSONB array of {role, content} objects.

create table if not exists mentor_conversations (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  messages    jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One row per user (upsert on user_id)
create unique index if not exists mentor_conversations_user_id_idx on mentor_conversations(user_id);

alter table mentor_conversations enable row level security;

create policy "Users own their mentor conversations"
  on mentor_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
