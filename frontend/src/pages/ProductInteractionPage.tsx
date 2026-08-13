import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, RefreshCw, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface AttractivenessProduct {
  product_id: string;
  product_name: string;
  views: number;
  pickups: number;
  compares: number;
  purchases: number;
  attractiveness_score: number;
}

interface ProductInteractionPageProps {
  storeId: string;
  token: string | null;
}

type SortField = 'attractiveness_score' | 'views' | 'pickups' | 'compares' | 'purchases';

export default function ProductInteractionPage({ storeId, token }: ProductInteractionPageProps) {
  const [products, setProducts] = useState<AttractivenessProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('attractiveness_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/analytics/attractiveness?store_id=${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load product attractiveness scores");
      const json = await res.json();
      setProducts(json || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 8000);
    return () => clearInterval(interval);
  }, [storeId]);

  // Sort logic
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      return sortAsc ? (valA - valB) : (valB - valA);
    });
  }, [products, sortField, sortAsc]);

  // Bar chart data for interactions
  const barChartData = useMemo(() => {
    return sortedProducts.slice(0, 5).map(p => ({
      product: p.product_name,
      Picked: p.pickups,
      Compared: p.compares,
      Purchased: p.purchases
    }));
  }, [sortedProducts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2 w-5 h-5 text-indigo-500" />
      <span className="text-xs font-semibold uppercase tracking-wider">Synchronizing attractiveness indices...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 p-4">
      <AlertCircle className="text-rose-500 w-10 h-10 mb-2" />
      <span className="text-xs font-semibold">{error}</span>
    </div>
  );

  const hasData = products.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-850">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Package className="w-5 h-5 mr-2 text-indigo-400" /> Product Attractiveness & Interactions
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live product engagement ratings and conversion indices</p>
        </div>
      </div>

      {/* Main Grid: Bar Chart and Table */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Interaction chart of Top 5 products */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Interactions breakdown (Top 5)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5"> shopper interest counts mapped per SKU</p>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            {!hasData && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-slate-700 mb-1" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">No active interaction telemetry</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#131322" />
                <XAxis dataKey="product" stroke="#475569" fontSize={8.5} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090f', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                />
                <Bar dataKey="Picked" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Compared" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Purchased" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Attractiveness Scoring Matrix Table */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Product Attractiveness Matrix</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Calculated Attractiveness Rating based on weighted attention-to-purchase telemetry</p>
          </div>

          <div className="overflow-x-auto text-xs font-semibold text-slate-350">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[8px] uppercase tracking-wider pb-2 cursor-pointer select-none">
                  <th className="pb-2">Rank</th>
                  <th className="pb-2">Product Name</th>
                  
                  <th className="pb-2 text-center" onClick={() => handleSort('attractiveness_score')}>
                    <span className="inline-flex items-center">
                      Attractiveness Score
                      {sortField === 'attractiveness_score' && (sortAsc ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                    </span>
                  </th>
                  
                  <th className="pb-2 text-center" onClick={() => handleSort('views')}>
                    <span className="inline-flex items-center">
                      Attention (Views)
                      {sortField === 'views' && (sortAsc ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                    </span>
                  </th>

                  <th className="pb-2 text-center" onClick={() => handleSort('pickups')}>
                    <span className="inline-flex items-center">
                      Pickups
                      {sortField === 'pickups' && (sortAsc ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                    </span>
                  </th>

                  <th className="pb-2 text-center" onClick={() => handleSort('compares')}>
                    <span className="inline-flex items-center">
                      Comparisons
                      {sortField === 'compares' && (sortAsc ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                    </span>
                  </th>

                  <th className="pb-2 text-center" onClick={() => handleSort('purchases')}>
                    <span className="inline-flex items-center">
                      Purchases
                      {sortField === 'purchases' && (sortAsc ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {hasData ? (
                  sortedProducts.map((p, idx) => (
                    <tr key={p.product_id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 text-slate-500 font-mono">#{idx + 1}</td>
                      <td className="py-2.5 text-slate-200">{p.product_name}</td>
                      
                      <td className="py-2.5 text-center font-bold">
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                          {p.attractiveness_score}%
                        </span>
                      </td>

                      <td className="py-2.5 text-center text-slate-350">{p.views}</td>
                      <td className="py-2.5 text-center text-emerald-450">{p.pickups}</td>
                      <td className="py-2.5 text-center text-amber-450">{p.compares}</td>
                      <td className="py-2.5 text-center text-blue-450">{p.purchases}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-550 italic">
                      No product telemetry available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
