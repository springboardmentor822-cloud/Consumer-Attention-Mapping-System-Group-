import { useQuery } from "@tanstack/react-query";
import { storeManagerApi, type HeatmapPoint } from "../api/storeManager";
import { analyticsDashboardApi, type ZoneTransition } from "../api/analyticsDashboard";
import { zonesApi } from "../api/resources";

const LIVE_INTERVAL = 8000;
const SLOW_INTERVAL = 30000;
// useZoneHeatmaps fans out to one request per real zone (9 in this store)
// plus one journey-flow call every tick - NOT a single cheap request. At the
// previous 4s interval that was ~10 HTTP requests every 4 seconds, sustained,
// from this one hook alone (~2.5 req/s) - a real, measurable contributor to
// excessive network/CPU load, independent of anything camera-related. Foot
// traffic density also doesn't meaningfully change within a few seconds, so
// there's no visible loss from polling less often - 15s still animates
// smoothly (see HeatmapGrid's ease-toward-target render loop) without the
// redundant request volume.
const HEATMAP_POLL_INTERVAL = 15000;

interface ZoneOption {
  id: number;
  zone_name: string;
  store_id: number;
}

export interface ZoneHeatmap {
  zone_id: number;
  zone_name: string;
  points: HeatmapPoint[];
}

export function useStoreManagerSummary(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "summary", storeId ?? null],
    queryFn: () => storeManagerApi.summary(storeId).then((r) => r.data),
    refetchInterval: LIVE_INTERVAL,
  });
}

export function useStoreManagerCameras(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "cameras", storeId ?? null],
    queryFn: () => storeManagerApi.cameras(storeId).then((r) => r.data),
    refetchInterval: LIVE_INTERVAL,
  });
}

export function useVisitorsByHour(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "visitors-by-hour", storeId ?? null],
    queryFn: () => storeManagerApi.visitorsByHour(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useVisitorsByZone(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "visitors-by-zone", storeId ?? null],
    queryFn: () => storeManagerApi.visitorsByZone(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useShelfActivity(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "shelf-activity", storeId ?? null],
    queryFn: () => storeManagerApi.shelfActivity(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useStoreAlerts(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "alerts", storeId ?? null],
    queryFn: () => storeManagerApi.alerts(storeId).then((r) => r.data),
    refetchInterval: LIVE_INTERVAL,
  });
}

export function useStoreActivities(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "activities", storeId ?? null],
    queryFn: () => storeManagerApi.activities(storeId).then((r) => r.data),
    refetchInterval: LIVE_INTERVAL,
  });
}

export function useStoreHeatmap(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "heatmap", storeId ?? null],
    queryFn: () => storeManagerApi.heatmap(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

/**
 * Real per-zone heat data for the whole store, built entirely on the
 * existing (unchanged) endpoints: GET /zones for the real zone list, then
 * GET /dashboard/heatmap-data?zone_id=X once per zone (that filter already
 * existed - see app/api/routers/ai_dashboard.py) so each zone's density is
 * genuinely its own, not guessed or split from one combined blob.
 */
export function useZoneHeatmaps(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "zone-heatmaps", storeId ?? null],
    queryFn: async (): Promise<{ zones: ZoneHeatmap[]; transitions: ZoneTransition[] }> => {
      const zonesRes = await zonesApi.list();
      const allZones = zonesRes.data as ZoneOption[];
      const zones = storeId ? allZones.filter((z) => z.store_id === storeId) : allZones;

      // Real zone-to-zone movement, already computed by the existing
      // journey-flow endpoint (used elsewhere on the Analyst dashboard) -
      // reused here as-is so the heatmap's flow arrows and that panel's
      // numbers can never disagree, and no backend change is needed.
      const [heatmapResults, journeyRes] = await Promise.all([
        Promise.all(
          zones.map(async (zone) => {
            const res = await storeManagerApi.heatmap(storeId, zone.id);
            return { zone_id: zone.id, zone_name: zone.zone_name, points: res.data.points };
          }),
        ),
        analyticsDashboardApi.journeyFlow(storeId).then((r) => r.data.transitions),
      ]);
      return { zones: heatmapResults, transitions: journeyRes };
    },
    enabled: true,
    refetchInterval: HEATMAP_POLL_INTERVAL,
  });
}

export function useQueue(storeId?: number) {
  return useQuery({
    queryKey: ["store-manager", "queue", storeId ?? null],
    queryFn: () => storeManagerApi.queue(storeId).then((r) => r.data),
    refetchInterval: LIVE_INTERVAL,
  });
}
