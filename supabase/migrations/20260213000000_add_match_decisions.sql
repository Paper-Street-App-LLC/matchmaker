-- Migration: Add match_decisions table
-- Description: Records matchmaker decisions (accept/decline) on candidate matches,
-- enabling the algorithm to exclude already-reviewed candidates from future results.

CREATE TABLE public.match_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id UUID NOT NULL REFERENCES public.matchmakers(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('accepted', 'declined')),
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_decision UNIQUE (matchmaker_id, person_id, candidate_id)
);

COMMENT ON TABLE public.match_decisions IS
  'Records matchmaker accept/decline decisions on candidate matches for a given person';

CREATE INDEX idx_match_decisions_matchmaker_id ON public.match_decisions(matchmaker_id);
CREATE INDEX idx_match_decisions_person_id ON public.match_decisions(person_id);

ALTER TABLE public.match_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matchmakers can view their own decisions"
  ON public.match_decisions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can insert their own decisions"
  ON public.match_decisions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can update their own decisions"
  ON public.match_decisions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = matchmaker_id)
  WITH CHECK (auth.uid() = matchmaker_id);
