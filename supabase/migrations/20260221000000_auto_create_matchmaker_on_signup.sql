-- Trigger function: auto-create a matchmaker profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.matchmakers (id, name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      'Unknown'
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger: fire after every new auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create matchmaker rows for any existing users missing from the table
INSERT INTO public.matchmakers (id, name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email, 'Unknown')
FROM auth.users u
LEFT JOIN public.matchmakers m ON m.id = u.id
WHERE m.id IS NULL;
