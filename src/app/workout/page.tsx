"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function Workout() {
  const { user } = useAuth();
  const router = useRouter();
  const [exercise, setExercise] = useState("ベンチプレス");
  const [sets, setSets] = useState([{ id: 1, weight: "", reps: "" }]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    
    // 全セットをまとめて保存する（簡略化のため最初のセットだけをメインに使用・または別テーブルだが一旦MVPとして合計セット数を保存）
    const validSets = sets.filter(s => s.weight && s.reps);
    if (validSets.length === 0) {
      alert("記録を入力してください");
      setLoading(false);
      return;
    }

    // 最新のセット（一番重いもの等を本当は選ぶが、ここではMVPのため1セット目を記録として扱うか、総ボリュームにするか）
    const maxWeightSet = [...validSets].sort((a, b) => Number(b.weight) - Number(a.weight))[0];

    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      exercise,
      weight_kg: Number(maxWeightSet.weight),
      reps: Number(maxWeightSet.reps),
      sets: validSets.length
    });

    setLoading(false);
    if (!error) {
      router.push("/");
    } else {
      alert("保存に失敗しました：" + error.message);
    }
  };

  const updateSet = (id: number, field: 'weight' | 'reps', value: string) => {
    setSets(sets.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  
  const removeSet = (id: number) => {
    if (sets.length > 1) {
      setSets(sets.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">トレーニング記録</h2>
        <button className="text-xs font-bold text-[#a29bfe] px-3 py-1 bg-[#a29bfe]/10 rounded-full border border-[#a29bfe]/20">前回をコピー</button>
      </div>

      <div className="bg-[#16162a] border border-white/5 rounded-2xl p-6 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-[#8888a8] uppercase tracking-widest block mb-2">種目名</span>
          <select 
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-4 font-bold outline-none focus:border-[#6c5ce7] transition-colors"
          >
            <option>ベンチプレス</option>
            <option>スクワット</option>
            <option>デッドリフト</option>
            <option>ショルダープレス</option>
            <option>懸垂</option>
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
              <input 
                type="number" 
                value={set.weight}
                onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                className="col-span-5 bg-[#0a0a0f] border border-white/5 rounded-lg p-3 text-center font-bold focus:border-[#6c5ce7] outline-none" 
                placeholder="0"
              />
              <input 
                type="number" 
                value={set.reps}
                onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                className="col-span-5 bg-[#0a0a0f] border border-white/5 rounded-lg p-3 text-center font-bold focus:border-[#6c5ce7] outline-none" 
                placeholder="0"
              />
              <button onClick={() => removeSet(set.id)} className="col-span-1 text-[#ff5252] font-bold text-lg active:scale-90">×</button>
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

      <button 
        onClick={handleSave}
        disabled={loading}
        className="w-full py-4 bg-[#ff6b35] rounded-xl font-bold shadow-[0_4px_16px_rgba(255,107,53,0.3)] active:scale-95 transition-transform disabled:opacity-50"
      >
        {loading ? "保存中..." : "記録を保存する"}
      </button>
    </div>
  );
}

