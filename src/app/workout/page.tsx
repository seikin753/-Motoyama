"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Plus, Minus, Search, Clock } from "lucide-react";

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
      showToast("記録を保存しました！");
      setSets([{ weight: "", reps: "" }]);
      setSelectedExercise("");
      setBodyWeight("");
      setLastRecord(null);
    }
    setSaving(false);
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  return (
    <div className="bg-[#fafafa] min-h-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-14 left-0 right-0 z-[60] flex justify-center p-4 pointer-events-none">
          <div className="bg-gray-900 text-white rounded-lg px-4 py-3 text-sm font-semibold shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="bg-white px-4 py-4 border-b border-gray-200/60 mb-2">
        <h2 className="text-[16px] font-bold text-gray-900 text-center">記録を追加</h2>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Exercise Selection */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <select 
              value={selectedExercise} 
              onChange={e => onExerciseChange(e.target.value)}
              className="flex-1 bg-transparent border-none text-[15px] font-semibold text-gray-900 focus:ring-0 outline-none appearance-none"
            >
              <option value="">種目を検索または選択</option>
              {Object.entries(grouped).map(([group, exs]) => (
                <optgroup key={group} label={group}>
                  {exs.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Previous Record Area */}
        {lastRecord && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-[13px] font-semibold">前回の記録 ({lastRecord.date})</span>
              </div>
              <button 
                onClick={copyLast} 
                className="text-[13px] font-semibold text-[#0095f6] hover:text-[#1877f2] transition-colors"
              >
                コピーする
              </button>
            </div>
            <p className="text-[16px] font-bold text-gray-900">
              {lastRecord.weight_kg} kg × {lastRecord.reps} 回 × {lastRecord.sets} sets
            </p>
          </div>
        )}

        {/* Sets Input Area */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-gray-900">セット情報</h3>
          </div>
          
          <div className="space-y-3">
            {sets.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold text-gray-500 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={s.weight} 
                      onChange={e => updateSet(i, "weight", e.target.value)} 
                      step="0.5"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[15px] font-semibold text-center focus:border-[#0095f6] focus:ring-1 focus:ring-[#0095f6] outline-none transition-all placeholder:font-normal placeholder:text-gray-400" 
                      placeholder="重量"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400">kg</span>
                  </div>
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={s.reps} 
                      onChange={e => updateSet(i, "reps", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[15px] font-semibold text-center focus:border-[#0095f6] focus:ring-1 focus:ring-[#0095f6] outline-none transition-all placeholder:font-normal placeholder:text-gray-400" 
                      placeholder="回数"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400">回</span>
                  </div>
                </div>
                {i > 0 && (
                  <button 
                    onClick={() => removeSet(i)} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button 
            onClick={addSet}
            className="w-full mt-4 py-3 flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> セットを追加
          </button>
        </div>

        {/* Bodyweight */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
          <h3 className="text-[14px] font-bold text-gray-900 mb-3">当日の体重 (任意)</h3>
          <div className="relative">
            <input 
              type="number" 
              value={bodyWeight} 
              onChange={e => setBodyWeight(e.target.value)} 
              step="0.1" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] font-semibold focus:border-[#0095f6] focus:ring-1 focus:ring-[#0095f6] outline-none transition-all" 
              placeholder="0.0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-gray-400">kg</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button 
            onClick={save} 
            disabled={saving || !selectedExercise}
            className="w-full py-4 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-xl font-bold text-[15px] disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? "保存中..." : "記録を保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
