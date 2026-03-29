"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
        // Growth rate: compare latest weight vs previous for each user/exercise
        const { data: workouts } = await supabase.from("workouts").select("user_id, exercise, weight_kg, date");
        const { data: profiles } = await supabase.from("profiles").select("id, display_name");
        if (!workouts || !profiles) { setRankings([]); setLoading(false); return; }

        const nameMap: Record<string, string> = {};
        profiles.forEach(p => { nameMap[p.id] = p.display_name; });

        // Group by user -> exercise -> records
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
        // Body weight ratio for ベンチプレス
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
    { key: "growth", label: "📈 成長率" },
    { key: "points", label: "⚡ ポイント" },
    { key: "ratio", label: "🏋️ 自重比" },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-[#16162a] rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.key ? "bg-[#6c5ce7] text-white" : "text-[#555570]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rankings */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-2 border-[#a29bfe] border-t-transparent rounded-full" /></div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-[#8888a8] text-sm">まだランキングデータがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rankings.map((r, i) => {
            const pos = i + 1;
            const posColors = pos === 1 ? "from-yellow-400 to-amber-500 text-black" : pos === 2 ? "from-gray-300 to-gray-400 text-black" : pos === 3 ? "from-orange-400 to-orange-500 text-black" : "from-[#2d2d4a] to-[#2d2d4a] text-white";
            return (
              <div key={i} className="bg-[#16162a] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${posColors} flex items-center justify-center font-bold text-sm`}>{pos}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{r.display_name}</div>
                  {r.detail && <div className="text-[10px] text-[#555570]">{r.detail}</div>}
                </div>
                <div className="text-sm font-bold text-[#a29bfe]">{r.value}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
