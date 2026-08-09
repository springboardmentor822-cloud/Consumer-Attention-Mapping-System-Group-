import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { storesApi } from "../api/resources";
import { useStoreManagerCameras } from "../hooks/useStoreManagerDashboard";
import CameraTile, { MAX_CONCURRENT_LIVE_STREAMS } from "../components/camera/CameraTile";

interface StoreOption {
  id: number;
  store_name: string;
}

const SNAPSHOT_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000";

export default function CameraGrid() {
  const { user } = useAuth();
  const isStoreManager = user?.role === "Store Manager";

  const storesQuery = useQuery({
    queryKey: ["stores", "picker"],
    queryFn: () => storesApi.list().then((r) => r.data as StoreOption[]),
    enabled: !isStoreManager,
  });

  const [storeId, setStoreId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!isStoreManager && storeId === undefined && storesQuery.data?.length) {
      setStoreId(storesQuery.data[0].id);
    }
  }, [isStoreManager, storeId, storesQuery.data]);

  const camerasQuery = useStoreManagerCameras(isStoreManager ? undefined : storeId);
  const cameras = camerasQuery.data?.cameras ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Camera Grid</h1>
          <p className="text-sm text-slate-400">
            Latest processed frame per camera - refreshes automatically, not a continuous live stream
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/cameras"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            <Video size={14} />
            Manage Cameras
          </Link>
          <Link
            to="/live-tracking"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            <Activity size={14} />
            Live Tracking
          </Link>
          {!isStoreManager && (
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
          )}
          <button
            onClick={() => camerasQuery.refetch()}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            <RefreshCw size={14} className={camerasQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {camerasQuery.isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          Couldn't load cameras for this store.
        </div>
      )}

      {camerasQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : !cameras.length ? (
        <p className="text-sm text-slate-500">No cameras registered for this store yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cameras.map((camera, index) => (
            <CameraTile
              key={camera.camera_id}
              index={index + 1}
              camera={camera}
              snapshotBaseUrl={SNAPSHOT_BASE_URL}
              liveEnabled={index < MAX_CONCURRENT_LIVE_STREAMS}
            />
          ))}
        </div>
      )}
    </div>
  );
}
