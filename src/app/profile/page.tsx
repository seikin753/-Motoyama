"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      // プロフィールの取得
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      
      if (profData) setProfile(profData);

      // 投稿数の取得
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);
        
      if (count) setPostCount(count);
      
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#6c5ce7] border-t-transparent animate-spin rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">マイページ</h2>
        <button onClick={handleLogout} className="text-xs text-[#ff5252] font-bold px-3 py-1 bg-[#ff5252]/10 rounded-lg">ログアウト</button>
      </div>

      <div className="flex flex-col items-center py-4 space-y-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-4xl font-black border-4 border-[#16162a] shadow-xl overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            profile?.display_name?.charAt(0) || "U"
          )}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">{profile?.display_name || "名無しユーザー"}</h2>
          <p className="text-xs text-[#555570]">{profile?.training_history || "トレーニング歴未設定"}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#16162a] border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-[8px] text-[#555570] font-bold uppercase mb-1">Posts</p>
          <p className="text-lg font-black">{postCount}</p>
        </div>
        <div className="bg-[#16162a] border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-[8px] text-[#555570] font-bold uppercase mb-1">Followers</p>
          <p className="text-lg font-black">0</p>
        </div>
        <div className="bg-[#16162a] border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-[8px] text-[#555570] font-bold uppercase mb-1">Points</p>
          <p className="text-lg font-black text-[#ff6b35]">{profile?.total_points || 0}</p>
        </div>
      </div>

      <section className="bg-[#16162a] border border-white/5 rounded-2xl p-6">
        <h3 className="text-[#8888a8] text-xs font-bold uppercase tracking-widest mb-6">フィジカルデータ</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] text-[#555570] font-bold uppercase">身長</p>
            <p className="font-black text-xl">{profile?.height || "-" } <span className="text-[10px] text-[#555570]">cm</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-[#555570] font-bold uppercase">体重</p>
            <p className="font-black text-xl">{profile?.weight || "-" } <span className="text-[10px] text-[#555570]">kg</span></p>
          </div>
        </div>
      </section>

      <button className="w-full py-4 border border-white/10 rounded-xl text-sm font-bold text-[#8888a8] hover:bg-white/[0.02]">
        プロフィールを編集
      </button>
    </div>
  );
}

