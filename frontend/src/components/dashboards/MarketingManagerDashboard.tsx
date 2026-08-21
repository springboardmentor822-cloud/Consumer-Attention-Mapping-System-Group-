import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell 
} from 'recharts';
import { Megaphone, TrendingUp, Sparkles, Target, ArrowUpRight, DollarSign, Award } from 'lucide-react';

export const MarketingManagerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    api.getMarketingDashboard('STORE-812')
      .then((res) => { if (mounted) setData(res); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading Marketing Manager Campaign Lift & Visibility Telemetry...
      </div>
    );
  }

  const { campaigns, promotion_lift, visibility_radar, attractiveness_scores, engagement_breakdown, recommendation_matrix } = data;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top Marketing KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{campaigns.length} Active</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center mt-1">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +52.4% Max Lift
          </div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Campaign Sales Lift</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">+$12,800</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">Incremental promo revenue</div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Promo Visibility Rank</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">#1 Beverages</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Eye-level promo dominance</div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Avg Conv. Uplift</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">+18.4%</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">Across top 10 SKUs</div>
        </div>
      </div>

      {/* Campaign Comparison & Sales-Lift Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before vs After Campaign Sales */}
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Campaign Before vs After Sales Lift Comparison</h3>
            <span className="text-xs text-slate-400">Revenue Impact</span>
          </div>
          <div className="bi-card-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaigns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="before_sales" name="Before Promo ($)" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="after_sales" name="After Promo ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Promotion Sales Lift Waterfall */}
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Promotion Incremental Lift Waterfall Breakdown</h3>
            <span className="text-xs text-emerald-400 font-semibold">Total: $48,500</span>
          </div>
          <div className="bi-card-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={promotion_lift.waterfall_steps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="step" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visibility Radar & High Impact Priority Decision Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visibility Radar Chart */}
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Shelf Visibility Radar & Factor Breakdown</h3>
            <span className="text-xs text-slate-400">SKU-101 vs SKU-104</span>
          </div>
          <div className="bi-card-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={visibility_radar}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis stroke="#475569" fontSize={10} />
                <Radar name="HydroSpark Citrus" dataKey="A_SKU101" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <Radar name="Keto Crunch Bar" dataKey="B_SKU104" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Marketing Decision Matrix */}
        <div className="bi-card">
          <div className="bi-card-header">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">High-Impact Priority Decision Matrix</h3>
            </div>
          </div>
          <div className="bi-card-body space-y-3">
            {recommendation_matrix.map((rec: any) => (
              <div key={rec.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{rec.action}</div>
                  <div className="text-[11px] text-slate-400">{rec.reason}</div>
                  <div className="text-[10px] text-indigo-400 font-mono mt-1">SKU: {rec.sku} | Shelf: {rec.shelf_id}</div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    +{rec.expected_conversion_uplift}% Uplift
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
