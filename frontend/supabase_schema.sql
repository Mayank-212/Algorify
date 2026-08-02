-- Copy and paste this into the Supabase SQL Editor

-- 1. Create Learning Twins table
CREATE TABLE public.learning_twins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_style TEXT NOT NULL DEFAULT 'visual',
    preferred_explanation_style TEXT NOT NULL DEFAULT 'analogies',
    current_level TEXT NOT NULL DEFAULT 'intermediate',
    weak_topics TEXT[] DEFAULT '{}',
    strong_topics TEXT[] DEFAULT '{}',
    overall_mastery INTEGER DEFAULT 0,
    day_streak INTEGER DEFAULT 0,
    total_study_time_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Turn on Row Level Security
ALTER TABLE public.learning_twins ENABLE ROW LEVEL SECURITY;

-- 3. Allow users to view their own twin
CREATE POLICY "Users can view own twin" ON public.learning_twins
    FOR SELECT USING (auth.uid() = id);

-- 4. Allow users to update their own twin
CREATE POLICY "Users can update own twin" ON public.learning_twins
    FOR UPDATE USING (auth.uid() = id);

-- 5. Allow users to insert their own twin
CREATE POLICY "Users can insert own twin" ON public.learning_twins
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.learning_twins (id, learning_style, preferred_explanation_style, current_level, weak_topics, strong_topics)
  VALUES (
    NEW.id,
    'visual',
    'analogies',
    'beginner',
    ARRAY['Calculus Integration', 'Organic Chemistry'],
    ARRAY['Basic Algebra']
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger to automatically create a Learning Twin when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
