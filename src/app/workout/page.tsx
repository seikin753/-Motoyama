"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Dumbbell, Copy, Plus, Minus, Scale } from "lucide-react";

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

  useEffect(() => { loadExercises(); }, []);

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

  function removeSet(i: number) { setSets(sets.filter((_, idx) => idx !== i)); }

  function updateSet(i: number, field: "weight" | "reps", val: string) {
    const newSets = [...sets];
    newSets[i][field] = val;
    setSets(newSets);
  }

  async function save() {
    if (!selectedExercise) { showToast("種目を選択してください"); return; }
    const validSets = sets.filter(s => s.weight && s.reps);
    if (validSets.length === 0) { showToast("セットを入力してください"); return; }
    if (!user) return;

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const rows = validSets.map(s => ({
      user_id: user.id, date: today, exercise: selectedExercise,
      weight_kg: Number(s.weight), reps: Number(s.reps), sets: 1,
      body_weight: bodyWeight ? Number(bodyWeight) : null,
    }));

    const { error } = await supabase.from("workouts").insert(rows);
    if (error) { showToast("保存に失敗しました"); }
    else {
      showToast("記録を保存しました！💪");
      setSets([{ weight: "", reps: "" }]);
      setSelectedExercise("");
      setBodyWeight("");
      setLastRecord(null);
    }
    setSaving(false);
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  return (
    <div className="p-4 space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white rounded-full px-5 py-2.5 text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-bold text-gray-900">トレーニング記録</h2>
      </div>

      {/* Exercise Select */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">種目</label>
        <select value={selectedExercise} onChange={e => onExerciseChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all">
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
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-blue-600">前回記録</span>
            <button onClick={copyLast} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              <Copy className="w-3.5 h-3.5" /> コピー
            </button>
          </div>
          <div className="text-sm font-semibold text-gray-800 mt-1">
            {lastRecord.weight_kg}kg × {lastRecord.reps}回 × {lastRecord.sets}set
            <span className="text-gray-400 font-normal ml-2">({lastRecord.date})</span>
          </div>
        </div>
      )}

      {/* Sets */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">セット</label>
        <div className="space-y-2">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">{i + 1}</span>
              <input type="number" placeholder="kg" value={s.weight} onChange={e => updateSet(i, "weight", e.target.value)} step="0.5"
                className="flex-1 border border-gray-200 rounded-lg p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
              <input type="number" placeholder="回" value={s.reps} onChange={e => updateSet(i, "reps", e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
              {i > 0 && (
                <button onClick={() => removeSet(i)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400">
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addSet}
          className="w-full mt-2 py-2.5 flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all">
          <Plus className="w-3.5 h-3.5" /> セット追加
        </button>
      </div>

      {/* Body Weight */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
          <Scale className="w-3.5 h-3.5" /> 体重（任意）
        </label>
        <input type="number" value={bodyWeight} onChange={e => setBodyWeight(e.target.value)} step="0.1" placeholder="kg"
          className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
      </div>

      {/* Save */}
      <button onClick={save} disabled={saving}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 active:scale-[0.98] transition-all">
        {saving ? "保存中..." : "💪 記録を保存"}
      </button>
    </div>
  );
}
