"use client";

import { MoreHorizontal, MessageCircle } from "lucide-react";

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
  onReaction: (type: string) => void;
  onToggleComments: () => void;
}

export default function PostCard({
  userName, avatarInitial, mediaUrl, mediaType, caption, tags, purposeTag,
  timeAgo, reactions, commentCount, onReaction, onToggleComments,
}: PostProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-pink-400/30">
            {avatarInitial}
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-900">{userName}</span>
            {purposeTag && (
              <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                {purposeTag}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">{timeAgo}</span>
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Media */}
      {mediaUrl && (
        <div className="w-full aspect-square bg-gray-50 relative">
          {mediaType?.startsWith("video") ? (
            <video controls src={mediaUrl} className="w-full h-full object-cover" />
          ) : (
            <img src={mediaUrl} alt="Workout" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          {reactions.map((r) => (
            <button
              key={r.type}
              onClick={() => onReaction(r.type)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all active:scale-90
                ${r.mine
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-500 hover:bg-gray-100"
                }`}
            >
              {r.type === "helpful" ? "🙏" : r.type === "want_to_try" ? "✨" : "🔥"}
              {r.count > 0 && <span className="text-xs">{r.count}</span>}
            </button>
          ))}
        </div>
        <button
          onClick={onToggleComments}
          className="flex items-center gap-1.5 px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          {commentCount > 0 && <span className="text-xs font-semibold">{commentCount}</span>}
        </button>
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold mr-1.5">{userName}</span>
            {caption}
          </p>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.map((t, i) => (
                <span key={i} className="text-xs text-blue-500 font-medium">#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
