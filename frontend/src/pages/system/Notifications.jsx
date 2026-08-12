import { useState } from "react";
import Layout from "../../components/Layout";
import { Bell, Flame, Video, Package, Shield, Check, CheckCheck, Trash2, BellRing } from "lucide-react";

export default function Notifications() {
  const [filter, setFilter] = useState("ALL");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "HIGH_TRAFFIC",
      title: "High Footfall Alert in Entrance Zone",
      message: "Entrance Zone recorded 554 visitor log entries. Occupancy exceeds standard baseline.",
      time: "10 mins ago",
      read: false,
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      tagColor: "bg-rose-500/20 text-rose-300 border-rose-500/40"
    },
    {
      id: 2,
      type: "CAMERA",
      title: "All 14 Camera Feeds Operational",
      message: "RTSP camera stream status check completed cleanly. Average system FPS: 24.0 FPS.",
      time: "25 mins ago",
      read: false,
      icon: <Video className="w-4 h-4 text-emerald-400" />,
      tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
    },
    {
      id: 3,
      type: "STOCK",
      title: "Stock Health Check Warning",
      message: "SKU110K product detector identified low stock count in Produce Section.",
      time: "1 hour ago",
      read: true,
      icon: <Package className="w-4 h-4 text-amber-400" />,
      tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/40"
    },
    {
      id: 4,
      type: "SECURITY",
      title: "User Authentication Event",
      message: "Administrator user admin@cams.com logged in successfully from IP 127.0.0.1.",
      time: "2 hours ago",
      read: true,
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/40"
    }
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  };

  const handleTriggerTestAlert = () => {
    const newAlert = {
      id: Date.now(),
      type: "HIGH_TRAFFIC",
      title: "Real-time AI Attention Spike Detected",
      message: "Beverages Aisle attention index spiked by +18.5% over the last 5 minutes.",
      time: "Just now",
      read: false,
      icon: <BellRing className="w-4 h-4 text-indigo-400" />,
      tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
    };
    setNotifications([newAlert, ...notifications]);
  };

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.read;
    if (filter === "ALERTS") return n.type === "HIGH_TRAFFIC" || n.type === "STOCK";
    if (filter === "SYSTEM") return n.type === "CAMERA" || n.type === "SECURITY";
    return true;
  });

  return (
    <Layout title="System Notifications & Alerts">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              Notifications & Real-time Alert Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">Live alert notifications triggered by store occupancy, camera status, inventory, and user activity.</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleTriggerTestAlert}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" /> Test Alert Trigger
            </button>
            <button
              onClick={handleMarkAllRead}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Mark All Read
            </button>
            <button
              onClick={handleClearRead}
              className="bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
              title="Clear read notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex border-b border-slate-800 gap-2">
          {[
            { key: "ALL", label: `All (${notifications.length})` },
            { key: "UNREAD", label: `Unread (${notifications.filter((n) => !n.read).length})` },
            { key: "ALERTS", label: "Traffic & Stock Alerts" },
            { key: "SYSTEM", label: "Camera & System Events" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 cursor-pointer ${
                filter === tab.key
                  ? "bg-slate-800/80 text-indigo-400 border-indigo-500"
                  : "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications Feed */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500">
              No notifications found in this category.
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={`bg-slate-900/80 border rounded-2xl p-4 transition flex items-start justify-between gap-4 ${
                  !n.read ? "border-indigo-500/40 shadow-md bg-slate-900" : "border-slate-800 opacity-80"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 shrink-0">
                    {n.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-bold text-white">{n.title}</h4>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${n.tagColor}`}>
                        {n.type}
                      </span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-2 block font-mono">{n.time}</span>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)))}
                    className="text-slate-500 hover:text-emerald-400 text-xs p-1 cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
