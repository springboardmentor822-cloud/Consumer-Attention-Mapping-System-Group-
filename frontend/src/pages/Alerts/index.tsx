import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ShieldAlert, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { alertsApi, Alert, AlertStats } from '../../api/alerts';
import { useAuth } from '../../contexts/AuthContext';

export function AlertsPage(): JSX.Element {
  const { user } = useAuth();
  const storeId = user?.store_id || undefined;
  
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [storeId]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertsApi.getAlerts(storeId);
      setAlerts(data.alerts);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsApi.acknowledgeAlert(id);
      fetchAlerts(); // Refresh list
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="h-5 w-5 text-rose-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-pulse">Loading alerts...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold">System Alerts & Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor operational issues, camera health, and traffic anomalies.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Active Alerts</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.open || 0}</div></CardContent>
        </Card>
        <Card className="bg-card/50 border-rose-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-rose-500">Critical Alerts</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-rose-500">{stats?.critical || 0}</div></CardContent>
        </Card>
        <Card className="bg-card/50 border-amber-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-500">Warnings</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-500">{stats?.warning || 0}</div></CardContent>
        </Card>
        <Card className="bg-card/50 border-emerald-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-500">Resolved Today</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-emerald-500">{stats?.resolved || 0}</div></CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/60">
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.filter(a => a.status === 'open').map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-4 border border-border/50 rounded-lg bg-card/30">
                <div className="flex gap-4">
                  <div className="mt-1">{getIcon(alert.severity)}</div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {alert.alert_type.replace('_', ' ').toUpperCase()}
                      <Badge variant="outline" className={alert.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}>
                        {alert.severity}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground/50 mt-2">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAcknowledge(alert.id)}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> Acknowledge
                </button>
              </div>
            ))}
            {alerts.filter(a => a.status === 'open').length === 0 && (
              <div className="text-center p-8 text-muted-foreground flex flex-col items-center">
                <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-4" />
                <p>No active alerts. All systems nominal.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
