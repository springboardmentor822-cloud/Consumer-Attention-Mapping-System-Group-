import React from 'react';
import {
  BrainCircuit,
  Eye,
  Clock,
  Users,
  GitCommit,
  Flame,
  Activity,
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

import KpiCard from '../components/widgets/KpiCard';
import SankeyDiagram from '../components/widgets/SankeyDiagram';
import BoxViolinPlot from '../components/widgets/BoxViolinPlot';
import HeatmapCanvas from '../components/widgets/HeatmapCanvas';
import { mockDashboardData } from '../services/mockDashboardData';

export default function RetailAnalystDashboard() {
  const data = mockDashboardData.retailAnalyst;
  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-indigo-400" /> Retail Analyst Control Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            In-depth analysis of customer behavior, journey paths, attention duration, dwell time distributions, and segment analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 border border-indigo-500/20 font-medium">
            AI Analytics Mode: <strong>Active</strong>
          </span>
        </div>
      </div>

      {/* 1. Section: KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Avg Attention Time"
          value={data.kpis.avgAttentionTime.value}
          change={data.kpis.avgAttentionTime.change}
          isPositive={true}
          icon={Eye}
          color="indigo"
        />
        <KpiCard
          title="Avg Dwell Time"
          value={data.kpis.avgDwellTime.value}
          change={data.kpis.avgDwellTime.change}
          isPositive={true}
          icon={Clock}
          color="emerald"
        />
        <KpiCard
          title="Repeat Visitors"
          value={data.kpis.repeatVisitors.value}
          change={data.kpis.repeatVisitors.change}
          isPositive={true}
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="Avg Session Length"
          value={data.kpis.avgSessionLength.value}
          change={data.kpis.avgSessionLength.change}
          isPositive={true}
          icon={Clock}
          color="violet"
        />
        <KpiCard
          title="Customer Segments"
          value={data.kpis.customerSegments.value}
          change={data.kpis.customerSegments.change}
          isPositive={true}
          icon={BrainCircuit}
          color="amber"
        />
        <KpiCard
          title="Engagement Score"
          value={data.kpis.engagementScore.value}
          change={data.kpis.engagementScore.change}
          isPositive={true}
          icon={Activity}
          color="rose"
        />
      </div>

      {/* 2. Section: Consumer Journey Flow (Sankey Diagram) */}
      <SankeyDiagram data={data.sankeyData} />

      {/* 3. Section: Attention Analytics & Box Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Average Attention Duration Over Time (Line Chart)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attentionAnalytics.overTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="s" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="attention" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <BoxViolinPlot title="Attention Time Distribution (Box Plot)" data={data.attentionAnalytics.boxPlot} />
      </div>

      {/* 4. Section: Customer Segmentation & Category Interest Tree Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Customer Segmentation (Pie Chart)</h4>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.segmentation}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {data.segmentation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Product Category Interest (Tree Map)</h4>
          <div className="grid grid-cols-2 gap-3 h-56">
            {data.shoppingBehaviour.treeMap.map((cat, idx) => (
              <div
                key={idx}
                className="rounded-lg p-4 flex flex-col justify-between border border-slate-800 transition-all hover:scale-[1.01]"
                style={{ backgroundColor: `${cat.color}20`, borderColor: cat.color }}
              >
                <span className="font-bold text-sm text-white">{cat.name}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Interest Share</span>
                  <span className="text-xl font-bold" style={{ color: cat.color }}>{cat.size}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Section: Heatmaps Suite & Behavioral Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeatmapCanvas title="Customer Traffic & Store Attention Heatmap" type="traffic" />

        {/* Behavioral Analytics Bubble Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Attention vs Dwell Time vs Conversion (Bubble Chart)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="attention" name="Attention (s)" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="dwell" name="Dwell (m)" stroke="#64748b" fontSize={11} />
                <ZAxis dataKey="sales" range={[60, 400]} name="Sales Volume" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Scatter name="Categories" data={data.behavioralAnalytics.bubble} fill="#6366f1" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
