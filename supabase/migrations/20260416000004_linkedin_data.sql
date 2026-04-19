-- LinkedIn data import table
-- Stores parsed LinkedIn export data per user (upserted on each import)

CREATE TABLE IF NOT EXISTS linkedin_data (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Profile basics
  headline       text,
  summary        text,
  location       text,

  -- Structured arrays (JSONB)
  positions      jsonb NOT NULL DEFAULT '[]',
  education      jsonb NOT NULL DEFAULT '[]',
  skills         jsonb NOT NULL DEFAULT '[]',
  posts          jsonb NOT NULL DEFAULT '[]',

  -- Stats
  post_count     int NOT NULL DEFAULT 0,
  position_count int NOT NULL DEFAULT 0,

  imported_at    timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT linkedin_data_user_unique UNIQUE (user_id)
);

ALTER TABLE linkedin_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own linkedin_data"
  ON linkedin_data FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
