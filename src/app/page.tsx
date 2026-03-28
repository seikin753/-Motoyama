"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function Home() {
  const { user } = useAuth();
  const [latestWorkout, setLatestWorkout] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    async function loadDashboard() {
      // プロフィール取得
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (prof) setProfile(prof);

      // 最新のワークアウト取得
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (workouts && workouts.length > 0) {
        setLatestWorkout(workouts[0]);
      }
      setLoading(false);
    }
    
    loadDashboard();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><div className="w-8 h-8 border-4 border-[#6c5ce7] border-t-transparent flex items-center justify-center animate-spin rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-2xl font-bold">ダッシュボード</h2>
          <span className="text-sm text-[#8888a8]">
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="累計ポイント" value={profile?.total_points || "0"} unit="pt" color="accent" />
          <StatCard label="継続日数" value="1" unit="日" color="fire" />
          <StatCard label="記録回数" value="-" unit="回" />
          <StatCard label="推定1RM" value="-" unit="kg" />
        </div>
      </section>

      <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-[#8888a8] text-xs font-bold uppercase tracking-widest mb-4">最新のトレーニング</h3>
        {latestWorkout ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#16162a] flex items-center justify-center border border-white/5 font-bold text-[#a29bfe]">1</div>
              <div>
                <p className="font-bold">{latestWorkout.exercise}</p>
                <p className="text-xs text-[#555570]">前回 ({new Date(latestWorkout.date).toLocaleDateString()}): {latestWorkout.weight_kg}kg x {latestWorkout.reps}回</p>
              </div>
            </div>
            <Link href="/workout" className="block w-full py-4 text-center bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-bold shadow-[0_4px_16px_rgba(108,92,231,0.3)] active:scale-95 transition-transform">
              記録を開始する
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-[#8888a8] mb-4">まだ記録がありません</p>
            <Link href="/workout" className="inline-block px-6 py-3 bg-[#16162a] border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/5">
              最初の記録をつける
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, unit, color = "default" }: { label: string; value: string | number; unit: string; color?: "default" | "accent" | "fire" }) {
  const colorClass = color === "accent" ? "text-[#a29bfe]" : color === "fire" ? "text-[#ff6b35]" : "text-white";
  return (
    <div className="bg-[#16162a] border border-white/5 rounded-2xl p-4 shadow-md">
      <p className="text-[10px] text-[#555570] font-bold uppercase mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-black ${colorClass}`}>{value}</span>
        <span className="text-[10px] text-[#555570] font-bold">{unit}</span>
      </div>
    </div>
  );
}

