import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, AlertCircle, ShoppingBag, Eye, Heart, TrendingUp, Info, HelpCircle } from 'lucide-react';

interface PageProps {
  storeId: string;
  token: string | null;
}

interface BehaviorItem {
  product_name: string;
  category: string;
  views: number;
  pickups: number;
  returns: number;
  purchases: number;
  ignore_rate: number;
  attractiveness_score: number;
}

type SortField = 'attractiveness_score' | 'views' | 'interactions' | 'purchases' | 'rate';

export default function ShoppingBehaviour({ storeId, token }: PageProps) {
  const [shoppingBehavior, setShoppingBehavior] = useState<BehaviorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('attractiveness_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [dashRes, attrRes] = await Promise.all([
          fetch(`http://localhost:8000/api/dashboards/analyst/${storeId}`, { headers }),
          fetch(`http://localhost:8000/api/analytics/attractiveness?store_id=${storeId}`, { headers })
        ]);

        if (!dashRes.ok || !attrRes.ok) {
          throw new Error("Failed to load shopping behavior or attractiveness metrics");
        }

        const dashJson = await dashRes.json();
        const attrJson = await attrRes.json();

        // Match attractiveness score to shopping behavior items
        const matchedBehavior = (dashJson.shopping_behavior || []).map((item: any) => {
          const attrItem = attrJson.find((a: any) => a.product_name === item.product_name);
          return {
            ...item,
            attractiveness_score: attrItem ? attrItem.attractiveness_score : 50.0
          };
        });

        setShoppingBehavior(matchedBehavior);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId, token]);

  // Dynamically group interaction metrics by product category for secondary comparisons
  const categoryData = useMemo(() => {
    const map: Record<string, { Visited: number; Interacted: number; Purchased: number }> = {};
    
    shoppingBehavior.forEach(item => {
      const cat = item.category || 'General';
      if (!map[cat]) {
        map[cat] = { Visited: 0, Interacted: 0, Purchased: 0 };
      }
      map[cat].Visited += item.views;
      map[cat].Interacted += item.pickups + item.returns;
      map[cat].Purchased += item.purchases;
    });

    return Object.entries(map).map(([category, vals]) => ({
      category,
      Visited: vals.Visited,
      Interacted: vals.Interacted,
      Purchased: vals.Purchased
    }));
  }, [shoppingBehavior]);

  // Totals for KPI metrics
  const totals = useMemo(() => {
    let visited = 0;
    let interacted = 0;
    let purchased = 0;
    shoppingBehavior.forEach(item => {
      visited += item.views;
      interacted += item.pickups + item.returns;
      purchased += item.purchases;
    });
    return { visited, interacted, purchased };
  }, [shoppingBehavior]);

  // Top Product Insight Card
  const topProduct = useMemo(() => {
    if (shoppingBehavior.length === 0) return null;
    return [...shoppingBehavior].sort((a, b) => b.views - a.views)[0];
  }, [shoppingBehavior]);

  // Attention -> Purchase Insight Card
  const attentionPurchaseInsight = useMemo(() => {
    if (!topProduct) return null;
    const totalViews = topProduct.views;
    const totalPicks = topProduct.pickups;
    const totalPurchases = topProduct.purchases;
    const conv = totalPicks > 0 ? (totalPurchases / totalPicks) : 0;

    if (totalViews > 50 && conv < 0.08) {
      return {
        status: "High attention, low conversion",
        desc: `Product '${topProduct.product_name}' has significant views (${totalViews}) but low purchase conversion. Consider package changes, layout relocation, or pricing audits.`,
        priority: "High"
      };
    }
    if (conv >= 0.15 && totalPurchases > 0) {
      return {
        status: "Strong conversion",
        desc: `Represents robust purchase conversion rate of ${(conv * 100).toFixed(0)}% for '${topProduct.product_name}'. Optimize inventory levels to prevent shelf stockout.`,
        priority: "Medium"
      };
    }
    return {
      status: "Stable performance",
      desc: "Shopper shelf attention translates to normal purchase rates across standard category items.",
      priority: "Low"
    };
  }, [topProduct]);

  // Ranked Products list for Attractiveness Ranking chart
  const rankedAttractivenessData = useMemo(() => {
    return [...shoppingBehavior]
      .sort((a, b) => b.attractiveness_score - a.attractiveness_score)
      .map(item => ({
        name: item.product_name,
        Attractiveness: item.attractiveness_score
      }));
  }, [shoppingBehavior]);

  // Max values for relative progress indicators
  const maxViewsVal = useMemo(() => {
    return Math.max(...shoppingBehavior.map(p => p.views), 1);
  }, [shoppingBehavior]);

  const maxInteractionsVal = useMemo(() => {
    return Math.max(...shoppingBehavior.map(p => p.pickups + p.returns), 1);
  }, [shoppingBehavior]);

  // Sortable and parsed products list
  const sortedProductTable = useMemo(() => {
    return shoppingBehavior.map((item, idx) => {
      const rateNum = item.pickups > 0 ? (item.purchases / item.pickups) : 0;
      return {
        id: idx + 1,
        name: item.product_name,
        category: item.category,
        views: item.views,
        interactions: item.pickups + item.returns,
        ratePct: rateNum * 100,
        rate: item.pickups > 0 ? `${Math.round(rateNum * 100)}%` : '0%',
        attractiveness_score: item.attractiveness_score,
        purchases: item.purchases,
        revenue: `₹ ${(item.purchases * 350).toLocaleString()}`
      };
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'rate') {
        comparison = a.ratePct - b.ratePct;
      } else {
        comparison = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [shoppingBehavior, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const hasData = shoppingBehavior.length > 0;

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2 w-5 h-5 text-cyan-500" />
      <span className="text-xs font-semibold uppercase tracking-wider">Loading shopper behavior matrices...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 p-4">
      <AlertCircle className="text-rose-500 w-10 h-10 mb-2" />
      <span className="text-xs font-semibold">{error}</span>
    </div>
  );

  if (!hasData) return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-slate-500 bg-[#07070f] rounded-xl p-8 text-center border border-slate-900 max-w-lg mx-auto shadow-xl">
      <ShoppingBag className="w-10 h-10 text-slate-800 mb-3" />
      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">NO TELEMETRY</span>
      <span className="text-[10px] text-slate-600 mt-2 leading-relaxed">No shopping behaviour data is currently available for this store. Verify pipeline status or select another store.</span>
    </div>
  );

  const interactConversion = totals.visited > 0 ? ((totals.interacted / totals.visited) * 100).toFixed(1) + '%' : 'N/A';
  const purchaseConversion = totals.interacted > 0 ? ((totals.purchased / totals.interacted) * 100).toFixed(1) + '%' : 'N/A';

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Dynamic Data Provenance and Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Shopping Behaviour</h1>
          <p className="text-xs text-slate-400 mt-0.5">Evaluate product attention and action-based conversion rates</p>
        </div>
        <div className="mt-2 md:mt-0 flex items-center space-x-2 bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-lg text-[9px] text-slate-400 font-medium">
          <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>Telemetry Source: Seeded / Derived Interaction Data (Derived from database records).</span>
        </div>
      </div>

      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        
        {/* Total Products */}
        <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-4 shadow-md">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Products</span>
          <span className="text-xl font-mono font-extrabold text-slate-200 mt-1 block">{shoppingBehavior.length}</span>
        </div>

        {/* Visited Card */}
        <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Views / Attention</span>
            <span className="text-xl font-mono font-extrabold text-blue-400">{totals.visited.toLocaleString()}</span>
          </div>
          <div className="w-[35%] h-[32px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <Bar dataKey="Visited" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interacted Card */}
        <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Pickups / Interacted</span>
            <span className="text-xl font-mono font-extrabold text-emerald-400">{totals.interacted.toLocaleString()}</span>
          </div>
          <div className="w-[35%] h-[32px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <Bar dataKey="Interacted" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purchased Card */}
        <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Purchases</span>
            <span className="text-xl font-mono font-extrabold text-indigo-400">{totals.purchased.toLocaleString()}</span>
          </div>
          <div className="w-[35%] h-[32px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <Bar dataKey="Purchased" fill="#818cf8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Product Attractiveness and Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Product Attractiveness Ranking */}
        <div className="lg:col-span-8 bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl flex flex-col space-y-4">
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-cyan-400" /> Product Attractiveness Ranking
            </span>
            <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-900">
              0-100 NORMALIZED SCORE
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={rankedAttractivenessData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161625" />
                <XAxis type="number" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#475569" fontSize={8} tickLine={false} width={110} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090910', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '8px' }}
                />
                <Bar dataKey="Attractiveness" fill="#6366f1" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Funnel */}
        <div className="lg:col-span-4 bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Attention Funnel</span>
          <div className="flex flex-col space-y-4 items-center py-2 flex-grow justify-center">
            
            {/* Visited */}
            <div className="w-full max-w-[180px] bg-[#12121e] border border-slate-850 p-2 rounded-lg text-center shadow-sm">
              <div className="text-[8px] text-slate-500 font-bold uppercase">Visited (Views)</div>
              <div className="text-sm font-bold font-mono text-blue-400">{totals.visited.toLocaleString()}</div>
            </div>

            {/* Conversion rate arrow */}
            <div className="flex flex-col items-center">
              <span className="text-slate-600 font-bold text-[9px]">➔</span>
              <span className="text-[8px] bg-slate-950 text-cyan-400 font-mono px-1.5 py-0.5 rounded-full border border-slate-900 shadow mt-0.5">{interactConversion}</span>
            </div>

            {/* Interacted */}
            <div className="w-full max-w-[180px] bg-[#12121e] border border-slate-850 p-2 rounded-lg text-center shadow-sm">
              <div className="text-[8px] text-slate-500 font-bold uppercase">Interacted (Pickups + Returns)</div>
              <div className="text-sm font-bold font-mono text-emerald-400">{totals.interacted.toLocaleString()}</div>
            </div>

            {/* Conversion rate arrow */}
            <div className="flex flex-col items-center">
              <span className="text-slate-650 font-bold text-[9px]">➔</span>
              <span className="text-[8px] bg-slate-950 text-cyan-400 font-mono px-1.5 py-0.5 rounded-full border border-slate-900 shadow mt-0.5">{purchaseConversion}</span>
            </div>

            {/* Purchased */}
            <div className="w-full max-w-[180px] bg-[#12121e] border border-slate-850 p-2 rounded-lg text-center shadow-sm">
              <div className="text-[8px] text-slate-500 font-bold uppercase">Purchased (Sales)</div>
              <div className="text-sm font-bold font-mono text-indigo-400">{totals.purchased.toLocaleString()}</div>
            </div>

          </div>
        </div>

      </div>

      {/* Row 3: Attractiveness Methodology Model & recommendations Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Attractiveness Model Methodology Panel */}
        <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block flex items-center">
            <HelpCircle className="w-4 h-4 mr-1.5 text-cyan-400" /> Product Attractiveness Model
          </span>
          <div className="grid grid-cols-5 gap-2 text-center text-[8px] text-slate-400 font-bold">
            <div className="bg-[#12121e] border border-slate-900 p-2 rounded">
              <div className="text-slate-500">Attention (A)</div>
              <div className="text-cyan-400 font-mono text-xs mt-1">35%</div>
            </div>
            <div className="bg-[#12121e] border border-slate-900 p-2 rounded">
              <div className="text-slate-500">Interaction (I)</div>
              <div className="text-cyan-400 font-mono text-xs mt-1">25%</div>
            </div>
            <div className="bg-[#12121e] border border-slate-900 p-2 rounded">
              <div className="text-slate-500">Pickup (P)</div>
              <div className="text-cyan-400 font-mono text-xs mt-1">20%</div>
            </div>
            <div className="bg-[#12121e] border border-slate-900 p-2 rounded">
              <div className="text-slate-500">Conversion (C)</div>
              <div className="text-cyan-400 font-mono text-xs mt-1">15%</div>
            </div>
            <div className="bg-[#12121e] border border-slate-900 p-2 rounded">
              <div className="text-slate-500">Repeat (R)</div>
              <div className="text-cyan-400 font-mono text-xs mt-1">5%</div>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 leading-normal font-medium">
            Scores are calculated by the backend using normalized interaction metrics: 
            <span className="text-slate-400 font-mono ml-1">Score = 0.35A + 0.25I + 0.20P + 0.15C + 0.05R</span>
          </p>
        </div>

        {/* Dynamic Store Manager Recommendations Redirect Card */}
        <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block flex items-center">
            <Info className="w-4 h-4 mr-1.5 text-cyan-400" /> Product Optimization Insights
          </span>
          <div className="bg-[#12121e] border border-slate-900 p-3 rounded-lg flex-grow flex items-center justify-between">
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-[80%]">
              Actionable shelf re-allocation, eye-level adjustments, and optimization suggestions are generated by the backend rule system.
            </p>
            <span className="text-[8px] font-mono text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded">
              Exposed in Store Manager
            </span>
          </div>
          <p className="text-[8px] text-slate-500 italic">
            *Optimization recommendations are available under Store Manager → Recommendations.
          </p>
        </div>

      </div>

      {/* Row 4: Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dynamic Top Product Card */}
        {topProduct && (
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl shadow-inner">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-grow space-y-1">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Top product (By Views)</span>
              <span className="text-xs font-bold text-slate-200 block truncate">{topProduct.product_name}</span>
              <div className="flex space-x-3 text-[9px] font-mono text-slate-450 leading-normal">
                <span>Views: <strong className="text-blue-400">{topProduct.views}</strong></span>
                <span>Interactions: <strong className="text-emerald-400">{topProduct.pickups + topProduct.returns}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Attention → Purchase Insight Card */}
        {attentionPurchaseInsight && (
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shadow-inner">
              <Heart className="w-5 h-5" />
            </div>
            <div className="flex-grow space-y-1 min-w-0">
              <div className="flex justify-between items-center min-w-0">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Attention ➔ Purchase Insight</span>
                <span className={`text-[7px] px-1.5 py-0.2 rounded font-extrabold uppercase scale-90 ${attentionPurchaseInsight.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-950 text-slate-500 border border-slate-900'}`}>
                  {attentionPurchaseInsight.priority} Priority
                </span>
              </div>
              <span className="text-xs font-bold text-slate-200 block truncate">{attentionPurchaseInsight.status}</span>
              <p className="text-[9px] text-slate-450 leading-relaxed truncate">{attentionPurchaseInsight.desc}</p>
            </div>
          </div>
        )}

      </div>

      {/* Row 5: Detailed Product Performance Table */}
      <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Detailed Product Performance</span>
        <div className="overflow-x-auto text-xs font-semibold text-slate-350">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[8px] uppercase tracking-wider pb-2 select-none">
                <th className="pb-2 w-[25%] cursor-pointer" onClick={() => handleSort('attractiveness_score')}>
                  Product Name {sortField === 'attractiveness_score' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-center cursor-pointer" onClick={() => handleSort('views')}>
                  Views {sortField === 'views' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="pb-2 text-center cursor-pointer" onClick={() => handleSort('interactions')}>
                  Interactions {sortField === 'interactions' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="pb-2 text-center cursor-pointer" onClick={() => handleSort('rate')}>
                  Purchase Rate {sortField === 'rate' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="pb-2 text-center cursor-pointer" onClick={() => handleSort('purchases')}>
                  Sales {sortField === 'purchases' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="pb-2 text-right pr-2 cursor-pointer" onClick={() => handleSort('attractiveness_score')}>
                  Attractiveness Score {sortField === 'attractiveness_score' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {sortedProductTable.map((p) => {
                const itemRaw = shoppingBehavior.find(s => s.product_name === p.name);
                const rawViews = itemRaw ? itemRaw.views : 0;
                const rawInteractions = itemRaw ? (itemRaw.pickups + itemRaw.returns) : 0;
                const viewsPercent = Math.min(100, Math.round((rawViews / maxViewsVal) * 100));
                const interactPercent = Math.min(100, Math.round((rawInteractions / maxInteractionsVal) * 100));

                return (
                  <tr key={p.id} className="hover:bg-slate-900/40 border-b border-slate-900/30 transition-colors">
                    <td className="py-3 text-slate-200 font-bold">{p.name}</td>
                    <td className="py-3 text-slate-500">{p.category}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-center space-x-2 font-mono text-[9px]">
                        <span className="w-7 text-right">{p.views}</span>
                        <div className="w-16 h-1 bg-slate-950 rounded-full overflow-hidden flex-shrink-0">
                          <div className="h-full bg-blue-500" style={{ width: `${viewsPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center space-x-2 font-mono text-[9px]">
                        <span className="w-7 text-right text-indigo-400">{p.interactions}</span>
                        <div className="w-16 h-1 bg-slate-950 rounded-full overflow-hidden flex-shrink-0">
                          <div className="h-full bg-emerald-500" style={{ width: `${interactPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                        {p.rate}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono text-slate-400">{itemRaw?.purchases || 0}</td>
                    <td className="py-3 text-right pr-2">
                      <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-extrabold font-mono px-2 py-0.5 rounded text-xs">
                        {p.attractiveness_score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
