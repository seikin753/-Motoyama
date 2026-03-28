"use client";

export default function Profile() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-8 space-y-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-4xl font-black border-4 border-[#16162a] shadow-xl">
          T
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Tomo</h2>
          <p className="text-xs text-[#555570]">トレーニング歴: 3年</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#16162a] border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-[8px] text-[#555570] font-bold uppercase mb-1">Posts</p>
          <p className="text-lg font-black">24</p>
        </div>
        <div className="bg-[#16162a] border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-[8px] text-[#555570] font-bold uppercase mb-1">Followers</p>
          <p className="text-lg font-black">128</p>
        </div>
        <div className="bg-[#16162a] border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-[8px] text-[#555570] font-bold uppercase mb-1">Points</p>
          <p className="text-lg font-black text-[#ff6b35]">1.2k</p>
        </div>
      </div>

      <section className="bg-[#16162a] border border-white/5 rounded-2xl p-6">
        <h3 className="text-[#8888a8] text-xs font-bold uppercase tracking-widest mb-6">フィジカルデータ</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] text-[#555570] font-bold uppercase">身長</p>
            <p className="font-black text-xl">178 <span className="text-[10px] text-[#555570]">cm</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-[#555570] font-bold uppercase">体重</p>
            <p className="font-black text-xl">74.5 <span className="text-[10px] text-[#555570]">kg</span></p>
          </div>
        </div>
      </section>

      <button className="w-full py-4 border border-white/10 rounded-xl text-sm font-bold text-[#8888a8] hover:bg-white/[0.02]">
        プロフィールを編集
      </button>
    </div>
  );
}
