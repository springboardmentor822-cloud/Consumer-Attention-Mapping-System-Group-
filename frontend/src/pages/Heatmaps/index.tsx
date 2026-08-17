import * as React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { HeatmapDashboard } from '../Dashboard/components/HeatmapDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { listStores } from '../../services/store';
import type { Store } from '../../types/store';
import { LoadingState } from '../../components/common/LoadingState';

export function HeatmapsPage(): JSX.Element {
  const { user } = useAuth();
  const [stores, setStores] = React.useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStores = async () => {
      try {
        const storeData = await listStores();
        setStores(storeData);
        if (user?.store_id) {
          setSelectedStoreId(user.store_id);
        } else if (storeData.length > 0) {
          setSelectedStoreId(storeData[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch stores", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchStores();
  }, [user]);

  if (loading) {
    return <LoadingState message="Loading heatmaps configuration..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Attention Heatmaps"
          description="Visualize physical hot-zones, shelf engagement densities, and bottleneck sectors in real-time."
        />
        {user?.role === 'Administrator' && stores.length > 0 && (
          <div className="mt-4 sm:mt-0">
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500"
            >
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.store_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="w-full">
        {selectedStoreId ? (
          <HeatmapDashboard storeId={selectedStoreId} />
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-lg border border-slate-800">
            No stores available to display heatmaps.
          </div>
        )}
      </div>
    </div>
  );
}
