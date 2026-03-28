"use client";

export default function Ranking() {
  const rankings = [
    { rank: 1, name: "Masa", points: 1540, growth: "+15%" },
    { rank: 2, name: "Tomo", points: 1200, growth: "+8%" },
    { rank: 3, name: "Satoshi", points: 980, growth: "+12%" },
    { rank: 4, name: "Ken", points: 850, growth: "+5%" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ランキング</h2>
      
      <div className="flex gap-2 p-1 bg-[#16162a] rounded-xl border border-white/5">
        <button className="flex-1 py-2 text-xs font-bold bg-[#6c5ce7] rounded-lg shadow-lg">成長率</button>
        <button className="flex-1 py-2 text-xs font-bold text-[#555570]">累計ポイント</button>
      </div>

      <div className="space-y-2">
        {rankings.map(item => (
          <div key={item.rank} className="bg-[#16162a] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
              item.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' : 
              item.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
              item.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-red-600 text-white' :
              'bg-[#0a0a0f] text-[#555570]'
            }`}>
              {item.rank}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{item.name}</p>
              <p className="text-[10px] text-[#555570]">スコア: {item.points} pt</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-[#00e676]">{item.growth}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
