import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Plot from 'react-plotly.js';
import { LiveStoreHeatmap } from './LiveStoreHeatmap';

export function StoreManagerDashboard(): JSX.Element {
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
                data={[{ x: ['8AM', '10AM', '12PM', '2PM', '4PM'], y: [50, 120, 300, 250, 400], type: 'scatter', mode: 'lines+markers', marker: { color: '#10b981' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                config={{ displayModeBar: true, toImageButtonOptions: { format: 'png', filename: 'hourly_visitor_trend' } }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Daily Store Footfall (Area)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], y: [1200, 1500, 1300, 1800, 2200], fill: 'tozeroy', type: 'scatter', marker: { color: '#3b82f6' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 2: Zone Occupancy */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 2 - Zone Occupancy</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Visitors per Zone (Bar)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Entrance', 'Aisle 1', 'Produce', 'Checkout'], y: [450, 320, 600, 400], type: 'bar', marker: { color: '#8b5cf6' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Zone Occupancy Distribution (Donut)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ values: [25, 20, 35, 20], labels: ['Entrance', 'Aisle 1', 'Produce', 'Checkout'], type: 'pie', hole: 0.5 }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: Shelf Performance */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 3 - Shelf Performance</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Shelf Engagement Score</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ y: ['Shelf A', 'Shelf B', 'Shelf C'], x: [92, 74, 38], type: 'bar', orientation: 'h', marker: { color: '#10b981' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 60, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Viewed vs Picked vs Purchased</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[
                  { x: ['Shelf A', 'Shelf B'], y: [100, 80], name: 'Viewed', type: 'bar' },
                  { x: ['Shelf A', 'Shelf B'], y: [40, 30], name: 'Picked', type: 'bar' },
                  { x: ['Shelf A', 'Shelf B'], y: [15, 10], name: 'Purchased', type: 'bar' }
                ]}
                layout={{ ...chartLayout, barmode: 'stack', height: 250, margin: { t: 10, r: 10, l: 30, b: 30 }, showlegend: true, legend: { x: 0, y: 1 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Shelf Attention Heatmap</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ z: [[1, 20, 30], [20, 1, 60], [30, 60, 1]], type: 'heatmap', colorscale: 'Viridis' }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 4: Product Interaction */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 4 - Product Interaction</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Top Picked</CardTitle></CardHeader><CardContent><Plot data={[{ y: ['Prod 1', 'Prod 2'], x: [50, 30], type: 'bar', orientation: 'h', marker: { color: '#f59e0b' } }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:50,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Most Returned</CardTitle></CardHeader><CardContent><Plot data={[{ y: ['Prod A', 'Prod B'], x: [15, 10], type: 'bar', orientation: 'h', marker: { color: '#ef4444' } }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:50,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Most Compared</CardTitle></CardHeader><CardContent><Plot data={[{ y: ['Item X', 'Item Y'], x: [40, 25], type: 'bar', orientation: 'h', marker: { color: '#6366f1' } }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:50,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Pickup Trend</CardTitle></CardHeader><CardContent><Plot data={[{ x: ['10AM', '12PM', '2PM'], y: [10, 45, 30], type: 'scatter', mode: 'lines' }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
        </div>
      </section>

      {/* SECTION 5: Store Conversion */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 5 - Store Conversion</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Entry → View → Pickup → Purchase Funnel</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ type: 'funnel', y: ['Entry', 'View', 'Pickup', 'Purchase'], x: [1200, 800, 400, 150] }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 60, b: 10 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Store Conversion Rate (Gauge)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ type: 'indicator', mode: 'gauge+number', value: 12.5, title: { text: "Conversion %" }, gauge: { axis: { range: [null, 100] }, bar: { color: "#10b981" } } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 30, r: 30, l: 30, b: 30 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 6: Camera Monitoring & Live Tracking */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 6 - Camera Monitoring & Tracking</h3>
        
        <div className="mb-4">
          <LiveStoreHeatmap />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur border-border/60 md:col-span-2">
            <CardHeader><CardTitle>Camera Grid View (Live Feed)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-video bg-slate-900 rounded border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-2 left-2 flex items-center gap-2 text-xs font-bold text-white"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> LIVE - Entrance</div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-white/70">People: 18 | Crowd: Medium</div>
                </div>
                <div className="aspect-video bg-slate-900 rounded border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-2 left-2 flex items-center gap-2 text-xs font-bold text-white"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> LIVE - Aisle 1</div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-white/70">People: 4 | Crowd: Low</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Camera Health Status</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ values: [4, 0], labels: ['Online', 'Offline'], type: 'pie', hole: 0.6, marker: { colors: ['#10b981', '#ef4444'] } }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 7: Alerts */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 7 - Alerts</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Timeline Chart (Recent Alerts)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[
                  { x: ['2023-10-01 10:00', '2023-10-01 12:30'], y: ['Overcrowding', 'Low Attention'], mode: 'markers', marker: { size: 12, color: ['#ef4444', '#f59e0b'] }, type: 'scatter' }
                ]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 20, l: 100, b: 40 } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Active Alert Cards</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border border-rose-500/20 bg-rose-500/10 rounded-lg">
                <p className="text-sm font-bold text-rose-400">Overcrowded Area</p>
                <p className="text-xs text-rose-400/80">Checkout Zone A is experiencing high density.</p>
              </div>
              <div className="p-3 border border-amber-500/20 bg-amber-500/10 rounded-lg">
                <p className="text-sm font-bold text-amber-400">Product Out of Stock</p>
                <p className="text-xs text-amber-400/80">Shelf B (Snacks) requires restocking.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
