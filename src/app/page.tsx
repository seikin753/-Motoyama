"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Flame, TrendingUp, Dumbbell, Zap, AlertTriangle, ChevronRight } from "lucide-react";

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
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          おかえり、{profile?.display_name || "トレーニー"} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">今日もトレーニングを頑張ろう！</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} value={summary.streak} label="連続日数" accent="orange" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-500" />} value={summary.this_week} label="今週の記録" accent="blue" />
        <StatCard icon={<Dumbbell className="w-5 h-5 text-purple-500" />} value={summary.total_workouts} label="総記録数" accent="purple" />
        <StatCard icon={<Zap className="w-5 h-5 text-yellow-500" />} value={summary.total_points} label="ポイント" accent="yellow" />
      </div>

      {/* Stagnation Warning */}
      {stagnant.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">停滞中の種目</h3>
          </div>
          <p className="text-xs text-amber-700">{stagnant.join("、")}</p>
          <p className="text-[11px] text-amber-500 mt-1">2週間以上PR更新がありません</p>
        </div>
      )}

      {/* Today's Workouts */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">📋 本日のトレーニング</h3>
          <span className="text-xs text-gray-400">{todayWorkouts.length}件</span>
        </div>
        <div className="divide-y divide-gray-100">
          {todayWorkouts.length > 0 ? (
            todayWorkouts.map((w, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-gray-800">{w.exercise}</span>
                <span className="text-sm text-blue-600 font-semibold">{w.weight_kg}kg × {w.reps}回 × {w.sets}set</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">まだ記録がありません</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/workout")}
          className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <Dumbbell className="w-4 h-4" /> 記録する
        </button>
        <button
          onClick={() => router.push("/timeline")}
          className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold text-sm shadow-md shadow-purple-500/20 hover:shadow-lg active:scale-[0.98] transition-all"
        >
          📹 投稿する
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: number; label: string; accent: string }) {
  const bgMap: Record<string, string> = {
    orange: "bg-orange-50 border-orange-100",
    blue: "bg-blue-50 border-blue-100",
    purple: "bg-purple-50 border-purple-100",
    yellow: "bg-yellow-50 border-yellow-100",
  };
  return (
    <div className={`${bgMap[accent] || "bg-gray-50 border-gray-100"} border rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
