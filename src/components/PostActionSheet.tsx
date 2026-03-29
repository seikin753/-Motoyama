"use client";

import { useEffect } from "react";
import { X, Pencil, Trash2, Share2, Link, Flag } from "lucide-react";

interface PostActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  isOwner: boolean;
}

export function PostActionSheet({ isOpen, onClose, postId, isOwner }: PostActionSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Action Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out translate-y-0">
        <div className="bg-[#1c1c1e] rounded-t-3xl p-6 pb-10 border-t border-white/10 shadow-2xl max-w-md mx-auto">
          {/* Handle */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">アクション</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#2c2c2e] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* 編集 (Owner only) */}
            {isOwner && (
              <button
                onClick={() => {
                  console.log("編集", postId);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">編集</p>
                  <p className="text-sm text-gray-400">投稿を編集する</p>
                </div>
              </button>
            )}

            {/* 削除 (Owner only) */}
            {isOwner && (
              <button
                onClick={() => {
                  console.log("削除", postId);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">削除</p>
                  <p className="text-sm text-gray-400">投稿を削除する</p>
                </div>
              </button>
            )}

            {/* シェア */}
            <button
              onClick={() => {
                console.log("シェア", postId);
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">シェア</p>
                <p className="text-sm text-gray-400">投稿をシェアする</p>
              </div>
            </button>

            {/* リンクコピー */}
            <button
              onClick={() => {
                console.log("リンクコピー", postId);
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Link className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">リンクをコピー</p>
                <p className="text-sm text-gray-400">投稿リンクをコピー</p>
              </div>
            </button>

            {/* 報告 (Not owner only) */}
            {!isOwner && (
              <button
                onClick={() => {
                  console.log("報告", postId);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">報告</p>
                  <p className="text-sm text-gray-400">この投稿を報告する</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
