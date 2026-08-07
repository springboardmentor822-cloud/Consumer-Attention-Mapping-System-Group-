import React from 'react';
import {
  Target,
  TrendingUp,
  Award,
  Sparkles,
  Eye,
  BarChart3,
  Percent,
  CircleDollarSign,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import KpiCard from '../components/widgets/KpiCard';
import RadarChartWidget from '../components/widgets/RadarChartWidget';
import WaterfallChartWidget from '../components/widgets/WaterfallChartWidget';
import DecisionMatrix from '../components/widgets/DecisionMatrix';
import HeatmapCanvas from '../components/widgets/HeatmapCanvas';
import { mockDashboardData } from '../services/mockDashboardData';

export default function MarketingManagerDashboard() {
  const data = mockDashboardData.marketingManager;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="h-6 w-6 text-amber-400" /> Marketing & Campaign Performance Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate campaign reach, promotional lift, product visibility scores, shelf attractiveness, and AI placement recommendations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 border border-amber-500/20 font-medium">
            Active Campaign Period: <strong>May 16 - May 22, 2025</strong>
          </span>
        </div>
      </div>

      {/* 1. Section: KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Campaign Reach"
          value={data.kpis.campaignReach.value}
          change={data.kpis.campaignReach.change}
          isPositive={true}
          icon={Eye}
          color="indigo"
        />
        <KpiCard
          title="Promotion Engagement"
          value={data.kpis.promotionEngagement.value}
          change={data.kpis.promotionEngagement.change}
          isPositive={true}
          icon={BarChart3}
          color="emerald"
        />
        <KpiCard
          title="Product Visibility"
          value={data.kpis.productVisibility.value}
          change={data.kpis.productVisibility.change}
          isPositive={true}
          icon={Target}
          color="blue"
        />
        <KpiCard
          title="Conversion Rate"
          value={data.kpis.conversionRate.value}
          change={data.kpis.conversionRate.change}
          isPositive={true}
          icon={Percent}
          color="violet"
        />
        <KpiCard
          title="Attractiveness Score"
          value={data.kpis.attractivenessScore.value}
          change={data.kpis.attractivenessScore.change}
          isPositive={true}
          icon={Award}
          color="amber"
        />
        <KpiCard
          title="Campaign ROI"
          value={data.kpis.campaignROI.value}
          change={data.kpis.campaignROI.change}
          isPositive={true}
          icon={CircleDollarSign}
          color="emerald"
        />
      </div>

      {/* 2. Section: Campaign Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Campaign Comparison (Grouped Bar Chart)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend />
                <Bar dataKey="engagement" fill="#6366f1" name="Engagement %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversion" fill="#10b981" name="Conversion %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Before vs After Promotion Lift Dual Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Promotion Effectiveness (Before vs After Lift)</h4>
          <div className="space-y-3">
            {data.promotionEffectiveness.beforeAfter.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-200">
                  <span>{item.metric}</span>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20">
                    {item.lift} LIFT
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-slate-400">Before:</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(item.before / 35) * 100}%` }} />
                    </div>
                    <span className="text-xs text-blue-400 font-bold">{item.before}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-slate-400">After:</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(item.after / 35) * 100}%` }} />
                    </div>
                    <span className="text-xs text-emerald-400 font-bold">{item.after}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Section: Waterfall Chart & Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaterfallChartWidget title="Sales Lift Waterfall Chart" data={data.promotionEffectiveness.waterfall} />
        <RadarChartWidget title="Product Attractiveness Radar Breakdown" data={data.productAttractiveness.radarBreakdown} />
      </div>

      {/* 4. Section: Product Visibility & Shelf Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Product Visibility Score by Shelf</h4>
          <div className="space-y-3">
            {data.productVisibility.shelfScores.map((shelf, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <span>{shelf.shelf}</span>
                  <span className="text-emerald-400 font-bold">{shelf.score} / 100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full"
                    style={{ width: `${shelf.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <HeatmapCanvas title="Shelf Visibility & Attention Heatmap" type="shelf" />
      </div>

      {/* 5. Section: AI Recommendations & Priority Matrix */}
      <DecisionMatrix recommendations={data.recommendations} />
    </div>
  );
}
