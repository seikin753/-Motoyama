-- ============================================
-- MuscleBoard Supabase Schema Initialization
-- ============================================

-- 既存テーブルの削除（まっさらに上書きするため）
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS profiles;

-- ============================================
-- 1. Profiles Table (ユーザープロフィール)
-- IDは認証連携と互換性を持たせるためUUIDにするかTEXTにするか。
-- 今回は柔軟性を確保するため、Googleログインや匿名など扱えるようにTEXTとするかUUIDとする。
-- Supabase Authと連携する場合は UUID が基本です。
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- auth.users.id と紐づく想定
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    height NUMERIC,
    weight NUMERIC,
    training_history TEXT,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 2. Posts Table (タイムライン投稿)
-- ============================================
CREATE TABLE posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    caption TEXT,
    tags TEXT[] DEFAULT '{}',
    purpose_tag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 3. Workouts Table (トレーニング記録)
-- ============================================
CREATE TABLE workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    exercise TEXT NOT NULL,
    weight_kg NUMERIC NOT NULL,
    reps INTEGER NOT NULL,
    sets INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 4. Comments Table (コメント集)
-- ============================================
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    at_seconds INTEGER, -- 動画の特定秒数へのコメント用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 5. Reactions Table (リアクション集)
-- ============================================
CREATE TABLE reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'helpful', 'want_to_try', 'effective'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id, type) -- 1投稿につき同じ種類のリアクションは1人1回まで
);

-- ============================================
-- Row Level Security (RLS) Settings
-- 今回はMVPテスト用として誰でも読み書き可能(Publicアクセス)にする最低限の設定
-- ※本番運用の際は auth.uid() を用いた厳密な制限に変更してください。
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON profiles FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON posts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON posts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON posts FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON workouts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON workouts FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON comments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON reactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON reactions FOR INSERT WITH CHECK (true);

-- ============================================
-- Trigger: Profile Creation on Signup
-- SupabaseのAuthにユーザーが登録された際、自動でprofilesテーブルにレコードを作成する
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (new.id, split_part(new.email, '@', 1), new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
