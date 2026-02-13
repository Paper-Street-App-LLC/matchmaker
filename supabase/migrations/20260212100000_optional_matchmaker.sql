-- Make matchmaker_id nullable (singles can exist without a matchmaker)
ALTER TABLE public.people ALTER COLUMN matchmaker_id DROP NOT NULL;

-- Drop existing RLS policies that require matchmaker_id = auth.uid()
DROP POLICY IF EXISTS "Matchmakers can view their own people" ON public.people;
DROP POLICY IF EXISTS "Matchmakers can insert people for themselves" ON public.people;
DROP POLICY IF EXISTS "Matchmakers can update their own people" ON public.people;
DROP POLICY IF EXISTS "Matchmakers can delete their own people" ON public.people;

-- New RLS policies: matchmakers see their own people, but service_role can see all
CREATE POLICY "Matchmakers can view their own people"
  ON public.people FOR SELECT TO authenticated
  USING (matchmaker_id IS NOT NULL AND auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can insert people for themselves"
  ON public.people FOR INSERT TO authenticated
  WITH CHECK (matchmaker_id IS NOT NULL AND auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can update their own people"
  ON public.people FOR UPDATE TO authenticated
  USING (matchmaker_id IS NOT NULL AND auth.uid() = matchmaker_id)
  WITH CHECK (matchmaker_id IS NOT NULL AND auth.uid() = matchmaker_id);

CREATE POLICY "Matchmakers can delete their own people"
  ON public.people FOR DELETE TO authenticated
  USING (matchmaker_id IS NOT NULL AND auth.uid() = matchmaker_id);

-- Add is_seed column to distinguish seed profiles from real ones
ALTER TABLE public.people ADD COLUMN is_seed BOOLEAN DEFAULT false;
