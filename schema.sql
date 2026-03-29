-- ============================================
-- MuscleBoard Supabase Schema — Full Feature
-- ============================================

-- 既存テーブルの削除
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    height NUMERIC,
    weight NUMERIC,
    training_history TEXT,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Exercises（種目マスタ）
CREATE TABLE exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    description TEXT DEFAULT ''
);

-- 3. Posts
CREATE TABLE posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT,
    media_type TEXT,
    caption TEXT,
    tags TEXT[] DEFAULT '{}',
    purpose_tag TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Workouts
CREATE TABLE workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    exercise TEXT NOT NULL,
    weight_kg NUMERIC NOT NULL,
    reps INTEGER NOT NULL,
    sets INTEGER DEFAULT 1,
    body_weight NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Comments
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT,
    message TEXT NOT NULL,
    at_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Reactions
CREATE TABLE reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(post_id, user_id, type)
);

-- ============================================
-- RLS (MVP: 全ユーザー読み書き可能)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (true);

-- exercises
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (true);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (true);

-- posts
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (true);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (true);

-- workouts
CREATE POLICY "workouts_select" ON workouts FOR SELECT USING (true);
CREATE POLICY "workouts_insert" ON workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "workouts_update" ON workouts FOR UPDATE USING (true);

-- comments
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (true);

-- reactions
CREATE POLICY "reactions_select" ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "reactions_delete" ON reactions FOR DELETE USING (true);

-- ============================================
-- Trigger: 新規ユーザー登録時にプロフィール自動作成
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (new.id, COALESCE(split_part(new.email, '@', 1), 'user'), new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- プリセット種目データ（30種目）
-- ============================================
INSERT INTO exercises (name, muscle_group) VALUES
  ('ベンチプレス', '胸'), ('インクラインベンチプレス', '胸'), ('ダンベルフライ', '胸'),
  ('チェストプレス', '胸'), ('ケーブルフライ', '胸'),
  ('デッドリフト', '背中'), ('ラットプルダウン', '背中'), ('ベントオーバーロウ', '背中'),
  ('シーテッドロウ', '背中'), ('チンニング（懸垂）', '背中'),
  ('オーバーヘッドプレス', '肩'), ('サイドレイズ', '肩'), ('フロントレイズ', '肩'),
  ('リアレイズ', '肩'), ('アップライトロウ', '肩'),
  ('バーベルカール', '腕'), ('ダンベルカール', '腕'), ('トライセプスエクステンション', '腕'),
  ('ケーブルプッシュダウン', '腕'), ('ハンマーカール', '腕'),
  ('スクワット', '脚'), ('レッグプレス', '脚'), ('レッグカール', '脚'),
  ('レッグエクステンション', '脚'), ('ブルガリアンスクワット', '脚'),
  ('クランチ', '腹'), ('レッグレイズ', '腹'), ('プランク', '腹'),
  ('アブローラー', '腹'), ('ケーブルクランチ', '腹');

-- ============================================
-- Supabase Storage: mediaバケット
-- ※ Supabase Dashboard > Storage で 'media' バケットを手動作成し、Public に設定してください
-- ============================================
