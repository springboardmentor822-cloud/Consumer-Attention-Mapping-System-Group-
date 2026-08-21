import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StoreFloorMapHeatmap } from '../heatmaps/StoreFloorMapHeatmap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell 
} from 'recharts';
import { Sparkles, Sliders } from 'lucide-react';

interface AnalystDashboardProps {
  onOpenCalibration?: () => void;
}

export const RetailAnalystDashboard: React.FC<AnalystDashboardProps> = ({ onOpenCalibration }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    api.getAnalystDashboard('STORE-812')
      .then((res) => { if (mounted) setData(res); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading Retail Analyst Behavioral Telemetry & Heatmap Matrices...
      </div>
    );
  }

  const { segment_distribution, shopping_behavior, behavior_scatter, attractiveness_rankings } = data;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const filteredProducts = attractiveness_rankings.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between bg-[#0f172a] p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white">Retail Analyst Trajectory & Behavioral Analytics</h2>
          <p className="text-xs text-slate-400">Deep shopper spatial pathing, dwell distributions, homography KDE matrices, and attractiveness scoring</p>
        </div>
        {onOpenCalibration && (
          <button
            onClick={onOpenCalibration}
            className="px-4 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-2"
          >
            <Sliders className="w-4 h-4" />
            <span>Calibrate Camera Homography</span>
          </button>
        )}
      </div>

      {/* 2D Spatial Heatmap Engine */}
      <StoreFloorMapHeatmap storeId="STORE-812" />

      {/* Dwell & Shopper Segmentation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shopper Segment Distribution */}
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Shopper Behavioral Segmentation (5 Profiles)</h3>
            <span className="text-xs text-slate-400">K-Means + Explainable Rules</span>
          </div>
          <div className="bi-card-body h-64 flex items-center">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={segment_distribution} dataKey="count" nameKey="segment_name" cx="50%" cy="50%" innerRadius={40} outerRadius={75}>
                  {segment_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-45% space-y-2 text-xs">
              {segment_distribution.map((s: any, idx: number) => (
                <div key={s.segment_name} className="space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">{s.segment_name}</span>
                    <span className="text-indigo-400 font-bold">{s.percentage}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between font-mono">
                    <span>Avg Dwell: {s.avg_dwell_sec}s</span>
                    <span>Path: {s.avg_distance_m}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Interaction Bars */}
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Shopping Behavior (Viewed vs Ignored vs Compared)</h3>
            <span className="text-xs text-slate-400">Product Engagement</span>
          </div>
          <div className="bi-card-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopping_behavior}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="viewed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compared" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ignored" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Behavior Scatter (Attention vs Purchase Conversion) */}
      <div className="bi-card">
        <div className="bi-card-header">
          <h3 className="font-bold text-sm text-white">Attention vs Purchase Conversion Bubble Scatter</h3>
          <span className="text-xs text-slate-400">Bubble size = Pickups</span>
        </div>
        <div className="bi-card-body h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" dataKey="attention_sec" name="Attention Duration (s)" stroke="#64748b" fontSize={11} />
              <YAxis type="number" dataKey="conversion_rate" name="Conversion Rate (%)" stroke="#64748b" fontSize={11} />
              <ZAxis type="number" dataKey="pickups" range={[60, 400]} name="Pickups" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Scatter name="SKUs" data={behavior_scatter} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filterable Product Attractiveness Ranking Table */}
      <div className="bi-card">
        <div className="bi-card-header flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Product Attractiveness Rankings (Formula: 0.35A + 0.25I + 0.20P + 0.15C + 0.05R)</h3>
          </div>
          <input
            type="text"
            placeholder="Search SKU or Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white text-[#0f172a] font-bold text-xs px-3.5 py-1.5 rounded-xl focus:outline-none border-2 border-slate-300 w-56 shadow-sm"
            style={{ color: '#0f172a' }}
          />
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
                <th className="px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredProducts.map((p: any) => (
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
