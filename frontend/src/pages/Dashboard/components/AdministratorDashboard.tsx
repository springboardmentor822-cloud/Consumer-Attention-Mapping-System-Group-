import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Plot from 'react-plotly.js';
import { LiveStoreHeatmap } from './LiveStoreHeatmap';

export function AdministratorDashboard(): JSX.Element {
  const chartLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8' },
    margin: { t: 30, r: 20, l: 40, b: 40 },
    xaxis: { gridcolor: '#334155' },
    yaxis: { gridcolor: '#334155' }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Platform Administration</span>
          <h2 className="text-2xl font-bold mt-1">System Health & Infrastructure Diagnostics</h2>
        </div>
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
          Administrator Active
        </Badge>
      </div>

      {/* SECTION 1: System Overview */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 1 - System Overview</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>System Uptime</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], y: [99.9, 99.8, 100, 99.9, 99.9], type: 'scatter', mode: 'lines+markers', marker: { color: '#10b981' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>API Requests Over Time</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['10AM', '11AM', '12PM', '1PM', '2PM'], y: [1200, 1500, 3000, 2500, 1800], fill: 'tozeroy', type: 'scatter', marker: { color: '#3b82f6' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 2: User Analytics */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 2 - User Analytics</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Users by Role</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ values: [2, 8, 4, 3], labels: ['Admin', 'Store Mgr', 'Analyst', 'Marketing'], type: 'pie', hole: 0 }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Active Users per Store</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Downtown', 'Uptown', 'Suburbs'], y: [5, 3, 4], type: 'bar', marker: { color: '#8b5cf6' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: Camera Monitoring & Live Tracking */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 3 - AI Camera Monitoring & Live Tracking</h3>
        <div className="mb-4">
          <LiveStoreHeatmap />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Camera Status</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ values: [42, 3], labels: ['Online', 'Offline'], type: 'pie', hole: 0.6, marker: { colors: ['#10b981', '#ef4444'] } }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Cameras by Store</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Downtown', 'Uptown', 'Suburbs'], y: [18, 12, 15], type: 'bar', marker: { color: '#0ea5e9' } }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Live Feed Grid (Simulated)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-16 bg-slate-800 rounded animate-pulse border border-slate-700 flex items-center justify-center text-[10px]">Cam 1</div>
                <div className="h-16 bg-slate-800 rounded animate-pulse border border-slate-700 flex items-center justify-center text-[10px]">Cam 2</div>
                <div className="h-16 bg-slate-800 rounded animate-pulse border border-slate-700 flex items-center justify-center text-[10px]">Cam 3</div>
                <div className="h-16 bg-slate-800 rounded animate-pulse border border-slate-700 flex items-center justify-center text-[10px]">Cam 4</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 4: Infrastructure Monitoring */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 4 - Infrastructure Monitoring</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">CPU Usage</CardTitle></CardHeader><CardContent><Plot data={[{ y: [40, 50, 45, 60, 55], type: 'scatter', mode: 'lines', marker: { color: '#f59e0b' } }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Memory Usage</CardTitle></CardHeader><CardContent><Plot data={[{ y: [60, 62, 61, 65, 63], type: 'scatter', mode: 'lines', marker: { color: '#6366f1' } }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">GPU Usage</CardTitle></CardHeader><CardContent><Plot data={[{ y: [80, 85, 90, 85, 88], type: 'scatter', mode: 'lines', marker: { color: '#10b981' } }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Disk Usage</CardTitle></CardHeader><CardContent><Plot data={[{ y: [45, 45, 46, 46, 46], type: 'scatter', mode: 'lines', marker: { color: '#64748b' } }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Network Traffic</CardTitle></CardHeader><CardContent><Plot data={[{ y: [120, 150, 110, 180, 160], type: 'scatter', mode: 'lines', marker: { color: '#0ea5e9' } }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
        </div>
      </section>

      {/* SECTION 5: API Performance */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 5 - API Performance</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">API Response Time</CardTitle></CardHeader><CardContent><Plot data={[{ y: [42, 45, 38, 55, 40], type: 'scatter', mode: 'lines' }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Endpoint Response Time</CardTitle></CardHeader><CardContent><Plot data={[{ x: ['/users', '/auth', '/cams'], y: [30, 80, 45], type: 'bar' }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Request Volume</CardTitle></CardHeader><CardContent><Plot data={[{ y: [1000, 1200, 800, 1500, 1100], fill: 'tozeroy', type: 'scatter' }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
        </div>
      </section>

      {/* SECTION 6: Security Monitoring */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 6 - Security Monitoring</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Login Attempts</CardTitle></CardHeader><CardContent><Plot data={[{ y: [12, 15, 8, 25, 14], type: 'scatter', mode: 'lines', marker: { color: '#f59e0b'} }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Failed Logins</CardTitle></CardHeader><CardContent><Plot data={[{ x: ['Mon', 'Tue', 'Wed'], y: [2, 5, 1], type: 'bar', marker: { color: '#ef4444'} }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Auth Status</CardTitle></CardHeader><CardContent><Plot data={[{ values: [95, 5], labels: ['Success', 'Failed'], type: 'pie', hole: 0.5, marker: { colors: ['#10b981', '#ef4444']} }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:0,b:0}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
        </div>
      </section>

      {/* SECTION 7: Audit Logs */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 7 - Audit Logs</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>System Events Timeline</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['2023-10-01', '2023-10-02', '2023-10-03', '2023-10-04'], y: [10, 15, 5, 20], type: 'bar', marker: { color: '#8b5cf6'} }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60 overflow-hidden">
            <CardHeader><CardTitle>Recent Audit History</CardTitle></CardHeader>
            <CardContent className="space-y-3 h-[250px] overflow-y-auto">
              <div className="text-sm border-b border-border pb-2"><span className="text-emerald-500 font-bold">10:42 AM</span> - Admin modified camera config</div>
              <div className="text-sm border-b border-border pb-2"><span className="text-emerald-500 font-bold">09:15 AM</span> - System backup completed</div>
              <div className="text-sm border-b border-border pb-2"><span className="text-emerald-500 font-bold">08:30 AM</span> - Store Manager role created</div>
              <div className="text-sm border-b border-border pb-2"><span className="text-rose-500 font-bold">02:11 AM</span> - Failed login attempt (IP: 192.168.1.5)</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
