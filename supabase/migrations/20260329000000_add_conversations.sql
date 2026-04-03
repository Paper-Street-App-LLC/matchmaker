CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  provider    TEXT,
  sender_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_thread ON conversations(thread_id, created_at);
