"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function Timeline() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      // 投稿と作成者のプロフィール、リアクション数、コメント数を取得
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(display_name, avatar_url),
          reactions(count),
          comments(count)
        `)
        .order('created_at', { ascending: false });
        
      if (data) setPosts(data);
      setLoading(false);
    }
    loadPosts();
  }, []);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return d.toLocaleDateString();
  };

  const playVideo = (id: string, url: string) => {
    const container = document.getElementById(`media-${id}`);
    if (container) {
      container.innerHTML = `<video src="${url}" controls autoPlay playsInline class="w-full h-full object-cover"></video>`;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#6c5ce7] border-t-transparent animate-spin rounded-full"></div></div>;
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">タイムライン</h2>
        <button className="text-xs font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10">
          投稿する
        </button>
      </div>
      
      {posts.length === 0 && (
        <div className="text-center py-10 text-[#555570] text-sm font-bold">
          まだ投稿がありません
        </div>
      )}

      {posts.map(post => (
        <div key={post.id} className="bg-[#1a1a2e] border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center font-bold text-xs overflow-hidden">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                post.profiles?.display_name?.charAt(0) || "U"
              )}
            </div>
            <div>
              <p className="text-sm font-bold">{post.profiles?.display_name || "Unknown User"}</p>
              <p className="text-[10px] text-[#555570]">{formatTime(post.created_at)}</p>
            </div>
          </div>
          
          <div id={`media-${post.id}`} className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer" onClick={() => post.media_url && playVideo(post.id, post.media_url)}>
            {post.media_url ? (
              <>
                <div className="absolute inset-0 bg-cover bg-center opacity-50 blur-sm" style={{ backgroundImage: `url(${post.media_url}#t=1)` }}></div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff4757] flex items-center justify-center shadow-[0_4px_16px_rgba(255,107,53,0.3)]">
                    <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[12px] border-l-white ml-1"></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[#555570] text-xs">メディアなし</div>
            )}
          </div>

          <div className="p-4">
            <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.caption}</p>
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <button className="flex items-center gap-1.5 text-xs text-[#8888a8] hover:text-[#ff6b35] transition-colors">
                🔥 <span className="font-bold">{post.reactions?.[0]?.count || 0}</span>
              </button>
              <button className="flex items-center gap-1.5 text-xs text-[#8888a8] hover:text-[#a29bfe] transition-colors">
                💬 <span className="font-bold">{post.comments?.[0]?.count || 0}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

