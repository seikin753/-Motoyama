"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Medal, Activity, Users, Settings as SettingsIcon } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("prs");

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
    else showToast("プロフィールを更新しました");
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
    <div className="bg-white min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-14 left-0 right-0 z-[60] flex justify-center p-4 pointer-events-none">
          <div className="bg-gray-900 text-white rounded-lg px-4 py-3 text-sm font-semibold shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* Header Profile Title */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200/60 sticky top-[44px] bg-white z-40">
        <h2 className="text-[17px] font-bold text-gray-900 flex items-center gap-1">
          {displayName || "User"}
        </h2>
        <button onClick={logout} className="p-1 hover:opacity-50">
          <LogOut className="w-6 h-6 text-gray-900" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200/60">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px] shrink-0">
            <div className="w-full h-full bg-white rounded-full border-2 border-white flex items-center justify-center text-gray-900 text-2xl font-bold">
              {(displayName || "?")[0].toUpperCase()}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex-1 flex justify-around text-center">
            <div>
              <div className="text-[17px] font-bold text-gray-900">{prs.length}</div>
              <div className="text-[13px] text-gray-600">種目(PR)</div>
            </div>
            <div>
              <div className="text-[17px] font-bold text-gray-900">{totalPoints}</div>
              <div className="text-[13px] text-gray-600">ポイント</div>
            </div>
            <div>
              <div className="text-[17px] font-bold text-gray-900">{trainingHistory || "-"}</div>
              <div className="text-[13px] text-gray-600">歴</div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-4">
          <div className="text-[14px] font-bold text-gray-900">{displayName}</div>
          <div className="text-[14px] text-gray-900 mt-0.5">
            {height && weight ? `${height}cm / ${weight}kg` : "身長/体重 未設定"}
          </div>
          <div className="text-[14px] text-gray-500 mt-0.5">{email}</div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex border-b border-gray-200/60">
        <button onClick={() => setActiveTab("prs")} className={`flex-1 py-3.5 flex justify-center border-b-2 ${activeTab === "prs" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}>
          <Medal className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab("weight")} className={`flex-1 py-3.5 flex justify-center border-b-2 ${activeTab === "weight" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}>
          <Activity className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab("edit")} className={`flex-1 py-3.5 flex justify-center border-b-2 ${activeTab === "edit" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}>
          <SettingsIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Valid content areas based on tab */}
      <div className="min-h-[400px]">
        {activeTab === "prs" && (
          <div className="divide-y divide-gray-100">
            {prs.length === 0 ? (
              <div className="text-center py-20">
                <Medal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-[14px] font-bold text-gray-900">PRが見つかりません</p>
              </div>
            ) : (
              prs.map((pr, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="text-[15px] font-bold text-gray-900">{pr.exercise}</div>
                  <div className="text-right">
                    <div className="text-[15px] font-bold text-[#0095f6]">{pr.weight_kg}kg × {pr.reps}回</div>
                    <div className="text-[12px] text-gray-500 font-medium">推定1RM: {pr.estimated1RM}kg</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "weight" && (
          <div className="p-4">
            {weightHistory.length > 1 ? (
              <div className="border border-gray-200/60 rounded-xl p-4">
                <h3 className="text-[14px] font-bold text-gray-900 mb-4">体重推移チャート</h3>
                <div className="h-40 flex items-end gap-1">
                  {weightHistory.map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[10px] text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-6">
                        {w.value}
                      </div>
                      <div className="w-full bg-gray-200 rounded-t-sm group-hover:bg-[#0095f6] transition-colors relative"
                        style={{ height: `${Math.max(10, ((w.value - minW) / range) * 100)}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400">{weightHistory[0]?.date}</span>
                  <span className="text-[11px] font-semibold text-gray-400">{weightHistory[weightHistory.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-[14px] font-bold text-gray-900">データが不足しています</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "edit" && (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[13px] font-bold text-gray-900 mb-1.5 block">名前</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full border border-gray-200/80 rounded-lg p-3 text-[14px] focus:border-gray-400 outline-none placeholder:text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold text-gray-900 mb-1.5 block">身長 (cm)</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                  className="w-full border border-gray-200/80 rounded-lg p-3 text-[14px] focus:border-gray-400 outline-none" />
              </div>
              <div>
                <label className="text-[13px] font-bold text-gray-900 mb-1.5 block">体重 (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} step="0.1"
                  className="w-full border border-gray-200/80 rounded-lg p-3 text-[14px] focus:border-gray-400 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold text-gray-900 mb-1.5 block">トレーニング歴</label>
              <select value={trainingHistory} onChange={e => setTrainingHistory(e.target.value)}
                className="w-full border border-gray-200/80 rounded-lg p-3 text-[14px] focus:border-gray-400 outline-none bg-white appearance-none">
                <option value="">選択...</option>
                {["未経験", "〜3ヶ月", "3ヶ月〜1年", "1年〜3年", "3年以上"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="w-full mt-2 py-3.5 bg-gray-900 hover:bg-black text-white rounded-lg font-bold text-[14px] disabled:opacity-50 transition-colors">
              {saving ? "保存中..." : "プロフィールを保存"}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
