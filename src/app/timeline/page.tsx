"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Post = {
  id: string; user_id: string; media_url: string | null; media_type: string | null;
  caption: string; tags: string[]; purpose_tag: string; created_at: string;
  profiles: { display_name: string }; is_private: boolean;
  reactions: { type: string; user_id: string }[];
  comments: { id: string }[];
};
type Comment = { id: string; user_id: string; display_name: string; message: string; at_seconds: number; created_at: string };

export default function TimelinePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, Comment[]>>({});
  const [toast, setToast] = useState("");

  useEffect(() => { loadTimeline(); }, []);

  async function loadTimeline() {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*, profiles(display_name), reactions(type, user_id), comments(id)")
      .eq("is_private", false)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setPosts(data as any);
    setLoading(false);
  }

  async function toggleReaction(postId: string, type: string) {
    if (!user) return;
    const existing = await supabase.from("reactions").select("id").eq("post_id", postId).eq("user_id", user.id).eq("type", type);
    if (existing.data && existing.data.length > 0) {
      await supabase.from("reactions").delete().eq("id", existing.data[0].id);
      await supabase.from("profiles").update({ total_points: (await getPoints()) - 10 }).eq("id", user.id);
    } else {
      await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, type });
      await supabase.from("profiles").update({ total_points: (await getPoints()) + 10 }).eq("id", user.id);
    }
    loadTimeline();
  }

  async function getPoints() {
    const { data } = await supabase.from("profiles").select("total_points").eq("id", user!.id).single();
    return data?.total_points || 0;
  }

  async function toggleComments(postId: string) {
    if (openComments[postId]) {
      const copy = { ...openComments }; delete copy[postId]; setOpenComments(copy); return;
    }
    const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at");
    setOpenComments({ ...openComments, [postId]: data || [] });
  }

  async function addComment(postId: string, message: string) {
    if (!user || !message.trim()) return;
    const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
    await supabase.from("comments").insert({
      post_id: postId, user_id: user.id, display_name: prof?.display_name || "匿名", message: message.trim(), at_seconds: 0,
    });
    await supabase.from("profiles").update({ total_points: (await getPoints()) + 10 }).eq("id", user.id);
    toggleComments(postId); // close
    setTimeout(() => toggleComments(postId), 100); // reopen with new data
    showToast("コメントしました！");
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "たった今";
    if (diff < 3600) return Math.floor(diff / 60) + "分前";
    if (diff < 86400) return Math.floor(diff / 3600) + "時間前";
    if (diff < 604800) return Math.floor(diff / 86400) + "日前";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  }

  if (loading) {
    return <div className="flex items-center justify-center h-60"><div className="animate-spin w-8 h-8 border-2 border-[#a29bfe] border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2d2d4a] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold shadow-lg">{toast}</div>}

      {/* Post Button */}
      <button onClick={() => setShowModal(true)} className="w-full py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(108,92,231,0.4)] transition-all">
        📹 投稿する
      </button>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">💪</div>
          <p className="text-[#8888a8] text-sm">まだ投稿がありません</p>
          <button onClick={() => setShowModal(true)} className="mt-3 px-6 py-2 bg-gradient-to-r from-[#ff6b35] to-[#ff4757] rounded-lg text-sm font-bold">📹 投稿する</button>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="bg-[#16162a] border border-white/5 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] rounded-full flex items-center justify-center text-xs font-bold">
                {(post.profiles?.display_name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{post.profiles?.display_name || "匿名"}</div>
                <div className="text-[10px] text-[#555570]">{timeAgo(post.created_at)}</div>
              </div>
              {post.purpose_tag && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${post.purpose_tag === "重量UP" ? "bg-[#ff6b35]/20 text-[#ff6b35]" : "bg-[#a29bfe]/20 text-[#a29bfe]"}`}>
                  {post.purpose_tag}
                </span>
              )}
            </div>

            {/* Media */}
            {post.media_url && (
              <div className="aspect-video bg-black">
                {post.media_type?.startsWith("video") ? (
                  <video controls src={post.media_url} className="w-full h-full object-contain" />
                ) : (
                  <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {/* Caption */}
            {post.caption && (
              <div className="px-3 py-2">
                <p className="text-sm">{post.caption}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.tags.map((t, i) => <span key={i} className="text-[10px] text-[#a29bfe]">#{t}</span>)}
                  </div>
                )}
              </div>
            )}

            {/* Reactions */}
            <div className="px-3 py-2 flex items-center gap-2 border-t border-white/5">
              {[{ type: "helpful", emoji: "🙏" }, { type: "want_to_try", emoji: "✨" }, { type: "effective", emoji: "🔥" }].map(r => {
                const count = post.reactions?.filter(rx => rx.type === r.type).length || 0;
                const myReaction = post.reactions?.some(rx => rx.type === r.type && rx.user_id === user?.id);
                return (
                  <button key={r.type} onClick={() => toggleReaction(post.id, r.type)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${myReaction ? "bg-[#a29bfe]/20 text-[#a29bfe]" : "text-[#555570] hover:bg-white/5"}`}>
                    {r.emoji} <span>{count}</span>
                  </button>
                );
              })}
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#555570] hover:bg-white/5 ml-auto">
                💬 {post.comments?.length || 0}
              </button>
            </div>

            {/* Comments Section */}
            {openComments[post.id] && (
              <div className="px-3 pb-3 border-t border-white/5">
                <div className="py-2 space-y-2">
                  {openComments[post.id].length === 0 ? (
                    <p className="text-xs text-[#555570]">コメントはまだありません</p>
                  ) : (
                    openComments[post.id].map(c => (
                      <div key={c.id} className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-[#2d2d4a] rounded-full flex items-center justify-center text-[8px] font-bold mt-0.5">
                          {(c.display_name || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-[#a29bfe]">{c.display_name || "匿名"}</span>
                          <p className="text-xs">{c.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <CommentInput onSubmit={(msg) => addComment(post.id, msg)} />
              </div>
            )}
          </div>
        ))
      )}

      {/* Post Modal */}
      {showModal && <PostModal onClose={() => { setShowModal(false); loadTimeline(); }} user={user} showToast={showToast} />}
    </div>
  );
}

function CommentInput({ onSubmit }: { onSubmit: (msg: string) => void }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="flex gap-2">
      <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="コメントを入力..."
        onKeyDown={e => { if (e.key === "Enter") { onSubmit(msg); setMsg(""); } }}
        className="flex-1 bg-[#0a0a0f] border border-white/5 rounded-lg px-3 py-2 text-xs focus:border-[#6c5ce7] outline-none" />
      <button onClick={() => { onSubmit(msg); setMsg(""); }} className="px-3 py-2 bg-[#6c5ce7] rounded-lg text-xs font-bold">送信</button>
    </div>
  );
}

function PostModal({ onClose, user, showToast }: { onClose: () => void; user: any; showToast: (m: string) => void }) {
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [purpose, setPurpose] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type.startsWith("video") && f.size > 50 * 1024 * 1024) { showToast("動画は50MBまでです"); return; }
    if (f.type.startsWith("image") && f.size > 5 * 1024 * 1024) { showToast("画像は5MBまでです"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!caption && !file) { showToast("テキストまたはメディアを追加してください"); return; }
    if (!user) return;
    setSubmitting(true); setProgress(30);

    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      setProgress(60);
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) { showToast("アップロード失敗: " + error.message); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      mediaUrl = urlData.publicUrl;
      mediaType = file.type;
      setProgress(90);
    }

    const tagArr = tags ? tags.split(/[,、\s]+/).filter(Boolean) : [];
    const { error } = await supabase.from("posts").insert({
      user_id: user.id, media_url: mediaUrl, media_type: mediaType,
      caption, tags: tagArr, purpose_tag: purpose, is_private: false,
    });

    if (error) { showToast("投稿に失敗しました"); }
    else {
      // Add 20 points
      const { data: prof } = await supabase.from("profiles").select("total_points").eq("id", user.id).single();
      await supabase.from("profiles").update({ total_points: (prof?.total_points || 0) + 20 }).eq("id", user.id);
      setProgress(100);
      showToast("投稿しました！🔥");
      onClose();
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#16162a] w-full max-w-[480px] rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">📹 新規投稿</h3>
          <button onClick={onClose} className="text-[#555570] text-xl">✕</button>
        </div>

        {/* Upload Area */}
        {!preview ? (
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-[#a29bfe]/30 transition-colors">
            <div className="text-3xl mb-2">📁</div>
            <p className="text-xs text-[#8888a8]">タップして画像・動画を選択</p>
            <p className="text-[10px] text-[#555570] mt-1">画像5MB / 動画50MBまで</p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden mb-3">
            {file?.type.startsWith("video") ? (
              <video controls src={preview} className="w-full max-h-48 object-contain bg-black" />
            ) : (
              <img src={preview} alt="" className="w-full max-h-48 object-cover" />
            )}
            <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 bg-black/50 rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />

        {/* Caption */}
        <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="キャプションを入力..."
          className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm mt-3 h-20 resize-none focus:border-[#6c5ce7] outline-none" />

        {/* Tags */}
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="タグ（カンマ区切り）"
          className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm mt-2 focus:border-[#6c5ce7] outline-none" />

        {/* Purpose */}
        <select value={purpose} onChange={e => setPurpose(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm mt-2 focus:border-[#6c5ce7] outline-none">
          <option value="">目的タグ（任意）</option>
          <option value="重量UP">重量UP</option>
          <option value="フォーム確認">フォーム確認</option>
          <option value="成長記録">成長記録</option>
          <option value="質問">質問</option>
        </select>

        {/* Progress */}
        {progress > 0 && progress < 100 && (
          <div className="mt-3 h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Submit */}
        <button onClick={submit} disabled={submitting}
          className="w-full mt-3 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-bold text-sm disabled:opacity-50 transition-all">
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </div>
    </div>
  );
}
