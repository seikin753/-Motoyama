"use client";
import { useState } from "react";

export default function Workout() {
  const [sets, setSets] = useState([{ id: 1, weight: "60", reps: "10" }]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">トレーニング記録</h2>
        <button className="text-xs font-bold text-[#a29bfe] px-3 py-1 bg-[#a29bfe]/10 rounded-full border border-[#a29bfe]/20">前回をコピー</button>
      </div>

      <div className="bg-[#16162a] border border-white/5 rounded-2xl p-6 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-[#8888a8] uppercase tracking-widest block mb-2">種目名</span>
          <select className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-4 font-bold outline-none focus:border-[#6c5ce7] transition-colors selection:bg-[#6c5ce7]">
            <option>ベンチプレス</option>
            <option>スクワット</option>
            <option>デッドリフト</option>
          </select>
        </label>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-[#555570] uppercase px-2">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 text-center">重量 (kg)</div>
            <div className="col-span-5 text-center">回数</div>
            <div className="col-span-1"></div>
          </div>

          {sets.map((set, idx) => (
            <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 text-xs font-bold text-[#555570] text-center">{idx + 1}</div>
              <input type="number" defaultValue={set.weight} className="col-span-5 bg-[#0a0a0f] border border-white/5 rounded-lg p-3 text-center font-bold focus:border-[#6c5ce7] outline-none" />
              <input type="number" defaultValue={set.reps} className="col-span-5 bg-[#0a0a0f] border border-white/5 rounded-lg p-3 text-center font-bold focus:border-[#6c5ce7] outline-none" />
              <button className="col-span-1 text-[#ff5252] font-bold text-lg">×</button>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setSets([...sets, { id: Date.now(), weight: "", reps: "" }])}
          className="w-full py-3 border border-dashed border-white/10 rounded-xl text-sm font-bold text-[#8888a8] hover:bg-white/[0.02] transition-colors"
        >
          セットを追加
        </button>
      </div>

      <button className="w-full py-4 bg-[#ff6b35] rounded-xl font-bold shadow-[0_4px_16px_rgba(255,107,53,0.3)] active:scale-95 transition-transform">
        記録を保存する
      </button>
    </div>
  );
}
