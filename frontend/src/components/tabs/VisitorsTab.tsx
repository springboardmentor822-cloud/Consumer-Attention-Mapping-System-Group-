"use client";
import React, { useEffect, useState } from 'react';

interface DemographicData {
  label: string;
  count: number;
  percent: number;
}

interface VisitorStats {
  total_visitors: number;
  gender: DemographicData[];
  customer_types: DemographicData[];
  insights: {
    top_converting_demo: string;
  };
}

// Change it to this:
export default function VisitorsTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/backend/v1/dashboard/visitors?time_filter=${timeFilter}`, { credentials: 'include' });
        const data = await res.json();
        if (isMounted && data.status === "success") setStats(data.data);
      } catch (err) {
        console.error("Visitors fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [timeFilter]);

  const getGenderPercent = (label: string) => {
    if (!stats) return 0;
    const match = stats.gender.find(g => g.label.toLowerCase() === label.toLowerCase());
    return match ? match.percent : 0;
  };

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">
      
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Shopper Demographics & Customer Types</h2>
          <p className="text-xs text-slate-400 mt-1">Verified from supermarket_sales - Sheet1.csv</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Gender Distribution Card */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-inner">
          <h3 className="text-sm font-bold text-slate-200 mb-6">Gender Distribution</h3>
          {loading ? (
            <div className="text-center text-xs text-slate-500 animate-pulse py-4">Loading data...</div>
          ) : (
            <div className="space-y-4">
              <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div className="h-full bg-purple-500" style={{ width: `${getGenderPercent('Female')}%` }}></div>
                <div className="h-full bg-blue-500" style={{ width: `${getGenderPercent('Male')}%` }}></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {stats?.gender.map((g, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-slate-400 text-xs">{g.label}</span>
                    <span className="text-xl font-bold">{g.percent}%</span>
                    <span className="text-[10px] text-slate-500">{g.count} transactions</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Customer Type Card (Member vs Normal) */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-inner">
          <h3 className="text-sm font-bold text-slate-200 mb-6">Customer Membership Type</h3>
          {loading ? (
            <div className="text-center text-xs text-slate-500 animate-pulse py-4">Loading data...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {stats?.customer_types.map((t, i) => (
                  <div key={i} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 uppercase font-bold">{t.label}</span>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">{t.percent}%</p>
                    <p className="text-[10px] text-slate-500 mt-1">{t.count} total records</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* CSV-Derived Insight Card */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex items-center space-x-4">
        <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400 text-xl">💡</div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold">Top Revenue Demographic</p>
          <p className="text-lg font-bold text-slate-200">{loading ? "..." : stats?.insights.top_converting_demo}</p>
        </div>
      </div>

    </div>
  );
}