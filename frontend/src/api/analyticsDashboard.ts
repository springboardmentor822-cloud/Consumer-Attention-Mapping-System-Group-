import api from "./client";

export interface ZoneTransition {
  from_zone_id: number;
  from_zone_name: string;
  to_zone_id: number;
  to_zone_name: string;
  count: number;
}
export interface JourneyFlowResponse {
  store_id: number | null;
  transitions: ZoneTransition[];
}

export interface SegmentItem {
  segment: string;
  count: number;
  avg_dwell_seconds: number;
}
export interface SegmentationResponse {
  store_id: number | null;
  total_customers: number;
  segments: SegmentItem[];
  multi_zone_visitor_pct: number;
}

export interface StoreComparisonItem {
  store_id: number;
  store_name: string;
  visitors: number;
  avg_dwell_seconds: number;
  peak_hour: number | null;
}
export interface StoreComparisonResponse {
  stores: StoreComparisonItem[];
}

export interface InsightItem {
  severity: string;
  message: string;
}
export interface InsightsResponse {
  store_id: number | null;
  insights: InsightItem[];
}

export interface ProductVisibilityItem {
  shelf_id: number;
  shelf_name: string;
  store_name: string;
  zone: string;
  visibility_score: number;
}
export interface ProductVisibilityResponse {
  shelves: ProductVisibilityItem[];
}

export interface FunnelStage {
  stage: string;
  count: number;
}
export interface ConversionFunnelResponse {
  store_id: number | null;
  stages: FunnelStage[];
  conversion_rate: number | null;
}

export interface CategorySummaryItem {
  category: string;
  product_count: number;
  total_stock: number;
  avg_price: number;
  inventory_value: number;
}

export interface InventorySummaryResponse {
  store_id: number | null;
  total_products: number;
  total_inventory_items: number;
  inventory_value: number;
  low_stock_products: number;
  categories: CategorySummaryItem[];
}

export interface ProductStockItem {
  product_id: number;
  product_name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  price: number;
  shelf_name: string;
}

export interface ProductAnalysisResponse {
  store_id: number | null;
  highest_stock: ProductStockItem[];
  lowest_stock: ProductStockItem[];
  to_restock: ProductStockItem[];
  categories: CategorySummaryItem[];
}

export interface ShelfAnalysisItem {
  shelf_id: number;
  shelf_name: string;
  store_name: string;
  zone: string;
  product_count: number;
  visit_count: number;
  status: string;
  /** Live re-detection on this shelf camera's latest processed frame.
   *  null when the camera has never been processed - which is different from
   *  "detected zero products". */
  detected_product_count: number | null;
  restocking_needed: boolean;
}

export interface ShelfAnalysisResponse {
  store_id: number | null;
  shelves: ShelfAnalysisItem[];
  most_visited: ShelfAnalysisItem | null;
  least_visited: ShelfAnalysisItem | null;
  empty_count: number;
  full_count: number;
}

export interface AttractivenessItem {
  shelf_id: number;
  shelf_name: string;
  store_name: string;
  zone: string;
  score: number;
  traffic_score: number;
  dwell_score: number;
  interaction_score: number;
  stockout_penalty: number;
  rank: number;
  has_behavior_data: boolean;
}

export interface AttractivenessResponse {
  store_id: number | null;
  shelves: AttractivenessItem[];
}

export interface RecommendationItem {
  severity: string;
  shelf_id: number;
  shelf_name: string;
  zone: string;
  issue: string;
  action: string;
}

export interface RecommendationsResponse {
  store_id: number | null;
  recommendations: RecommendationItem[];
  shelves_considered: number;
}

function storeParams(storeId?: number) {
  return storeId ? { store_id: storeId } : {};
}

export const analyticsDashboardApi = {
  journeyFlow: (storeId?: number) =>
    api.get<JourneyFlowResponse>("/dashboard/analyst/journey-flow", { params: storeParams(storeId) }),
  segmentation: (storeId?: number) =>
    api.get<SegmentationResponse>("/dashboard/analyst/segmentation", { params: storeParams(storeId) }),
  storeComparison: () => api.get<StoreComparisonResponse>("/dashboard/analyst/store-comparison"),
  insights: (storeId?: number) =>
    api.get<InsightsResponse>("/dashboard/analyst/insights", { params: storeParams(storeId) }),
  productVisibility: (storeId?: number) =>
    api.get<ProductVisibilityResponse>("/dashboard/marketing/product-visibility", { params: storeParams(storeId) }),
  conversionFunnel: (storeId?: number) =>
    api.get<ConversionFunnelResponse>("/dashboard/marketing/conversion-funnel", { params: storeParams(storeId) }),
  inventorySummary: (storeId?: number) =>
    api.get<InventorySummaryResponse>("/dashboard/analyst/inventory-summary", { params: storeParams(storeId) }),
  productAnalysis: (storeId?: number) =>
    api.get<ProductAnalysisResponse>("/dashboard/analyst/product-analysis", { params: storeParams(storeId) }),
  shelfAnalysis: (storeId?: number) =>
    api.get<ShelfAnalysisResponse>("/dashboard/analyst/shelf-analysis", { params: storeParams(storeId) }),
  attractiveness: (storeId?: number) =>
    api.get<AttractivenessResponse>("/dashboard/attractiveness", { params: storeParams(storeId) }),
  recommendations: (storeId?: number) =>
    api.get<RecommendationsResponse>("/dashboard/recommendations", { params: storeParams(storeId) }),
};
