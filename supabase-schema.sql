-- なにめし Supabase Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Meals table
CREATE TABLE IF NOT EXISTS meals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_name TEXT NOT NULL,
  category TEXT NOT NULL,
  ingredients TEXT,
  pfc JSONB,
  is_manual BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  cooked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meals" ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON meals FOR DELETE USING (auth.uid() = user_id);

-- 2. Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_name TEXT NOT NULL,
  recipe_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- 3. Shopping items table
CREATE TABLE IF NOT EXISTS shopping_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount TEXT,
  checked BOOLEAN DEFAULT FALSE,
  recipe_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own shopping items" ON shopping_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shopping items" ON shopping_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping items" ON shopping_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping items" ON shopping_items FOR DELETE USING (auth.uid() = user_id);

-- 4. Pantry table
CREATE TABLE IF NOT EXISTS pantry (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_name)
);

ALTER TABLE pantry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pantry" ON pantry FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pantry" ON pantry FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pantry" ON pantry FOR DELETE USING (auth.uid() = user_id);

-- 5. PFC Goals table
CREATE TABLE IF NOT EXISTS pfc_goals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  calories INTEGER NOT NULL DEFAULT 2000,
  protein INTEGER NOT NULL DEFAULT 60,
  fat INTEGER NOT NULL DEFAULT 55,
  carbs INTEGER NOT NULL DEFAULT 300,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pfc_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own goals" ON pfc_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON pfc_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON pfc_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON pfc_goals FOR DELETE USING (auth.uid() = user_id);
