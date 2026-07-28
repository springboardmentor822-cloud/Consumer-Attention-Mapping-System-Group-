import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Plot from 'react-plotly.js';

export function RetailAnalystDashboard(): JSX.Element {
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
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Analytics Studio</span>
          <h2 className="text-2xl font-bold mt-1">Consumer Behavior & Attention Intelligence</h2>
        </div>
        <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-200">
          Retail Analyst Active
        </Badge>
      </div>

      {/* SECTION 1: Consumer Attention Analytics */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 1 - Consumer Attention Analytics</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Avg Attention Duration (Line)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['10AM', '12PM', '2PM', '4PM'], y: [12, 18, 14, 22], type: 'scatter', mode: 'lines+markers', marker: { color: '#0ea5e9' } }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Attention Trend (Area)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Mon', 'Tue', 'Wed', 'Thu'], y: [40, 60, 50, 75], fill: 'tozeroy', type: 'scatter', marker: { color: '#8b5cf6' } }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Time Distribution (Box)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ y: [4, 5, 5, 6, 8, 9, 12, 14, 15, 20], type: 'box', name: 'Attention (s)', marker: { color: '#10b981' } }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 2: Consumer Journey */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 2 - Consumer Journey</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Customer Journey (Sankey Diagram)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{
                  type: 'sankey',
                  orientation: 'h',
                  node: { pad: 15, thickness: 20, line: { color: 'black', width: 0.5 }, label: ['Entrance', 'Beverages', 'Snacks', 'Billing', 'Exit'], color: ['blue', 'orange', 'green', 'red', 'purple'] },
                  link: { source: [0, 0, 1, 2, 3], target: [1, 2, 3, 3, 4], value: [80, 20, 60, 40, 100] }
                }]}
                layout={{ ...chartLayout, height: 300, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Movement Flow</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center p-6 text-muted-foreground h-[300px]">
              <div>
                <p>Entrance &rarr; Aisle 1 &rarr; Shelf B &rarr; Checkout</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: Customer Segmentation */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 3 - Customer Segmentation</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Customer Segments (Pie)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ values: [35, 25, 20, 15, 5], labels: ['Explorers', 'Quick Buyers', 'Comparison Buyers', 'Impulse Buyer', 'Brand Loyal'], type: 'pie', hole: 0 }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Segment Distribution (Donut)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ values: [60, 40], labels: ['New Customers', 'Repeat Customers'], type: 'pie', hole: 0.6 }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 4: Shopping Behaviour */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 4 - Shopping Behaviour</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Most Viewed</CardTitle></CardHeader><CardContent><Plot data={[{ y: ['Prod A', 'Prod B'], x: [500, 300], type: 'bar', orientation: 'h', marker: { color: '#0ea5e9'} }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:50,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Most Ignored</CardTitle></CardHeader><CardContent><Plot data={[{ y: ['Prod X', 'Prod Y'], x: [450, 400], type: 'bar', orientation: 'h', marker: { color: '#ef4444'} }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:50,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Most Compared</CardTitle></CardHeader><CardContent><Plot data={[{ y: ['TV A', 'TV B'], x: [200, 150], type: 'bar', orientation: 'h', marker: { color: '#8b5cf6'} }]} layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:50,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Category Interest</CardTitle></CardHeader><CardContent>
            <Plot 
              data={[{ type: 'treemap', labels: ['Electronics', 'Snacks', 'Beverages'], parents: ['', '', ''], values: [50, 30, 20] }]} 
              layout={{...chartLayout, height: 180, margin: {t:0,r:0,l:0,b:0}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} 
            />
          </CardContent></Card>
        </div>
      </section>

      {/* SECTION 5: Heatmaps */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 5 - Heatmaps</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Traffic</CardTitle></CardHeader><CardContent><Plot data={[{ z: [[1, 2], [3, 4]], type: 'heatmap', colorscale: 'Hot' }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Attention</CardTitle></CardHeader><CardContent><Plot data={[{ z: [[4, 1], [2, 3]], type: 'heatmap', colorscale: 'Viridis' }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Shelf</CardTitle></CardHeader><CardContent><Plot data={[{ z: [[2, 2], [2, 5]], type: 'heatmap', colorscale: 'Plasma' }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
          <Card className="bg-card/50"><CardHeader><CardTitle className="text-sm">Zone</CardTitle></CardHeader><CardContent><Plot data={[{ z: [[5, 2], [1, 1]], type: 'heatmap', colorscale: 'Inferno' }]} layout={{...chartLayout, height: 150, margin: {t:0,r:0,l:30,b:20}}} config={{displayModeBar: false}} style={{width:'100%', height:'100%'}} /></CardContent></Card>
        </div>
      </section>

      {/* SECTION 6: Dwell Time Analysis */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 6 - Dwell Time Analysis</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Dwell Time Distribution (Violin Plot)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ type: 'violin', y: [1, 2, 2.5, 3, 3, 4, 4.5, 5, 8], box: { visible: true }, line: { color: '#ec4899' }, meanline: { visible: true } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Avg Dwell Time by Hour (Line)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['10AM', '12PM', '2PM', '4PM'], y: [3.5, 4.2, 5.1, 3.8], type: 'scatter', mode: 'lines+markers', marker: { color: '#8b5cf6' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 7: Behavioral Analytics */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 7 - Behavioral Analytics</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Attention vs Purchase (Scatter)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: [10, 20, 30, 40, 50], y: [1, 2, 4, 8, 16], mode: 'markers', type: 'scatter', marker: { size: 12, color: '#0ea5e9' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Attention vs Dwell vs Conversion (Bubble)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: [5, 10, 15, 20], y: [2, 4, 6, 8], mode: 'markers', marker: { size: [10, 20, 30, 40], color: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'] } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
