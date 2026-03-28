"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Ranking() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRankings() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10);
      
      if (data) {
        setRankings(data);
      }
      setLoading(false);
    }
    loadRankings();
  }, []);

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold">ランキング</h2>
      
      <div className="flex gap-2 p-1 bg-[#16162a] rounded-xl border border-white/5">
        <button className="flex-1 py-2 text-xs font-bold text-[#555570]">成長率</button>
        <button className="flex-1 py-2 text-xs font-bold bg-[#6c5ce7] rounded-lg shadow-lg">累計ポイント</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#6c5ce7] border-t-transparent animate-spin rounded-full"></div></div>
      ) : (
        <div className="space-y-2">
          {rankings.map((item, idx) => {
            const rank = idx + 1;
            return (
              <div key={item.id} className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                  rank === 1 ? 'bg-gradient-to-br from-[#ffd700] to-[#ffa500] text-black shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 
                  rank === 2 ? 'bg-gradient-to-br from-[#e0e0e0] to-[#9e9e9e] text-black' :
                  rank === 3 ? 'bg-gradient-to-br from-[#cd7f32] to-[#8b4513] text-white' :
                  'bg-[#0a0a0f] text-[#555570]'
                }`}>
                  {rank}
                </div>
                
                {item.avatar_url && (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <img src={item.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="flex-1">
                  <p className="font-bold text-sm">{item.display_name}</p>
                  <p className="text-[10px] text-[#555570]">スコア: {item.total_points || 0} pt</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-[#a29bfe]">+{(item.total_points * 0.1).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

