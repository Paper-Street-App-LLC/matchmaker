-- Migration: Add match_decisions table
-- Tracks matchmaker accept/decline decisions on match candidates
-- Decline reasons feed back into the algorithm as "revealed preferences"

CREATE TABLE public.match_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id UUID NOT NULL REFERENCES public.matchmakers(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('accepted', 'declined')),
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT different_people CHECK (person_id != candidate_id),
  CONSTRAINT unique_decision UNIQUE (person_id, candidate_id)
);

CREATE INDEX idx_match_decisions_person_id ON public.match_decisions(person_id);
CREATE INDEX idx_match_decisions_candidate_id ON public.match_decisions(candidate_id);
CREATE INDEX idx_match_decisions_matchmaker_id ON public.match_decisions(matchmaker_id);

ALTER TABLE public.match_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matchmakers can view their own decisions"
  ON public.match_decisions FOR SELECT TO authenticated
  USING (auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can insert their own decisions"
  ON public.match_decisions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = matchmaker_id);
