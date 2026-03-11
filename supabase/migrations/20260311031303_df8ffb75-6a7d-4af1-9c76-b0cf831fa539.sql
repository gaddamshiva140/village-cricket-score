
-- Make user_id nullable
ALTER TABLE public.matches ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.matches ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE public.players ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.players ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE public.teams ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.teams ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- Drop all existing RLS policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Create permissive public access policies
CREATE POLICY "allow_all" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
