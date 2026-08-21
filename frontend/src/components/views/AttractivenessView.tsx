import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Sparkles, Search } from 'lucide-react';

export const AttractivenessView: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    api.getProductAttractiveness('STORE-812').then((res) => setProducts(res));
  }, []);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Product Attractiveness Scoring (Formula: 0.35A + 0.25I + 0.20P + 0.15C + 0.05R)</h2>
          <p className="text-xs text-slate-400">Category-normalized multi-factor engagement evaluation</p>
        </div>
        <input
          type="text"
          placeholder="Filter SKU or Product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white text-[#0f172a] font-bold text-xs px-3.5 py-2 rounded-xl focus:outline-none border-2 border-slate-300 w-64 shadow-sm"
          style={{ color: '#0f172a' }}
        />
      </div>

      <div className="bi-card">
        <div className="bi-card-header">
          <h3 className="font-bold text-sm text-white">Category-Normalized Scores</h3>
        </div>
        <div className="bi-card-body p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1e293b] text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">SKU & Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Shelf Level</th>
                <th className="px-4 py-3">Attention (A)</th>
                <th className="px-4 py-3">Interactions (I)</th>
                <th className="px-4 py-3">Pickups (P)</th>
                <th className="px-4 py-3">Conversion (C)</th>
                <th className="px-4 py-3">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filtered.map((p) => (
                <tr key={p.product_id} className="hover:bg-slate-800/40 transition-all">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                      {p.shelf_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.normalized_metrics.A}%</td>
                  <td className="px-4 py-3 text-slate-300">{p.normalized_metrics.I}%</td>
                  <td className="px-4 py-3 text-slate-300">{p.normalized_metrics.P}%</td>
                  <td className="px-4 py-3 text-slate-300">{p.normalized_metrics.C}%</td>
                  <td className="px-4 py-3 font-extrabold text-indigo-400 text-sm">{p.final_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
