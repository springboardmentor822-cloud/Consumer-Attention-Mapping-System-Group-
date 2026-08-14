import React, { useState } from "react";

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'settings'
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const [notificationsList, setNotificationsList] = useState([
    { id: "NTF-101", title: "RTSP Camera Stream Disconnected", desc: "Camera #CAM-005 in Store 5 - Connaught Place lost RTSP connection.", category: "Device Failures", priority: "Critical", time: "10 mins ago", read: false, icon: "📹", color: "border-rose-500/30 text-rose-400 bg-rose-500/10" },
    { id: "NTF-102", title: "GPU VRAM High Utilization Warning", desc: "AI Cluster Node 2 VRAM exceeded 85% threshold during peak weekend surge.", category: "Infrastructure Updates", priority: "High", time: "28 mins ago", read: false, icon: "🖥️", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
    { id: "NTF-103", title: "Unrecognized IP Login Attempt Blocked", desc: "Firewall rule automatically blocked suspicious login attempt from IP 45.142.120.9.", category: "Security Alerts", priority: "High", time: "1 hour ago", read: false, icon: "🛡️", color: "border-rose-500/30 text-rose-400 bg-rose-500/10" },
    { id: "NTF-104", title: "Weekly Consumer Attention PDF Generated", desc: "Automated executive analytical PDF report successfully generated for Store 1.", category: "Report Generation", priority: "Info", time: "2 hours ago", read: true, icon: "📄", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
    { id: "NTF-105", title: "YOLOv8 AI Model Retrained", desc: "YOLOv8 object detection model updated to v2.4 (FP16 TensorRT precision).", category: "AI Analytics", priority: "Info", time: "3 hours ago", read: true, icon: "🤖", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
    { id: "NTF-106", title: "New Store Manager Account Created", desc: "User Vikram Malhotra registered and assigned to South India Region.", category: "User Management", priority: "Info", time: "5 hours ago", read: true, icon: "👤", color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10" }
  ]);

  // Preferences State
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    pushNotifs: true,
    smsAlerts: false,
    quietHours: true,
    quietStart: "22:00",
    quietEnd: "07:00"
  });

  const markAllAsRead = () => {
    setNotificationsList(notificationsList.map(n => ({ ...n, read: true })));
    showToast("All notifications marked as read");
  };

  const markAsRead = (id) => {
    setNotificationsList(notificationsList.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotificationsList([]);
    showToast("Cleared notification inbox");
  };

  // Filtered Notifications
  const filteredNotifications = notificationsList.filter(n => {
    const matchRead = activeTab === "all" || (activeTab === "unread" && !n.read);
    const matchCat = categoryFilter === "All" || n.category === categoryFilter;
    const matchPrio = priorityFilter === "All" || n.priority === priorityFilter;
    return matchRead && matchCat && matchPrio;
  });

  const unreadCount = notificationsList.filter(n => !n.read).length;

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>🔔</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h1 className="text-xl font-black text-white tracking-wide">Centralized Alert & Notification Hub</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-widest animate-pulse">
                {unreadCount} Unread Alerts
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            ✓ Mark All Read
          </button>
          <button
            onClick={clearAll}
            className="px-3.5 py-2 bg-[#1E293B] hover:bg-rose-500/20 text-rose-400 border border-[#334155] rounded-xl text-xs font-bold transition"
          >
            Clear Inbox
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Unread Critical Alerts</span>
          <h2 className="text-lg font-black text-rose-400 font-mono">{unreadCount} Active</h2>
          <span className="text-[10px] text-rose-400 font-bold block">Requires Operator Response</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Device Failures & Offline</span>
          <h2 className="text-lg font-black text-amber-400 font-mono">1 Camera Stream</h2>
          <span className="text-[10px] text-amber-400 font-bold block">RTSP Connection Lost</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Security Incident Alerts</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">1 Threat Blocked</h2>
          <span className="text-[10px] text-purple-300 font-bold block">Firewall Rule Active</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Total Logged Notifications</span>
          <h2 className="text-lg font-black text-white font-mono">{notificationsList.length} Notifications</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">Real-time Stream Engine</span>
        </div>
      </div>

      {/* Navigation Tabs & Preferences */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "🔔 All Notifications", count: notificationsList.length },
          { id: "unread", label: "🔴 Unread Only", count: unreadCount },
          { id: "settings", label: "⚙️ Alert Preferences & Quiet Hours", count: "Settings" },
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
            <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-black/30 font-mono">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1 & 2: NOTIFICATIONS LIST ────────────────────────────────── */}
      {(activeTab === "all" || activeTab === "unread") && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase">Filter By:</span>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">All Categories</option>
                <option value="Device Failures">Device Failures</option>
                <option value="Infrastructure Updates">Infrastructure Updates</option>
                <option value="Security Alerts">Security Alerts</option>
                <option value="Report Generation">Report Generation</option>
                <option value="AI Analytics">AI Analytics</option>
                <option value="User Management">User Management</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Info">Info</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredNotifications.length}</strong> items
            </span>
          </div>

          {/* Notifications Cards */}
          <div className="space-y-3">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-4 rounded-2xl border transition flex flex-wrap justify-between items-center gap-4 cursor-pointer
                  ${!n.read ? "bg-[#0F172A] border-indigo-500/40 shadow-lg" : "bg-[#070C18] border-[#1E293B] opacity-80"}
                `}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-[280px]">
                  <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-lg flex-shrink-0">
                    {n.icon}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-white text-xs">{n.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${n.color}`}>
                        {n.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-bold">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.desc}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">{n.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showToast(`Triggered response action for ${n.id}`);
                    }}
                    className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#273552] text-indigo-300 font-bold rounded-xl text-xs border border-indigo-500/20 transition"
                  >
                    Quick Action →
                  </button>
                </div>
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <div className="bg-[#0F172A] border border-[#1E293B] p-8 rounded-2xl text-center text-slate-400 text-xs">
                No notifications matching current filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: ALERT PREFERENCES ─────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-6">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>⚙️</span> Configurable Alert Settings & Notification Preferences
          </h3>

          <div className="space-y-4 max-w-xl text-xs">
            <div className="flex items-center justify-between p-3.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div>
                <span className="font-bold text-white block">Email Alert Dispatch</span>
                <span className="text-slate-400 text-[11px]">Send critical device & security alerts to admin email</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailAlerts}
                onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div>
                <span className="font-bold text-white block">In-App Push Notifications</span>
                <span className="text-slate-400 text-[11px]">Pop-up toast alerts in CAMS Admin interface</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.pushNotifs}
                onChange={(e) => setPreferences({ ...preferences, pushNotifs: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#070C18] border border-[#1E293B] rounded-xl">
              <div>
                <span className="font-bold text-white block">Quiet Hours Schedule</span>
                <span className="text-slate-400 text-[11px]">Suppress non-critical notifications during off-hours ({preferences.quietStart} - {preferences.quietEnd})</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.quietHours}
                onChange={(e) => setPreferences({ ...preferences, quietHours: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={() => showToast("Alert preferences saved successfully!")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
