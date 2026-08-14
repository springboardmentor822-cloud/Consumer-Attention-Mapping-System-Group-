import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function AiInfrastructure() {
  const [activeTab, setActiveTab] = useState("models"); // 'models' | 'nodes' | 'pipelines' | 'resources'
  const [toastMessage, setToastMessage] = useState("");
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // AI Models
  const [aiModels, setAiModels] = useState([
    { id: "M-YOLOv8", name: "YOLOv8 Object & Person Detector", version: "v2.4.0", type: "Real-time Detection", precision: "FP16 TensorRT", fps: "30 FPS", status: "Active", latency: "12ms", uptime: "99.99%" },
    { id: "M-BYTE", name: "ByteTrack Multi-Object Tracker", version: "v1.8.2", type: "Trajectory Tracking", precision: "FP16 CUDA", fps: "30 FPS", status: "Active", latency: "6ms", uptime: "99.98%" },
    { id: "M-GAZE", name: "Gaze-Net Attention Estimator", version: "v3.1.0", type: "Gaze & Dwell Analysis", precision: "INT8 TensorRT", fps: "25 FPS", status: "Active", latency: "18ms", uptime: "99.95%" },
    { id: "M-REID", name: "Re-ID Consumer Feature Extractor", version: "v1.2.5", type: "Re-Identification", precision: "FP32 PyTorch", fps: "20 FPS", status: "Idle / Warm", latency: "24ms", uptime: "99.90%" }
  ]);

  // Compute Nodes (NVIDIA Jetson / GPU Clusters)
  const computeNodes = [
    { id: "NODE-GPU-01", name: "NVIDIA RTX 4090 Cluster #1", role: "Primary Stream Inference", gpuUtil: "68%", vram: "18.4 GB / 24 GB", temp: "58°C", streams: 48, status: "Healthy" },
    { id: "NODE-GPU-02", name: "NVIDIA RTX 4090 Cluster #2", role: "Primary Stream Inference", gpuUtil: "62%", vram: "16.8 GB / 24 GB", temp: "54°C", streams: 42, status: "Healthy" },
    { id: "NODE-JET-01", name: "Jetson AGX Orin Edge Node 1", role: "In-Store Edge AI Processor", gpuUtil: "74%", vram: "12.2 GB / 32 GB", temp: "48°C", streams: 16, status: "Healthy" },
    { id: "NODE-JET-02", name: "Jetson AGX Orin Edge Node 2", role: "In-Store Edge AI Processor", gpuUtil: "81%", vram: "14.5 GB / 32 GB", temp: "52°C", streams: 18, status: "Warning" }
  ];

  // Pipeline Execution Stats
  const pipelineSteps = [
    { step: "1. RTSP Video Ingestion", rate: "142 Streams", latency: "4 ms", loss: "0.00%", status: "Optimal" },
    { step: "2. YOLOv8 Bounding Box Detection", rate: "4,260 FPS", latency: "12 ms", loss: "0.01%", status: "Optimal" },
    { step: "3. ByteTrack Trajectory Association", rate: "4,260 FPS", latency: "6 ms", loss: "0.00%", status: "Optimal" },
    { step: "4. Attention Heatmap Rasterization", rate: "142 Grids", latency: "8 ms", loss: "0.00%", status: "Optimal" },
    { step: "5. Analytics DB Time-Series Write", rate: "1,420 Recs/s", latency: "5 ms", loss: "0.00%", status: "Optimal" }
  ];

  // Resource Usage Chart Data
  const resourceHistory = [
    { time: "00:00", gpu: 42, vram: 50, cpu: 28, temp: 46 },
    { time: "04:00", gpu: 35, vram: 45, cpu: 22, temp: 44 },
    { time: "08:00", gpu: 65, vram: 68, cpu: 52, temp: 52 },
    { time: "12:00", gpu: 88, vram: 82, cpu: 74, temp: 58 },
    { time: "16:00", gpu: 76, vram: 78, cpu: 65, temp: 55 },
    { time: "20:00", gpu: 54, vram: 60, cpu: 42, temp: 48 }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 border border-purple-500 text-purple-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>🤖</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h1 className="text-xl font-black text-white tracking-wide">AI & Infrastructure Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/10 border border-purple-500/30 text-purple-400 uppercase tracking-widest">
              NVIDIA CUDA & TensorRT Cluster
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsDeployModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
        >
          <span>🚀</span> Deploy New AI Service
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Deployed AI Models</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">4 Models Active</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">TensorRT Accelerated</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">GPU Compute Nodes</span>
          <h2 className="text-lg font-black text-white font-mono">4 Compute Clusters</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">124 Total GPU Cores</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Inference Frame Rate</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">4,260 FPS Total</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">30 FPS Per Stream</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Avg Model Latency</span>
          <h2 className="text-lg font-black text-cyan-400 font-mono">12.0 ms</h2>
          <span className="text-[10px] text-cyan-400 font-bold block">Real-time Stream Engine</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "models", label: "🤖 Deployed AI Models", count: aiModels.length },
          { id: "nodes", label: "🖥️ Compute Nodes & GPUs", count: computeNodes.length },
          { id: "pipelines", label: "⚡ Stream Processing Pipelines", count: pipelineSteps.length },
          { id: "resources", label: "📊 Hardware Resource Utilization", count: "Real-time" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap
              ${activeTab === t.id
                ? "bg-purple-600 text-white shadow-md"
                : "bg-[#0F172A] text-slate-400 border border-[#1E293B] hover:text-white"
              }`}
          >
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-black/30 font-mono">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: AI MODELS ────────────────────────────────────────────── */}
      {activeTab === "models" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiModels.map((m) => (
            <div key={m.id} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 hover:border-slate-600 transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{m.name}</h3>
                    <span className="text-[11px] text-purple-400 font-mono block">{m.id} • Version {m.version}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    ● {m.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 bg-[#070C18] p-3 rounded-xl border border-[#1E293B] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Engine Type</span>
                    <span className="font-bold text-slate-200">{m.type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Precision Mode</span>
                    <span className="font-mono text-purple-300 font-bold">{m.precision}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Target Frame Rate</span>
                    <span className="font-mono text-emerald-400 font-bold">{m.fps}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Inference Latency</span>
                    <span className="font-mono text-cyan-400 font-bold">{m.latency}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E293B] flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono text-[10px]">Processing Uptime: {m.uptime}</span>
                <button
                  onClick={() => showToast(`Initiated model benchmark for ${m.name}`)}
                  className="px-3 py-1 bg-[#1E293B] hover:bg-[#273552] text-purple-300 font-bold rounded-lg text-[11px] border border-purple-500/20 transition"
                >
                  Model Metrics →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: COMPUTE NODES ─────────────────────────────────────────── */}
      {activeTab === "nodes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {computeNodes.map((n) => (
            <div key={n.id} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-white text-sm">{n.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{n.id} • {n.role}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${n.status === "Healthy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}>
                  ● {n.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 bg-[#070C18] p-3 rounded-xl border border-[#1E293B] text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">GPU Load</span>
                  <span className="font-mono font-black text-purple-400 text-sm">{n.gpuUtil}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">VRAM Allocated</span>
                  <span className="font-mono font-bold text-slate-200">{n.vram}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Active Streams</span>
                  <span className="font-mono font-bold text-emerald-400">{n.streams} Streams</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: PIPELINE EXECUTION STATS ─────────────────────────────── */}
      {activeTab === "pipelines" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>⚡</span> End-to-End AI Processing Pipeline Execution Stats
          </h3>

          <div className="space-y-3">
            {pipelineSteps.map((p, idx) => (
              <div key={idx} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-white text-xs block">{p.step}</span>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Throughput: <strong className="text-indigo-300">{p.rate}</strong> • Step Latency: <strong className="text-cyan-400">{p.latency}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-400 font-bold">Drop Rate: {p.loss}</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: HARDWARE RESOURCE UTILIZATION ────────────────────────── */}
      {activeTab === "resources" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>📊</span> Cluster Hardware Load & Thermal Trends
          </h3>

          <div className="h-64 w-full pt-2">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <LineChart data={resourceHistory}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Line type="monotone" dataKey="gpu" stroke="#A855F7" strokeWidth={2} name="GPU Utilization %" />
                <Line type="monotone" dataKey="vram" stroke="#06B6D4" strokeWidth={2} name="VRAM Usage %" />
                <Line type="monotone" dataKey="cpu" stroke="#10B981" strokeWidth={2} name="CPU Load %" />
              </LineChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      )}

      {/* ── MODAL: DEPLOY NEW AI SERVICE ─────────────────────────────────── */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-white">🚀 Deploy New AI Model / Service</h3>
              <button onClick={() => setIsDeployModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              showToast("AI Model compiled & deployed to GPU inference engine!");
              setIsDeployModalOpen(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Model Name</label>
                <input type="text" required placeholder="e.g. YOLOv9 Object Detector" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Precision Acceleration</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono">
                  <option>FP16 TensorRT (Recommended)</option>
                  <option>INT8 Quantized (Ultra Low Latency)</option>
                  <option>FP32 CUDA Standard</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Compute Node Cluster</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                  <option>NVIDIA RTX 4090 Cluster #1</option>
                  <option>NVIDIA RTX 4090 Cluster #2</option>
                  <option>Jetson AGX Orin Edge Cluster</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsDeployModalOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition">Deploy Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
