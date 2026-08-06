import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ProductVisibilityPage() {
  const [shelves, setShelves] = useState([
    { id: 1, shelf: "Shelf A (Bakery Endcap)", score: 94, category: "Bakery", footfall: "14,200" },
    { id: 2, shelf: "Shelf D (Cosmetics Wall)", score: 91, category: "Beauty", footfall: "12,100" },
    { id: 3, shelf: "Shelf B (Dairy Eye-Level)", score: 88, category: "Dairy", footfall: "9,800" },
    { id: 4, shelf: "Shelf C (Snacks Middle)", score: 81, category: "Snacks", footfall: "8,400" },
  ]);

  const [shelfName, setShelfName] = useState("");
  const [scoreVal, setScoreVal] = useState("");

  return (
    <div className="space-y-5 font-sans">
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-white">👁️ Product Visibility Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track and update shelf-level eye gaze fixations & visibility scores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visibility Score Index by Shelf</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={shelves}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <YAxis type="category" dataKey="shelf" stroke="#64748B" fontSize={10} width={150} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449" }} />
                <Bar dataKey="score" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Visibility Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Update Shelf Visibility</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Shelf Name (e.g. Endcap B2)"
              value={shelfName}
              onChange={(e) => setShelfName(e.target.value)}
              className="w-full px-3 py-2 bg-[#172033] border border-[#273449] rounded-xl text-xs text-white"
            />
            <input
              type="number"
              placeholder="Visibility Score (0-100)"
              value={scoreVal}
              onChange={(e) => setScoreVal(e.target.value)}
              className="w-full px-3 py-2 bg-[#172033] border border-[#273449] rounded-xl text-xs text-white"
            />
            <button
              onClick={() => {
                if (shelfName && scoreVal) {
                  setShelves((prev) => [
                    ...prev,
                    { id: Date.now(), shelf: shelfName, score: parseInt(scoreVal), category: "General", footfall: "5,000" }
                  ]);
                  setShelfName("");
                  setScoreVal("");
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl transition"
            >
              Add Shelf Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
