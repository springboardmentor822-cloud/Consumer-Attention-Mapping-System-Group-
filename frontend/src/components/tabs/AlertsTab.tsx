"use client";
import React, { useEffect, useState } from 'react';

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  timestamp: string;
  source: string;
  status: string;
}

export default function AlertsTab() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  // Real uptime from the same endpoint InfraTab uses — was previously a
  // hardcoded "99.9%" with no connection to any actual data source.
  const [uptime, setUptime] = useState<string | null>(null);

  const fetchAlerts = () => {
    fetch('/api/backend/v1/dashboard/alerts', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setAlerts(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Alerts fetch error:", err);
        setLoading(false);
      });
  };

  const fetchUptime = () => {
    fetch('/api/backend/v1/dashboard/system-health', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") setUptime(data.data.uptime);
      })
      .catch(err => console.error("Uptime fetch error:", err));
  };

  // Fetch immediately, then poll every 5 seconds for new alerts
  useEffect(() => {
    fetchAlerts();
    fetchUptime();
    const interval = setInterval(() => { fetchAlerts(); fetchUptime(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Derived from the real alert feed — these used to be hardcoded "1" / "1"
  // regardless of what the feed actually contained.
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'Active').length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && a.status === 'Active').length;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { border: 'border-rose-500/50', bg: 'bg-rose-500/10', text: 'text-rose-500', icon: '🚨' };
      case 'warning':
        return { border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-500', icon: '⚠️' };
      case 'info':
        return { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-500', icon: 'ℹ️' };
      default:
        return { border: 'border-slate-600', bg: 'bg-slate-800', text: 'text-slate-400', icon: '🔔' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-200 h-[calc(100vh-120px)] flex flex-col">
      
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold">System Alerts & Notifications</h2>
          <p className="text-xs text-slate-400 mt-1">Live anomaly detection and hardware monitoring logs</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            Filter: Active
          </button>
          <button className="bg-emerald-600/20 border border-emerald-600/30 text-xs font-bold text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-600/30 transition-colors flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
            Live Feed
          </button>
        </div>
      </div>

      {/* KPI Cards — all three now reflect the real fetched data */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <div className="bg-slate-950 border border-rose-500/30 p-4 rounded-xl shadow-inner flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-rose-500">{loading ? "…" : criticalCount}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Critical Alerts</span>
        </div>
        <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-xl shadow-inner flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-amber-500">{loading ? "…" : warningCount}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Active Warnings</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-inner flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-blue-400">{uptime ?? "…"}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Server Runtime</span>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-sm font-bold">Event Log</h3>
          <button className="text-xs text-cyan-400 hover:text-cyan-300">Mark all as read</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full text-xs font-mono text-cyan-400 animate-pulse">
              Connecting to event stream...
            </div>
          ) : (
            alerts.map((alert, idx) => {
              const styles = getSeverityStyles(alert.severity);
              return (
                <div key={idx} className={`border ${styles.border} ${styles.bg} rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-800/40`}>
                  
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl mt-1">{styles.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-bold ${styles.text}`}>{alert.type}</h4>
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
                          {alert.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-[10px] text-slate-500 font-mono">
                        <span>🕒 {alert.timestamp}</span>
                        <span>📍 {alert.source}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 shrink-0">
                    {alert.status === 'Active' ? (
                      <>
                        <button className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600/30 transition-colors w-full">
                          Resolve
                        </button>
                        <button className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors w-full">
                          Acknowledge
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center justify-center w-full">
                        ✓ Resolved
                      </span>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}