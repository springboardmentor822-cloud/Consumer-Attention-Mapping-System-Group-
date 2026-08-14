import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from "recharts";
import CustomDateSelector from "../../components/CustomDateSelector";
import { formatNumber } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function CampaignReports() {
  const { globalFilter } = useCams();
  const [period, setPeriod] = useState("Monthly");

  useEffect(() => {
    if (globalFilter?.dateRange === "Today" || globalFilter?.dateRange === "Yesterday") {
      setPeriod("Daily");
    } else if (globalFilter?.dateRange === "Last 7 Days") {
      setPeriod("Weekly");
    } else if (globalFilter?.dateRange === "Last 30 Days" || globalFilter?.dateRange === "This Month") {
      setPeriod("Monthly");
    }
  }, [globalFilter]);

  // DISTINCT DATASETS FOR EACH PERIOD (DAILY, WEEKLY, MONTHLY, QUARTERLY)
  const periodDataMap = {
    Daily: {
      kpis: [
        { label: "Total Revenue Today", val: "₹42.8K", sub: "↑ 14.2% vs yesterday" },
        { label: "Ad Spend Today", val: "₹9.5K", sub: "Optimal daily cap" },
        { label: "Daily ROI", val: "4.5x", sub: "Summer Sale peak" },
        { label: "Active Campaigns Today", val: "3", sub: "Live in store" }
      ],
      chartData: [
        { label: "8 AM", revenue: 4800, spend: 1200, roi: 4.0 },
        { label: "11 AM", revenue: 9200, spend: 2100, roi: 4.38 },
        { label: "2 PM", revenue: 11400, spend: 2500, roi: 4.56 },
        { label: "5 PM", revenue: 14200, spend: 2900, roi: 4.89 },
        { label: "8 PM", revenue: 3200, spend: 800, roi: 4.0 }
      ],
      summaries: [
        { name: "Summer Sale 2025 (Daily Slot)", period: "Today 9AM–9PM", impressions: "42K", revenue: "₹24.5K", roi: "4.8x", status: "✅ Active" },
        { name: "Electronics Flash Promo", period: "Today 5PM–7PM", impressions: "18K", revenue: "₹12.2K", roi: "4.2x", status: "✅ Completed" }
      ]
    },
    Weekly: {
      kpis: [
        { label: "Weekly Revenue", val: "₹2.84L", sub: "↑ 18.4% vs last week" },
        { label: "Weekly Ad Spend", val: "₹68.0K", sub: "Within budget" },
        { label: "Weekly Avg ROI", val: "4.17x", sub: "Strong performance" },
        { label: "Reports Generated", val: "12", sub: "This week" }
      ],
      chartData: [
        { label: "Mon", revenue: 34000, spend: 8500, roi: 4.0 },
        { label: "Wed", revenue: 42000, spend: 9800, roi: 4.28 },
        { label: "Fri", revenue: 58000, spend: 12400, roi: 4.67 },
        { label: "Sat", revenue: 84000, spend: 18200, roi: 4.61 },
        { label: "Sun", revenue: 66000, spend: 15100, roi: 4.37 }
      ],
      summaries: [
        { name: "Summer Sale 2025", period: "Aug 1–7", impressions: "240K", revenue: "₹1.45L", roi: "4.6x", status: "✅ Active" },
        { name: "Weekend Bonanza", period: "Aug 2–4", impressions: "180K", revenue: "₹0.98L", roi: "4.1x", status: "✅ Completed" }
      ]
    },
    Monthly: {
      kpis: [
        { label: "Total Revenue Generated", val: "₹8.92L", sub: "↑ 22.1% YoY" },
        { label: "Total Ad Spend", val: "₹2.31L", sub: "Under budget" },
        { label: "Overall ROI", val: "3.86x", sub: "↑ 0.4x vs last month" },
        { label: "Reports Generated", val: "48", sub: "This month" }
      ],
      chartData: [
        { label: "Jan", revenue: 52000, spend: 18000, roi: 2.9 },
        { label: "Feb", revenue: 61000, spend: 19500, roi: 3.1 },
        { label: "Mar", revenue: 75000, spend: 22000, roi: 3.4 },
        { label: "Apr", revenue: 68000, spend: 20000, roi: 3.4 },
        { label: "May", revenue: 89000, spend: 24000, roi: 3.7 },
        { label: "Jun", revenue: 102000, spend: 27000, roi: 3.8 }
      ],
      summaries: [
        { name: "Summer Sale 2025", period: "May 1–22", impressions: "820K", revenue: "₹3.25L", roi: "4.2x", status: "✅ Completed" },
        { name: "New Arrival Launch", period: "Apr 10–30", impressions: "610K", revenue: "₹2.18L", roi: "3.8x", status: "✅ Completed" },
        { name: "Festive Offer", period: "Mar 20–31", impressions: "310K", revenue: "₹1.12L", roi: "2.6x", status: "✅ Completed" }
      ]
    },
    Quarterly: {
      kpis: [
        { label: "Quarterly Revenue", val: "₹24.8L", sub: "↑ 28.5% QoQ" },
        { label: "Quarterly Ad Spend", val: "₹6.15L", sub: "Approved budget" },
        { label: "Quarterly ROI", val: "4.03x", sub: "Best annual quarter" },
        { label: "Campaigns Executed", val: "16", sub: "Full Q2 report" }
      ],
      chartData: [
        { label: "Q1 2025", revenue: 480000, spend: 135000, roi: 3.55 },
        { label: "Q2 2025", revenue: 620000, spend: 160000, roi: 3.87 },
        { label: "Q3 2025", revenue: 710000, spend: 175000, roi: 4.05 },
        { label: "Q4 2025", revenue: 890000, spend: 210000, roi: 4.23 }
      ],
      summaries: [
        { name: "Q2 Grand Retail Fest", period: "Apr–Jun 2025", impressions: "2.4M", revenue: "₹9.80L", roi: "4.4x", status: "✅ Completed" },
        { name: "Q1 Spring Clearance", period: "Jan–Mar 2025", impressions: "1.8M", revenue: "₹6.40L", roi: "3.6x", status: "✅ Completed" }
      ]
    }
  };

  const activePeriodContent = periodDataMap[period] || periodDataMap.Monthly;

  const handleExportClick = () => {
    const csvContent = "data:text/csv;charset=utf-8,Period,Label,Revenue,AdSpend,ROI\n" +
      activePeriodContent.chartData.map(d => `"${period}","${d.label}","${d.revenue}","${d.spend}","${d.roi}x"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CAMS_Campaign_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-6">
      {/* PAGE HEADER WITH PERIOD FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <h1 className="text-xl font-black text-white">Campaign Purpose & Reports</h1>

        {/* CONNECTED PERIOD FILTERS */}
        <div className="flex items-center space-x-2 font-mono self-end sm:self-auto">
          {["Daily", "Weekly", "Monthly", "Quarterly"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                period === p ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-[#070C18] text-slate-400 border-[#1E293B] hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={handleExportClick}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs transition ml-2"
          >
            ⬇ Export {period} Report
          </button>
        </div>
      </div>

      {/* COMPACT KPIS FOR SELECTED PERIOD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {activePeriodContent.kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium font-sans">{k.label}</span>
            <h2 className="text-lg font-black text-white mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* CHARTS FOR SELECTED PERIOD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Revenue vs Ad Spend ({period} Breakdown)</h3>
          <div className="h-48">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={activePeriodContent.chartData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="spend" fill="#1E293B" radius={[4, 4, 0, 0]} name="Ad Spend" />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">ROI Trend ({period})</h3>
          <div className="h-48">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activePeriodContent.chartData}>
                <defs>
                  <linearGradient id="roiGradPeriod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="x" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Area type="monotone" dataKey="roi" stroke="#F59E0B" strokeWidth={2} fill="url(#roiGradPeriod)" name="ROI" />
              </AreaChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      </div>

      {/* CAMPAIGN SUMMARY TABLE FOR SELECTED PERIOD */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Campaign Summary Report ({period})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2">Campaign Name</th><th className="pb-2">Time Frame</th>
                <th className="pb-2">Impressions</th><th className="pb-2">Revenue</th>
                <th className="pb-2">ROI</th><th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {activePeriodContent.summaries.map((c, i) => (
                <tr key={i} className="hover:bg-[#0D1527]/50 transition">
                  <td className="py-2.5 font-bold text-white">{c.name}</td>
                  <td className="py-2.5 text-slate-400 font-sans">{c.period}</td>
                  <td className="py-2.5 text-slate-300 font-mono">{c.impressions}</td>
                  <td className="py-2.5 font-bold text-white font-mono">{c.revenue}</td>
                  <td className="py-2.5 text-amber-400 font-black font-mono">{c.roi}</td>
                  <td className="py-2.5 text-slate-300 font-sans">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
