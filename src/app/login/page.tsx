"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("ログインに失敗しました。パスワードをご確認ください。");
      else router.push("/");
    } else {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else if (data.session) router.push("/");
      else setError("確認メールを送信しました。メールをご確認ください。");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-white max-w-md mx-auto relative pb-20">
      <div className="w-full max-w-[350px]">
        {/* Logo */}
        <div className="text-center mb-10 mt-8">
          <h1 
            className="text-4xl font-bold tracking-tight text-gray-900 mb-2" 
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            MuscleBoard
          </h1>
          <p className="text-gray-500 text-sm font-medium">友達と筋トレの成長をシェアしよう</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          {error && (
            <div className="bg-red-50 text-red-500 text-xs p-3 rounded-sm font-medium text-center border border-red-100">
              {error}
            </div>
          )}

          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-[3px] px-3 py-2.5 text-sm focus:border-gray-400 outline-none transition-colors placeholder:text-gray-400"
              placeholder="メールアドレス"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-[3px] px-3 py-2.5 text-sm focus:border-gray-400 outline-none transition-colors placeholder:text-gray-400"
              placeholder="パスワード"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-[8px] font-semibold text-sm disabled:opacity-70 transition-colors"
            >
              {loading ? "処理中..." : isLoginView ? "ログイン" : "登録してはじめる"}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm font-semibold text-gray-500">または</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Sub-actions */}
        {isLoginView && (
          <div className="text-center">
            <button className="text-xs text-[#00376b] hover:text-[#001d38] transition-colors">
              パスワードを忘れた場合
            </button>
          </div>
        )}
      </div>

      {/* Footer Switch */}
      <div className="absolute bottom-10 left-0 right-0 max-w-md mx-auto px-6">
        <div className="border border-gray-300 py-4 text-center text-sm rounded-sm">
          {isLoginView ? (
            <p className="text-gray-900">
              アカウントをお持ちでないですか？{" "}
              <button 
                onClick={() => { setIsLoginView(false); setError(""); }} 
                className="text-[#0095f6] font-semibold hover:text-[#1877f2]"
              >
                登録する
              </button>
            </p>
          ) : (
            <p className="text-gray-900">
              アカウントをお持ちですか？{" "}
              <button 
                onClick={() => { setIsLoginView(true); setError(""); }} 
                className="text-[#0095f6] font-semibold hover:text-[#1877f2]"
              >
                ログインする
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
