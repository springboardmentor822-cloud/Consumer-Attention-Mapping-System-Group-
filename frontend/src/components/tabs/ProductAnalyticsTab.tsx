"use client";
import React, { useEffect, useState } from 'react';

// Define the shapes of our API data
interface Product {
  category: string;
  sku_prefix: string;
  units_sold: number;
  revenue: number;
  avg_price: number;
  live_pickups: number;
  live_comparisons: number;
}

interface AttractivenessScore {
  category: string;
  raw_metrics: {
    att_s: number;
    intx: number;
    pick: number;
    conv: number;
    rep: number;
  };
  attractiveness_score: number;
}

export default function ProductAnalyticsTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [scores, setScores] = useState<AttractivenessScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [prodRes, scoreRes] = await Promise.all([
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/products?time_filter=${timeFilter}`),
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/attractiveness`)
        ]);
        
        const prodData = await prodRes.json();
        const scoreData = await scoreRes.json();

        if (isMounted) {
          if (prodData.status === "success") setProducts(prodData.data);
          if (scoreData.status === "success") setScores(scoreData.data);
        }
      } catch (err) {
        console.error("Failed to fetch product analytics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => { isMounted = false; };
  }, [timeFilter]);

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500">
      
      {/* 1. AI ATTRACTIVENESS SCORING LEADERBOARD */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-200">AI Attractiveness Scoring</h3>
          <p className="text-slate-400 text-sm mt-1">
            Composite AI score based on Attention (35%), Interaction (25%), Pickup (20%), Conversion (15%), and Repeat (5%).
          </p>
        </div>

        {loading ? (
          <div className="text-purple-400 font-mono text-sm animate-pulse py-8 text-center">Calculating composite weights...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scores.map((score, idx) => {
              // Determine medal colors for top 3
              const medalColor = idx === 0 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' : 
                                 idx === 1 ? 'text-slate-300 bg-slate-300/10 border-slate-300/30' : 
                                 'text-amber-600 bg-amber-600/10 border-amber-600/30';

              return (
                <div key={idx} className={`border rounded-xl p-4 flex flex-col justify-between ${medalColor}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider">{score.category}</span>
                    <span className="text-2xl font-black">
                      {score.attractiveness_score}<span className="text-sm font-normal opacity-70">/100</span>
                    </span>
                  </div>
                  
                  {/* Micro-metrics breakdown */}
                  <div className="grid grid-cols-5 gap-1 text-center divide-x divide-white/10 mt-auto pt-3 border-t border-white/10">
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">Att</p>
                      <p className="text-xs font-bold">{score.raw_metrics.att_s}s</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">Int</p>
                      <p className="text-xs font-bold">{score.raw_metrics.intx}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">Pik</p>
                      <p className="text-xs font-bold">{score.raw_metrics.pick}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">Cnv</p>
                      <p className="text-xs font-bold">{score.raw_metrics.conv}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">Rep</p>
                      <p className="text-xs font-bold">{score.raw_metrics.rep}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. HYBRID METRICS & SALES DATA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-200">Historical Sales & Live Interaction Pipeline</h3>
            <p className="text-slate-400 text-sm mt-1">Fusing POS sales data with live computer vision CV tracking.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
             <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Re-ID Active</span>
            </div>
            <button className="bg-slate-800 hover:bg-slate-700 transition-colors text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700">Export CSV</button>
          </div>
        </div>

        {loading ? (
          <div className="text-cyan-400 font-mono text-sm animate-pulse text-center py-12">Syncing CV tracking with sales telemetry...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No product data available for this date range.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, index) => {
              const totalInteractions = p.live_pickups + p.units_sold;
              const conversionRate = totalInteractions > 0 
                ? Math.round((p.units_sold / totalInteractions) * 100) 
                : 0;

              return (
                <div key={index} className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-colors duration-300">
                  <div className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider border-b border-l border-cyan-500/30">
                    {p.category}
                  </div>
                  
                  {/* CSV Sales Data Block */}
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">{p.sku_prefix}</p>
                  <p className="text-lg font-bold text-slate-200 mb-2">{p.category}</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${p.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-xs text-slate-500 font-normal ml-2">Revenue</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Units Sold: <span className="font-bold text-slate-300">{p.units_sold}</span></p>

                  {/* CV Live Action Metrics Block */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3 text-center border-b border-slate-800 pb-2">Live Camera Interactions</h4>
                    <div className="grid grid-cols-3 gap-2 divide-x divide-slate-800">
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-400">{p.live_pickups}</p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase">Pickups</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-purple-400">{p.live_comparisons}</p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase">Comparisons</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-emerald-400">{conversionRate}%</p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase">Conv Rate</p>
                      </div>
                    </div>
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