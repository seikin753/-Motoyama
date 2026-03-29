"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Settings, Trophy, LogOut, ChevronRight } from "lucide-react";

type PR = { exercise: string; weight_kg: number; reps: number; estimated1RM: number };
type WeightPoint = { date: string; value: number };

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [trainingHistory, setTrainingHistory] = useState("");
  const [totalPoints, setTotalPoints] = useState(0);
  const [email, setEmail] = useState("");
  const [prs, setPrs] = useState<PR[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightPoint[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    loadProfile();
    loadPRs();
    loadWeightHistory();
  }, [user]);

  async function loadProfile() {
    const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
    if (data) {
      setDisplayName(data.display_name || "");
      setHeight(data.height ? String(data.height) : "");
      setWeight(data.weight ? String(data.weight) : "");
      setTrainingHistory(data.training_history || "");
      setTotalPoints(data.total_points || 0);
    }
  }

  async function loadPRs() {
    const { data } = await supabase.from("workouts").select("exercise, weight_kg, reps").eq("user_id", user!.id);
    if (!data) return;
    const prMap: Record<string, PR> = {};
    data.forEach(w => {
      const est = w.weight_kg * (1 + w.reps / 30);
      if (!prMap[w.exercise] || est > prMap[w.exercise].estimated1RM) {
        prMap[w.exercise] = { exercise: w.exercise, weight_kg: w.weight_kg, reps: w.reps, estimated1RM: Math.round(est * 10) / 10 };
      }
    });
    setPrs(Object.values(prMap));
  }

  async function loadWeightHistory() {
    const { data } = await supabase.from("workouts").select("date, body_weight").eq("user_id", user!.id).not("body_weight", "is", null).order("date");
    if (!data) return;
    const map: Record<string, number> = {};
    data.forEach(w => { if (w.body_weight) map[w.date] = Number(w.body_weight); });
    setWeightHistory(Object.entries(map).map(([date, value]) => ({ date, value })));
  }

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      training_history: trainingHistory,
    }).eq("id", user!.id);
    if (error) showToast("更新に失敗しました");
    else showToast("プロフィールを更新しました！✨");
    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const maxW = weightHistory.length > 0 ? Math.max(...weightHistory.map(w => w.value)) : 0;
  const minW = weightHistory.length > 0 ? Math.min(...weightHistory.map(w => w.value)) : 0;
  const range = maxW - minW || 1;

  return (
    <div className="p-4 space-y-4">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white rounded-full px-5 py-2.5 text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-3 ring-4 ring-purple-500/20">
          {(displayName || "?")[0].toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{displayName || "匿名"}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{email}</p>
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-orange-50 rounded-full">
          <span className="text-sm">🔥</span>
          <span className="text-sm font-bold text-orange-600">{totalPoints} pt</span>
        </div>
      </div>

      {/* Profile Edit */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">プロフィール編集</h3>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">表示名</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">身長 (cm)</label>
              <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">体重 (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} step="0.1"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">トレーニング歴</label>
            <select value={trainingHistory} onChange={e => setTrainingHistory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-400 outline-none bg-white">
              <option value="">選択...</option>
              {["未経験", "〜3ヶ月", "3ヶ月〜1年", "1年〜3年", "3年以上"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all">
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>

      {/* Weight History */}
      {weightHistory.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 体重推移</h3>
          <div className="h-32 flex items-end gap-px">
            {weightHistory.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[8px] text-gray-400">{w.value}</div>
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                  style={{ height: `${Math.max(8, ((w.value - minW) / range) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-400">{weightHistory[0]?.date}</span>
            <span className="text-[9px] text-gray-400">{weightHistory[weightHistory.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* PRs */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-gray-900">自己ベスト</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {prs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">まだ記録がありません</p>
          ) : (
            prs.map((pr, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-gray-800">{pr.exercise}</span>
                <div className="text-sm text-right">
                  <span className="text-blue-600 font-semibold">{pr.weight_kg}kg × {pr.reps}回</span>
                  <span className="text-gray-400 ml-2 text-xs">(1RM: {pr.estimated1RM}kg)</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Logout */}
      <button onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
        <LogOut className="w-4 h-4" /> ログアウト
      </button>
    </div>
  );
}
