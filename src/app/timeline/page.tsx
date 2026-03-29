"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import PostCard from "@/components/PostCard";
import { PlusSquare, X, Send, Image as ImageIcon, Heart } from "lucide-react";

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
    if (diff < 3600) return Math.floor(diff / 60) + "分";
    if (diff < 86400) return Math.floor(diff / 3600) + "時間";
    if (diff < 604800) return Math.floor(diff / 86400) + "日";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-[3px] border-gray-300 border-t-gray-800 rounded-full" /></div>;
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-14 left-0 right-0 z-[60] flex justify-center p-4 pointer-events-none">
          <div className="bg-gray-900 text-white rounded-lg px-4 py-3 text-sm font-semibold shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* New Post Button (Floating) */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 z-[40] w-14 h-14 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
      >
        <PlusSquare className="w-6 h-6" />
      </button>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-24 h-24 border-2 border-gray-900 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-gray-900" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">投稿がありません</h2>
          <p className="text-sm text-gray-500 mb-6">日々のトレーニングの成長をアプリで記録して、ここにシェアしましょう。</p>
          <button 
            onClick={() => setShowModal(true)}
            className="text-sm font-semibold text-[#0095f6] hover:text-[#1877f2]"
          >
            最初の投稿をする
          </button>
        </div>
      ) : (
        <div className="pb-10">
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
                  postId={post.id}
                  isOwner={post.user_id === user?.id}
                  onReaction={(type) => toggleReaction(post.id, type)}
                  onToggleComments={() => toggleComments(post.id)}
                />

                {/* Comments Section (inline) */}
                {openComments[post.id] && (
                  <div className="bg-white px-4 py-3 border-b border-gray-200/60 pb-4">
                    {openComments[post.id].length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">コメントはまだありません</p>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {openComments[post.id].map(c => (
                          <div key={c.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
                              {(c.display_name || "?")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 mt-0.5">
                              <p className="text-[13px] leading-tight text-gray-900">
                                <span className="font-semibold mr-1.5">{c.display_name || "匿名"}</span>
                                {c.message}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-900">返信</button>
                              </div>
                            </div>
                            <button className="pt-1"><Heart className="w-3 h-3 text-gray-400" /></button>
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
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
      <input 
        value={msg} 
        onChange={e => setMsg(e.target.value)} 
        placeholder="コメントを追加..."
        onKeyDown={e => { if (e.key === "Enter") { onSubmit(msg); setMsg(""); } }}
        className="flex-1 bg-white border-0 text-[13px] placeholder:text-gray-400 focus:ring-0 outline-none" 
      />
      <button 
        onClick={() => { onSubmit(msg); setMsg(""); }}
        disabled={!msg.trim()}
        className="text-[#0095f6] text-[13px] font-semibold disabled:opacity-50"
      >
        投稿する
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
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-slide-up max-w-md mx-auto relative">
      {/* Header */}
      <div className="flex justify-between items-center h-12 px-4 border-b border-gray-200/60 bg-white">
        <button onClick={onClose} className="p-1 -ml-1 hover:opacity-50">
          <X className="w-7 h-7 text-gray-900" />
        </button>
        <h3 className="text-base font-bold text-gray-900">新規投稿</h3>
        <button onClick={submit} disabled={submitting} className="text-[#0095f6] font-semibold text-[15px] disabled:opacity-50">
          {submitting ? "シェア中..." : "シェア"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {/* Progress */}
        {progress > 0 && progress < 100 && (
          <div className="h-0.5 bg-gray-100 w-full">
            <div className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Upload Area */}
        <div className="p-4 border-b border-gray-200/60">
          <div className="flex gap-4">
            <div className="w-[60px] h-[60px] bg-gray-100 rounded-lg shrink-0 overflow-hidden relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              {!preview ? (
                <div className="w-full h-full flex flex-col items-center justify-center border border-gray-200 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              ) : (
                <>
                  {file?.type.startsWith("video") ? (
                    <video src={preview} className="w-full h-full object-cover" />
                  ) : (
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4 text-white drop-shadow-md" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }} />
                  </div>
                </>
              )}
            </div>
            <textarea 
              value={caption} 
              onChange={e => setCaption(e.target.value)} 
              placeholder="キャプションを入力..."
              className="flex-1 bg-transparent border-none text-[15px] placeholder:text-gray-400 focus:ring-0 outline-none resize-none pt-1" 
              rows={3}
            />
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
        </div>

        {/* Settings Links */}
        <div className="divide-y divide-gray-200/60 border-b border-gray-200/60">
          <div className="px-4 py-3.5">
            <input 
              value={tags} 
              onChange={e => setTags(e.target.value)} 
              placeholder="タグ（カンマ区切り）"
              className="w-full bg-transparent border-none text-[15px] placeholder:text-gray-900 focus:ring-0 outline-none" 
            />
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <span className="text-[15px] text-gray-900">目的タグ（任意）</span>
            <select 
              value={purpose} 
              onChange={e => setPurpose(e.target.value)}
              className="bg-transparent border-none text-[15px] text-gray-500 focus:ring-0 outline-none text-right appearance-none"
            >
              <option value="">設定しない</option>
              <option value="重量UP">重量UP</option>
              <option value="フォーム確認">フォーム確認</option>
              <option value="成長記録">成長記録</option>
              <option value="質問">質問</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
