import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Plot from 'react-plotly.js';

export function MarketingManagerDashboard(): JSX.Element {
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
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Marketing Hub</span>
          <h2 className="text-2xl font-bold mt-1">Campaign Analytics & Promotion Engagement</h2>
        </div>
        <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200">
          Marketing Manager Active
        </Badge>
      </div>

      {/* SECTION 1: Campaign Performance */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 1 - Campaign Performance</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Campaign Comparison (Grouped Bar)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[
                  { x: ['Campaign A', 'Campaign B', 'Campaign C'], y: [80, 60, 40], name: 'Customer Engagement', type: 'bar' },
                  { x: ['Campaign A', 'Campaign B', 'Campaign C'], y: [50, 40, 20], name: 'Sales Lift', type: 'bar' },
                  { x: ['Campaign A', 'Campaign B', 'Campaign C'], y: [90, 70, 50], name: 'Attention Generated', type: 'bar' }
                ]}
                layout={{ ...chartLayout, barmode: 'group', height: 250, margin: { t: 10, r: 10, l: 30, b: 30 }, showlegend: true }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Campaign Performance Trend (Line)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], y: [100, 150, 120, 200], type: 'scatter', mode: 'lines+markers', marker: { color: '#8b5cf6' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 2: Promotion Effectiveness */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 2 - Promotion Effectiveness</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Before vs After Lift</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[
                  { x: ['Pickups', 'Checkouts'], y: [120, 45], name: 'Before Promotion', type: 'bar', marker: { color: '#3b82f6' } },
                  { x: ['Pickups', 'Checkouts'], y: [310, 105], name: 'After Promotion', type: 'bar', marker: { color: '#10b981' } }
                ]}
                layout={{ ...chartLayout, barmode: 'group', height: 200, margin: { t: 10, r: 10, l: 30, b: 30 }, showlegend: true, legend: {x:0, y:1} }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Sales Lift (Waterfall)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{
                  type: "waterfall", orientation: "v",
                  measure: ["relative", "relative", "relative", "total"],
                  x: ["Base Sales", "Promo A", "Promo B", "Total Lift"],
                  y: [1000, 400, 200, 1600],
                  connector: { line: { color: "rgb(63, 63, 63)" } }
                }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Campaign Conversion (Funnel)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ type: 'funnel', y: ['Impressions', 'Clicks', 'Purchases'], x: [5000, 1200, 300] }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 70, b: 10 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: Product Visibility */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 3 - Product Visibility</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Visibility Metrics (Radar)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ type: 'scatterpolar', r: [80, 90, 70, 85, 80], theta: ['Shelf A', 'Shelf B', 'Endcap', 'Display', 'Shelf A'], fill: 'toself' }]}
                layout={{ ...chartLayout, polar: { radialaxis: { visible: true, range: [0, 100] }, bgcolor: 'transparent' }, height: 200, margin: { t: 30, r: 30, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Visibility Score</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ y: ['Item A', 'Item B', 'Item C'], x: [95, 82, 60], type: 'bar', orientation: 'h', marker: { color: '#0ea5e9' } }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 50, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Shelf Visibility Heatmap</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ z: [[10, 20], [30, 40], [50, 60]], type: 'heatmap', colorscale: 'Portland' }]}
                layout={{ ...chartLayout, height: 200, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 4: Product Attractiveness */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 4 - Product Attractiveness</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Attractiveness Ranking (Bar)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ y: ['Shoes', 'Bags', 'Hats'], x: [90, 75, 60], type: 'bar', orientation: 'h', marker: { color: '#ec4899' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 50, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Attractiveness Breakdown (Radar)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ type: 'scatterpolar', r: [90, 80, 70, 90], theta: ['Color', 'Placement', 'Lighting', 'Color'], fill: 'toself', marker: { color: '#ec4899' } }]}
                layout={{ ...chartLayout, polar: { radialaxis: { visible: true, range: [0, 100] }, bgcolor: 'transparent' }, height: 250, margin: { t: 30, r: 30, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 5: Customer Engagement */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 5 - Customer Engagement</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Engagement Trend (Line)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Day 1', 'Day 2', 'Day 3'], y: [45, 60, 80], type: 'scatter', mode: 'lines', marker: { color: '#f59e0b' } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Engagement Distribution (Donut)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ values: [40, 30, 20, 10], labels: ['Viewing', 'Interacting', 'Reading Label', 'Ignoring'], type: 'pie', hole: 0.6 }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 10, b: 10 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 6: Conversion Analysis */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 6 - Conversion Analysis</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Attention vs Conversion (Scatter)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: [10, 20, 30, 40], y: [5, 15, 25, 35], mode: 'markers', marker: { size: 12, color: '#10b981' }, type: 'scatter' }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 30, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Engagement vs Sales (Bubble)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: [50, 60, 70, 80], y: [100, 200, 300, 400], mode: 'markers', marker: { size: [15, 25, 35, 45], color: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981'] } }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 40, b: 30 } }}
                config={{ displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 7: Marketing Recommendations */}
      <section>
        <h3 className="text-xl font-bold mb-4">Section 7 - Marketing Recommendations</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Decision Matrix</CardTitle></CardHeader>
            <CardContent className="space-y-3 h-[250px] overflow-y-auto">
              <div className="p-3 border border-border bg-slate-900 rounded-lg">
                <span className="font-bold text-emerald-400">Recommendation 1:</span> Increase lighting on Shelf C.
              </div>
              <div className="p-3 border border-border bg-slate-900 rounded-lg">
                <span className="font-bold text-emerald-400">Recommendation 2:</span> Move Product B to Endcap.
              </div>
              <div className="p-3 border border-border bg-slate-900 rounded-lg">
                <span className="font-bold text-emerald-400">Recommendation 3:</span> Change banner for Campaign X.
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader><CardTitle>Priority Matrix (High vs Low Impact)</CardTitle></CardHeader>
            <CardContent>
              <Plot
                data={[{ x: ['Effort Level 1', 'Effort Level 2'], y: ['High Impact', 'Low Impact'], z: [[100, 20], [50, 10]], type: 'heatmap', colorscale: 'YlGnBu' }]}
                layout={{ ...chartLayout, height: 250, margin: { t: 10, r: 10, l: 70, b: 30 } }}
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
