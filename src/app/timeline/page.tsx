"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import PostCard from "@/components/PostCard";
import { Camera, X, Send } from "lucide-react";

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
    toggleComments(postId);
    setTimeout(() => toggleComments(postId), 100);
    showToastMsg("コメントしました！");
  }

  function showToastMsg(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "たった今";
    if (diff < 3600) return Math.floor(diff / 60) + "分前";
    if (diff < 86400) return Math.floor(diff / 3600) + "時間前";
    if (diff < 604800) return Math.floor(diff / 86400) + "日前";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  }

  if (loading) {
    return <div className="flex items-center justify-center h-60"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white rounded-full px-5 py-2.5 text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}

      {/* Post Button */}
      <div className="p-4">
        <button onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all">
          <Camera className="w-4 h-4" /> 新規投稿
        </button>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📸</div>
          <p className="text-gray-500 text-sm">まだ投稿がありません</p>
          <p className="text-gray-400 text-xs mt-1">トレーニング動画を共有しよう！</p>
        </div>
      ) : (
        <div>
          {posts.map(post => {
            const reactionData = [
              { type: "helpful", count: post.reactions?.filter(rx => rx.type === "helpful").length || 0, mine: post.reactions?.some(rx => rx.type === "helpful" && rx.user_id === user?.id) || false },
              { type: "want_to_try", count: post.reactions?.filter(rx => rx.type === "want_to_try").length || 0, mine: post.reactions?.some(rx => rx.type === "want_to_try" && rx.user_id === user?.id) || false },
              { type: "effective", count: post.reactions?.filter(rx => rx.type === "effective").length || 0, mine: post.reactions?.some(rx => rx.type === "effective" && rx.user_id === user?.id) || false },
            ];

            return (
              <div key={post.id}>
                <PostCard
                  userName={post.profiles?.display_name || "匿名"}
                  avatarInitial={(post.profiles?.display_name || "?")[0].toUpperCase()}
                  mediaUrl={post.media_url}
                  mediaType={post.media_type}
                  caption={post.caption}
                  tags={post.tags || []}
                  purposeTag={post.purpose_tag}
                  timeAgo={timeAgo(post.created_at)}
                  reactions={reactionData}
                  commentCount={post.comments?.length || 0}
                  onReaction={(type) => toggleReaction(post.id, type)}
                  onToggleComments={() => toggleComments(post.id)}
                />

                {/* Comments Section (inline) */}
                {openComments[post.id] && (
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
                    {openComments[post.id].length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">コメントはまだありません</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {openComments[post.id].map(c => (
                          <div key={c.id} className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600 mt-0.5">
                              {(c.display_name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-gray-900">{c.display_name || "匿名"}</span>
                              <p className="text-xs text-gray-700">{c.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <CommentInput onSubmit={(msg) => addComment(post.id, msg)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Post Modal */}
      {showModal && <PostModal onClose={() => { setShowModal(false); loadTimeline(); }} user={user} showToast={showToastMsg} />}
    </div>
  );
}

function CommentInput({ onSubmit }: { onSubmit: (msg: string) => void }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="flex gap-2">
      <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="コメントを入力..."
        onKeyDown={e => { if (e.key === "Enter") { onSubmit(msg); setMsg(""); } }}
        className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all" />
      <button onClick={() => { onSubmit(msg); setMsg(""); }}
        className="w-8 h-8 flex items-center justify-center bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors">
        <Send className="w-3.5 h-3.5" />
      </button>
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
      const { data: prof } = await supabase.from("profiles").select("total_points").eq("id", user.id).single();
      await supabase.from("profiles").update({ total_points: (prof?.total_points || 0) + 20 }).eq("id", user.id);
      setProgress(100);
      showToast("投稿しました！🔥");
      onClose();
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-md rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-900">新規投稿</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Upload Area */}
        {!preview ? (
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">タップして画像・動画を選択</p>
            <p className="text-xs text-gray-400 mt-1">画像5MB / 動画50MBまで</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden mb-4">
            {file?.type.startsWith("video") ? (
              <video controls src={preview} className="w-full max-h-52 object-contain bg-gray-100 rounded-2xl" />
            ) : (
              <img src={preview} alt="" className="w-full max-h-52 object-cover rounded-2xl" />
            )}
            <button onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />

        {/* Caption */}
        <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="キャプションを入力..."
          className="w-full border border-gray-200 rounded-xl p-3 text-sm mt-4 h-20 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all" />

        {/* Tags */}
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="タグ（カンマ区切り）"
          className="w-full border border-gray-200 rounded-xl p-3 text-sm mt-3 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all" />

        {/* Purpose */}
        <select value={purpose} onChange={e => setPurpose(e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm mt-3 focus:border-blue-400 outline-none bg-white">
          <option value="">目的タグ（任意）</option>
          <option value="重量UP">重量UP</option>
          <option value="フォーム確認">フォーム確認</option>
          <option value="成長記録">成長記録</option>
          <option value="質問">質問</option>
        </select>

        {/* Progress */}
        {progress > 0 && progress < 100 && (
          <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Submit */}
        <button onClick={submit} disabled={submitting}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20">
          {submitting ? "投稿中..." : "シェアする"}
        </button>
      </div>
    </div>
  );
}
