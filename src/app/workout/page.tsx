"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Exercise = { id: string; name: string; muscle_group: string };
type SetData = { weight: string; reps: string };
type LastRecord = { weight_kg: number; reps: number; sets: number; date: string };

export default function WorkoutPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Exercise[]>>({});
  const [selectedExercise, setSelectedExercise] = useState("");
  const [sets, setSets] = useState<SetData[]>([{ weight: "", reps: "" }]);
  const [bodyWeight, setBodyWeight] = useState("");
  const [lastRecord, setLastRecord] = useState<LastRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const { data } = await supabase.from("exercises").select("*").order("muscle_group");
    if (data) {
      setExercises(data);
      const g: Record<string, Exercise[]> = {};
      data.forEach((ex: Exercise) => {
        if (!g[ex.muscle_group]) g[ex.muscle_group] = [];
        g[ex.muscle_group].push(ex);
      });
      setGrouped(g);
    }
  }

  async function onExerciseChange(name: string) {
    setSelectedExercise(name);
    if (!name || !user) { setLastRecord(null); return; }
    const { data } = await supabase
      .from("workouts")
      .select("weight_kg, reps, sets, date")
      .eq("user_id", user.id)
      .eq("exercise", name)
      .order("date", { ascending: false })
      .limit(1);
    if (data && data.length > 0) setLastRecord(data[0]);
    else setLastRecord(null);
  }

  function copyLast() {
    if (!lastRecord) return;
    const newSets: SetData[] = [];
    for (let i = 0; i < lastRecord.sets; i++) {
      newSets.push({ weight: String(lastRecord.weight_kg), reps: String(lastRecord.reps) });
    }
    setSets(newSets);
    showToast("前回記録をコピーしました！");
  }

  function addSet() {
    const last = sets[sets.length - 1] || { weight: "", reps: "" };
    setSets([...sets, { weight: last.weight, reps: last.reps }]);
  }

  function removeSet(i: number) {
    setSets(sets.filter((_, idx) => idx !== i));
  }

  function updateSet(i: number, field: "weight" | "reps", val: string) {
    const newSets = [...sets];
    newSets[i][field] = val;
    setSets(newSets);
  }

  async function save() {
    if (!selectedExercise) { showToast("種目を選択してください", true); return; }
    const validSets = sets.filter(s => s.weight && s.reps);
    if (validSets.length === 0) { showToast("セットを入力してください", true); return; }
    if (!user) return;

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const rows = validSets.map(s => ({
      user_id: user.id,
      date: today,
      exercise: selectedExercise,
      weight_kg: Number(s.weight),
      reps: Number(s.reps),
      sets: 1,
      body_weight: bodyWeight ? Number(bodyWeight) : null,
    }));

    const { error } = await supabase.from("workouts").insert(rows);
    if (error) { showToast("保存に失敗しました", true); }
    else {
      showToast("記録を保存しました！💪");
      setSets([{ weight: "", reps: "" }]);
      setSelectedExercise("");
      setBodyWeight("");
      setLastRecord(null);
    }
    setSaving(false);
  }

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">💪 トレーニング記録</h2>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2d2d4a] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      {/* Exercise Select */}
      <div>
        <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-1 block">種目</label>
        <select
          value={selectedExercise}
          onChange={e => onExerciseChange(e.target.value)}
          className="w-full bg-[#16162a] border border-white/5 rounded-xl p-4 text-sm font-bold focus:border-[#6c5ce7] outline-none"
        >
          <option value="">種目を選択...</option>
          {Object.entries(grouped).map(([group, exs]) => (
            <optgroup key={group} label={group}>
              {exs.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Last Record */}
      {lastRecord && (
        <div className="bg-[#16162a] border border-white/5 rounded-xl p-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#8888a8]">前回記録</span>
            <button onClick={copyLast} className="text-xs text-[#a29bfe] font-bold">📋 コピー</button>
          </div>
          <div className="text-sm mt-1">
            {lastRecord.weight_kg}kg × {lastRecord.reps}回 × {lastRecord.sets}セット
            <span className="text-[#555570] ml-2">({lastRecord.date})</span>
          </div>
        </div>
      )}

      {/* Sets */}
      <div>
        <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-2 block">セット</label>
        <div className="space-y-2">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#2d2d4a] rounded-full flex items-center justify-center text-xs font-bold text-[#a29bfe]">{i + 1}</span>
              <input type="number" placeholder="重量 kg" value={s.weight} onChange={e => updateSet(i, "weight", e.target.value)} step="0.5"
                className="flex-1 bg-[#16162a] border border-white/5 rounded-lg p-3 text-sm focus:border-[#6c5ce7] outline-none" />
              <input type="number" placeholder="回数" value={s.reps} onChange={e => updateSet(i, "reps", e.target.value)}
                className="flex-1 bg-[#16162a] border border-white/5 rounded-lg p-3 text-sm focus:border-[#6c5ce7] outline-none" />
              {i > 0 && <button onClick={() => removeSet(i)} className="text-[#ff4757] text-lg">✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addSet} className="w-full mt-2 py-2 border border-white/10 rounded-lg text-xs text-[#8888a8] hover:bg-white/5 transition-colors">
          + セット追加
        </button>
      </div>

      {/* Body Weight */}
      <div>
        <label className="text-[10px] font-bold text-[#8888a8] uppercase mb-1 block">体重（任意）</label>
        <input type="number" value={bodyWeight} onChange={e => setBodyWeight(e.target.value)} step="0.1" placeholder="kg"
          className="w-full bg-[#16162a] border border-white/5 rounded-xl p-4 text-sm focus:border-[#6c5ce7] outline-none" />
      </div>

      {/* Save Button */}
      <button onClick={save} disabled={saving}
        className="w-full py-4 bg-gradient-to-r from-[#ff6b35] to-[#ff4757] rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] disabled:opacity-50 transition-all">
        {saving ? "保存中..." : "💪 記録を保存"}
      </button>
    </div>
  );
}
