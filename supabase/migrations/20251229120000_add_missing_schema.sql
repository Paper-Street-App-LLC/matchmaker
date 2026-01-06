-- Migration: Add missing schema for introductions and feedback
-- Description: Adds missing columns to existing tables and creates introductions and feedback tables

-- ============================================================================
-- Step 1: Alter Existing Tables
-- ============================================================================

-- Add updated_at column to matchmakers table
ALTER TABLE public.matchmakers
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

-- Add missing columns to people table
ALTER TABLE public.people
  ADD COLUMN age INTEGER,
  ADD COLUMN location VARCHAR(255),
  ADD COLUMN gender VARCHAR(50),
  ADD COLUMN preferences JSONB,
  ADD COLUMN personality JSONB,
  ADD COLUMN notes TEXT,
  ADD COLUMN active BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

-- Add index on people.active for filtering active people
CREATE INDEX idx_people_active ON public.people(active);

-- ============================================================================
-- Step 2: Create introductions Table
-- ============================================================================

CREATE TABLE public.introductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchmaker_id UUID NOT NULL REFERENCES public.matchmakers(id) ON DELETE CASCADE,
  person_a_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  person_b_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT different_people CHECK (person_a_id != person_b_id)
);

-- Add comment for documentation
COMMENT ON TABLE public.introductions IS 'Tracks when two people are introduced by a matchmaker';

-- Create indexes for introductions table
CREATE INDEX idx_introductions_matchmaker_id ON public.introductions(matchmaker_id);
CREATE INDEX idx_introductions_people ON public.introductions(person_a_id, person_b_id);

-- Enable Row Level Security on introductions table
ALTER TABLE public.introductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for introductions
CREATE POLICY "Matchmakers can view their own introductions"
  ON public.introductions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can insert their own introductions"
  ON public.introductions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can update their own introductions"
  ON public.introductions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = matchmaker_id)
  WITH CHECK (auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can delete their own introductions"
  ON public.introductions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = matchmaker_id);

-- ============================================================================
-- Step 3: Create feedback Table
-- ============================================================================

CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  introduction_id UUID NOT NULL REFERENCES public.introductions(id) ON DELETE CASCADE,
  from_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sentiment VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE public.feedback IS 'Stores feedback about dates and interactions between introduced people';

-- Create indexes for feedback table
CREATE INDEX idx_feedback_introduction_id ON public.feedback(introduction_id);
CREATE INDEX idx_feedback_from_person_id ON public.feedback(from_person_id);

-- Enable Row Level Security on feedback table
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback
-- Matchmakers can view feedback for introductions they created
CREATE POLICY "Matchmakers can view feedback for their introductions"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.introductions
      WHERE introductions.id = feedback.introduction_id
      AND introductions.matchmaker_id = auth.uid()
    )
  );

CREATE POLICY "Matchmakers can insert feedback for their introductions"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.introductions
      WHERE introductions.id = feedback.introduction_id
      AND introductions.matchmaker_id = auth.uid()
    )
  );

-- ============================================================================
-- Step 4: Add Trigger Functions for updated_at
-- ============================================================================

-- Create trigger function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_updated_at_column IS 'Trigger function to automatically update updated_at column on UPDATE';

-- Apply trigger to matchmakers table
CREATE TRIGGER update_matchmakers_updated_at
  BEFORE UPDATE ON public.matchmakers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to people table
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to introductions table
CREATE TRIGGER update_introductions_updated_at
  BEFORE UPDATE ON public.introductions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
