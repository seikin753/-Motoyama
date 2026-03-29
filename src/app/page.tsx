"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Flame, Activity, Zap, Layers, AlertCircle } from "lucide-react";

type Profile = { display_name: string; total_points: number };
type WorkoutRow = { exercise: string; weight_kg: number; reps: number; sets: number };
type GrowthSummary = { streak: number; this_week: number; total_workouts: number; total_points: number };

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<GrowthSummary>({ streak: 0, this_week: 0, total_workouts: 0, total_points: 0 });
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutRow[]>([]);
  const [stagnant, setStagnant] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    loadDashboard();
  }, [user, authLoading]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("display_name, total_points").eq("id", user!.id).single();
      if (prof) setProfile(prof);

      const { data: allWorkouts } = await supabase.from("workouts").select("*").eq("user_id", user!.id);
      const workouts = allWorkouts || [];

      const today = new Date().toISOString().split("T")[0];
      const todayW = workouts.filter((w: any) => w.date === today);
      setTodayWorkouts(todayW);

      const now = new Date();
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = workouts.filter((w: any) => new Date(w.date) >= weekAgo).length;

      const daysSet = new Set(workouts.map((w: any) => w.date));
      const sortedDays = Array.from(daysSet).sort().reverse();
      let streak = 0;
      let checkDate = new Date(now);
      for (const day of sortedDays) {
        const checkStr = checkDate.toISOString().split("T")[0];
        if (day === checkStr) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
        else if (day < checkStr) break;
      }

      setSummary({ streak, this_week: thisWeek, total_workouts: workouts.length, total_points: prof?.total_points || 0 });

      const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const prMap: Record<string, { date: string; est1rm: number }> = {};
      workouts.forEach((w: any) => {
        const est = w.weight_kg * (1 + w.reps / 30);
        if (!prMap[w.exercise] || est > prMap[w.exercise].est1rm) {
          prMap[w.exercise] = { date: w.date, est1rm: est };
        }
      });
      const stagnantExercises = Object.entries(prMap)
        .filter(([, v]) => new Date(v.date) < twoWeeksAgo)
        .map(([k]) => k);
      setStagnant(stagnantExercises);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-[3px] border-gray-300 border-t-gray-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-full">
      {/* Header section */}
      <div className="bg-white px-4 py-5 border-b border-gray-200/60">
        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
          Hello, {profile?.display_name || "トレーニー"}
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">今日のトレーニングも頑張りましょう</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Flame className="w-[18px] h-[18px] text-white" />} iconBg="bg-gradient-to-tr from-orange-400 to-red-500" value={summary.streak} label="連続記録 (日)" />
          <StatCard icon={<Activity className="w-[18px] h-[18px] text-white" />} iconBg="bg-gradient-to-tr from-blue-400 to-cyan-500" value={summary.this_week} label="今週の記録" />
          <StatCard icon={<Layers className="w-[18px] h-[18px] text-white" />} iconBg="bg-gradient-to-tr from-purple-500 to-pink-500" value={summary.total_workouts} label="総記録セット" />
          <StatCard icon={<Zap className="w-[18px] h-[18px] text-white" />} iconBg="bg-gradient-to-tr from-yellow-400 to-amber-500" value={summary.total_points} label="累計ポイント" />
        </div>

        {/* Stagnation Warning */}
        {stagnant.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-[15px] font-bold text-gray-900">停滞アラート</h3>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-1">
              以下の種目で2週間以上PR更新がありません。<br/>
              重量やレップスを見直してみましょう！
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {stagnant.map((ex, i) => (
                <span key={i} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-md text-xs font-semibold">
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Today's Workouts */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[15px] font-bold text-gray-900">今日の記録</h3>
            <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{todayWorkouts.length}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {todayWorkouts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {todayWorkouts.map((w, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-[15px] font-semibold text-gray-900">{w.exercise}</span>
                    <span className="text-[14px] text-gray-500 font-medium">
                      <span className="text-gray-900 font-bold">{w.weight_kg}</span>kg × <span className="text-gray-900 font-bold">{w.reps}</span>回
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[14px] text-gray-500 font-medium mb-4">本日の記録はまだありません</p>
                <button
                  onClick={() => router.push("/workout")}
                  className="px-6 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg font-semibold text-[13px] transition-colors"
                >
                  トレーニングを記録
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, iconBg }: { icon: React.ReactNode; value: number; label: string; iconBg: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between aspect-[4/3]">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  );
}
