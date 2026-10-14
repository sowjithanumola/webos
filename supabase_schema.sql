-- ==============================================================================
-- WebOS Supabase Database Schema & Row-Level Security (RLS) Policies
-- Run this in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create table for user-specific virtual files and folders
CREATE TABLE IF NOT EXISTS public.user_files (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  size BIGINT DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  is_trash BOOLEAN DEFAULT false,
  original_path TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_files_pkey PRIMARY KEY (id, user_id)
);

-- 2. Create indexes for quick directory lookups and search
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON public.user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_parent ON public.user_files(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_user_files_path ON public.user_files(user_id, path);

-- 3. Enable Row-Level Security on user_files
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Authenticated users can only access and manipulate their own files
DROP POLICY IF EXISTS "Users can read own files" ON public.user_files;
CREATE POLICY "Users can read own files"
  ON public.user_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own files" ON public.user_files;
CREATE POLICY "Users can insert own files"
  ON public.user_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own files" ON public.user_files;
CREATE POLICY "Users can update own files"
  ON public.user_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own files" ON public.user_files;
CREATE POLICY "Users can delete own files"
  ON public.user_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Create table for user settings & desktop customizations
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row-Level Security on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
CREATE POLICY "Users can read own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;
CREATE POLICY "Users can delete own settings"
  ON public.user_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
