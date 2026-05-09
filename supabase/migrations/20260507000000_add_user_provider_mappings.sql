CREATE TABLE public.user_provider_mappings (
  provider    TEXT NOT NULL,
  sender_id   TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, sender_id)
);

CREATE INDEX idx_user_provider_mappings_user ON public.user_provider_mappings(user_id);

ALTER TABLE public.user_provider_mappings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_provider_mappings IS $$Maps inbound chat-provider identities ((provider, sender_id) pairs) to a Supabase auth.users.id. Accessed only via the service_role key from the gateway; RLS is enabled with no policies so anon/authenticated keys are denied by default. The composite PK doubles as the unique constraint the user-mapping service relies on for concurrent-first-contact safety.$$;
