-- Migration: Make matchmaker_id optional for shared seed profiles
-- Seed profiles have matchmaker_id = NULL and are visible to all authenticated users

ALTER TABLE public.people ALTER COLUMN matchmaker_id DROP NOT NULL;

-- SELECT: own people + shared profiles (NULL matchmaker_id)
DROP POLICY IF EXISTS "Matchmakers can view their own people" ON public.people;
CREATE POLICY "Matchmakers can view their own people and shared profiles"
  ON public.people FOR SELECT TO authenticated
  USING (auth.uid() = matchmaker_id OR matchmaker_id IS NULL);

-- INSERT: must set matchmaker_id to self
DROP POLICY IF EXISTS "Matchmakers can insert people for themselves" ON public.people;
CREATE POLICY "Matchmakers can insert people for themselves"
  ON public.people FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = matchmaker_id);
