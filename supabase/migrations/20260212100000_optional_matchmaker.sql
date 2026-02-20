-- Migration: Make matchmaker_id optional and add is_seed flag
-- Description: Allows seed profiles with no matchmaker, visible to all authenticated users

-- ============================================================================
-- Step 1: Add is_seed column
-- ============================================================================

ALTER TABLE public.people
  ADD COLUMN is_seed BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX idx_people_is_seed ON public.people(is_seed);

-- ============================================================================
-- Step 2: Make matchmaker_id nullable (seed profiles have no matchmaker)
-- ============================================================================

ALTER TABLE public.people
  ALTER COLUMN matchmaker_id DROP NOT NULL;

-- ============================================================================
-- Step 3: Update RLS SELECT policy to include seed profiles
-- ============================================================================

DROP POLICY IF EXISTS "Matchmakers can view their own people" ON public.people;

CREATE POLICY "Matchmakers can view their own people and seed profiles"
  ON public.people
  FOR SELECT
  TO authenticated
  USING (auth.uid() = matchmaker_id OR is_seed = true);

-- INSERT policy: matchmaker_id must match auth user (prevents inserting seeds via API)
DROP POLICY IF EXISTS "Matchmakers can insert people for themselves" ON public.people;

CREATE POLICY "Matchmakers can insert people for themselves"
  ON public.people
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = matchmaker_id AND is_seed = false);

-- UPDATE/DELETE policies unchanged — seed profiles are excluded because matchmaker_id IS NULL
