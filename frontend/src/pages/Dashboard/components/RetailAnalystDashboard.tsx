import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Plot from 'react-plotly.js';
import { LiveStoreHeatmap } from './LiveStoreHeatmap';
import { analyticsApi, Journey, Segment } from '../../../api/analytics';
import { useAuth } from '../../../contexts/AuthContext';

export function RetailAnalystDashboard(): JSX.Element {
  const { user } = useAuth();
  const storeId = user?.store_id || '00000000-0000-0000-0000-000000000000';
  
  const [loading, setLoading] = useState(true);
  const [segmentsData, setSegmentsData] = useState<{ segments: Segment[], distribution: any } | null>(null);
  const [journeyData, setJourneyData] = useState<{ journeys: Journey[], summary: any, transitions: any } | null>(null);
  const [dwellData, setDwellData] = useState<{ hourly: any, distribution: any } | null>(null);
  const [trafficData, setTrafficData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [segRes, jourRes, dwellRes, trafficRes] = await Promise.all([
          analyticsApi.getSegments(storeId),
          analyticsApi.getJourneys(storeId),
          analyticsApi.getDwellTime(storeId),
          analyticsApi.getTrafficFlow(storeId)
        ]);
        
        setSegmentsData(segRes);
        setJourneyData(jourRes);
        setDwellData(dwellRes);
        setTrafficData(trafficRes);
      } catch (error) {
        console.error("Failed to fetch analyst data:", error);
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
    return <div className="p-8 text-center"><div className="animate-pulse">Loading analytics...</div></div>;
  }

  // Sankey data from API transitions
  const sankeyData = journeyData?.transitions || { nodes: [], sources: [], targets: [], values: [] };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Analytics Console</span>
          <h2 className="text-2xl font-bold mt-1">Consumer Behavior Analysis</h2>
        </div>
        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-200">
          Retail Analyst Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Dwell Time</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-500">{journeyData?.summary?.avg_dwell_time || 0}s</div></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Path Length</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{journeyData?.summary?.avg_path_length || 0}m</div></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Zones Visited</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{journeyData?.summary?.avg_zones_visited || 0}</div></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Conversion Rate</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-emerald-500">{journeyData?.summary?.conversion_rate || 0}%</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader><CardTitle>Shopper Segmentation Distribution</CardTitle></CardHeader>
          <CardContent>
            <Plot
              data={[{ 
                values: segmentsData?.distribution ? Object.values(segmentsData.distribution) : [], 
                labels: segmentsData?.distribution ? Object.keys(segmentsData.distribution) : [], 
                type: 'pie', hole: 0.5, marker: { colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'] } 
              }]}
              layout={{ ...chartLayout, height: 300, margin: { t: 10, r: 10, l: 10, b: 10 } }}
              useResizeHandler={true}
              config={{ displayModeBar: false }}
              style={{ width: '100%', minHeight: '300px' }}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader><CardTitle>Dwell Time Distribution</CardTitle></CardHeader>
          <CardContent>
            <Plot
              data={[{ 
                x: dwellData?.distribution || [], 
                type: 'histogram', 
                marker: { color: '#3b82f6', opacity: 0.7 } 
              }]}
              layout={{ ...chartLayout, height: 300, margin: { t: 10, r: 10, l: 40, b: 40 }, xaxis: { title: 'Dwell Time (s)', ...chartLayout.xaxis }, yaxis: { title: 'Count', ...chartLayout.yaxis } }}
              useResizeHandler={true}
              config={{ displayModeBar: false }}
              style={{ width: '100%', minHeight: '300px' }}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/60">
        <CardHeader><CardTitle>Customer Journey Flow (Zone Transitions)</CardTitle></CardHeader>
        <CardContent>
          <Plot
            data={[{
              type: "sankey",
              orientation: "h",
              node: {
                pad: 15,
                thickness: 20,
                line: { color: "black", width: 0.5 },
                label: sankeyData.nodes,
                color: sankeyData.nodes.map(() => "#3b82f6")
              },
              link: {
                source: sankeyData.sources,
                target: sankeyData.targets,
                value: sankeyData.values,
                color: "rgba(59, 130, 246, 0.2)"
              }
            }]}
            layout={{ ...chartLayout, height: 400, margin: { t: 10, r: 10, l: 10, b: 10 } }}
            useResizeHandler={true}
            config={{ displayModeBar: false }}
            style={{ width: '100%', minHeight: '400px' }}
          />
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader><CardTitle>Recent Detected Segments</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(segmentsData?.segments || []).slice(0, 5).map(seg => (
                <div key={seg.id} className="p-3 border border-border/50 rounded flex justify-between items-center">
                  <div>
                    <p className="font-bold">{seg.segment}</p>
                    <p className="text-xs text-muted-foreground">{seg.reason}</p>
                  </div>
                  <Badge variant="outline">{(seg.confidence * 100).toFixed(0)}% Conf</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <LiveStoreHeatmap />
      </div>
    </div>
  );
}
