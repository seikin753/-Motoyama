"use client";
import { Icons } from "@/components/icons";

export default function Timeline() {
  const posts = [
    { id: 1, user: "Tomo", caption: "今日のベンチプレス。フォームチェックお願いします！", video: true, reactions: 12, comments: 4, time: "2時間前" },
    { id: 2, user: "Ken", caption: "背中の日。デッドリフト150kg達成！", video: false, reactions: 24, comments: 2, time: "5時間前" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">タイムライン</h2>
      
      {posts.map(post => (
        <div key={post.id} className="bg-[#1a1a2e] border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center font-bold text-xs">
              {post.user[0]}
            </div>
            <div>
              <p className="text-sm font-bold">{post.user}</p>
              <p className="text-[10px] text-[#555570]">{post.time}</p>
            </div>
          </div>
          
          <div className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer">
            {post.video ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#ff6b35] flex items-center justify-center shadow-[0_4px_16px_rgba(255,107,53,0.3)]">
                  <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[12px] border-l-white ml-1"></div>
                </div>
              </div>
            ) : (
              <div className="text-[#555570] text-xs">画像はまだありません</div>
            )}
          </div>

          <div className="p-4">
            <p className="text-sm leading-relaxed mb-4">{post.caption}</p>
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <button className="flex items-center gap-1.5 text-xs text-[#8888a8] hover:text-[#ff6b35] transition-colors">
                🔥 <span className="font-bold">{post.reactions}</span>
              </button>
              <button className="flex items-center gap-1.5 text-xs text-[#8888a8] hover:text-[#a29bfe] transition-colors">
                💬 <span className="font-bold">{post.comments}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
