import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, PieChart, Pie, Cell
} from "recharts";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function CampaignPerformance() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);
  const [customRange, setCustomRange] = useState(null);

  const selectedPeriod = localPeriod || globalFilter?.dateRange || "Last 7 Days";
  const activeCustomRange = customRange || (globalFilter?.dateRange === "Custom Date Range" ? globalFilter : null);

  const handleDateChange = (newPeriod, customData = null) => {
    setLocalPeriod(newPeriod);
    if (newPeriod === "Custom Date Range" && customData) {
      setCustomRange(customData);
    } else if (newPeriod !== "Custom Date Range") {
      setCustomRange(null);
    }
  };

  // Scale multiplier based on date period
  let mult = 1.0;
  if (selectedPeriod === "Today") mult = 0.15;
  else if (selectedPeriod === "Yesterday") mult = 0.14;
  else if (selectedPeriod === "Last 7 Days") mult = 1.0;
  else if (selectedPeriod === "Last 30 Days") mult = 4.1;
  else if (selectedPeriod === "Custom Date Range" && activeCustomRange?.startDate && activeCustomRange?.endDate) {
    const diffDays = Math.max(1, Math.round((new Date(activeCustomRange.endDate) - new Date(activeCustomRange.startDate)) / (1000 * 60 * 60 * 24)));
    mult = parseFloat((diffDays / 7).toFixed(2));
  }


  const performanceTrend = [
    { week: "W1", impressions: Math.round(42000 * mult), engagement: 28, conversion: 12.4 },
    { week: "W2", impressions: Math.round(56000 * mult), engagement: 31, conversion: 14.2 },
    { week: "W3", impressions: Math.round(48000 * mult), engagement: 27, conversion: 11.8 },
    { week: "W4", impressions: Math.round(72000 * mult), engagement: 36, conversion: 16.9 },
    { week: "W5", impressions: Math.round(68000 * mult), engagement: 34, conversion: 15.7 },
    { week: "W6", impressions: Math.round(82000 * mult), engagement: 39, conversion: 18.2 },
  ];

  const campaigns = [
    { id: 1, name: "Summer Sale 2025", status: "Active", budget: "₹2.5L", spent: "₹1.8L", imp: formatNumber(Math.round(820000 * mult)), eng: "34.5%", conv: "16.2%", roi: "4.2x", trend: "↑" },
    { id: 2, name: "New Arrival Launch", status: "Active", budget: "₹1.8L", spent: "₹1.2L", imp: formatNumber(Math.round(610000 * mult)), eng: "33.1%", conv: "14.8%", roi: "3.8x", trend: "↑" },
    { id: 3, name: "Weekend Bonanza", status: "Active", budget: "₹1.2L", spent: "₹0.9L", imp: formatNumber(Math.round(540000 * mult)), eng: "28.9%", conv: "12.7%", roi: "3.2x", trend: "↑" },
    { id: 4, name: "Festive Offer", status: "Completed", budget: "₹0.8L", spent: "₹0.8L", imp: formatNumber(Math.round(310000 * mult)), eng: "26.7%", conv: "11.3%", roi: "2.6x", trend: "→" },
    { id: 5, name: "Clearance Sale", status: "Paused", budget: "₹0.6L", spent: "₹0.4L", imp: formatNumber(Math.round(170000 * mult)), eng: "19.3%", conv: "8.6%", roi: "2.1x", trend: "↓" },
    { id: 6, name: "Back to School", status: "Draft", budget: "₹1.0L", spent: "₹0L", imp: "—", eng: "—", conv: "—", roi: "—", trend: "—" },
  ];

  const channelData = [
    { channel: "In-Store Display", reach: Math.round(45000 * mult), ctr: 8.4 },
    { channel: "Digital Signage", reach: Math.round(32000 * mult), ctr: 6.9 },
    { channel: "Shelf Promo", reach: Math.round(28000 * mult), ctr: 12.1 },
    { channel: "Entrance Banner", reach: Math.round(61000 * mult), ctr: 5.2 },
    { channel: "Product Spotlight", reach: Math.round(18000 * mult), ctr: 14.6 },
  ];

  // Campaign Performance by Status (Requirement 1: Donut Chart)
  const campaignStatusData = [
    { name: "Active", count: Math.max(1, Math.round(7 * (mult > 2 ? 1.5 : 1))), color: "#10B981" },
    { name: "Completed", count: Math.max(1, Math.round(3 * (mult > 2 ? 1.2 : 1))), color: "#3B82F6" },
    { name: "Paused", count: Math.max(1, Math.round(2 * (mult > 2 ? 1.1 : 1))), color: "#F59E0B" }
  ];

  const totalStatusCount = campaignStatusData.reduce((acc, curr) => acc + curr.count, 0);

  const statusColor = { Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", Completed: "bg-blue-500/10 text-blue-400 border-blue-500/30", Paused: "bg-amber-500/10 text-amber-400 border-amber-500/30", Draft: "bg-slate-500/10 text-slate-400 border-slate-500/30" };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-6">
      {/* PAGE HEADER WITH DATE RANGE FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white">Campaign Performance</h1>
          {selectedPeriod === "Custom Date Range" && customRange?.label && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              📅 {customRange.label}
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Campaigns", val: `${totalStatusCount}`, sub: `${campaignStatusData[0].count} Active` },
          { label: "Total Impressions", val: formatNumber(Math.round(2450000 * mult)), sub: "↑ 18.6%" },
          { label: "Avg. Engagement", val: "32.8%", sub: "↑ 9.7%" },
          { label: "Avg. Conversion", val: "14.6%", sub: "↑ 7.5%" },
          { label: "Total Budget", val: "₹7.9L", sub: "₹5.1L Spent" },
          { label: "Best ROI", val: "4.2x", sub: "Summer Sale" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl font-mono">
            <span className="text-slate-400 text-[11px] block font-medium font-sans">{k.label}</span>
            <h2 className="text-lg font-black text-white mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* CHARTS ROW 1: Trend & Status Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* Impressions, Engagement & Conversion Over Time */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Impressions, Engagement & Conversion Over Time</h3>
            
          </div>
          <div className="h-52">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={9} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={9} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar yAxisId="left" dataKey="impressions" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Impressions" />
                <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#F59E0B" strokeWidth={2} name="Engagement %" />
                <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={2} name="Conversion %" />
              </ComposedChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        {/* REQUIREMENT 1: NEW CAMPAIGN PERFORMANCE BY STATUS DONUT CHART */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance by Status</h3>
            
          </div>
          <div className="h-40 w-full relative flex items-center justify-center">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={campaignStatusData} innerRadius={42} outerRadius={62} dataKey="count">
                  {campaignStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">{totalStatusCount}</strong>
              <span className="text-[9px] text-slate-400 block">Campaigns</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-[#1E293B]">
            {campaignStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 justify-center">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-sans">{item.name}:</span>
                <strong className="text-white">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Channel Performance */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Performance by Channel</h3>
          
        </div>
        <div className="h-48">
          <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelData} layout="vertical">
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#64748B" fontSize={9} />
              <YAxis dataKey="channel" type="category" stroke="#64748B" fontSize={9} width={110} />
              <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
              <Bar dataKey="reach" fill="#2563EB" radius={[0, 4, 4, 0]} name="Reach" />
            </BarChart>
          </ResponsiveContainer>
</ComponentErrorBoundary>
        </div>
      </div>

      {/* Campaigns Directory Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">All Campaigns Directory</h3>
          <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs transition">+ New Campaign</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">#</th><th className="pb-2">Campaign</th><th className="pb-2">Status</th>
                <th className="pb-2">Budget</th><th className="pb-2">Spent</th><th className="pb-2">Impressions</th>
                <th className="pb-2">Engagement</th><th className="pb-2">Conversion</th><th className="pb-2">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-[#0D1527]/50 transition">
                  <td className="py-2.5 text-slate-500">{c.id}</td>
                  <td className="py-2.5 font-bold text-white">{c.name}</td>
                  <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColor[c.status]}`}>{c.status}</span></td>
                  <td className="py-2.5 text-slate-300">{c.budget}</td>
                  <td className="py-2.5 text-slate-300">{c.spent}</td>
                  <td className="py-2.5 text-slate-300">{c.imp}</td>
                  <td className="py-2.5 text-blue-400 font-bold">{c.eng}</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{c.conv}</td>
                  <td className="py-2.5 font-black text-amber-400">{c.roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
