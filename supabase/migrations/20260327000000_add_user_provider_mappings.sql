-- User provider mappings: resolve chat platform IDs to Supabase auth users
CREATE TABLE user_provider_mappings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  provider   TEXT NOT NULL,
  sender_id  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, sender_id)
);

-- Enable RLS (service role bypasses, but defense-in-depth)
ALTER TABLE user_provider_mappings ENABLE ROW LEVEL SECURITY;
