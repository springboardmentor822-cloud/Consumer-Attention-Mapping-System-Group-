import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { CameraPreviewCard } from '../common/CameraPreviewCard';
import { AlertTriangle, ShieldAlert, CheckCircle, Filter, Bell, RefreshCw } from 'lucide-react';

interface AlertsLiveFeedViewProps {
  onOpenDedicatedCameraPage?: (cameraId: string) => void;
}

export const AlertsLiveFeedView: React.FC<AlertsLiveFeedViewProps> = ({ onOpenDedicatedCameraPage }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchAlerts = (typeFilter: string = selectedType) => {
    api.getAlerts('STORE-812', typeFilter === 'ALL' ? undefined : typeFilter)
      .then((res) => setAlerts(res))
      .catch((err) => console.error("Error fetching alerts:", err));
  };

  useEffect(() => {
    api.getStoreManagerDashboard('STORE-812').then((res) => setDashboardData(res));
    fetchAlerts();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedType(val);
    fetchAlerts(val);
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId);
      setActionMsg(`Alert ${alertId} marked as acknowledged`);
      fetchAlerts();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e) {
      setActionMsg(`Failed to acknowledge alert ${alertId}`);
    }
  };

  const handleSelectCamera = (id: string) => {
    if (onOpenDedicatedCameraPage) {
      onOpenDedicatedCameraPage(id);
    }
  };

  if (!dashboardData) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading RTSP Surveillance Console...</div>;

  const { cameras } = dashboardData;

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-950 text-rose-300 border-rose-500';
      case 'ALERT': return 'bg-amber-950 text-amber-300 border-amber-500';
      case 'WARNING': return 'bg-yellow-950 text-yellow-300 border-yellow-500';
      default: return 'bg-indigo-950 text-indigo-300 border-indigo-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <span>Live RTSP Camera Surveillance Feeds & System Alerts</span>
          </h2>
          <p className="text-xs text-slate-400">Real-time asynchronous rule evaluation across shelf performance, product visibility, traffic, and cameras</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchAlerts()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <span className="status-pill-online px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
            6 Feeds Synchronized
          </span>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-emerald-950 border-2 border-emerald-500 text-emerald-300 font-extrabold text-xs p-3 rounded-xl flex items-center space-x-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((cam: any) => (
          <CameraPreviewCard
            key={cam.id}
            id={cam.id}
            name={cam.name}
            ipAddress={cam.ip_address}
            resolution={cam.resolution}
            status={cam.status}
            onOpenDedicatedPage={handleSelectCamera}
          />
        ))}
      </div>

      {/* Real-time Alerts Engine Panel */}
      <div className="bi-card">
        <div className="bi-card-header flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-extrabold text-sm text-white">Automated Alert & Anomaly Engine</h3>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={handleFilterChange}
              className="bg-[#090d16] border border-slate-700 px-3 py-1.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="ALL">All Alert Types</option>
              <option value="SHELF_PERFORMANCE">Shelf Performance</option>
              <option value="PRODUCT_VISIBILITY">Product Visibility</option>
              <option value="TRAFFIC_ANOMALY">Traffic Anomaly</option>
              <option value="CAMERA_HEALTH">Camera Health</option>
            </select>
          </div>
        </div>

        <div className="bi-card-body space-y-3">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No active alerts matching selected criteria.</div>
          ) : (
            alerts.map((alt: any) => (
              <div key={alt.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${alt.acknowledged ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-[#1e293b] border-slate-700'}`}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getLevelBadgeClass(alt.level)}`}>
                      {alt.level}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {alt.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-extrabold text-white">{alt.title}</span>
                  </div>
                  <div className="text-xs text-slate-300">{alt.description}</div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="font-mono text-xs text-slate-400">{alt.time || 'Just now'}</span>
                  {!alt.acknowledged ? (
                    <button
                      onClick={() => handleAcknowledge(alt.id)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg shadow border border-indigo-400 transition-all"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 font-bold text-[10px] rounded-lg border border-emerald-600">
                      ACKNOWLEDGED
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
