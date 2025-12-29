-- Create matchmakers table (extends auth.users)
-- This table stores additional information for matchmakers
CREATE TABLE public.matchmakers (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id)
);

-- Add comment for documentation
COMMENT ON TABLE public.matchmakers IS 'Extends auth.users with matchmaker-specific information';

-- Create people table
-- This table stores people in the matchmaking network
CREATE TABLE public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id UUID NOT NULL REFERENCES public.matchmakers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE public.people IS 'Stores people in the matchmaking network, each associated with a matchmaker';

-- Create index on matchmaker_id for better query performance
CREATE INDEX idx_people_matchmaker_id ON public.people(matchmaker_id);

-- Enable Row Level Security on matchmakers table
ALTER TABLE public.matchmakers ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on people table
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- RLS Policy: matchmakers can only SELECT their own record
CREATE POLICY "Matchmakers can view their own profile"
  ON public.matchmakers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policy: people - SELECT
CREATE POLICY "Matchmakers can view their own people"
  ON public.people
  FOR SELECT
  TO authenticated
  USING (auth.uid() = matchmaker_id);

-- RLS Policy: people - INSERT
CREATE POLICY "Matchmakers can insert people for themselves"
  ON public.people
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = matchmaker_id);

-- RLS Policy: people - UPDATE
CREATE POLICY "Matchmakers can update their own people"
  ON public.people
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = matchmaker_id)
  WITH CHECK (auth.uid() = matchmaker_id);

-- RLS Policy: people - DELETE
CREATE POLICY "Matchmakers can delete their own people"
  ON public.people
  FOR DELETE
  TO authenticated
  USING (auth.uid() = matchmaker_id);
