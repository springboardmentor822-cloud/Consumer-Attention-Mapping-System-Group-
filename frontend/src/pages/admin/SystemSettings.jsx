import React, { useState } from "react";

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'security' | 'ai' | 'email' | 'retention' | 'maintenance'

  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const [generalForm, setGeneralForm] = useState({
    platformName: "Consumer Attention Mapping System (CAMS)",
    companyName: "Enterprise Retail Vision Technologies Inc.",
    timezone: "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
    language: "English (US)",
    dateFormat: "YYYY-MM-DD HH:mm:ss",
    defaultDashboard: "Central Monitoring Dashboard"
  });

  const [securityForm, setSecurityForm] = useState({
    sessionTimeout: 30,
    passwordPolicy: "Strong (Min 12 chars, Symbols & Numbers)",
    maxLoginAttempts: 5,
    mfaRequirement: "Enforced for Administrators & Managers"
  });

  const [aiSettings, setAiSettings] = useState({
    heatmapSampling: "30 FPS Real-time",
    confidenceThreshold: 0.85,
    minDwellSeconds: 3.0,
    faceBlurring: true
  });

  const [maintenanceRunning, setMaintenanceRunning] = useState(false);

  const handleMaintenanceOp = (opName) => {
    setMaintenanceRunning(true);
    showToast(`Executing maintenance operation: ${opName}...`);
    setTimeout(() => {
      setMaintenanceRunning(false);
      showToast(`Completed ${opName} successfully!`);
    }, 1500);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>⚙️</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h1 className="text-xl font-black text-white tracking-wide">System Settings & Platform Policy Configuration</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase tracking-widest">
              Global Platform Governance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global platform preferences, operational security policies, AI sampling thresholds, data retention rules, and system maintenance diagnostics.
          </p>
        </div>

        <button
          onClick={() => showToast("Global platform settings saved successfully")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
        >
          <span>💾</span> Save All Settings
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "general", label: "🏢 General Platform Info", count: "Platform" },
          { id: "security", label: "🔒 Security & Auth Policies", count: "Policies" },
          { id: "ai", label: "🤖 AI & Analytics Settings", count: "Thresholds" },
          { id: "email", label: "✉️ Email & Notification Config", count: "SMTP" },
          { id: "retention", label: "📦 Data Retention Policies", count: "Archiving" },
          { id: "maintenance", label: "🛠️ System Maintenance & Diagnostics", count: "Tools" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap
              ${activeTab === t.id
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-[#0F172A] text-slate-400 border border-[#1E293B] hover:text-white"
              }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: GENERAL PLATFORM SETTINGS ────────────────────────────── */}
      {activeTab === "general" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-sm font-extrabold text-white">General Platform Information & Regional Settings</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Platform Name</label>
              <input
                type="text"
                value={generalForm.platformName}
                onChange={(e) => setGeneralForm({ ...generalForm, platformName: e.target.value })}
                className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Company / Organization Details</label>
              <input
                type="text"
                value={generalForm.companyName}
                onChange={(e) => setGeneralForm({ ...generalForm, companyName: e.target.value })}
                className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">System Timezone</label>
                <select
                  value={generalForm.timezone}
                  onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option>(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                  <option>(UTC+00:00) Universal Coordinated Time (UTC)</option>
                  <option>(UTC-05:00) Eastern Time (US & Canada)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Language & Region</label>
                <select
                  value={generalForm.language}
                  onChange={(e) => setGeneralForm({ ...generalForm, language: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Hindi (India)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SECURITY SETTINGS ─────────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-sm font-extrabold text-white">Security Policies & MFA Configuration</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                value={securityForm.sessionTimeout}
                onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeout: parseInt(e.target.value) })}
                className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Password Strength Policy</label>
              <select
                value={securityForm.passwordPolicy}
                onChange={(e) => setSecurityForm({ ...securityForm, passwordPolicy: e.target.value })}
                className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option>Strong (Min 12 chars, Symbols & Numbers)</option>
                <option>Medium (Min 8 chars, Numbers)</option>
                <option>Enterprise Custom Enforcement</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Max Failed Login Attempts (Lockout)</label>
              <input
                type="number"
                value={securityForm.maxLoginAttempts}
                onChange={(e) => setSecurityForm({ ...securityForm, maxLoginAttempts: parseInt(e.target.value) })}
                className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: AI & ANALYTICS SETTINGS ───────────────────────────────── */}
      {activeTab === "ai" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-sm font-extrabold text-white">AI Model & Analytics Threshold Settings</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">YOLOv8 Detection Confidence Threshold ({aiSettings.confidenceThreshold})</label>
              <input
                type="range"
                min="0.50"
                max="0.99"
                step="0.01"
                value={aiSettings.confidenceThreshold}
                onChange={(e) => setAiSettings({ ...aiSettings, confidenceThreshold: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Minimum Dwell Time Threshold (Seconds)</label>
              <input
                type="number"
                value={aiSettings.minDwellSeconds}
                onChange={(e) => setAiSettings({ ...aiSettings, minDwellSeconds: parseFloat(e.target.value) })}
                className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-[#070C18] rounded-xl border border-[#1E293B]">
              <span className="font-bold text-white">GDPR Face Blurring & Privacy Masking</span>
              <input
                type="checkbox"
                checked={aiSettings.faceBlurring}
                onChange={(e) => setAiSettings({ ...aiSettings, faceBlurring: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: MAINTENANCE OPERATIONS & DIAGNOSTICS ─────────────────── */}
      {activeTab === "maintenance" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>🛠️</span> System Maintenance Operations & Diagnostics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2">
              <h4 className="font-bold text-white text-xs">Clear System Cache</h4>
              <p className="text-[11px] text-slate-400">Purge temporary Redis cache and compiled UI templates.</p>
              <button
                onClick={() => handleMaintenanceOp("Clear System Cache")}
                disabled={maintenanceRunning}
                className="w-full py-2 bg-[#1E293B] hover:bg-[#273552] text-indigo-300 font-bold rounded-xl text-xs border border-indigo-500/20 transition"
              >
                Clear Cache Now
              </button>
            </div>

            <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2">
              <h4 className="font-bold text-white text-xs">Rebuild Search Indexes</h4>
              <p className="text-[11px] text-slate-400">Re-index stores, cameras, user accounts, and shelf planograms.</p>
              <button
                onClick={() => handleMaintenanceOp("Rebuild Search Indexes")}
                disabled={maintenanceRunning}
                className="w-full py-2 bg-[#1E293B] hover:bg-[#273552] text-purple-300 font-bold rounded-xl text-xs border border-purple-500/20 transition"
              >
                Rebuild Index
              </button>
            </div>

            <div className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-2">
              <h4 className="font-bold text-white text-xs">Run Health Diagnostics</h4>
              <p className="text-[11px] text-slate-400">Run automated diagnostics on database, RTSP streams, and CUDA nodes.</p>
              <button
                onClick={() => handleMaintenanceOp("Run Health Diagnostics")}
                disabled={maintenanceRunning}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
              >
                Run Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
