CREATE TABLE public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  provider    TEXT,
  sender_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_thread ON public.conversations(thread_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.conversations IS
  'Gateway conversation history. Accessed only via the service_role key '
  'from the webhook-handling gateway; RLS is enabled with no policies so '
  'anon/authenticated keys are denied by default. If a future caller needs '
  'anon/authenticated access, add explicit CREATE POLICY statements in a '
  'follow-up migration.';
