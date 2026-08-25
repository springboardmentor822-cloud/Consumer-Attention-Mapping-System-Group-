"use client";
import React, { useEffect, useState } from 'react';

interface ProductData {
  category: string;
  sku_prefix: string;
  units_sold: number;
  revenue: number;
  avg_price: number;
}

export default function ProductsTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/backend/v1/dashboard/products?time_filter=${timeFilter}`, { credentials: 'include' });
        const data = await res.json();
        if (isMounted && data.status === "success") setProducts(data.data);
      } catch (err) {
        console.error("Products fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [timeFilter]);

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.units_sold, 0);
  const topCategory = products.length > 0 ? products[0].category : "Loading...";
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div><h2 className="text-xl font-bold">Product Performance & Inventory</h2><p className="text-xs text-slate-400 mt-1">Sales telemetry from the retail sales dataset</p></div>
        <div className="flex space-x-2">
          <button onClick={() => alert("Adding products isn't wired to real backend logic yet — the product list here is derived directly from the sales CSV, not an editable inventory table.")} className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600/30 transition-colors">
            + Add Product
          </button>
          <button onClick={() => alert("Removing products isn't wired to real backend logic yet — the product list here is derived directly from the sales CSV, not an editable inventory table.")} className="bg-rose-600/20 text-rose-400 border border-rose-600/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-600/30 transition-colors">
            - Remove Product
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-inner"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Gross Revenue</span><p className="text-3xl font-bold text-emerald-400 mt-2">{loading ? "..." : formatCurrency(totalRevenue)}</p></div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-inner"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Units Moved</span><p className="text-3xl font-bold text-blue-400 mt-2">{loading ? "..." : totalUnits.toLocaleString()}</p></div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-inner"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Performing Class</span><p className="text-3xl font-bold text-purple-400 mt-2">{topCategory}</p></div>
      </div>
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-sm font-bold">Category Financial Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr><th className="px-6 py-4 font-semibold">Category / SKU</th><th className="px-6 py-4 font-semibold text-right">Units Sold</th><th className="px-6 py-4 font-semibold text-right">Avg Price</th><th className="px-6 py-4 font-semibold text-right">Total Revenue</th><th className="px-6 py-4 font-semibold w-1/4">Revenue Share</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (<tr><td colSpan={5} className="px-6 py-8 text-center text-cyan-400 text-xs font-mono animate-pulse">Aggregating...</td></tr>) : (
                products.map((product, idx) => {
                  const sharePercent = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4"><div className="font-bold text-slate-200">{product.category}</div><div className="text-[10px] text-slate-500 font-mono mt-0.5">{product.sku_prefix}</div></td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300">{product.units_sold.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300">{formatCurrency(product.avg_price)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(product.revenue)}</td>
                      <td className="px-6 py-4"><div className="flex items-center space-x-2"><div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{ width: `${sharePercent}%` }}></div></div><span className="text-[10px] text-slate-400 font-mono w-8 text-right">{sharePercent.toFixed(1)}%</span></div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}