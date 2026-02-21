-- Cross-Matchmaker Matching Migration
-- Enables introductions between people from different matchmakers
-- by replacing single matchmaker_id with matchmaker_a_id / matchmaker_b_id

-- Step 1: Drop ALL policies that depend on introductions.matchmaker_id
-- (must happen before we can drop the column)
DROP POLICY IF EXISTS "Matchmakers can view their own introductions" ON public.introductions;
DROP POLICY IF EXISTS "Matchmakers can insert their own introductions" ON public.introductions;
DROP POLICY IF EXISTS "Matchmakers can update their own introductions" ON public.introductions;
DROP POLICY IF EXISTS "Matchmakers can delete their own introductions" ON public.introductions;

-- Feedback policies also depend on introductions.matchmaker_id via subquery
DROP POLICY IF EXISTS "Matchmakers can view feedback for their introductions" ON public.feedback;
DROP POLICY IF EXISTS "Matchmakers can insert feedback for their introductions" ON public.feedback;

-- Step 2: Add new columns to introductions (nullable for migration safety)
ALTER TABLE public.introductions
  ADD COLUMN matchmaker_a_id UUID REFERENCES public.matchmakers(id) ON DELETE CASCADE,
  ADD COLUMN matchmaker_b_id UUID REFERENCES public.matchmakers(id) ON DELETE CASCADE;

-- Step 3: Backfill from existing matchmaker_id
UPDATE public.introductions
SET matchmaker_a_id = matchmaker_id,
    matchmaker_b_id = matchmaker_id;

-- Step 4: Make new columns NOT NULL after backfill
ALTER TABLE public.introductions
  ALTER COLUMN matchmaker_a_id SET NOT NULL,
  ALTER COLUMN matchmaker_b_id SET NOT NULL;

-- Step 5: Drop old matchmaker_id column and its index
DROP INDEX IF EXISTS idx_introductions_matchmaker_id;
ALTER TABLE public.introductions DROP COLUMN matchmaker_id;

-- Step 6: Add indexes on new columns
CREATE INDEX idx_introductions_matchmaker_a_id ON public.introductions(matchmaker_a_id);
CREATE INDEX idx_introductions_matchmaker_b_id ON public.introductions(matchmaker_b_id);

-- Step 7: Create new RLS policies for dual ownership on introductions
CREATE POLICY "Matchmakers can view introductions they are part of"
  ON public.introductions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (matchmaker_a_id, matchmaker_b_id));

CREATE POLICY "Matchmakers can insert introductions they are part of"
  ON public.introductions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (matchmaker_a_id, matchmaker_b_id));

CREATE POLICY "Matchmakers can update introductions they are part of"
  ON public.introductions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (matchmaker_a_id, matchmaker_b_id))
  WITH CHECK (auth.uid() IN (matchmaker_a_id, matchmaker_b_id));

CREATE POLICY "Matchmakers can delete introductions they are part of"
  ON public.introductions
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (matchmaker_a_id, matchmaker_b_id));

-- Step 8: Recreate feedback RLS policies using new columns
CREATE POLICY "Matchmakers can view feedback for their introductions"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.introductions
      WHERE introductions.id = feedback.introduction_id
      AND auth.uid() IN (introductions.matchmaker_a_id, introductions.matchmaker_b_id)
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
      AND auth.uid() IN (introductions.matchmaker_a_id, introductions.matchmaker_b_id)
    )
  );
