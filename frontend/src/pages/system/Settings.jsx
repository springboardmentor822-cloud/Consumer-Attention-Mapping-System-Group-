import { useState } from "react";
import Layout from "../../components/Layout";
import { Settings as SettingsIcon, Sliders, Cpu, Video, HardDrive, CheckCircle2, RotateCcw } from "lucide-react";

export default function Settings() {
  const [personConf, setPersonConf] = useState(0.45);
  const [productConf, setProductConf] = useState(0.20);
  const [trackBuffer, setTrackBuffer] = useState(30);
  const [dwellThreshold, setDwellThreshold] = useState(2.0);
  const [fpsSetting, setFpsSetting] = useState("24");
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [retentionDays, setRetentionDays] = useState("90");
  const [syncInterval, setSyncInterval] = useState("3");
  const [savedMsg, setSavedMsg] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg("System configuration updated & applied to AI pipeline!");
    setTimeout(() => setSavedMsg(""), 3500);
  };

  const handleReset = () => {
    setPersonConf(0.45);
    setProductConf(0.20);
    setTrackBuffer(30);
    setDwellThreshold(2.0);
    setFpsSetting("24");
    setAutoReconnect(true);
    setRetentionDays("90");
    setSyncInterval("3");
    setSavedMsg("Configuration reset to system defaults.");
    setTimeout(() => setSavedMsg(""), 3500);
  };

  return (
    <Layout title="System Settings & Engine Parameters">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-indigo-400" />
              System Settings & AI Engine Parameters
            </h1>
            <p className="text-xs text-slate-400 mt-1">Configure YOLOv8 thresholds, ByteTrack tracker parameters, RTSP camera options, and data retention.</p>
          </div>
          {savedMsg && (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-1.5 rounded-xl font-bold">
              <CheckCircle2 className="w-4 h-4" /> {savedMsg}
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: AI Computer Vision Parameters */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-4 h-4 text-indigo-400" />
              AI Computer Vision & Tracking Engine
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Person Detection Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">YOLOv8 Person Detection Confidence</label>
                  <span className="text-xs font-mono font-bold text-indigo-400">{personConf.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.90"
                  step="0.05"
                  value={personConf}
                  onChange={(e) => setPersonConf(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[10px] text-slate-500">Minimum confidence score to detect human bounding boxes.</p>
              </div>

              {/* SKU110K Product Detection Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">SKU110K Product Detection Threshold</label>
                  <span className="text-xs font-mono font-bold text-amber-400">{productConf.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.75"
                  step="0.05"
                  value={productConf}
                  onChange={(e) => setProductConf(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[10px] text-slate-500">Minimum confidence for retail shelf product object detection.</p>
              </div>

              {/* ByteTrack Buffer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">ByteTrack Track Buffer (Frames)</label>
                  <span className="text-xs font-mono font-bold text-emerald-400">{trackBuffer} frames</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={trackBuffer}
                  onChange={(e) => setTrackBuffer(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">Number of frames to retain object identity during occlusions.</p>
              </div>

              {/* Dwell Time Minimum */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">Minimum Dwell Time Threshold</label>
                  <span className="text-xs font-mono font-bold text-purple-400">{dwellThreshold.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={dwellThreshold}
                  onChange={(e) => setDwellThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-[10px] text-slate-500">Minimum dwell duration required to generate an attention log entry.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Camera Stream Settings */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Video className="w-4 h-4 text-emerald-400" />
              Camera Stream & Video Loader Options
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Target Frame Rate (FPS)</label>
                <select
                  value={fpsSetting}
                  onChange={(e) => setFpsSetting(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="15">15 FPS (Resource Saving)</option>
                  <option value="24">24 FPS (Standard Retail Stream)</option>
                  <option value="30">30 FPS (High Performance)</option>
                  <option value="60">60 FPS (Ultra High Speed)</option>
                </select>
              </div>

              <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div>
                  <div className="text-xs font-bold text-white">Auto-Reconnect RTSP Streams</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Automatically retry camera stream on network dropouts</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoReconnect(!autoReconnect)}
                  className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                    autoReconnect ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                      autoReconnect ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Data Retention & System Cache */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <HardDrive className="w-4 h-4 text-purple-400" />
              Data Retention & Cache Sync
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Attention Log Retention Period</label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days (Recommended)</option>
                  <option value="365">1 Year (Full Audit Retention)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Live Tracker Memory Sync Interval</label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="1">1 Second (Realtime)</option>
                  <option value="3">3 Seconds (Standard)</option>
                  <option value="5">5 Seconds (Balanced)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save & Reset Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-5 py-3 rounded-xl transition cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset Defaults
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-lg cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Save System Settings
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
