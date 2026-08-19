'use client';

import React from 'react';
import { Eye, TrendingUp, Sparkles, Award, Megaphone, ArrowUpRight, BarChart2, FileText, Download, Target, ShoppingBag } from 'lucide-react';
import BeforeAfterPromotionLift from './BeforeAfterPromotionLift';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
  scales: {
    x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } },
    y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } },
  },
};

function MarketingOverviewTab() {
  const campaignData = {
    labels: ['Week 1 (Before)', 'Week 2 (Placement Shift)', 'Week 3 (Promo Display)', 'Week 4 (Current)'],
    datasets: [
      {
        label: 'Promotional Endcap Gaze Duration (s)',
        data: [120, 280, 490, 620],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Aisle Shelf Gaze Baseline (s)',
        data: [210, 230, 220, 240],
        borderColor: '#64748b',
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          MARKETING MANAGER CAMPAIGN DASHBOARD
          <span className="text-xs bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/30">
            Milestone 3 & PDF Guidelines Fully Aligned
          </span>
        </h1>
        <p className="text-xs text-slate-400">Evaluate campaign effectiveness, product visibility, before-vs-after promotion lift, and zone conversion lift.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Campaign Reach</span><Megaphone size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">14,250</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight size={12} /> +18.4% vs baseline
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Promo Gaze Duration</span><Eye size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">620 hrs</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight size={12} /> +41.7% vs baseline
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Endcap Conversion Rate</span><TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">38.5%</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight size={12} /> +133% Lift
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Campaign ROI</span><Award size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">4.8x</div>
          <div className="text-[11px] text-purple-400 font-mono mt-1">High Return</div>
        </div>
      </div>

      <BeforeAfterPromotionLift />

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-1">Campaign Visibility Impact</h3>
        <p className="text-xs text-slate-400 mb-3">Before vs. After placement changes (Gaze Duration in seconds)</p>
        <div className="h-64"><Line data={campaignData} options={chartOptions} /></div>
      </div>
    </div>
  );
}

function PromoDisplaysTab() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Eye size={20} className="text-amber-400" /> PROMOTIONAL DISPLAYS & ENDCAPS
        </h1>
        <p className="text-xs text-slate-400">Active promotional endcap displays, gaze attention counts, and conversion performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Promo Endcap A – Snacks', gaze: '490 secs', pickup: '310 units', lift: '+158%', status: 'Active' },
          { title: 'Promo Endcap B – Beverages', gaze: '620 secs', pickup: '420 units', lift: '+184%', status: 'Active' },
          { title: 'Front Entrance Stand', gaze: '380 secs', pickup: '190 units', lift: '+92%', status: 'Active' },
        ].map((p) => (
          <div key={p.title} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{p.title}</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">{p.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-400">Gaze Time:</span> <strong className="text-amber-400">{p.gaze}</strong></div>
              <div><span className="text-slate-400">Pickups:</span> <strong className="text-blue-400">{p.pickup}</strong></div>
            </div>
            <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded border border-emerald-500/20 text-center">
              Conversion Lift: {p.lift}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignVisibilityTab() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-emerald-400" /> CAMPAIGN VISIBILITY & CONVERSION LIFT
        </h1>
        <p className="text-xs text-slate-400">Zone-by-zone promotional conversion rates and visibility indexes.</p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="pb-2">Zone / Display Location</th>
              <th className="pb-2 text-center">Passing Traffic</th>
              <th className="pb-2 text-center">Gaze Attention</th>
              <th className="pb-2 text-center">Interactions</th>
              <th className="pb-2 text-right">Conversion Lift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {[
              { zone: 'Main Entrance Stand', traffic: '1,248', gaze: '840 (67.3%)', inter: '320', lift: '+92.4%' },
              { zone: 'Aisle 2 Endcap (Snacks)', traffic: '860', gaze: '680 (79.0%)', inter: '410', lift: '+158.0%' },
              { zone: 'Aisle 4 Endcap (Drinks)', traffic: '720', gaze: '610 (84.7%)', inter: '380', lift: '+184.2%' },
              { zone: 'Checkout Display Racks', traffic: '1,170', gaze: '920 (78.6%)', inter: '520', lift: '+115.6%' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/40">
                <td className="py-2.5 font-bold text-white">{row.zone}</td>
                <td className="py-2.5 text-center text-slate-400">{row.traffic}</td>
                <td className="py-2.5 text-center font-mono text-amber-400">{row.gaze}</td>
                <td className="py-2.5 text-center font-mono text-purple-400">{row.inter}</td>
                <td className="py-2.5 text-right font-black text-emerald-400">{row.lift}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarketingReportsTab() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileText size={20} className="text-blue-400" /> MARKETING CAMPAIGN EXPORTS
        </h1>
        <p className="text-xs text-slate-400">Download campaign visibility reports, promotional endcap lift analytics, and ROI summaries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Campaign ROI & Visibility Summary', desc: 'Comprehensive report on gaze duration, reach, and conversion lift.' },
          { title: 'Promotional Endcap Lift Report', desc: 'Detailed before vs after comparison for all store endcap placements.' },
        ].map((item, i) => (
          <div key={i} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20">
              <Download size={13} /> Export PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketingManagerDashboardView({ activeTab }) {
  return (
    <div className="p-6 text-slate-200">
      {activeTab === 'overview'  && <MarketingOverviewTab />}
      {activeTab === 'promo'     && <PromoDisplaysTab />}
      {activeTab === 'traffic'   && <CampaignVisibilityTab />}
      {activeTab === 'reports'   && <MarketingReportsTab />}
    </div>
  );
}
