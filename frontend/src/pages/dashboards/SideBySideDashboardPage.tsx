import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storesApi } from "../../api/resources";
import AdminDashboardPage from "./AdminDashboardPage";
import StoreManagerDashboardPage from "./StoreManagerDashboardPage";

interface StoreOption {
  id: number;
  store_name: string;
}

export default function SideBySideDashboardPage() {
  const storesQuery = useQuery({
    queryKey: ["stores", "picker"],
    queryFn: () => storesApi.list().then((r) => r.data as StoreOption[]),
  });

  const [storeId, setStoreId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (storeId === undefined && storesQuery.data?.length) {
      setStoreId(storesQuery.data[0].id);
    }
  }, [storeId, storesQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin / Store Manager - Side by Side</h1>
          <p className="text-sm text-slate-400">Compare system-wide admin metrics against a single store's live performance</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Store:</label>
          <select
            value={storeId ?? ""}
            onChange={(e) => setStoreId(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-white focus-ring"
          >
            {storesQuery.data?.map((store) => (
              <option key={store.id} value={store.id}>
                {store.store_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!storesQuery.data?.length && !storesQuery.isLoading ? (
        <p className="text-sm text-slate-500">No stores exist yet - create one to compare its dashboard here.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
            <AdminDashboardPage compact />
          </div>
          <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
            {storeId !== undefined && <StoreManagerDashboardPage storeId={storeId} compact />}
          </div>
        </div>
      )}
    </div>
  );
}
