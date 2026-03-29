"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap, Scale } from "lucide-react";

type RankItem = { display_name: string; value: string; detail?: string };

export default function RankingPage() {
  const [tab, setTab] = useState<"growth" | "points" | "ratio">("points");
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
    { key: "points", label: "ポイント", icon: <Zap className="w-4 h-4" /> },
    { key: "growth", label: "成長率", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "ratio", label: "自重比", icon: <Scale className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header section w/ Tabs inside */}
      <div className="bg-white border-b border-gray-200/60 sticky top-11 z-40">
        <div className="flex px-4 pt-3 pb-0 overflow-x-auto no-scrollbar gap-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 pb-3 text-[14px] font-bold transition-colors whitespace-nowrap
                ${tab === t.key 
                  ? "text-gray-900 border-b-2 border-gray-900" 
                  : "text-gray-400 border-b-2 border-transparent"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-8 h-8 border-[3px] border-gray-300 border-t-gray-800 rounded-full" />
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 border-2 border-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-900" />
          </div>
          <p className="text-[14px] font-bold text-gray-900">ランキングがありません</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 pb-10">
          {rankings.map((r, i) => {
            const pos = i + 1;
            return (
              <div key={i} className="px-4 py-3.5 flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="w-6 text-center text-[14px] font-bold text-gray-500">
                  {pos}
                </div>
                {/* Avatar matching Instagram DM style */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[1.5px] shrink-0">
                  <div className="w-full h-full bg-white rounded-full border border-white flex items-center justify-center text-gray-900 text-[15px] font-bold">
                    {(r.display_name || "?")[0].toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-[14px] font-bold text-gray-900 truncate tracking-tight">{r.display_name}</div>
                  {r.detail && <div className="text-[13px] text-gray-500">{r.detail}</div>}
                </div>
                <div className="text-[15px] font-bold text-gray-900">
                  {r.value}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
