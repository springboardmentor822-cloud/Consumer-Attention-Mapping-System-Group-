import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bell, AlertTriangle, RefreshCw } from 'lucide-react';

interface AlertItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface AlertCenterPageProps {
  storeId: string;
  token: string | null;
}

export default function AlertCenterPage({ storeId, token }: AlertCenterPageProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/manager/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.alerts || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);

    const ws = new WebSocket(`ws://localhost:8000/api/ws/${storeId}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "CAMERA_ALERT") {
          const newAlert: AlertItem = {
            id: String(Date.now()),
            type: payload.event_type,
            message: payload.message,
            timestamp: payload.timestamp
          };
          setAlerts(prev => [newAlert, ...prev]);
        }
      } catch (err) {
        console.error("WS error", err);
      }
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [storeId]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2" /> Synchronizing Alerts...
    </div>
  );

  // Group alerts hourly for the Timeline Chart
  const alertTimelineMap: { [hour: string]: number } = {};
  alerts.forEach((al) => {
    try {
      const hour = new Date(al.timestamp).getHours();
      const label = `${String(hour).padStart(2, '0')}:00`;
      alertTimelineMap[label] = (alertTimelineMap[label] || 0) + 1;
    } catch {
      // Fallback
    }
  });

  // Default points if timeline map is empty
  const timelineData = Object.keys(alertTimelineMap).length > 0
    ? Object.keys(alertTimelineMap).map((key) => ({ hour: key, count: alertTimelineMap[key] }))
    : [
        { hour: "10:00", count: 2 },
        { hour: "11:00", count: 4 },
        { hour: "12:00", count: 1 },
        { hour: "13:00", count: 3 }
      ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Bell className="w-5 h-5 mr-2 text-rose-500" /> Alerts & Security timeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live security incident logs and alerts timeline graphs</p>
        </div>
      </div>

      {/* Alert Cards (No Chart) */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Alert Cards (Recent Notifications)</span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "High Crowd Detected", details: "Aisle B is crowded", time: "10:24 AM", border: "border-amber-500/20" },
            { title: "Shelf C - Low Attention", details: "Attention time dropped", time: "10:18 AM", border: "border-indigo-500/20" },
            { title: "Camera 6 Offline", details: "Promotion Area camera is offline", time: "10:15 AM", border: "border-rose-500/20" },
            { title: "Long Queue at Checkout", details: "8 customers in queue", time: "10:10 AM", border: "border-rose-500/20" }
          ].map((item, idx) => (
            <div key={idx} className={`bg-[#0f0f18] border ${item.border} p-4 rounded-xl flex flex-col justify-between shadow-sm`}>
              <div className="flex justify-between items-start text-[9px] font-bold text-slate-500">
                <span className="uppercase text-slate-450">{item.title}</span>
                <span>{item.time}</span>
              </div>
              <p className="text-xs text-slate-350 font-semibold mt-2">{item.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Chart (Recent Alerts) */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Timeline Chart (Recent Alerts Frequency)</span>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
              <YAxis stroke="#94a3b8" fontSize={9} />
              <Tooltip />
              <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
