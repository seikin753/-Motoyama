"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

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
      // Profile
      const { data: prof } = await supabase.from("profiles").select("display_name, total_points").eq("id", user!.id).single();
      if (prof) setProfile(prof);

      // All user workouts
      const { data: allWorkouts } = await supabase.from("workouts").select("*").eq("user_id", user!.id);
      const workouts = allWorkouts || [];

      // Today's workouts
      const today = new Date().toISOString().split("T")[0];
      const todayW = workouts.filter((w: any) => w.date === today);
      setTodayWorkouts(todayW);

      // Summary calculations
      const now = new Date();
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = workouts.filter((w: any) => new Date(w.date) >= weekAgo).length;

      // Streak calculation
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

      // Stagnation check (PR not updated in 2 weeks)
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
    return <div className="flex items-center justify-center h-60"><div className="animate-spin w-8 h-8 border-2 border-[#a29bfe] border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={summary.streak} label="🔥 連続日数" fire />
        <StatCard value={summary.this_week} label="📊 今週の記録" />
        <StatCard value={summary.total_workouts} label="💪 総記録数" />
        <StatCard value={summary.total_points} label="⚡ ポイント" fire />
      </div>

      {/* Stagnation Warning */}
      {stagnant.length > 0 && (
        <div className="bg-[#16162a] border border-yellow-500/20 rounded-xl p-4">
          <h3 className="text-sm font-bold mb-1">⚠️ 停滞中の種目</h3>
          <p className="text-xs text-[#8888a8]">{stagnant.join("、")}</p>
          <p className="text-[10px] text-[#555570] mt-1">2週間以上PR更新がありません。メニューの見直しを検討しましょう！</p>
        </div>
      )}

      {/* Today's Workouts */}
      <div className="bg-[#16162a] border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">📋 本日のトレーニング</h3>
        {todayWorkouts.length > 0 ? (
          todayWorkouts.map((w, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-sm">{w.exercise}</span>
              <span className="text-sm text-[#a29bfe] font-bold">{w.weight_kg}kg × {w.reps}回 × {w.sets}セット</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#555570] text-center py-4">まだ記録がありません</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/workout")} className="py-4 bg-gradient-to-r from-[#ff6b35] to-[#ff4757] rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] transition-all">
          💪 記録する
        </button>
        <button onClick={() => router.push("/timeline")} className="py-4 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(108,92,231,0.4)] transition-all">
          📹 投稿する
        </button>
      </div>
    </div>
  );
}

function StatCard({ value, label, fire = false }: { value: number; label: string; fire?: boolean }) {
  return (
    <div className="bg-[#16162a] border border-white/5 rounded-xl p-4 text-center">
      <div className={`text-2xl font-black ${fire ? "text-[#ff6b35]" : "text-[#f0f0f5]"}`}>{value}</div>
      <div className="text-[10px] text-[#8888a8] font-bold mt-1">{label}</div>
    </div>
  );
}
