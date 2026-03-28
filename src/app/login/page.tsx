"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex flex-col justify-center px-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black bg-gradient-to-r from-[#ff6b35] to-[#ff4757] bg-clip-text text-transparent mb-2">
          MuscleBoard
        </h1>
        <p className="text-[#8888a8] text-sm font-bold">成長を加速させるSNS</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-[#ff5252]/10 border border-[#ff5252]/30 text-[#ff5252] text-xs p-3 rounded-lg font-bold text-center">
            {error}
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-1 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#16162a] border border-white/5 rounded-xl p-4 text-sm font-bold focus:border-[#6c5ce7] outline-none transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-1 block">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#16162a] border border-white/5 rounded-xl p-4 text-sm font-bold focus:border-[#6c5ce7] outline-none transition-colors"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-4 space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-bold hover:shadow-[0_0_20px_rgba(108,92,231,0.4)] disabled:opacity-50 transition-all"
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-4 bg-transparent border border-white/10 rounded-xl font-bold hover:bg-white/5 disabled:opacity-50 transition-colors text-[#8888a8]"
          >
            新規登録
          </button>
        </div>
      </form>
    </div>
  );
}
