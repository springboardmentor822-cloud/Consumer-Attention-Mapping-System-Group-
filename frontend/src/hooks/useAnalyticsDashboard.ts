import { useQuery } from "@tanstack/react-query";
import { analyticsDashboardApi } from "../api/analyticsDashboard";

const SLOW_INTERVAL = 30000;

export function useJourneyFlow(storeId?: number) {
  return useQuery({
    queryKey: ["analyst", "journey-flow", storeId ?? null],
    queryFn: () => analyticsDashboardApi.journeyFlow(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useSegmentation(storeId?: number) {
  return useQuery({
    queryKey: ["analyst", "segmentation", storeId ?? null],
    queryFn: () => analyticsDashboardApi.segmentation(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useStoreComparison() {
  return useQuery({
    queryKey: ["analyst", "store-comparison"],
    queryFn: () => analyticsDashboardApi.storeComparison().then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useAnalystInsights(storeId?: number) {
  return useQuery({
    queryKey: ["analyst", "insights", storeId ?? null],
    queryFn: () => analyticsDashboardApi.insights(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useProductVisibility(storeId?: number) {
  return useQuery({
    queryKey: ["marketing", "product-visibility", storeId ?? null],
    queryFn: () => analyticsDashboardApi.productVisibility(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useConversionFunnel(storeId?: number) {
  return useQuery({
    queryKey: ["marketing", "conversion-funnel", storeId ?? null],
    queryFn: () => analyticsDashboardApi.conversionFunnel(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useInventorySummary(storeId?: number) {
  return useQuery({
    queryKey: ["analyst", "inventory-summary", storeId ?? null],
    queryFn: () => analyticsDashboardApi.inventorySummary(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useProductAnalysis(storeId?: number) {
  return useQuery({
    queryKey: ["analyst", "product-analysis", storeId ?? null],
    queryFn: () => analyticsDashboardApi.productAnalysis(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useShelfAnalysis(storeId?: number) {
  return useQuery({
    queryKey: ["analyst", "shelf-analysis", storeId ?? null],
    queryFn: () => analyticsDashboardApi.shelfAnalysis(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useAttractiveness(storeId?: number) {
  return useQuery({
    queryKey: ["attractiveness", storeId ?? null],
    queryFn: () => analyticsDashboardApi.attractiveness(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}

export function useRecommendations(storeId?: number) {
  return useQuery({
    queryKey: ["recommendations", storeId ?? null],
    queryFn: () => analyticsDashboardApi.recommendations(storeId).then((r) => r.data),
    refetchInterval: SLOW_INTERVAL,
  });
}
