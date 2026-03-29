"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

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
    else showToast("プロフィールを更新しました！");
    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  // Simple inline chart
  const maxW = weightHistory.length > 0 ? Math.max(...weightHistory.map(w => w.value)) : 0;
  const minW = weightHistory.length > 0 ? Math.min(...weightHistory.map(w => w.value)) : 0;
  const range = maxW - minW || 1;

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2d2d4a] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold shadow-lg">{toast}</div>}

      {/* Profile Card */}
      <div className="bg-[#16162a] border border-white/5 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
          {(displayName || "?")[0].toUpperCase()}
        </div>
        <h2 className="text-lg font-bold">{displayName || "匿名"}</h2>
        <p className="text-xs text-[#555570]">{email}</p>
        <p className="text-sm text-[#ff6b35] font-bold mt-1">🔥 {totalPoints} ポイント</p>
      </div>

      {/* Profile Edit */}
      <div className="bg-[#16162a] border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">📝 プロフィール編集</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-1 block">表示名</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm focus:border-[#6c5ce7] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-1 block">身長 (cm)</label>
              <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm focus:border-[#6c5ce7] outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-1 block">体重 (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} step="0.1"
                className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm focus:border-[#6c5ce7] outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-1 block">トレーニング歴</label>
            <select value={trainingHistory} onChange={e => setTrainingHistory(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm focus:border-[#6c5ce7] outline-none">
              <option value="">選択...</option>
              {["未経験", "〜3ヶ月", "3ヶ月〜1年", "1年〜3年", "3年以上"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-bold text-sm disabled:opacity-50 transition-all">
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>

      {/* Weight History Chart */}
      {weightHistory.length > 1 && (
        <div className="bg-[#16162a] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-bold mb-3">📊 体重推移</h3>
          <div className="h-32 flex items-end gap-px">
            {weightHistory.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[8px] text-[#555570]">{w.value}</div>
                <div className="w-full bg-gradient-to-t from-[#6c5ce7] to-[#a29bfe] rounded-t"
                  style={{ height: `${Math.max(8, ((w.value - minW) / range) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-[#555570]">{weightHistory[0]?.date}</span>
            <span className="text-[8px] text-[#555570]">{weightHistory[weightHistory.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* PRs */}
      <div className="bg-[#16162a] border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">🏆 自己ベスト</h3>
        {prs.length === 0 ? (
          <p className="text-xs text-[#555570]">まだ記録がありません</p>
        ) : (
          prs.map((pr, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-sm">{pr.exercise}</span>
              <div className="text-sm text-right">
                <span className="text-[#a29bfe] font-bold">{pr.weight_kg}kg × {pr.reps}回</span>
                <span className="text-[#555570] ml-2">(1RM: {pr.estimated1RM}kg)</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Logout */}
      <button onClick={logout} className="w-full py-3 border border-[#ff4757]/30 text-[#ff4757] rounded-xl text-sm font-bold hover:bg-[#ff4757]/10 transition-colors">
        ログアウト
      </button>
    </div>
  );
}
