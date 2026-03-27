-- Conversation store: server-side message history for gateway
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    JSONB NOT NULL,
  provider   TEXT,
  sender_id  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_thread ON conversations(thread_id, created_at);

-- Enable RLS (service role bypasses, but defense-in-depth)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
