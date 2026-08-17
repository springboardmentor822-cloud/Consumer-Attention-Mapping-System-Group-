import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Plot from 'react-plotly.js';
import { marketingApi, Campaign, Promotion } from '../../../api/marketing';
import { recommendationsApi } from '../../../api/recommendations';
import { Recommendation } from '../../../api/analytics';
import { useAuth } from '../../../contexts/AuthContext';

export function MarketingManagerDashboard(): JSX.Element {
  const { user } = useAuth();
  const storeId = user?.store_id || '00000000-0000-0000-0000-000000000000';
  
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [campRes, promoRes, engageRes, recRes] = await Promise.all([
          marketingApi.getCampaigns(storeId),
          marketingApi.getPromotions(storeId),
          marketingApi.getEngagement(storeId),
          recommendationsApi.getRecommendations(storeId)
        ]);
        
        setCampaigns(campRes || []);
        setPromotions(promoRes || []);
        setEngagement(engageRes);
        setRecommendations(recRes || []);
      } catch (error) {
        console.error("Failed to fetch marketing data:", error);
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
    return <div className="p-8 text-center"><div className="animate-pulse">Loading marketing metrics...</div></div>;
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const activePromotions = promotions.filter(p => p.is_active);
  const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Marketing Hub</span>
          <h2 className="text-2xl font-bold mt-1">Campaign & Merchandising Optimization</h2>
        </div>
        <Badge variant="outline" className="border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-200">
          Marketing Manager Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Campaigns</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{activeCampaigns.length}</div></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Promotions</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{activePromotions.length}</div></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Engagement Rate</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-purple-500">{engagement?.engagement_rate || 0}%</div></CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Campaign Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-emerald-500">${totalRevenue.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader><CardTitle>Campaign Performance (CTR vs Conversion)</CardTitle></CardHeader>
          <CardContent>
            <Plot
              data={[{
                x: campaigns.map(c => c.metrics?.ctr || 0),
                y: campaigns.map(c => c.metrics?.conversion_rate || 0),
                text: campaigns.map(c => c.name),
                mode: 'markers',
                marker: { size: campaigns.map(c => Math.max((c.revenue || 0) / 1000, 10)), color: '#8b5cf6', opacity: 0.7 },
                type: 'scatter'
              }]}
              layout={{ ...chartLayout, height: 300, xaxis: { title: 'CTR (%)', ...chartLayout.xaxis }, yaxis: { title: 'Conversion Rate (%)', ...chartLayout.yaxis } }}
              useResizeHandler={true}
              config={{ displayModeBar: false }}
              style={{ width: '100%', minHeight: '300px' }}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader><CardTitle>Promotion Funnel (Views → Interactions → Conversions)</CardTitle></CardHeader>
          <CardContent>
            <Plot
              data={[
                { name: 'Views', x: activePromotions.map(p => p.name), y: activePromotions.map(p => p.views), type: 'bar' },
                { name: 'Interactions', x: activePromotions.map(p => p.name), y: activePromotions.map(p => p.interactions), type: 'bar' },
                { name: 'Conversions', x: activePromotions.map(p => p.name), y: activePromotions.map(p => p.conversions), type: 'bar' }
              ]}
              layout={{ ...chartLayout, height: 300, barmode: 'group', showlegend: true, legend: { orientation: 'h', y: -0.2 } }}
              useResizeHandler={true}
              config={{ displayModeBar: false }}
              style={{ width: '100%', minHeight: '300px' }}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/60">
        <CardHeader><CardTitle>AI-Driven Merchandising Recommendations</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.slice(0, 4).map((rec, i) => (
              <div key={rec.id || i} className="p-4 border border-border/50 rounded-lg bg-card/30">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-md text-purple-400">{rec.title}</h4>
                  <Badge variant="outline" className={
                    rec.priority === 'high' || rec.priority === 'critical' ? 'border-rose-500 text-rose-500' : 'border-amber-500 text-amber-500'
                  }>{rec.priority?.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                <div className="text-xs space-y-1">
                  <p><span className="font-semibold text-slate-300">Reason:</span> {rec.reason}</p>
                  <p><span className="font-semibold text-slate-300">Metric:</span> {rec.supporting_metric}</p>
                  <p><span className="font-semibold text-emerald-400">Impact:</span> {rec.expected_impact}</p>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && <div className="col-span-2 text-center p-4 text-muted-foreground">No recommendations available</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
