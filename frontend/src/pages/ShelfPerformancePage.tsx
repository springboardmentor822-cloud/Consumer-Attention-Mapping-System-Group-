import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers, RefreshCw } from 'lucide-react';

interface ShelfPoint {
  shelf: string;
  score: number;
}

interface StoreManagerData {
  shelf_performance: ShelfPoint[];
}

interface ShelfPerformancePageProps {
  storeId: string;
  token: string | null;
}

export default function ShelfPerformancePage({ storeId, token }: ShelfPerformancePageProps) {
  const [data, setData] = useState<StoreManagerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchShelf = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/manager/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelf();
    const interval = setInterval(fetchShelf, 8000);
    return () => clearInterval(interval);
  }, [storeId]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2" /> Loading Shelf Performance...
    </div>
  );

  // Mock Viewed vs Picked vs Purchased data mapped to current shelves
  const mockStackedData = data?.shelf_performance.map((shelf, index) => {
    return {
      name: shelf.shelf,
      Viewed: Math.round(shelf.score * 1.5 + 20),
      Picked: Math.round(shelf.score * 0.6 + 5),
      Purchased: Math.round(shelf.score * 0.2 + 2)
    };
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Layers className="w-5 h-5 mr-2 text-indigo-400" /> Shelf Performance Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live shelf engagement ratings and product interactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart (Shelf Engagement Score) */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Horizontal Bar Chart (Shelf Engagement Score)</span>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.shelf_performance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                <YAxis type="category" dataKey="shelf" stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Bar Chart (Viewed vs Picked vs Purchased) */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Stacked Bar Chart (Viewed vs Picked vs Purchased)</span>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockStackedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
                <Bar dataKey="Viewed" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Picked" stackId="a" fill="#eab308" />
                <Bar dataKey="Purchased" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap (Shelf Attention Heatmap) */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 lg:col-span-2">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Heatmap (Shelf Attention Heatmap Grid)</span>
          <div className="grid grid-cols-8 gap-2 bg-[#0f0f18] p-4 rounded-xl border border-slate-850">
            {Array.from({ length: 24 }).map((_, idx) => {
              const intensity = (idx * 7) % 100;
              let bg = "bg-blue-600/30";
              if (intensity > 75) bg = "bg-red-650";
              else if (intensity > 45) bg = "bg-orange-500/80";
              else if (intensity > 25) bg = "bg-green-600/50";
              return (
                <div key={idx} className={`h-10 rounded flex items-center justify-center font-bold text-[9px] text-white ${bg}`}>
                  Region {idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
