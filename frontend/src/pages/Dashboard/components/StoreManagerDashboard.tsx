import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Plot from 'react-plotly.js';
import { LiveStoreHeatmap } from './LiveStoreHeatmap';
import { LiveVideoFeed } from './LiveVideoFeed';
import { analyticsApi, ProductScore, Journey } from '../../../api/analytics';
import { alertsApi, Alert } from '../../../api/alerts';
import { systemApi, SystemStats } from '../../../api/system';
import { useAuth } from '../../../contexts/AuthContext';

export function StoreManagerDashboard(): JSX.Element {
  const { user } = useAuth();
  const storeId = user?.store_id || '00000000-0000-0000-0000-000000000000'; // Fallback to default store if none attached
  
  const [loading, setLoading] = useState(true);
  const [trafficFlow, setTrafficFlow] = useState<any>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [productScores, setProductScores] = useState<ProductScore[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let trafficRes = null;
        let journeyRes = { journeys: [] };
        let scoresRes = [];
        let statsRes = null;
        let alertsRes = { alerts: [] };

        try { trafficRes = await analyticsApi.getTrafficFlow(storeId); } catch (e) { console.error("Traffic fail", e); }
        try { journeyRes = await analyticsApi.getJourneys(storeId); } catch (e) { console.error("Journey fail", e); }
        try { scoresRes = await analyticsApi.getAttractiveness(storeId); } catch (e) { console.error("Scores fail", e); }
        try { statsRes = await systemApi.getStats(); } catch (e) { console.error("Stats fail", e); }
        try { alertsRes = await alertsApi.getAlerts(storeId); } catch (e) { console.error("Alerts fail", e); }
        
        setTrafficFlow(trafficRes);
        setJourneys(journeyRes.journeys || []);
        setProductScores(scoresRes || []);
        setSystemStats(statsRes);
        setAlerts(alertsRes.alerts || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (storeId) {
      fetchData();
    }
  }, [storeId]);

  const chartLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8' },
    margin: { t: 30, r: 20, l: 40, b: 40 },
    xaxis: { gridcolor: '#334155' },
    yaxis: { gridcolor: '#334155' }
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-pulse">Loading dashboard data...</div></div>;
  }

  // Derived data for charts
  const topProducts = productScores.slice(0, 5);
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Operator Console</span>
          <h2 className="text-2xl font-bold mt-1">Store Performance Dashboard</h2>
        </div>
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
          Store Manager Active
        </Badge>
      </div>

      {/* SECTION 1: Store Traffic */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 1 - Store Traffic</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Hourly Visitor Trend (Line)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ 
                  x: (trafficFlow?.hourly?.hours || []).map((h: number) => `${h}:00`), 
                  y: trafficFlow?.hourly?.values || [], 
                  type: 'scatter', 
                  mode: 'lines+markers', 
                  marker: { color: '#10b981' } 
                }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                useResizeHandler={true}
                config={{ displayModeBar: true, toImageButtonOptions: { format: 'png', filename: 'hourly_visitor_trend' } }}
                style={{ width: '100%', minHeight: '250px' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Daily Store Footfall (Area)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ 
                  x: trafficFlow?.daily?.days || [], 
                  y: trafficFlow?.daily?.values || [], 
                  fill: 'tozeroy', 
                  type: 'scatter', 
                  marker: { color: '#3b82f6' } 
                }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                useResizeHandler={true}
                config={{ displayModeBar: true }}
                style={{ width: '100%', minHeight: '250px' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 2: Shelf & Product Performance */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 2 - Product Performance</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Top Products by Attractiveness Score</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ 
                  y: topProducts.map(p => p.product_name), 
                  x: topProducts.map(p => p.score), 
                  type: 'bar', 
                  orientation: 'h', 
                  marker: { color: '#10b981' } 
                }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 150, b: 30 } }}
                useResizeHandler={true}
                config={{ displayModeBar: true }}
                style={{ width: '100%', minHeight: '250px' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Product Interactions (Views vs Pickups vs Purchases)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[
                  { x: topProducts.map(p => p.product_name), y: topProducts.map(p => p.raw_metrics.repeat_views), name: 'Viewed', type: 'bar' },
                  { x: topProducts.map(p => p.product_name), y: topProducts.map(p => p.raw_metrics.pickup_count), name: 'Picked', type: 'bar' },
                  { x: topProducts.map(p => p.product_name), y: topProducts.map(p => p.raw_metrics.purchase_count), name: 'Purchased', type: 'bar' }
                ]}
                layout={{ ...chartLayout, barmode: 'group', height: 250, margin: { t: 10, r: 10, l: 40, b: 60 }, showlegend: true, legend: { orientation: 'h', y: -0.2 } }}
                useResizeHandler={true}
                config={{ displayModeBar: true }}
                style={{ width: '100%', minHeight: '250px' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: Camera Monitoring & Tracking */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 3 - Camera Monitoring & Tracking</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <LiveStoreHeatmap />
          <LiveVideoFeed />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ 
                  values: [systemStats?.cameras_online || 0, systemStats?.cameras_offline || 0], 
                  labels: ['Cameras Online', 'Cameras Offline'], 
                  type: 'pie', 
                  hole: 0.6, 
                  marker: { colors: ['#10b981', '#ef4444'] } 
                }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                useResizeHandler={true}
                config={{ displayModeBar: false }}
                style={{ width: '100%', minHeight: '250px' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 4: Alerts */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 4 - Active Alerts</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60 col-span-2">
            <CardHeader><CardTitle>Recent Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">No active alerts</div>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className={`p-3 border rounded-lg ${
                    alert.severity === 'critical' ? 'border-rose-500/20 bg-rose-500/10' : 
                    alert.severity === 'warning' ? 'border-amber-500/20 bg-amber-500/10' : 
                    'border-blue-500/20 bg-blue-500/10'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-sm font-bold ${
                          alert.severity === 'critical' ? 'text-rose-400' : 
                          alert.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                        }`}>{alert.alert_type.replace('_', ' ').toUpperCase()}</p>
                        <p className={`text-xs ${
                          alert.severity === 'critical' ? 'text-rose-400/80' : 
                          alert.severity === 'warning' ? 'text-amber-400/80' : 'text-blue-400/80'
                        }`}>{alert.message}</p>
                      </div>
                      <span className="text-xs opacity-50">{new Date(alert.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
