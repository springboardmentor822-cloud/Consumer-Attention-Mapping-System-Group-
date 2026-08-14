"use client";
import React, { useEffect, useState } from 'react';

interface CategoryMetric {
  name: string;
  revenue: number;
  units: number;
  share: number;
}

export default function CategoryTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [categories, setCategories] = useState<CategoryMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:9000/api/v1/dashboard/category-performance?time_filter=${timeFilter}`);
        const data = await res.json();
        if (isMounted && data.status === "success") setCategories(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [timeFilter]);

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold">Category Performance Analytics</h3>
            <p className="text-sm text-slate-400 mt-1">Revenue, unit volume, and share — all computed directly from the sales dataset.</p>
          </div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 rounded-lg">
            Live Sync: supermarket_sales.csv
          </span>
        </div>

        {loading ? (
          <div className="text-cyan-400 font-mono text-sm animate-pulse py-10 text-center">Aggregating Category Metrics...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {categories.map((cat, idx) => {
              const avgOrderValue = cat.units > 0 ? cat.revenue / cat.units : 0;
              return (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row items-center gap-6">

                  <div className="w-full lg:w-1/4">
                    <h4 className="text-xl font-bold text-slate-100">{cat.name}</h4>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      ${cat.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-slate-500 uppercase font-bold mt-1">Total Revenue</p>
                  </div>

                  <div className="w-full lg:w-2/4 flex flex-col space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Revenue Share</span>
                      <span className="font-bold text-slate-200">{cat.share}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${cat.share}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 pt-2">
                      <span>Units Moved: <span className="text-slate-200 font-bold">{cat.units}</span></span>
                    </div>
                  </div>

                  <div className="w-full lg:w-1/4 bg-slate-900 border border-slate-700 rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Avg Unit Price</p>
                    <p className="text-xl font-bold text-purple-400 mt-1">${avgOrderValue.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
