import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { canManageCameras } from "../utils/roles";
import axios from "axios";

const API_BASE_URL = api.defaults.baseURL || "http://localhost:8000";

const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const path = url.replace(/^https?:\/\/[^\/]+/, "");
    return `${API_BASE_URL}${path}`;
  }
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
};

/* ─── animated counter ───────────────────────────────────── */
function AnimatedNumber({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 30) || 1;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(start);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{val}{suffix}</>;
}

/* ─── keyframes injected once ────────────────────────────── */
const CSS_ANIM = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes scaleUp { from{transform:scale(.93);opacity:0} to{transform:scale(1);opacity:1} }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
@keyframes glow { 0%,100%{box-shadow:0 0 6px #22d3a5} 50%{box-shadow:0 0 16px #22d3a5} }
@keyframes slide-scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(200%)} }
.cam-card:hover { transform: translateY(-4px) scale(1.01) !important; box-shadow: 0 20px 50px #22d3a522, 0 0 0 1.5px #22d3a540 !important; }
.ping-btn:hover { background: rgba(34,211,165,0.18) !important; border-color: #22d3a5 !important; }
.delete-btn:hover { background: rgba(248,113,113,0.2) !important; border-color: #f87171 !important; color: #f87171 !important; }
.action-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
.action-btn-secondary:hover { background: #0f2035 !important; color: #94a3b8 !important; }
`;

const S = {
  statPill: (accent) => ({
    flex: "1 1 150px",
    background: "linear-gradient(135deg,#0d1b2a 0%,#081420 100%)",
    border: `1px solid ${accent}33`,
    borderRadius: 14,
    padding: "16px 20px",
    boxShadow: `0 0 24px ${accent}14`,
  }),
  card: () => ({
    background: "linear-gradient(145deg,#0d1b2a 0%,#0a1628 100%)",
    border: "1.5px solid #1e2d42",
    borderRadius: 18,
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
    boxShadow: "0 4px 24px #00000045",
  }),
  input: {
    width: "100%",
    background: "#030d18",
    border: "1px solid #1e2d42",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 12,
    color: "#e2e8f0",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
};

export default function Cameras() {
  const { user } = useAuth();
  const canManage = canManageCameras(user?.role);
  const [store, setStore] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [regMode, setRegMode] = useState("file"); // "file" or "rtsp"
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeCamera, setActiveCamera] = useState(null);
  const [activeCameraAnalytics, setActiveCameraAnalytics] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [realMetrics, setRealMetrics] = useState(null);

  const fetchRealMetrics = async (storeId) => {
    try {
      const res = await api.get(`/analytics/stores/${storeId}/retail-metrics`);
      setRealMetrics(res.data);
    } catch (err) {
      console.error("Failed to fetch real metrics", err);
    }
  };

  useEffect(() => {
    api.get("/stores").then((r) => { if (r.data.length > 0) setStore(r.data[0]); });
  }, []);

  const fetchCameras = async (storeId) => {
    if (!storeId) return;
    try {
      const res = await api.get(`/cameras/${storeId}`);
      let fetchedCameras = res.data;
      setCameras(fetchedCameras);
    } catch (err) {
      console.error("Failed to load cameras", err);
    }
  };

  useEffect(() => {
    if (store) fetchCameras(store.id);
  }, [store]);

  useEffect(() => {
    if (!store) return;
    fetchRealMetrics(store.id);
    const interval = setInterval(() => {
      fetchRealMetrics(store.id);
    }, 2000);
    return () => clearInterval(interval);
  }, [store]);

  useEffect(() => {
    if (!activeCamera) {
      setActiveCameraAnalytics(null);
      return;
    }
    const fetchCamAnalytics = async () => {
      try {
        const res = await api.get(`/cameras/${activeCamera.id}/analytics`);
        setActiveCameraAnalytics(res.data);
      } catch (err) {
        console.error(`Failed to fetch analytics for camera ${activeCamera.id}`, err);
      }
    };
    fetchCamAnalytics();
    const interval = setInterval(fetchCamAnalytics, 1500);
    return () => clearInterval(interval);
  }, [activeCamera]);

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a video file.");
      return;
    }
    setError(""); setBusy(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await api.post(
        `/cameras/upload-video?store_id=${store.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSelectedFile(null);
      if (store) fetchCameras(store.id);
    } catch (err) {
      setError("Upload failed. Make sure backend is running.");
    } finally { setBusy(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!store) return;
    setError(""); setBusy(true);
    try {
      await api.post("/cameras", { label, location, stream_url: streamUrl, store_id: store.id });
      setLabel(""); setLocation(""); setStreamUrl("");
      fetchCameras(store.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not register camera.");
    } finally { setBusy(false); }
  }

  async function handleDeleteCamera(id, e) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this camera feed?")) return;
    try {
      await api.delete(`/cameras/${id}`);
      setCameras((p) => p.filter((c) => c.id !== id));
      if (activeCamera?.id === id) setActiveCamera(null);
    } catch (err) {
      alert("Failed to delete camera.");
    }
  }

  async function checkStatus(id) {
    const r = await api.get(`/cameras/status/${id}`);
    setCameras((p) => p.map((c) => (c.id === id ? r.data : c)));
  }

  const onlineCount = cameras.filter((c) => c.status === "online").length;

  const currentFps = activeCameraAnalytics?.fps ? activeCameraAnalytics.fps.toFixed(1) : 24.0;
  const currentDwell = activeCameraAnalytics?.average_dwell_time ? activeCameraAnalytics.average_dwell_time.toFixed(1) : "0.0";
  const currentDetected = activeCameraAnalytics?.current_customers ?? 0;
  const currentProducts = activeCameraAnalytics?.current_products ?? 0;
  const totalCustomerCount = activeCameraAnalytics?.total_entries ?? activeCameraAnalytics?.current_customers ?? 0;

  const statusCfg = {
    online:  { dot: "#22d3a5", text: "Online",  color: "#22d3a5" },
    offline: { dot: "#f87171", text: "Offline", color: "#f87171" },
    unknown: { dot: "#94a3b8", text: "Unknown", color: "#94a3b8" },
  };

  if (!store) return (
    <Layout title="Camera Control">
      <div style={{ color: "#22d3a5", textAlign: "center", padding: 60, letterSpacing: "0.1em", fontSize: 13 }}>
        ⬡ Initialising surveillance network…
      </div>
    </Layout>
  );

  return (
    <Layout title={`Camera Control — ${store.name}`}>
      <style>{CSS_ANIM}</style>
      <div style={{ fontFamily: "Inter, sans-serif" }}>

        {/* ── Summary Stats ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { label: "Total Cameras", value: cameras.length, suffix: "",     color: "#38bdf8", accent: "#38bdf8" },
            { label: "Online Now",    value: onlineCount,    suffix: "",     color: "#22d3a5", accent: "#22d3a5" },
            { label: "Offline",       value: cameras.length - onlineCount, suffix: "", color: "#f87171", accent: "#f87171" },
            { label: "Avg FPS",       value: 14,             suffix: " fps", color: "#a78bfa", accent: "#a78bfa" },
          ].map((s) => (
            <div key={s.label} style={S.statPill(s.accent)}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 20, alignItems: "start" }}>

          {/* Camera Grid */}
          <div>
            {cameras.length === 0 ? (
              <div style={{ background: "#0d1b2a", border: "1px dashed #1e3350", borderRadius: 18, padding: 56, textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📷</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>No cameras registered</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Upload a video file or register an RTSP feed →</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 18 }}>
                {cameras.map((c, i) => {
                  const st = statusCfg[c.status] || statusCfg.unknown;
                  const videoSrc = resolveMediaUrl(c.stream_url);
                  return (
                    <div
                      key={c.id}
                      className="cam-card"
                      style={S.card()}
                      onMouseEnter={() => setHoveredCard(c.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => { 
                        setActiveCamera(c); 
                        setShowHeatmap(false); 
                        setSnapshotMsg(""); 
                        fetchRealMetrics(store.id);
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ width: "100%", aspectRatio: "16/9", background: "#030d18", position: "relative", overflow: "hidden" }}>
                        <video src={videoSrc} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85, filter: "brightness(0.9) saturate(1.1)" }} autoPlay muted loop playsInline />
                        {/* Gradient fade */}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,#0a1628 100%)" }} />
                        {/* Corner brackets */}
                        {[[{top:8,left:8},{borderTop:"1.5px solid #22d3a5",borderLeft:"1.5px solid #22d3a5"}],
                          [{top:8,right:8},{borderTop:"1.5px solid #22d3a5",borderRight:"1.5px solid #22d3a5"}],
                          [{bottom:8,left:8},{borderBottom:"1.5px solid #22d3a5",borderLeft:"1.5px solid #22d3a5"}],
                          [{bottom:8,right:8},{borderBottom:"1.5px solid #22d3a5",borderRight:"1.5px solid #22d3a5"}],
                        ].map(([pos, border], bi) => (
                          <div key={bi} style={{ position:"absolute", width:14, height:14, ...pos, ...border }} />
                        ))}
                        {/* LIVE badge */}
                        <div style={{ position:"absolute", top:10, left:10, display:"flex", alignItems:"center", gap:5, background:"rgba(5,12,22,0.8)", border:"1px solid #ef444450", borderRadius:7, padding:"3px 8px", backdropFilter:"blur(6px)" }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444", display:"inline-block", animation:"blink 1s step-start infinite" }} />
                          <span style={{ fontSize:8, fontWeight:900, color:"#ef4444", letterSpacing:"0.16em" }}>LIVE</span>
                        </div>
                        {/* Cam ID */}
                        <div style={{ position:"absolute", top:10, right:10, fontSize:9, fontFamily:"monospace", color:"#22d3a5", background:"rgba(3,13,24,0.85)", padding:"2px 7px", borderRadius:5, border:"1px solid #1e2d42" }}>
                          {`CAM ${String(i+1).padStart(2,"0")}`}
                        </div>
                        {/* Hover overlay */}
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,6,18,0.6)", backdropFilter:"blur(3px)", opacity: hoveredCard===c.id?1:0, transition:"opacity 0.22s" }}>
                          <div style={{ background:"linear-gradient(135deg,#22d3a5,#3b82f6)", borderRadius:11, padding:"9px 22px", fontSize:12, fontWeight:800, color:"#fff", letterSpacing:"0.06em", boxShadow:"0 4px 20px #22d3a540" }}>
                            ▶ Open Monitor
                          </div>
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding:"14px 16px 16px" }}>
                        <div style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:2 }}>{c.label}</div>
                        <div style={{ fontSize:11, color:"#475569", marginBottom:12 }}>{c.location}</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid #0f1f30", paddingTop:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ width:8, height:8, borderRadius:"50%", background:st.dot, display:"inline-block", boxShadow:`0 0 8px ${st.dot}`, animation: c.status==="online"?"glow 2s ease infinite":undefined }} />
                            <span style={{ fontSize:11, color:st.color, fontWeight:700 }}>{st.text}</span>
                          </div>
                          <div style={{ display:"flex", gap:6 }}>
                            <button
                              className="ping-btn"
                              style={{ fontSize:10, fontWeight:700, padding:"4px 11px", borderRadius:7, border:"1px solid #1e3350", background:"transparent", color:"#475569", cursor:"pointer", letterSpacing:"0.05em", transition:"all 0.2s" }}
                              onClick={(e) => { e.stopPropagation(); checkStatus(c.id); }}
                            >
                              Ping
                            </button>
                            {canManage && (
                              <button
                                className="delete-btn"
                                style={{ fontSize:10, fontWeight:700, padding:"4px 8px", borderRadius:7, border:"1px solid #334155", background:"transparent", color:"#64748b", cursor:"pointer", transition:"all 0.2s" }}
                                onClick={(e) => handleDeleteCamera(c.id, e)}
                                title="Delete Camera"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Register Panel */}
          <div style={{ background:"linear-gradient(145deg,#0d1b2a,#081420)", border:"1.5px solid #1e2d42", borderRadius:18, padding:22, boxShadow:"0 8px 32px #00000050" }}>
            {canManage ? (
              <>
                <div style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:4 }}>＋ Add Camera Feed</div>
                <div style={{ fontSize:11, color:"#475569", marginBottom:14 }}>Upload a video file or connect an RTSP stream.</div>

                {/* Mode Selector */}
                <div style={{ display:"flex", background:"#030d18", border:"1px solid #1e2d42", borderRadius:10, padding:3, marginBottom:16 }}>
                  <button
                    onClick={() => setRegMode("file")}
                    style={{ flex:1, padding:"6px", borderRadius:8, fontSize:11, fontWeight:700, border:"none", cursor:"pointer", background: regMode==="file"?"#1e2d42":"transparent", color: regMode==="file"?"#22d3a5":"#64748b", transition:"all 0.2s" }}
                  >
                    📁 Upload Video
                  </button>
                  <button
                    onClick={() => setRegMode("rtsp")}
                    style={{ flex:1, padding:"6px", borderRadius:8, fontSize:11, fontWeight:700, border:"none", cursor:"pointer", background: regMode==="rtsp"?"#1e2d42":"transparent", color: regMode==="rtsp"?"#22d3a5":"#64748b", transition:"all 0.2s" }}
                  >
                    📡 RTSP Stream
                  </button>
                </div>

                {regMode === "file" ? (
                  <form onSubmit={handleFileUpload} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div>
                      <label style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"#475569", display:"block", marginBottom:5 }}>Select Video (.mp4)</label>
                      <input
                        type="file"
                        accept=".mp4,.avi,.mov"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        style={{ ...S.input, padding: "8px" }}
                      />
                    </div>
                    {error && <div style={{ fontSize:11, color:"#f87171", background:"#f8717118", border:"1px solid #f8717130", borderRadius:8, padding:"7px 11px" }}>{error}</div>}
                    <button
                      type="submit" disabled={busy}
                      style={{ width:"100%", background: busy?"#0d2a45":"linear-gradient(135deg,#22d3a5,#2563eb)", border:"none", borderRadius:10, color:"#fff", fontWeight:800, fontSize:12, letterSpacing:"0.07em", padding:"11px", cursor:busy?"not-allowed":"pointer", opacity:busy?0.6:1, transition:"all 0.2s", fontFamily:"Inter,sans-serif" }}
                    >
                      {busy ? "Uploading & Registering…" : "⊕ Upload & Add Camera"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCreate} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {[
                      { lbl:"Camera Label", val:label,     set:setLabel,     ph:"e.g. CAM-04" },
                      { lbl:"Location",     val:location,  set:setLocation,  ph:"e.g. Front Entrance" },
                      { lbl:"Stream URL",   val:streamUrl, set:setStreamUrl, ph:"rtsp://192.168.1.100/live" },
                    ].map(({ lbl, val, set, ph }) => (
                      <div key={lbl}>
                        <label style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"#475569", display:"block", marginBottom:5 }}>{lbl}</label>
                        <input
                          required value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={ph}
                          style={S.input}
                          onFocus={(e) => { e.target.style.borderColor="#22d3a5"; e.target.style.boxShadow="0 0 0 3px #22d3a514"; }}
                          onBlur={(e)  => { e.target.style.borderColor="#1e2d42"; e.target.style.boxShadow="none"; }}
                        />
                      </div>
                    ))}
                    {error && <div style={{ fontSize:11, color:"#f87171", background:"#f8717118", border:"1px solid #f8717130", borderRadius:8, padding:"7px 11px" }}>{error}</div>}
                    <button
                      type="submit" disabled={busy}
                      style={{ width:"100%", background: busy?"#0d2a45":"linear-gradient(135deg,#22d3a5,#2563eb)", border:"none", borderRadius:10, color:"#fff", fontWeight:800, fontSize:12, letterSpacing:"0.07em", padding:"11px", cursor:busy?"not-allowed":"pointer", opacity:busy?0.6:1, transition:"all 0.2s", fontFamily:"Inter,sans-serif" }}
                    >
                      {busy ? "Registering…" : "⊕ Add RTSP Camera"}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🔒</div>
                <div style={{ fontSize:11, color:"#475569", lineHeight:1.6 }}>View-only access.<br/>Contact a Store Manager to register cameras.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MONITOR MODAL ══ */}
      {activeCamera && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(0,4,14,0.9)", backdropFilter:"blur(14px)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fadeIn 0.2s ease", fontFamily:"Inter,sans-serif" }}
          onClick={() => setActiveCamera(null)}
        >
          <div
            style={{ background:"#04101e", border:"1.5px solid #1e3350", borderRadius:22, width:"100%", maxWidth:980, maxHeight:"92vh", display:"flex", flexDirection:"row", overflow:"hidden", boxShadow:"0 40px 100px #000c, 0 0 80px #22d3a51a", animation:"scaleUp 0.22s cubic-bezier(.34,1.56,.64,1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* LEFT: Video */}
            <div style={{ flex:1, background:"#020b16", display:"flex", flexDirection:"column", minWidth:0 }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:"1px solid #0d1e30" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#ef4444", display:"inline-block", animation:"blink 1s step-start infinite" }} />
                  <span style={{ fontSize:10, fontWeight:900, color:"#ef4444", letterSpacing:"0.2em" }}>LIVE FEED</span>
                  <span style={{ fontSize:9, color:"#475569", fontFamily:"monospace", marginLeft:6 }}>{new Date().toLocaleTimeString()}</span>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:9, fontFamily:"monospace", color:"#22d3a5", background:"#22d3a50d", border:"1px solid #22d3a525", borderRadius:6, padding:"2px 9px" }}>{activeCamera.label}</span>
                  <button onClick={() => setActiveCamera(null)} style={{ background:"#0d1e30", border:"1px solid #1e3350", borderRadius:8, color:"#475569", width:28, height:28, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif" }}>✕</button>
                </div>
              </div>

              {/* Video area */}
              <div style={{ flex:1, position:"relative", overflow:"hidden", minHeight:240 }}>
                <img
                  key={`${activeCamera.id}-${showHeatmap}`}
                  src={`${API_BASE_URL}/cameras/stream/${activeCamera.id}?heatmap=${showHeatmap}&token=${localStorage.getItem('cams_token')}`}
                  alt="Live AI Monitor Feed"
                  style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                />
                {/* Scanlines */}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,160,0.018) 2px,rgba(0,255,160,0.018) 4px)" }} />
                {/* Scan beam */}
                <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#22d3a530,transparent)", animation:"slide-scan 4s linear infinite", pointerEvents:"none" }} />
                {/* Heatmap */}
                {showHeatmap && (
                  <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 45% 35% at 58% 42%, rgba(255,90,0,0.42) 0%, rgba(255,200,0,0.18) 55%, transparent 80%), radial-gradient(ellipse 25% 22% at 28% 68%, rgba(255,40,0,0.3) 0%, transparent 70%)", mixBlendMode:"screen" }} />
                )}
                {/* Corner brackets */}
                {[[{top:10,left:10},{borderTop:"2px solid #22d3a5",borderLeft:"2px solid #22d3a5"}],
                  [{top:10,right:10},{borderTop:"2px solid #22d3a5",borderRight:"2px solid #22d3a5"}],
                  [{bottom:10,left:10},{borderBottom:"2px solid #22d3a5",borderLeft:"2px solid #22d3a5"}],
                  [{bottom:10,right:10},{borderBottom:"2px solid #22d3a5",borderRight:"2px solid #22d3a5"}],
                ].map(([pos,border],i) => (
                  <div key={i} style={{ position:"absolute", width:18, height:18, pointerEvents:"none", ...pos, ...border }} />
                ))}
              </div>

              {/* Footer */}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 18px", borderTop:"1px solid #0d1e30", fontSize:9, fontFamily:"monospace", color:"#475569" }}>
                <span>URL: {activeCamera.stream_url}</span>
                <span style={{ color:"#22d3a5" }}>AI: YOLOv8 / Attention Mapping &nbsp;|&nbsp; {currentFps} FPS</span>
              </div>
            </div>

            {/* RIGHT: Analytics */}
            <div style={{ width:292, background:"#040f1c", borderLeft:"1.5px solid #0d1e30", display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {/* Header */}
              <div style={{ padding:"18px 18px 14px", borderBottom:"1px solid #0d1e30" }}>
                <div style={{ fontSize:16, fontWeight:900, color:"#e2e8f0", letterSpacing:"0.02em" }}>{activeCamera.label}</div>
                <div style={{ fontSize:11, color:"#475569", marginTop:2, marginBottom:14 }}>{activeCamera.location}</div>
                {/* Heatmap toggle */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#081420", border:"1px solid #0d1e30", borderRadius:10, padding:"10px 13px" }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#64748b" }}>Attention Heatmap</div>
                    <div style={{ fontSize:9, color:"#475569" }}>Dwell zone overlay</div>
                  </div>
                  <div
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    style={{ width:40, height:22, borderRadius:12, background: showHeatmap?"#22d3a5":"#0d1e30", border:`1px solid ${showHeatmap?"#22d3a5":"#1e3350"}`, cursor:"pointer", position:"relative", transition:"all 0.25s", flexShrink:0 }}
                  >
                    <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left: showHeatmap?20:2, transition:"left 0.25s", boxShadow:"0 1px 6px #0009" }} />
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
                {[
                  { label:"Frame Rate",          val: currentFps,           suffix:" fps", color:"#38bdf8", pct:(currentFps/30)*100 },
                  { label:"Avg Dwell Time",      val: parseFloat(currentDwell), suffix:"s",color:"#22d3a5", pct:Math.min((parseFloat(currentDwell)/10)*100, 100) },
                  { label:"People Detected",     val: currentDetected,      suffix:"",     color:"#a78bfa", pct:Math.min(currentDetected * 20, 100) },
                  { label:"Products Detected",   val: currentProducts,      suffix:"",     color:"#eab308", pct:Math.min(currentProducts * 5, 100) },
                  { label:"Total Customer Count",val: totalCustomerCount,   suffix:"",     color:"#f59e0b", pct:Math.min(totalCustomerCount, 100) },
                ].map((m) => (
                  <div key={m.label} style={{ background:`linear-gradient(135deg,${m.color}09 0%,transparent 100%)`, border:`1px solid ${m.color}1e`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                    <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.13em", color:"#475569", marginBottom:4 }}>{m.label}</div>
                    <div style={{ fontSize:22, fontWeight:900, color:m.color, lineHeight:1 }}>
                      <AnimatedNumber target={m.val} suffix={m.suffix} />
                    </div>
                    <div style={{ height:3, borderRadius:2, background:"#0d1e30", marginTop:7, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${m.pct}%`, background:m.color, borderRadius:2, transition:"width 1s ease" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer action */}
              <div style={{ padding:16, borderTop:"1px solid #0d1e30" }}>
                <button
                  onClick={() => setActiveCamera(null)}
                  style={{ width:"100%", background:"#0d1e30", border:"1px solid #1e3350", borderRadius:10, color:"#94a3b8", fontWeight:700, fontSize:11, padding:"10px", cursor:"pointer" }}
                >
                  Close Monitor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
