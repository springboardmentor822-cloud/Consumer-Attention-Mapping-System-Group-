import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Plot from 'react-plotly.js';
import { systemApi, auditApi, SystemStats } from '../../../api/system';
import { alertsApi, Alert } from '../../../api/alerts';

export function AdministratorDashboard(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let statsRes = null;
        let logsRes = [];
        let alertsRes = { alerts: [] };

        try { statsRes = await systemApi.getStats(); } catch (e) { console.error("Stats fail", e); }
        try { logsRes = await auditApi.getLogs(10); } catch (e) { console.error("Logs fail", e); }
        try { alertsRes = await alertsApi.getAlerts(); } catch (e) { console.error("Alerts fail", e); }

        setStats(statsRes);
        setLogs(logsRes || []);
        setAlerts(alertsRes.alerts || []);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8' },
    margin: { t: 30, r: 20, l: 40, b: 40 },
    xaxis: { gridcolor: '#334155' },
    yaxis: { gridcolor: '#334155' }
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-pulse">Loading system metrics...</div></div>;
  }

  const roleNames = stats?.users_by_role ? Object.keys(stats.users_by_role) : [];
  const roleCounts = stats?.users_by_role ? Object.values(stats.users_by_role) : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Platform Control</span>
          <h2 className="text-2xl font-bold mt-1">System Administration</h2>
        </div>
        <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200">
          Administrator Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.total_users || 0}</div><p className="text-xs text-muted-foreground mt-1">{stats?.active_users || 0} active</p></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Stores Managed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.total_stores || 0}</div><p className="text-xs text-muted-foreground mt-1">Across all regions</p></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cameras Online</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-emerald-500">{stats?.cameras_online || 0} / {stats?.total_cameras || 0}</div><p className="text-xs text-muted-foreground mt-1">{stats?.cameras_offline || 0} offline</p></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">System Alerts</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-rose-500">{stats?.open_alerts || 0}</div><p className="text-xs text-muted-foreground mt-1">Require attention</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader><CardTitle>User Distribution by Role</CardTitle></CardHeader>
          <CardContent>
            <Plot
              data={[{ values: roleCounts, labels: roleNames, type: 'pie', hole: 0.6, marker: { colors: ['#f43f5e', '#3b82f6', '#8b5cf6', '#10b981'] } }]}
              layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 10, b: 10 } }}
              useResizeHandler={true}
              config={{ displayModeBar: false }}
              style={{ width: '100%', minHeight: '250px' }}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader><CardTitle>System Alerts (Critical)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {alerts.filter(a => a.severity === 'critical').slice(0, 3).map(alert => (
              <div key={alert.id} className="p-3 border border-rose-500/20 bg-rose-500/10 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-rose-400">{alert.alert_type.toUpperCase()}</p>
                  <p className="text-xs text-rose-400/80">{alert.message}</p>
                </div>
                <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded">Action Req</span>
              </div>
            ))}
            {alerts.filter(a => a.severity === 'critical').length === 0 && (
              <div className="text-center p-4 text-emerald-500/80">No critical alerts detected</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/60">
        <CardHeader><CardTitle>Security Audit Log</CardTitle></CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Resource</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50">
                    <td className="px-6 py-3">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3"><Badge variant="outline" className={log.action.includes('fail') ? 'border-rose-500 text-rose-500' : 'border-blue-500 text-blue-500'}>{log.action}</Badge></td>
                    <td className="px-6 py-3">{log.resource}</td>
                    <td className="px-6 py-3 font-mono text-xs">{log.ip_address}</td>
                    <td className="px-6 py-3">{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={5} className="text-center p-4">No audit logs available</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
