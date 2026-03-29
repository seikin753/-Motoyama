"use client";

import { useState } from "react";
import { MoreHorizontal, MessageCircle, Heart, Bookmark, Send } from "lucide-react";
import { PostActionSheet } from "./PostActionSheet";

interface PostProps {
  userName: string;
  avatarInitial: string;
  mediaUrl: string | null;
  mediaType: string | null;
  caption: string;
  tags: string[];
  purposeTag: string;
  timeAgo: string;
  reactions: { type: string; count: number; mine: boolean }[];
  commentCount: number;
  postId: string;
  isOwner: boolean;
  onReaction: (type: string) => void;
  onToggleComments: () => void;
}

export default function PostCard({
  userName, avatarInitial, mediaUrl, mediaType, caption, tags, purposeTag,
  timeAgo, reactions, commentCount, postId, isOwner, onReaction, onToggleComments,
}: PostProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);
  
  // Map our custom reactions to Instagram-like interactions
  const helpful = reactions.find(r => r.type === "helpful");
  const effect = reactions.find(r => r.type === "effective");
  const tryIt = reactions.find(r => r.type === "want_to_try");

  return (
    <div className="bg-white border-b border-gray-200/60 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[1.5px]">
            <div className="w-full h-full bg-white rounded-full border border-white flex items-center justify-center text-gray-900 text-xs font-bold leading-none">
              {avatarInitial}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 line-clamp-1">
              <span className="font-semibold text-[13px] text-gray-900">{userName}</span>
              <span className="text-gray-400 text-[13px]">·</span>
              <span className="text-[13px] text-gray-500">{timeAgo}</span>
            </div>
            {purposeTag && (
              <span className="text-[10px] text-blue-500 font-medium">
                {purposeTag}
              </span>
            )}
          </div>
        </div>
        <button 
          className="p-1.5 hover:opacity-50 transition-opacity"
          onClick={() => setShowActionSheet(true)}
        >
          <MoreHorizontal className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {/* Media */}
      {mediaUrl && (
        <div className="w-full aspect-square bg-gray-100 relative max-h-[500px] overflow-hidden">
          {mediaType?.startsWith("video") ? (
            <video controls src={mediaUrl} className="w-full h-full object-cover" />
          ) : (
            <img src={mediaUrl} alt="Post media" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {/* Action Bar (Instagram style icons) */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onReaction("helpful")} 
            className="hover:opacity-50 transition-opacity flex items-center gap-1"
          >
            <Heart className={`w-6 h-6 ${helpful?.mine ? "fill-red-500 text-red-500" : "text-gray-900"}`} />
            {helpful && helpful.count > 0 && <span className="text-xs font-semibold">{helpful.count}</span>}
          </button>
          <button 
            onClick={onToggleComments} 
            className="hover:opacity-50 transition-opacity flex items-center gap-1"
          >
            <MessageCircle className="w-6 h-6 text-gray-900" />
            {commentCount > 0 && <span className="text-xs font-semibold">{commentCount}</span>}
          </button>
          <button 
            onClick={() => onReaction("effective")} 
            className="hover:opacity-50 transition-opacity flex items-center gap-1"
          >
            <Send className={`w-6 h-6 ${effect?.mine ? "fill-blue-500 text-blue-500" : "text-gray-900"}`} />
          </button>
        </div>
        <button 
          onClick={() => onReaction("want_to_try")} 
          className="hover:opacity-50 transition-opacity"
        >
          <Bookmark className={`w-6 h-6 ${tryIt?.mine ? "fill-gray-900 text-gray-900" : "text-gray-900"}`} />
        </button>
      </div>

      {/* Caption & Likes Summary */}
      <div className="px-3 pb-2 space-y-1">
        {/* Total Likes/Reactions summary */}
        {((helpful?.count || 0) + (effect?.count || 0) + (tryIt?.count || 0)) > 0 && (
          <p className="text-[13px] font-semibold text-gray-900">
            {((helpful?.count || 0) + (effect?.count || 0) + (tryIt?.count || 0))}件のリアクション
          </p>
        )}
        
        {caption && (
          <p className="text-[13px] leading-[18px] text-gray-900">
            <span className="font-semibold mr-1.5">{userName}</span>
            {caption}
          </p>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {tags.map((t, i) => (
              <span key={i} className="text-[13px] text-blue-900 cursor-pointer hover:underline">#{t}</span>
            ))}
          </div>
        )}

        {commentCount > 0 && (
          <button onClick={onToggleComments} className="text-[13px] text-gray-500 mt-1 hover:opacity-75">
            コメント{commentCount}件をすべて見る
          </button>
        )}
      </div>

      {/* Post Action Sheet */}
      <PostActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        postId={postId}
        isOwner={isOwner}
      />
    </div>
  );
}
