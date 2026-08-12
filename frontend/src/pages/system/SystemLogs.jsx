import { useState } from "react";
import Layout from "../../components/Layout";
import { FileSearch, Download, Trash2, Search, Filter, ShieldAlert, CheckCircle, Info, AlertTriangle } from "lucide-react";

export default function SystemLogs() {
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [logs, setLogs] = useState([
    { id: 1, time: "2026-07-27 19:54:12", level: "INFO", component: "YOLOv8 Engine", message: "YOLOv8 person detector initialized with weight file yolov8n.pt", ip: "127.0.0.1" },
    { id: 2, time: "2026-07-27 19:54:14", level: "SUCCESS", component: "SKU110K Model", message: "Product detector loaded app/models/sku110k_best.pt successfully (166 products mapped)", ip: "127.0.0.1" },
    { id: 3, time: "2026-07-27 19:55:01", level: "INFO", component: "ByteTrack Tracker", message: "ByteTrack instance allocated for 14 active camera channels", ip: "127.0.0.1" },
    { id: 4, time: "2026-07-27 19:56:30", level: "WARNING", component: "RTSP Streamer", message: "Camera Cam 08 reconnecting to stream source (Backdoor Exit feed)", ip: "192.168.1.108" },
    { id: 5, time: "2026-07-27 19:58:10", level: "INFO", component: "Database Service", message: "Executed AttentionLog query for Store 01 (554 logs retrieved)", ip: "127.0.0.1" },
    { id: 6, time: "2026-07-27 19:59:45", level: "SUCCESS", component: "FastAPI Router", message: "GET /analytics/stores/1/live returned 200 OK in 14ms", ip: "127.0.0.1" },
    { id: 7, time: "2026-07-27 20:01:22", level: "INFO", component: "Heatmap Engine", message: "Generated 155 thermal coordinate anchor points across 6 store locations", ip: "127.0.0.1" },
    { id: 8, time: "2026-07-27 20:04:15", level: "ERROR", component: "RTSP Streamer", message: "Camera Cam 12 stream connection timeout; falling back to stored video buffer", ip: "192.168.1.112" },
    { id: 9, time: "2026-07-27 20:07:00", level: "SUCCESS", component: "Report Service", message: "Generated Daily & Weekly Executive PDF reports for Store 04", ip: "127.0.0.1" },
    { id: 10, time: "2026-07-27 20:12:30", level: "INFO", component: "Auth Service", message: "User admin@cams.com authenticated successfully (Role: Administrator)", ip: "127.0.0.1" }
  ]);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.time.includes(searchTerm);
    return matchesLevel && matchesSearch;
  });

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear current system logs?")) {
      setLogs([]);
    }
  };

  const handleExportLogs = () => {
    const textContent = logs
      .map((l) => `[${l.time}] [${l.level}] [${l.component}] ${l.message} (IP: ${l.ip})`)
      .join("\n");
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cams_system_audit_${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case "SUCCESS":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> SUCCESS</span>;
      case "WARNING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> WARNING</span>;
      case "ERROR":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit"><ShieldAlert className="w-3 h-3" /> ERROR</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit"><Info className="w-3 h-3" /> INFO</span>;
    }
  };

  return (
    <Layout title="System Audit Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-indigo-400" />
              System Audit & AI Engine Activity Logs
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-time execution logs from FastAPI server, YOLOv8 detector, ByteTrack, and OpenCV video pipeline.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportLogs}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Log File
            </button>
            <button
              onClick={handleClearLogs}
              className="bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Buffer
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search log messages or component..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {["ALL", "INFO", "SUCCESS", "WARNING", "ERROR"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition cursor-pointer ${
                    filterLevel === lvl
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Severity</th>
                  <th className="px-6 py-3.5">Component</th>
                  <th className="px-6 py-3.5">Event Message</th>
                  <th className="px-6 py-3.5">Origin IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-sans text-xs">
                      No matching log entries found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-3.5 text-slate-400 whitespace-nowrap">{log.time}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">{getLevelBadge(log.level)}</td>
                      <td className="px-6 py-3.5 font-bold text-indigo-300 whitespace-nowrap">{log.component}</td>
                      <td className="px-6 py-3.5 font-sans text-slate-200">{log.message}</td>
                      <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">{log.ip}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
