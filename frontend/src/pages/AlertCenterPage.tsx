import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bell, AlertTriangle, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';

interface AlertItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface RecommendationItem {
  priority: string;
  reason: string;
  action: string;
  expected_impact: string;
  target_shelf: string;
  target_sku: string;
}

interface AlertCenterPageProps {
  storeId: string;
  token: string | null;
}

export default function AlertCenterPage({ storeId, token }: AlertCenterPageProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // 1. Fetch live alerts from dashboard manager
      const alertsRes = await fetch(`http://localhost:8000/api/dashboards/manager/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (alertsRes.ok) {
        const json = await alertsRes.json();
        setAlerts(json.alerts || []);
      }

      // 2. Fetch live optimization recommendations
      const recsRes = await fetch(`http://localhost:8000/api/analytics/recommendations?store_id=${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (recsRes.ok) {
        const json = await recsRes.json();
        setRecommendations(json || []);
      }
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);

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
      <RefreshCw className="animate-spin mr-2 w-5 h-5 text-indigo-500" />
      <span className="text-xs font-semibold uppercase tracking-wider">Synchronizing recommendations...</span>
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

  const timelineData = Object.keys(alertTimelineMap).length > 0
    ? Object.keys(alertTimelineMap).map((key) => ({ hour: key, count: alertTimelineMap[key] }))
    : [
        { hour: "09:00", count: 0 },
        { hour: "10:00", count: 0 },
        { hour: "11:00", count: 0 }
      ];

  const hasRecs = recommendations.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-850">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Bell className="w-5 h-5 mr-2 text-rose-500" /> Optimization & Alert Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live store optimization recommendations and system security logs</p>
        </div>
      </div>

      {/* 1. Rule Recommendations Grid Section */}
      <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-400" /> Active Placement & Marketing Recommendations
          </span>
          <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-slate-400">
            {recommendations.length} Suggestions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasRecs ? (
            recommendations.map((item, idx) => {
              const badgeColor = item.priority === 'High' 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : (item.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20');
              
              return (
                <div key={idx} className="bg-[#0f0f18] border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-sm hover:border-slate-700 transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <span className={`text-[8px] font-bold px-2 py-0.5 border rounded uppercase ${badgeColor}`}>
                      {item.priority} Priority
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">SKU: {item.target_sku}</span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-200 font-bold leading-snug">{item.action}</p>
                    <p className="text-[10px] text-slate-400 leading-normal mt-1.5">{item.reason}</p>
                  </div>

                  <div className="border-t border-slate-900 pt-2.5 flex justify-between items-center text-[9px] text-slate-500">
                    <span>Target: <span className="font-semibold text-slate-350">{item.target_shelf}</span></span>
                    <span className="text-emerald-450 font-bold bg-emerald-500/5 px-2 py-0.5 rounded">
                      {item.expected_impact}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-8 text-slate-550 border border-dashed border-slate-850 rounded-xl">
              <AlertCircle className="w-8 h-8 mb-2 text-slate-705" />
              <p className="text-xs italic font-semibold uppercase tracking-wider">No active optimization recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Timeline Chart (Alerts Frequency) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Alerts Log List */}
        <div className="lg:col-span-5 bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block mb-1">Alerts Log</span>
            <span className="text-[9px] text-slate-500">Real-time system events list</span>
          </div>

          <div className="space-y-2 mt-4 max-h-[170px] overflow-y-auto pr-1">
            {alerts.length > 0 ? (
              alerts.map((al) => (
                <div key={al.id} className="bg-[#0f0f18] border border-slate-850 p-2.5 rounded-lg flex items-center justify-between text-[10px]">
                  <div>
                    <span className="font-bold text-slate-300">{al.type}</span>
                    <p className="text-[9px] text-slate-500 mt-0.5">{al.message}</p>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono">
                    {new Date(al.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-slate-500 italic text-center py-8">No recent alerts recorded.</p>
            )}
          </div>
        </div>

        {/* Timeline bar chart */}
        <div className="lg:col-span-7 bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block mb-1">Timeline Chart (Recent Alerts Frequency)</span>
            <span className="text-[9px] text-slate-500">Hourly aggregation of security events</span>
          </div>
          
          <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis dataKey="hour" stroke="#475569" fontSize={8.5} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090f', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
