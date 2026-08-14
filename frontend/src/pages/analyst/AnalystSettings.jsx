import React, { useState } from "react";

export default function AnalystSettings() {
  const [profile, setProfile] = useState({
    name: "Retail Analyst",
    email: "analyst@cams-retail.com",
    timezone: "UTC-5 (EST)",
    autoRefresh: "60s",
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    anomalies: true,
    lowStock: false,
    systemAlerts: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Settings</h1>
        </div>
        <button className="bg-[#0F172A] border border-[#1E293B] px-4 py-1.5 rounded-xl text-cyan-400 text-xs font-bold font-mono">
          SYSTEM: ONLINE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
        {/* Profile Settings */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">User Profile Configuration</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 block mb-1">User Display Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500" />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Email Address</label>
              <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500" />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Regional Timezone</label>
              <select value={profile.timezone} onChange={e => setProfile({...profile, timezone: e.target.value})} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>UTC-5 (EST)</option>
                <option>UTC-8 (PST)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC+5:30 (IST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dashboard preferences */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dashboard & telemetry sync</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 block mb-1">Data Refresh Interval</label>
              <select value={profile.autoRefresh} onChange={e => setProfile({...profile, autoRefresh: e.target.value})} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>15s (Real-time)</option>
                <option>30s</option>
                <option>60s</option>
                <option>Manual Refresh</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Default Analytics Period</label>
              <select className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Primary Analytical Model</label>
              <select className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>YOLOv8 + ByteTrack Telemetry Sync</option>
                <option>Custom Heuristic Tracking</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification settings */}
        <div className="lg:col-span-12 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notifications & Alert Channels</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: "email", label: "Monthly Digest Emails", desc: "Receive category reviews and general reports." },
              { key: "anomalies", label: "Gaze Anomaly alerts", desc: "Real-time notice when focus drops on endcaps." },
              { key: "lowStock", label: "Low stock notifications", desc: "Notice when shelf inventory dips below 20%." },
              { key: "systemAlerts", label: "Infrastructure warnings", desc: "Immediate warning if cameras disconnect." },
            ].map((n, i) => (
              <div key={i} onClick={() => setNotifications({...notifications, [n.key]: !notifications[n.key]})} className={`p-3 border rounded-xl cursor-pointer transition flex flex-col justify-between ${notifications[n.key] ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-[#070C18] border-[#1E293B] text-slate-400 hover:text-white"}`}>
                <div>
                  <span className="font-bold text-white block mb-1">{n.label}</span>
                  <p className="text-[10px] text-slate-400 leading-normal">{n.desc}</p>
                </div>
                <span className="text-[10px] font-bold mt-2 block font-mono">{notifications[n.key] ? "ENABLED ✓" : "DISABLED +"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-xs rounded-xl transition uppercase tracking-wider">
          Save Settings Profile
        </button>
      </div>
    </div>
  );
}
