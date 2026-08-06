import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, ComposedChart, AreaChart, Area
} from "recharts";

const Header = ({ navigate }) => (
  <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
    <div className="flex items-center space-x-3">
      <button onClick={() => navigate("/marketing-manager")} className="bg-[#182238] hover:bg-[#202C48] text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-xl border border-[#273552] flex items-center space-x-1.5 transition">
        <span>←</span><span>Back</span>
      </button>
      <span className="text-white font-black text-sm tracking-wide">Consumer Attention Mapping System</span>
      <span className="bg-[#B45309]/30 text-[#F59E0B] border border-[#B45309]/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Marketing Manager Portal</span>
    </div>
    <button className="bg-[#3F1A24] hover:bg-[#52212E] text-[#F87171] border border-[#7F1D1D]/50 font-bold px-3 py-1.5 rounded-xl text-xs transition">Logout</button>
  </div>
);

export default function PromotionEffectiveness() {
  const navigate = useNavigate();
  const [view, setView] = useState("All Promotions");

  const beforeAfterData = [
    { metric: "Footfall", before: 12.5, after: 18.5 },
    { metric: "Avg. Attention", before: 4.1, after: 6.8 },
    { metric: "Engagement", before: 21, after: 33 },
    { metric: "Conversion", before: 9.2, after: 14.6 },
    { metric: "Revenue", before: 5.6, after: 8.9 },
  ];

  const promotions = [
    { id: 1, name: "Buy 2 Get 1 Free – Electronics", zone: "Electronics", type: "Discount", lift: "+42%", revenue: "₹1.8L", status: "Active", color: "emerald" },
    { id: 2, name: "Weekend Flash Sale – Apparel", zone: "Apparel", type: "Flash Sale", lift: "+28%", revenue: "₹0.9L", status: "Active", color: "blue" },
    { id: 3, name: "Loyalty Points – Grocery", zone: "Grocery", type: "Loyalty", lift: "+15%", revenue: "₹0.6L", status: "Active", color: "teal" },
    { id: 4, name: "Clearance 50% Off – Shelf E", zone: "Shelf E", type: "Clearance", lift: "+8%", revenue: "₹0.3L", status: "Paused", color: "amber" },
    { id: 5, name: "New Arrival Spotlight", zone: "Entrance", type: "Spotlight", lift: "+35%", revenue: "₹1.2L", status: "Completed", color: "purple" },
  ];

  const liftTrend = [
    { week: "W1", electronics: 28, apparel: 18, grocery: 10 },
    { week: "W2", electronics: 32, apparel: 22, grocery: 12 },
    { week: "W3", electronics: 38, apparel: 26, grocery: 14 },
    { week: "W4", electronics: 42, apparel: 28, grocery: 15 },
    { week: "W5", electronics: 40, apparel: 27, grocery: 16 },
  ];

  const statusBadge = {
    Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Paused: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Completed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200">


      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-white">🏷️ Promotion Effectiveness</h1>
          <p className="text-slate-400 text-xs">Measure the real-world impact of promotional campaigns on consumer behavior.</p>
        </div>
        <div className="flex items-center space-x-2">
          {["All Promotions", "Active", "Paused", "Completed"].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${view === v ? "bg-[#D97706] text-slate-950 border-[#D97706]" : "bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Avg. Sales Lift", val: "+26.4%", sub: "Across all promotions" },
          { label: "Total Promo Revenue", val: "₹4.8L", sub: "↑ 34% vs baseline" },
          { label: "Active Promotions", val: "3", sub: "2 in Electronics, 1 in Grocery" },
          { label: "Best Performing Promo", val: "+42% Lift", sub: "Buy 2 Get 1 – Electronics" },
        ].map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block font-medium">{k.label}</span>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.val}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Before vs After */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Before vs After Promotion (Avg. All Promos)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beforeAfterData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="metric" stroke="#64748B" fontSize={8} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Bar dataKey="before" fill="#475569" radius={[4, 4, 0, 0]} name="Before" />
                <Bar dataKey="after" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="After" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lift Trend */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase">Sales Lift Trend by Zone (Weekly %)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liftTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                <Line type="monotone" dataKey="electronics" stroke="#8B5CF6" strokeWidth={2} name="Electronics" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="apparel" stroke="#2563EB" strokeWidth={2} name="Apparel" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="grocery" stroke="#10B981" strokeWidth={2} name="Grocery" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase">All Promotions</h3>
          <button className="bg-[#D97706] text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs">+ Add Promotion</button>
        </div>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400">
              <th className="pb-2">#</th><th className="pb-2">Promotion Name</th><th className="pb-2">Zone</th>
              <th className="pb-2">Type</th><th className="pb-2">Sales Lift</th><th className="pb-2">Revenue</th><th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {promotions.filter(p => view === "All Promotions" || p.status === view).map((p) => (
              <tr key={p.id} className="hover:bg-[#0D1527]/50 transition">
                <td className="py-2 text-slate-500">{p.id}</td>
                <td className="py-2 font-bold text-white">{p.name}</td>
                <td className="py-2 text-slate-400">{p.zone}</td>
                <td className="py-2 text-slate-300">{p.type}</td>
                <td className="py-2 font-black text-emerald-400">{p.lift}</td>
                <td className="py-2 font-bold text-white">{p.revenue}</td>
                <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBadge[p.status]}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
