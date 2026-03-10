
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper')),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own players" ON public.players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own players" ON public.players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own players" ON public.players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own players" ON public.players FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  player_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own teams" ON public.teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own teams" ON public.teams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own teams" ON public.teams FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Matches table (complex nested data stored as JSONB)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setup JSONB NOT NULL,
  innings JSONB NOT NULL,
  current_innings SMALLINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'completed', 'abandoned')),
  result TEXT,
  player_of_the_match TEXT,
  player_of_the_match_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches" ON public.matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own matches" ON public.matches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own matches" ON public.matches FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_players_user_id ON public.players(user_id);
CREATE INDEX idx_teams_user_id ON public.teams(user_id);
CREATE INDEX idx_matches_user_id ON public.matches(user_id);
CREATE INDEX idx_matches_status ON public.matches(status);
