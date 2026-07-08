import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { PageHeader } from '../../components/common/PageHeader';
import { Map, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';

const mockHeatmapGrid = [
  { id: 1, name: 'Cosmetics Sector A', intensity: 'Hot', color: 'bg-rose-500/80 text-white' },
  { id: 2, name: 'Cosmetics Sector B', intensity: 'Warm', color: 'bg-amber-500/80 text-white' },
  { id: 3, name: 'Hair Care Top', intensity: 'Cool', color: 'bg-sky-500/80 text-white' },
  { id: 4, name: 'Fragrances Display', intensity: 'Hot', color: 'bg-rose-500/80 text-white' },
  { id: 5, name: 'Promotions Endcap', intensity: 'Hot', color: 'bg-rose-500/80 text-white' },
  { id: 6, name: 'Checkout Counter', intensity: 'Warm', color: 'bg-amber-500/80 text-white' },
];

export function HeatmapsPage(): JSX.Element {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: 'Heatmap re-compiled', description: 'Updated with latest real-time visitor patterns.', type: 'success' });
    }, 800);
  };

  return (
    <div>
      <PageHeader
        title="Attention Heatmaps"
        description="Visualize physical hot-zones, shelf engagement densities, and bottleneck sectors."
        actions={
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recompile Heatmap
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-emerald-500" />
              Shelf Attention Overlay View
            </CardTitle>
            <CardDescription>Grid representations of eye-tracking and dwell density metrics across primary displays.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 max-w-5xl">
              {mockHeatmapGrid.map((gridItem) => (
                <div
                  key={gridItem.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between h-36 shadow-soft ${gridItem.color}`}
                >
                  <span className="font-semibold text-lg">{gridItem.name}</span>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs uppercase tracking-wider bg-white/20 px-2 py-1 rounded">
                      {gridItem.intensity} Zone
                    </span>
                    <span className="text-xs font-semibold">
                      {gridItem.intensity === 'Hot' ? '🔥 92%' : gridItem.intensity === 'Warm' ? '⚡ 60%' : '❄️ 22%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
