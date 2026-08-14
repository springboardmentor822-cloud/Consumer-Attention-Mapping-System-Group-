import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import ComponentErrorBoundary from "../../../components/ComponentErrorBoundary";


export default function ProductAttractivenessPage() {
  const ragData = [
    { subject: "Visibility", score: 88 },
    { subject: "Attraction", score: 74 },
    { subject: "Engagement", score: 82 },
    { subject: "Conversion", score: 70 },
    { subject: "Interaction", score: 78 },
    { subject: "Promo Lift", score: 91 },
  ];

  return (
    <div className="space-y-5 font-sans">
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-white">✨ Product Attractiveness RAG Index</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attractiveness Vector Map</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={ragData}>
                <PolarGrid stroke="#273449" />
                <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={10} />
                <PolarRadiusAxis stroke="#273449" fontSize={8} />
                <Radar name="Product Score" dataKey="score" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Attractiveness Rankings</h3>
          <div className="space-y-3">
            {[
              { rank: "#1", name: "Artisan Whole Wheat Bread", score: "96 Attractiveness", tag: "High Appeal" },
              { rank: "#2", name: "Organic Almond Milk 1L", score: "91 Attractiveness", tag: "High Appeal" },
              { rank: "#3", name: "Gourmet Dark Chocolate Bar", score: "84 Attractiveness", tag: "Medium Appeal" }
            ].map((p, idx) => (
              <div key={idx} className="bg-[#172033] border border-[#273449] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-extrabold text-xs mr-2">{p.rank}</span>
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.score}</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-lg">
                  {p.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
