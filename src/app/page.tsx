import { supabase } from "@/lib/supabase";

export default function Home() {
  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-2xl font-bold">ダッシュボード</h2>
          <span className="text-sm text-[#8888a8]">2026年3月29日</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="PR 更新" value="3" unit="種目" color="accent" />
          <StatCard label="継続日数" value="12" unit="日" color="fire" />
          <StatCard label="推定1RM" value="105" unit="kg" />
          <StatCard label="週刊ボリューム" value="12,500" unit="kg" />
        </div>
      </section>

      <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-[#8888a8] text-xs font-bold uppercase tracking-widest mb-4">本日のトレーニング</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#16162a] flex items-center justify-center border border-white/5 font-bold text-[#a29bfe]">1</div>
            <div>
              <p className="font-bold">ベンチプレス</p>
              <p className="text-xs text-[#555570]">前回: 85kg x 8</p>
            </div>
          </div>
          <button className="w-full py-4 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-bold shadow-[0_4px_16px_rgba(108,92,231,0.3)] active:scale-95 transition-transform">
            記録を開始する
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[#8888a8] text-xs font-bold uppercase tracking-widest">最近の成長</h3>
        <div className="bg-[#16162a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff6b35]/10 rounded-lg text-[#ff6b35]">🔥</div>
            <div>
              <p className="text-sm font-bold">スクワット 記録更新！</p>
              <p className="text-xs text-[#555570]">100kg &rarr; 105kg</p>
            </div>
          </div>
          <span className="text-xs text-[#555570]">3時間前</span>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, unit, color = "default" }: { label: string; value: string; unit: string; color?: "default" | "accent" | "fire" }) {
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
