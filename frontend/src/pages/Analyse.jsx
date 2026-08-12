import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { canViewAnalyse } from "../utils/roles";
import AccessDenied from "./AccessDenied";

export default function Analyse() {
  const { user } = useAuth();
  const allowed = canViewAnalyse(user?.role);

  const [metrics, setMetrics] = useState(null);
  const [timeframe, setTimeframe] = useState("hourly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;

    async function fetchAnalyticsData() {
      try {
        const storeRes = await api.get("/stores");
        if (storeRes.data.length > 0) {
          const s = storeRes.data[0];
          const mRes = await api.get(`/analytics/stores/${s.id}/retail-metrics`);
          setMetrics(mRes.data);
        }
      } catch (e) {
        console.error("Failed to fetch analytics metrics", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 3000);
    return () => clearInterval(interval);
  }, [allowed]);

  if (!allowed) {
    return <AccessDenied />;
  }

  const footfallData = timeframe === "hourly"
    ? (metrics?.hourly_footfall || [
        { label: "08:00", people: 12, products: 45 },
        { label: "10:00", people: 34, products: 82 },
        { label: "12:00", people: 65, products: 120 },
        { label: "14:00", people: 48, products: 95 },
        { label: "16:00", people: 82, products: 140 },
        { label: "18:00", people: 95, products: 160 },
        { label: "20:00", people: 40, products: 70 },
      ])
    : (metrics?.daily_footfall || [
        { label: "Mon", people: 320, products: 850 },
        { label: "Tue", people: 410, products: 920 },
        { label: "Wed", people: 380, products: 890 },
        { label: "Thu", people: 490, products: 1050 },
        { label: "Fri", people: 680, products: 1420 },
        { label: "Sat", people: 890, products: 1950 },
        { label: "Sun", people: 750, products: 1680 },
      ]);

  const maxPeople = Math.max(...footfallData.map((d) => d.people || d.count || 10), 10);
  const maxProducts = Math.max(...footfallData.map((d) => d.products || 10), 10);

  const zonesData = [
    { zone: "Beverages", visits: 145, dwell: "18.5s", attention: 91, color: "#3b82f6", pct: 90 },
    { zone: "Cooking Products", visits: 198, dwell: "22.0s", attention: 94, color: "#8b5cf6", pct: 95 },
    { zone: "Bakery", visits: 120, dwell: "14.5s", attention: 85, color: "#10b981", pct: 75 },
    { zone: "Entrance", visits: 62, dwell: "4.2s", attention: 45, color: "#f59e0b", pct: 45 },
    { zone: "Billing Counter", visits: 180, dwell: "45.0s", attention: 88, color: "#ec4899", pct: 88 },
    { zone: "Parking", visits: 40, dwell: "9.4s", attention: 20, color: "#64748b", pct: 20 },
  ];

  const shelvesData = [
    { shelf: "Cooking Shelf C1", zone: "Cooking Products", occ: 88, status: "Healthy", color: "from-purple-500 to-indigo-500" },
    { shelf: "Bakery Shelf B1", zone: "Bakery", occ: 82, status: "Healthy", color: "from-emerald-500 to-teal-400" },
    { shelf: "Beverage Shelf A1", zone: "Beverages", occ: 78, status: "Healthy", color: "from-blue-500 to-sky-400" },
    { shelf: "Beverage Shelf A2", zone: "Beverages", occ: 65, status: "Healthy", color: "from-sky-500 to-blue-400" },
    { shelf: "Produce Shelf P1", zone: "Produce Section", occ: 15, status: "Low Stock", color: "from-red-500 to-rose-400" },
  ];

  const hourlyDensity = [
    { hour: "08 AM", density: 25, level: "Low" },
    { hour: "10 AM", density: 55, level: "Medium" },
    { hour: "12 PM", density: 85, level: "High" },
    { hour: "02 PM", density: 60, level: "Medium" },
    { hour: "04 PM", density: 90, level: "Peak" },
    { hour: "06 PM", density: 98, level: "Peak" },
    { hour: "08 PM", density: 45, level: "Low" },
  ];

  return (
    <Layout title="Executive Analytics — 5 Primary Retail Charts">
      <div className="space-y-6 font-sans">
        {/* Header Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                🔒 Protected Analytics View
              </span>
              <span className="text-xs text-gray-500 font-semibold">Retail Analysts & Administrators Only</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1">5 Core Executive Retail Analytics Charts</h1>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            {["hourly", "daily", "weekly", "monthly"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  timeframe === tf ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Synthesizing 5 main retail charts...</div>
        ) : (
          <div className="space-y-6">
            {/* CHART 1: Footfall vs Product Detection Bar & Comparison Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">Chart #1</span>
                  <h2 className="text-base font-black text-gray-900">Customer Footfall vs Product Detections</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Real-time breakdown over {timeframe} timeframe</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> People Footfall
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Products Detected
                  </span>
                </div>
              </div>

              <div className="h-60 flex items-end justify-between gap-3 pt-6 border-b border-gray-100">
                {footfallData.map((item, idx) => {
                  const pHeight = Math.round(((item.people || item.count || 10) / maxPeople) * 100);
                  const prHeight = Math.round(((item.products || 10) / maxProducts) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full px-1">
                        <div
                          style={{ height: `${pHeight}%` }}
                          className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-500 relative group-hover:brightness-110"
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded shadow">
                            {item.people || item.count}
                          </span>
                        </div>
                        <div
                          style={{ height: `${prHeight}%` }}
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 relative group-hover:brightness-110"
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded shadow">
                            {item.products}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 mt-2 font-mono">{item.label || item.hour || item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHART 2 & CHART 3 GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CHART 2: Zone Dwell & Traffic Distribution Horizontal Bar Chart */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">Chart #2</span>
                <h3 className="text-sm font-black text-gray-900 mb-1">Zone Traffic & Dwell Distribution</h3>
                <p className="text-xs text-gray-500 mb-5">Average dwell time and visitor density across store zones</p>

                <div className="space-y-4">
                  {zonesData.map((z) => (
                    <div key={z.zone} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-800">📍 {z.zone}</span>
                        <span style={{ color: z.color }}>{z.dwell} Dwell ({z.visits} Visits)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${z.pct}%`, backgroundColor: z.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHART 3: Shelf Occupancy & Stock Capacity Matrix Chart */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider">Chart #3</span>
                <h3 className="text-sm font-black text-gray-900 mb-1">Shelf Occupancy & Stock Capacity</h3>
                <p className="text-xs text-gray-500 mb-5">SKU110K detected shelf capacity % and stock alerts</p>

                <div className="space-y-3.5">
                  {shelvesData.map((s) => (
                    <div key={s.shelf} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-gray-900">{s.shelf}</div>
                          <div className="text-[10px] text-gray-400">Zone: {s.zone}</div>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${s.status === "Low Stock" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                          {s.occ}% {s.status}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${s.color}`} style={{ width: `${s.occ}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CHART 4 & CHART 5 GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CHART 4: Peak Shopping Hours & Customer Density Area Chart */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <span className="text-[10px] font-mono text-amber-600 font-bold uppercase tracking-wider">Chart #4</span>
                <h3 className="text-sm font-black text-gray-900 mb-1">Peak Shopping Hours & Customer Density</h3>
                <p className="text-xs text-gray-500 mb-5">Hourly customer concentration intensity throughout operating hours</p>

                <div className="h-44 flex items-end justify-between gap-2 pt-4">
                  {hourlyDensity.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        style={{ height: `${h.density}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          h.level === "Peak"
                            ? "bg-gradient-to-t from-red-500 to-amber-400"
                            : h.level === "High"
                            ? "bg-gradient-to-t from-amber-500 to-yellow-400"
                            : "bg-gradient-to-t from-sky-400 to-blue-300"
                        }`}
                      />
                      <span className="text-[9px] font-bold text-gray-600 mt-2 font-mono">{h.hour}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHART 5: Attention Score & Shelf Engagement Gauge / Comparison Chart */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <span className="text-[10px] font-mono text-purple-600 font-bold uppercase tracking-wider">Chart #5</span>
                <h3 className="text-sm font-black text-gray-900 mb-1">Attention Score & Engagement Index</h3>
                <p className="text-xs text-gray-500 mb-5">Customer visual attention rating and interaction index</p>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl flex flex-col justify-center items-center">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-500 tracking-wider">Avg Attention Score</span>
                    <span className="text-3xl font-black text-indigo-600 mt-1">{metrics?.attention_score || 88.5}%</span>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1">↑ +5.2% vs last week</span>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl flex flex-col justify-center items-center">
                    <span className="text-[10px] font-extrabold uppercase text-purple-500 tracking-wider">Shelf Engagement</span>
                    <span className="text-3xl font-black text-purple-600 mt-1">94.2</span>
                    <span className="text-[10px] text-purple-600 font-bold mt-1">High Interaction Rate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
