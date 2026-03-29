"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError("");

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      if (data.session) {
        router.push("/");
      } else {
        setError("確認メールを送信しました。メールをご確認ください。");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-white max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold italic tracking-tighter text-gray-900 mb-1">
          MuscleBoard
        </h1>
        <p className="text-gray-500 text-sm">成長を加速させるSNS</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-medium text-center">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">メールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">パスワード</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-4 bg-white border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            新規登録
          </button>
        </div>
      </form>
    </div>
  );
}
