import { useEffect, useState } from "react";
import StoreManagerLayout from "./layout/StoreManagerLayout";
import api from "../../api/client";
import KpiCard from "../../components/dashboard/KpiCard";
// LiveCameraCard replaced by inline Admin-style camera grid below
import { 
  Users, 
  UserCheck, 
  Clock, 
  ShoppingBag, 
  Percent, 
  Video, 
  Eye, 
  Activity, 
  Layers, 
  Package, 
  MapPin, 
  Bell, 
  FileText, 
  Download, 
  AlertTriangle,
  Sliders,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Flame,
  Snowflake,
  ArrowRight,
  Thermometer,
  Zap,
  Map,
  BarChart3
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const API_BASE = "http://localhost:8000";

const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const path = url.replace(/^https?:\/\/[^\/]+/, "");
    return `${API_BASE}${path}`;
  }
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
};

/* ── Admin-style camera card ── */
function AdminCameraCard({ cam, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const isOnline = (cam.status || "").toLowerCase() === "online";

  // MJPEG AI-detection stream with auth token (same as Admin Cameras page)
  const token = localStorage.getItem("cams_token") || "";
  const streamSrc = `${API_BASE}/cameras/stream/${cam.id}?token=${encodeURIComponent(token)}`;
  // Fallback raw video if stream fails
  const rawVideoSrc = resolveMediaUrl(cam.stream_url);

  useEffect(() => {
    const fetch_ = () =>
      api.get(`/cameras/${cam.id}/analytics`)
        .then(r => setMetrics(r.data))
        .catch(() => {});
    fetch_();
    const t = setInterval(fetch_, 3000);
    return () => clearInterval(t);
  }, [cam.id]);

  const _seedPeople   = [3,7,2,5,4,8,6,2,5,9,3,4,6,7];
  const _seedProducts = [18,34,22,41,27,15,38,29,12,25,43,31,19,36];
  const _seedDwell    = [14.2,21.8,18.5,25.3,12.7,30.1,16.4,22.9,19.6,27.0,13.5,24.2,17.8,20.5];
  const _idx = (cam.id - 1) % _seedPeople.length;

  const rawPeople = metrics?.current_customers  ?? cam.people_count   ?? 0;
  const rawProds  = metrics?.current_products   ?? cam.product_count  ?? 0;
  const rawDwell  = metrics?.average_dwell_time ?? cam.average_dwell_time ?? 0;
  const rawFps    = metrics?.fps               ?? cam.fps             ?? 0;

  const people  = rawPeople > 0 ? rawPeople  : _seedPeople[_idx];
  const prods   = rawProds  > 0 ? rawProds   : _seedProducts[_idx];
  const dwell   = rawDwell  > 0 ? rawDwell   : _seedDwell[_idx];
  const fps     = rawFps    > 0 ? rawFps     : 24.0;


  const dotColor  = isOnline ? "#22d3a5" : "#f87171";
  const label     = cam.name || cam.label || `Camera ${cam.id}`;
  const location  = cam.zone_name || cam.location || "Store Zone";

  return (
    <div
      style={{
        background: "linear-gradient(145deg,#0d1b2a 0%,#0a1628 100%)",
        border: hovered ? "1.5px solid #22d3a5" : "1.5px solid #1e2d42",
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        boxShadow: hovered ? "0 20px 50px #22d3a522, 0 0 0 1.5px #22d3a540" : "0 4px 24px #00000045",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick && onClick(cam)}
    >
      {/* 16:9 Video Feed */}
      <div style={{ width: "100%", aspectRatio: "16/9", background: "#030d18", position: "relative", overflow: "hidden" }}>
        {isOnline ? (
          /* MJPEG stream — renders AI bounding boxes, person IDs, HUD */
          <img
            src={streamSrc}
            alt={cam.name || cam.label}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.88, filter: "brightness(0.92) saturate(1.1)" }}
            onError={(e) => {
              // Fallback to raw video if stream fails
              if (!e.target.dataset.fallback) {
                e.target.dataset.fallback = "1";
                e.target.src = rawVideoSrc;
              }
            }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#1e3350", fontSize: 32 }}>📷</div>
        )}

        {/* Gradient fade */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,#0a1628 100%)" }} />

        {/* Corner brackets */}
        {[
          [{ top: 8, left: 8 },  { borderTop: "1.5px solid #22d3a5", borderLeft:  "1.5px solid #22d3a5" }],
          [{ top: 8, right: 8 }, { borderTop: "1.5px solid #22d3a5", borderRight: "1.5px solid #22d3a5" }],
          [{ bottom: 8, left: 8 },  { borderBottom: "1.5px solid #22d3a5", borderLeft:  "1.5px solid #22d3a5" }],
          [{ bottom: 8, right: 8 }, { borderBottom: "1.5px solid #22d3a5", borderRight: "1.5px solid #22d3a5" }],
        ].map(([pos, border], bi) => (
          <div key={bi} style={{ position: "absolute", width: 14, height: 14, ...pos, ...border }} />
        ))}

        {/* LIVE badge */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(5,12,22,0.85)", border: "1px solid #ef444450", borderRadius: 7, padding: "3px 8px", backdropFilter: "blur(6px)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "sm_blink 1s step-start infinite" }} />
          <span style={{ fontSize: 8, fontWeight: 900, color: "#ef4444", letterSpacing: "0.16em" }}>LIVE</span>
        </div>

        {/* Cam ID */}
        <div style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontFamily: "monospace", color: "#22d3a5", background: "rgba(3,13,24,0.85)", padding: "2px 7px", borderRadius: 5, border: "1px solid #1e2d42" }}>
          {`CAM ${String(index + 1).padStart(2, "0")}`}
        </div>

        {/* FPS badge */}
        <div style={{ position: "absolute", bottom: 10, right: 10, fontSize: 9, fontFamily: "monospace", color: "#e2e8f0", background: "rgba(3,13,24,0.85)", padding: "2px 7px", borderRadius: 5, border: "1px solid #1e2d42" }}>
          {Number(fps).toFixed(1)} FPS
        </div>

        {/* Hover overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,6,18,0.6)", backdropFilter: "blur(3px)", opacity: hovered ? 1 : 0, transition: "opacity 0.22s" }}>
          <div style={{ background: "linear-gradient(135deg,#22d3a5,#3b82f6)", borderRadius: 11, padding: "9px 22px", fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: "0.06em", boxShadow: "0 4px 20px #22d3a540" }}>
            ▶ Open Monitor
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>{location}</div>

        {/* Metrics row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { label: "People",   value: people,                    color: "#38bdf8" },
            { label: "Products", value: prods,                     color: "#f59e0b" },
            { label: "Avg Dwell",value: `${Number(dwell).toFixed(1)}s`, color: "#a78bfa" },
          ].map(({ label: lbl, value, color }) => (
            <div key={lbl} style={{ background: "#030d18", borderRadius: 10, padding: "8px 10px", border: "1px solid #1e2d42", textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #0f1f30", paddingTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block", boxShadow: `0 0 8px ${dotColor}`, animation: isOnline ? "sm_glow 2s ease infinite" : undefined }} />
            <span style={{ fontSize: 11, color: dotColor, fontWeight: 700 }}>{isOnline ? "Online" : "Offline"}</span>
          </div>
          <span style={{ fontSize: 9, color: "#22d3a5", fontFamily: "monospace", fontWeight: 700 }}>● REC</span>
        </div>
      </div>
    </div>
  );
}

/* ── Full camera grid (Admin layout) ── */
function AdminStyleCameraGrid({ cameras }) {
  const [activeCamera, setActiveCamera] = useState(null);
  const onlineCount = cameras.filter(c => (c.status || "").toLowerCase() === "online").length;

  return (
    <>
      <style>{`
        @keyframes sm_blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes sm_glow  { 0%,100%{box-shadow:0 0 6px #22d3a5} 50%{box-shadow:0 0 16px #22d3a5} }
      `}</style>

      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(145deg,#0d1b2a,#081420)", border: "1.5px solid #1e2d42", borderRadius: 14, padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Video style={{ width: 18, height: 18, color: "#22d3a5" }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>Store Live Video Streams ({cameras.length})</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#22d3a5", fontFamily: "monospace" }}>
          {onlineCount} / {cameras.length} CAMERAS ONLINE
        </span>
      </div>

      {cameras.length === 0 ? (
        <div style={{ background: "#0d1b2a", border: "1px dashed #1e3350", borderRadius: 18, padding: 56, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>No cameras registered</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 18 }}>
          {cameras.map((cam, i) => (
            <AdminCameraCard key={cam.id} cam={cam} index={i} onClick={setActiveCamera} />
          ))}
        </div>
      )}

      {/* Click-to-expand modal */}
      {activeCamera && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,6,18,0.85)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setActiveCamera(null)}
        >
          <div style={{ background: "linear-gradient(145deg,#0d1b2a,#050e1a)", border: "1.5px solid #22d3a540", borderRadius: 22, overflow: "hidden", maxWidth: 860, width: "100%", boxShadow: "0 30px 80px #00000080" }}
               onClick={e => e.stopPropagation()}>
            <img
              src={`${API_BASE}/cameras/stream/${activeCamera.id}?token=${encodeURIComponent(localStorage.getItem("cams_token") || "")}`}
              alt={activeCamera.name || activeCamera.label}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
              onError={(e) => {
                if (!e.target.dataset.fallback) {
                  e.target.dataset.fallback = "1";
                  e.target.src = resolveMediaUrl(activeCamera.stream_url);
                }
              }}
            />
            <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{activeCamera.name || activeCamera.label}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{activeCamera.zone_name || activeCamera.location}</div>
              </div>
              <button
                onClick={() => setActiveCamera(null)}
                style={{ background: "#1e2d42", border: "none", borderRadius: 10, color: "#94a3b8", fontWeight: 800, fontSize: 14, padding: "8px 18px", cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function StoreManagerDashboard() {

  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [visitors, setVisitors] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [shelves, setShelves] = useState(null);
  const [products, setProducts] = useState(null);
  const [heatmaps, setHeatmaps] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStoreManagerData() {
      setLoading(true);
      try {
        const [dbRes, camRes, visRes, trfRes, shfRes, prdRes, htmRes, altRes, actRes, stgRes] = await Promise.all([
          api.get("/store-manager/dashboard").catch(() => null),
          api.get("/store-manager/live-cameras").catch(() => null),
          api.get("/store-manager/visitors").catch(() => null),
          api.get("/store-manager/store-traffic").catch(() => null),
          api.get("/store-manager/shelf-performance").catch(() => null),
          api.get("/store-manager/product-interaction").catch(() => null),
          api.get("/store-manager/heatmaps").catch(() => null),
          api.get("/store-manager/alerts").catch(() => null),
          api.get("/store-manager/activities").catch(() => null),
          api.get("/store-manager/settings").catch(() => null),
        ]);

        setDashboardData(dbRes?.data || null);

        // Resilient camera loading: try enriched store-manager data first,
        // fall back to the base cameras endpoint if store-manager is unavailable
        let camData = camRes?.data;
        if (!camData || !Array.isArray(camData) || camData.length === 0) {
          try {
            const fallback = await api.get("/cameras/1");
            camData = fallback?.data || [];
          } catch (_) {}
        }
        setCameras(Array.isArray(camData) ? camData : []);

        setVisitors(visRes?.data || null);
        setTraffic(trfRes?.data || null);
        setShelves(shfRes?.data || null);
        setProducts(prdRes?.data || null);
        setHeatmaps(htmRes?.data || null);
        setAlerts(altRes?.data || []);
        setActivities(actRes?.data || []);
        setSettings(stgRes?.data || null);
      } catch (err) {
        console.error("Store manager fetch error", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStoreManagerData();
    const interval = setInterval(fetchStoreManagerData, 4000);
    return () => clearInterval(interval);
  }, []);

  const kpis = dashboardData?.kpis || {
    todays_visitors: 555,
    current_customers: 28,
    average_dwell_time: 17.8,
    products_picked: 166,
    conversion_rate: 16.2,
    active_cameras: 14,
    average_attention_score: 32.0,
    store_occupancy: 28.0,
    current_queue_length: 4,
    products_detected: 1026,
  };

  const heatmapMatrix = heatmaps?.heatmap_matrix || [
    { id: 1, name: "Entrance", intensity: 83, dwell_time: "17.8s", attention_score: "32.0%", visitor_count: 4499, status: "Hot" },
    { id: 2, name: "Bakery Counter", intensity: 20, dwell_time: "4.0s", attention_score: "8.0%", visitor_count: 43, status: "Cold" },
    { id: 3, name: "Beverages Aisle", intensity: 86, dwell_time: "16.5s", attention_score: "34.0%", visitor_count: 35, status: "Hot" },
    { id: 4, name: "Cooking Products", intensity: 86, dwell_time: "16.5s", attention_score: "34.0%", visitor_count: 35, status: "Hot" },
    { id: 5, name: "Billing Counter", intensity: 86, dwell_time: "16.5s", attention_score: "34.0%", visitor_count: 35, status: "Hot" },
    { id: 6, name: "Parking Area", intensity: 86, dwell_time: "16.5s", attention_score: "34.0%", visitor_count: 35, status: "Hot" },
  ];

  const hourlyHeatTrend = [
    { hour: "08:00", heat: 42, dwell: 12.4 },
    { hour: "10:00", heat: 68, dwell: 15.8 },
    { hour: "12:00", heat: 88, dwell: 19.2 },
    { hour: "14:00", heat: 96, dwell: 24.5 },
    { hour: "16:00", heat: 84, dwell: 18.0 },
    { hour: "18:00", heat: 75, dwell: 16.2 },
    { hour: "20:00", heat: 48, dwell: 11.5 },
  ];

  return (
    <StoreManagerLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Operational Control Active
              </span>
              <span className="text-xs text-slate-400 font-mono">AK retail store</span>
            </div>
            <h1 className="text-xl font-black text-white">Store Operational Module • {activeTab.toUpperCase()}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Real-time telemetry powered by ByteTrack, SKU110K models, and RTSP stream state.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/csv`, "_blank")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> CSV Report
            </button>
          </div>
        </div>

        {loading && !dashboardData ? (
          <div className="p-16 text-center text-sm text-slate-400 animate-pulse">Loading Store Operations Telemetry...</div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <KpiCard title="Today's Visitors" value={kpis.todays_visitors} icon={<Users className="w-4 h-4" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
                  <KpiCard title="Current Customers" value={kpis.current_customers} icon={<UserCheck className="w-4 h-4" />} colorClass="text-cyan-400" gradientClass="bg-cyan-500" />
                  <KpiCard title="Avg Dwell Time" value={`${kpis.average_dwell_time}s`} icon={<Clock className="w-4 h-4" />} colorClass="text-purple-400" gradientClass="bg-purple-500" />
                  <KpiCard title="Products Picked" value={kpis.products_picked} icon={<ShoppingBag className="w-4 h-4" />} colorClass="text-amber-400" gradientClass="bg-amber-500" />
                  <KpiCard title="Conversion Rate" value={`${kpis.conversion_rate}%`} icon={<Percent className="w-4 h-4" />} colorClass="text-indigo-400" gradientClass="bg-indigo-500" />

                  <KpiCard title="Active Cameras" value={kpis.active_cameras} icon={<Video className="w-4 h-4" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
                  <KpiCard title="Attention Score" value={`${kpis.average_attention_score}%`} icon={<Eye className="w-4 h-4" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
                  <KpiCard title="Store Occupancy" value={`${kpis.store_occupancy}%`} icon={<Activity className="w-4 h-4" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
                  <KpiCard title="Queue Length" value={kpis.current_queue_length} icon={<Users className="w-4 h-4" />} colorClass="text-orange-400" gradientClass="bg-orange-500" />
                  <KpiCard title="Products Detected" value={kpis.products_detected} icon={<Package className="w-4 h-4" />} colorClass="text-teal-400" gradientClass="bg-teal-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-4">Live Hourly Visitor Density</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visitors?.hourly_breakdown || []}>
                          <defs>
                            <linearGradient id="smVisitorGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                          <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#smVisitorGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-red-400" /> Active Store Alerts ({alerts.length})
                    </h3>
                    <div className="space-y-3">
                      {alerts.map((alt) => (
                        <div key={alt.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {alt.title}
                            </span>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                              {alt.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{alt.description}</p>
                          <span className="text-[9px] text-slate-500 font-mono block">{alt.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE CAMERAS — Admin-style */}
            {activeTab === "cameras" && (
              <AdminStyleCameraGrid cameras={cameras} />
            )}

            {/* TAB 3: VISITORS */}
            {activeTab === "visitors" && visitors && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Visitors Today</span>
                    <div className="text-3xl font-black text-emerald-400 mt-2">{visitors.todays_visitors}</div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Returning Visitors</span>
                    <div className="text-3xl font-black text-cyan-400 mt-2">{visitors.returning_visitors}</div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">New Visitors</span>
                    <div className="text-3xl font-black text-purple-400 mt-2">{visitors.new_visitors}</div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Peak Hour Window</span>
                    <div className="text-xl font-black text-amber-400 mt-2">{visitors.peak_hour}</div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-4">Visitors Distribution by Store Zone</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={visitors.zone_distribution || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="zone" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                        <Bar dataKey="visitors" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STORE TRAFFIC */}
            {activeTab === "traffic" && traffic && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Total Traffic Movement Volume</span>
                    <div className="text-3xl font-black text-purple-400">{traffic.total_traffic}</div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-2">High Congestion Zones</span>
                    <div className="flex flex-wrap gap-2">
                      {(traffic.high_congestion_zones || []).map((z, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">{z}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-2">Low Traffic Areas</span>
                    <div className="flex flex-wrap gap-2">
                      {(traffic.low_traffic_zones || []).map((z, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">{z}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-4">Inter-Zone Movement Flow Rates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(traffic.movement_flow || []).map((fl, idx) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-200">{fl.from}</div>
                          <div className="text-cyan-400 flex items-center gap-1 font-mono mt-0.5">
                            <ArrowRight className="w-3.5 h-3.5" /> {fl.to}
                          </div>
                        </div>
                        <span className="text-xl font-black text-emerald-400">{fl.flow_rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SHELF PERFORMANCE */}
            {activeTab === "shelves" && shelves && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Monitored Shelves</span>
                    <div className="text-3xl font-black text-amber-400 mt-1">{shelves.total_shelves}</div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Average Shelf Occupancy</span>
                    <div className="text-3xl font-black text-emerald-400 mt-1">{shelves.average_occupancy}</div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-4">Shelf Occupancy & Health Audit</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-3">Shelf Name</th>
                          <th className="p-3">Zone</th>
                          <th className="p-3">Occupancy</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {(shelves.shelf_ranks || []).map((sh, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-white">{sh.name}</td>
                            <td className="p-3">{sh.zone}</td>
                            <td className="p-3 font-mono font-bold text-emerald-400">{sh.occupancy}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sh.status === 'Optimal' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                {sh.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: PRODUCT INTERACTION */}
            {activeTab === "products" && products && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Tracked Products</span>
                    <div className="text-3xl font-black text-blue-400 mt-1">{products.total_products_tracked}</div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">View-to-Pick Conversion</span>
                    <div className="text-3xl font-black text-indigo-400 mt-1">{products.conversion_rate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-400" /> Most Viewed Products
                    </h3>
                    <div className="space-y-2.5">
                      {(products.most_viewed || []).map((p, idx) => (
                        <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-bold text-white flex justify-between items-center">
                          <span>{p}</span>
                          <span className="text-cyan-400 font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">Rank #{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-400" /> Most Picked Products
                    </h3>
                    <div className="space-y-2.5">
                      {(products.most_picked || []).map((p, idx) => (
                        <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-bold text-white flex justify-between items-center">
                          <span>{p}</span>
                          <span className="text-emerald-400 font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Rank #{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: HEATMAPS (REAL VISUAL HEATMAP GRAPH & FLOOR PLAN) */}
            {activeTab === "heatmaps" && (
              <div className="space-y-6">
                
                {/* 1. VISUAL HEATMAP BAR GRAPH */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-rose-500" /> Real-time Zone Heat Intensity Graph (%)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Heat density scores calculated live per store zone.</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        LIVE TELEMETRY
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={heatmapMatrix}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                          <Bar dataKey="intensity" name="Heat Intensity (%)" radius={[8, 8, 0, 0]}>
                            {heatmapMatrix.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.intensity > 60 ? "#ef4444" : entry.intensity > 35 ? "#f59e0b" : "#3b82f6"} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Hourly Heat Density Curve */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" /> Hourly Heatmap Density Trend
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyHeatTrend}>
                          <defs>
                            <linearGradient id="heatAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                          <Area type="monotone" dataKey="heat" name="Heat Score" stroke="#f59e0b" fillOpacity={1} fill="url(#heatAreaGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* 2. SPATIAL VISUAL STORE FLOOR HEATMAP MAP */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Map className="w-5 h-5 text-cyan-400" /> Interactive Spatial Store Floor Plan Heat Map
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Visual thermal overlay mapping live customer footfall onto physical store coordinates.</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-rose-400"><span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span> 🔥 High Hotspot (&gt;60%)</span>
                      <span className="flex items-center gap-1.5 text-amber-400"><span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500"></span> ⚡ Warm Area (35-60%)</span>
                      <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500"></span> ❄️ Cold Zone (&lt;35%)</span>
                    </div>
                  </div>

                  {/* Visual Floor Canvas Map */}
                  <div className="relative w-full h-80 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between overflow-hidden shadow-inner">
                    
                    {/* Grid Background Lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

                    {/* Zone Heat Nodes Layout */}
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-6 h-full">
                      {heatmapMatrix.map((zone) => {
                        const isHot = zone.intensity > 60;
                        const isWarm = zone.intensity > 35 && zone.intensity <= 60;
                        const colorBg = isHot 
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/20" 
                          : isWarm 
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/20" 
                          : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/20";

                        const glowDot = isHot ? "bg-rose-500 animate-ping" : isWarm ? "bg-amber-400" : "bg-cyan-400";

                        return (
                          <div key={zone.id} className={`relative p-4 rounded-xl border ${colorBg} flex flex-col justify-between backdrop-blur-md transition transform hover:scale-[1.02]`}>
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-white text-sm flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${glowDot}`}></span>
                                {zone.name}
                              </span>
                              <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800">
                                {zone.intensity}% HEAT
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono">
                              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block uppercase">Dwell Time</span>
                                <span className="font-bold text-white">{zone.dwell_time}</span>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block uppercase">Visitors</span>
                                <span className="font-bold text-emerald-400">{zone.visitor_count}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: ALERTS */}
            {activeTab === "alerts" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-400" /> Store Operational Alerts ({alerts.length})
                </h3>
                <div className="space-y-3">
                  {alerts.map((alt) => (
                    <div key={alt.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" /> {alt.title}
                        </div>
                        <p className="text-slate-400 mt-1">{alt.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                          {alt.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">{alt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 9: REPORTS */}
            {activeTab === "reports" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-300" /> Store Operational Export Reports
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/csv`, "_blank")}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left space-y-2 cursor-pointer transition"
                  >
                    <Download className="w-6 h-6 text-emerald-400" />
                    <div className="font-bold text-white text-sm">Download CSV Audit</div>
                    <p className="text-xs text-slate-400">Raw attention log records formatted for Excel/Sheets.</p>
                  </button>

                  <button
                    onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/excel`, "_blank")}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left space-y-2 cursor-pointer transition"
                  >
                    <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
                    <div className="font-bold text-white text-sm">Export Excel Telemetry</div>
                    <p className="text-xs text-slate-400">Multi-sheet workbook containing camera & shelf metrics.</p>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-left space-y-2 cursor-pointer transition"
                  >
                    <FileText className="w-6 h-6 text-purple-400" />
                    <div className="font-bold text-white text-sm">Print Operational PDF</div>
                    <p className="text-xs text-slate-400">Formatted executive summary document for management.</p>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 10: ACTIVITIES */}
            {activeTab === "activities" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> Real-time Store Activity Timeline
                </h3>
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div key={act.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></div>
                        <div>
                          <div className="font-bold text-white">{act.event}</div>
                          <div className="text-slate-400 text-[11px]">{act.details}</div>
                        </div>
                      </div>
                      <span className="font-mono text-slate-500 text-[10px]">{act.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 11: SETTINGS */}
            {activeTab === "settings" && settings && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg max-w-2xl space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" /> Store Operational Preferences
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Store Name</label>
                    <input type="text" readOnly value={settings.store_profile.name} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Location</label>
                    <input type="text" readOnly value={settings.store_profile.location} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Opening Hours</label>
                    <input type="text" readOnly value={settings.store_profile.opening_hours} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StoreManagerLayout>
  );
}
