"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap, Scale, Trophy, Medal } from "lucide-react";

type RankItem = { display_name: string; value: string; detail?: string };

export default function RankingPage() {
  const [tab, setTab] = useState<"growth" | "points" | "ratio">("growth");
  const [rankings, setRankings] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTab(tab); }, [tab]);

  async function loadTab(t: string) {
    setLoading(true);
    try {
      if (t === "points") {
        const { data } = await supabase.from("profiles").select("display_name, total_points").order("total_points", { ascending: false }).limit(50);
        setRankings((data || []).map(r => ({ display_name: r.display_name, value: r.total_points + "pt" })));
      } else if (t === "growth") {
        const { data: workouts } = await supabase.from("workouts").select("user_id, exercise, weight_kg, date");
        const { data: profiles } = await supabase.from("profiles").select("id, display_name");
        if (!workouts || !profiles) { setRankings([]); setLoading(false); return; }

        const nameMap: Record<string, string> = {};
        profiles.forEach(p => { nameMap[p.id] = p.display_name; });

        const userEx: Record<string, Record<string, { date: string; weight: number }[]>> = {};
        workouts.forEach(w => {
          if (!userEx[w.user_id]) userEx[w.user_id] = {};
          if (!userEx[w.user_id][w.exercise]) userEx[w.user_id][w.exercise] = [];
          userEx[w.user_id][w.exercise].push({ date: w.date, weight: Number(w.weight_kg) });
        });

        const items: { name: string; growth: number; count: number }[] = [];
        Object.entries(userEx).forEach(([uid, exs]) => {
          let totalGrowth = 0, exCount = 0;
          Object.values(exs).forEach(records => {
            records.sort((a, b) => a.date.localeCompare(b.date));
            if (records.length < 2) return;
            const prev = records[records.length - 2].weight;
            const latest = records[records.length - 1].weight;
            if (prev > 0) { totalGrowth += ((latest - prev) / prev) * 100; exCount++; }
          });
          if (exCount > 0) {
            items.push({ name: nameMap[uid] || "Unknown", growth: Math.round((totalGrowth / exCount) * 10) / 10, count: exCount });
          }
        });
        items.sort((a, b) => b.growth - a.growth);
        setRankings(items.map(r => ({
          display_name: r.name,
          value: (r.growth > 0 ? "+" : "") + r.growth + "%",
          detail: r.count + "種目追跡",
        })));
      } else {
        const { data: workouts } = await supabase.from("workouts").select("user_id, weight_kg").eq("exercise", "ベンチプレス");
        const { data: profiles } = await supabase.from("profiles").select("id, display_name, weight");
        if (!workouts || !profiles) { setRankings([]); setLoading(false); return; }

        const nameMap: Record<string, string> = {};
        const bodyMap: Record<string, number> = {};
        profiles.forEach(p => { nameMap[p.id] = p.display_name; bodyMap[p.id] = Number(p.weight) || 0; });

        const bestMap: Record<string, number> = {};
        workouts.forEach(w => {
          const wt = Number(w.weight_kg);
          if (!bestMap[w.user_id] || wt > bestMap[w.user_id]) bestMap[w.user_id] = wt;
        });

        const items: { name: string; ratio: number; best: number; bw: number }[] = [];
        Object.entries(bestMap).forEach(([uid, best]) => {
          const bw = bodyMap[uid];
          if (bw > 0) items.push({ name: nameMap[uid] || "Unknown", ratio: Math.round((best / bw) * 100) / 100, best, bw });
        });
        items.sort((a, b) => b.ratio - a.ratio);
        setRankings(items.map(r => ({
          display_name: r.name,
          value: r.ratio + "x",
          detail: r.best + "kg / " + r.bw + "kg",
        })));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const tabs = [
    { key: "growth", label: "成長率", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "points", label: "ポイント", icon: <Zap className="w-4 h-4" /> },
    { key: "ratio", label: "自重比", icon: <Scale className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all
              ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Rankings */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">まだランキングデータがありません</p>
          <p className="text-gray-400 text-xs mt-1">トレーニングを記録しよう！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rankings.map((r, i) => {
            const pos = i + 1;
            return (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <RankBadge pos={pos} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{r.display_name}</div>
                  {r.detail && <div className="text-[11px] text-gray-400">{r.detail}</div>}
                </div>
                <div className={`text-sm font-bold ${pos <= 3 ? "text-blue-600" : "text-gray-700"}`}>{r.value}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RankBadge({ pos }: { pos: number }) {
  if (pos === 1) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md shadow-yellow-500/30">
      <Trophy className="w-4 h-4 text-white" />
    </div>
  );
  if (pos === 2) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-sm">
      <Medal className="w-4 h-4 text-white" />
    </div>
  );
  if (pos === 3) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
      <Medal className="w-4 h-4 text-white" />
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
      {pos}
    </div>
  );
}
