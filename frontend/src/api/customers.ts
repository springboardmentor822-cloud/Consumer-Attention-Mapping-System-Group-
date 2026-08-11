import api from "./client";

/** Shown wherever a visit has no legitimate mapping to a real customer.
 * Mirrors the backend constants - CCTV never supplies a name or phone. */
export const ANONYMOUS_VISITOR_NAME = "Anonymous Visitor";
export const UNKNOWN_CUSTOMER_PHONE = "Not Available";

export interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  store_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface CustomerPayload {
  customer_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  store_id: number | null;
  is_active: boolean;
}

export interface PurchasedProduct {
  product_id: number | null;
  name: string;
  quantity: number;
}

export interface CustomerListItem {
  customer_id: number | null;
  tracking_id: string | null;
  display_name: string;
  customer_code: string | null;
  phone: string;
  /** False for anonymous video-derived rows. The UI must not imply identity. */
  is_identified: boolean;
  last_visit: string | null;
  total_visits: number;
  total_dwell_seconds: number;
  interaction_count: number;
  products_purchased: number;
  total_spend: string;
  /** Real purchased products. Empty means no transactions - render
   * "No purchase recorded", never a fabricated line. */
  products: PurchasedProduct[];
}

export interface CustomerListResponse {
  store_id: number | null;
  total: number;
  items: CustomerListItem[];
}

export interface VisitSummary {
  id: number;
  tracking_id: string;
  customer_id: number | null;
  customer_name: string;
  phone: string;
  store_id: number;
  camera_id: number;
  camera_name: string | null;
  entry_time: string;
  exit_time: string;
  total_dwell_seconds: number;
  total_zones_visited: number;
  interaction_count: number;
}

export interface VisitZone {
  zone_id: number | null;
  zone_name: string;
  seconds: number;
}

export interface VisitDetail extends VisitSummary {
  zones: VisitZone[];
  journey: string[];
}

export interface InteractionItem {
  product_id: number | null;
  product_name: string | null;
  zone_id: number | null;
  zone_name: string | null;
  interaction_type: string;
  timestamp: string;
  duration_seconds: number;
}

export interface PurchaseItem {
  product_id: number | null;
  product_name: string | null;
  category: string | null;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface JourneyZone {
  zone_id: number | null;
  zone_name: string;
  seconds: number;
  visits: number;
  interactions: number;
}

export interface ProductInteractionDetail {
  product_id: number | null;
  product_name: string;
  zone_name: string | null;
  interaction_count: number;
  total_seconds: number;
}

export interface TrackingInfo {
  tracking_ids: string[];
  cameras: string[];
  first_detected: string | null;
  last_detected: string | null;
  zones: string[];
  total_tracking_seconds: number;
  visit_count: number;
}

/** Everything the Customer Details modal needs, for a registered customer or
 * an anonymous tracked visitor, in one request. */
export interface CustomerProfile {
  is_identified: boolean;
  display_name: string;
  phone: string;
  email: string | null;
  customer_code: string | null;
  customer_id: number | null;
  tracking_id: string | null;
  total_visits: number;
  first_visit: string | null;
  last_visit: string | null;
  average_visit_seconds: number;
  total_dwell_seconds: number;
  total_spend: string;
  average_purchase_value: string | null;
  purchase_count: number;
  journey: JourneyZone[];
  purchases: Purchase[];
  interactions: ProductInteractionDetail[];
  tracking: TrackingInfo;
  recent_visits: VisitSummary[];
}

export interface StoreCustomerSummary {
  store_id: number | null;
  todays_customers: number;
  returning_customers: number;
  average_dwell_seconds: number;
  total_purchases: number;
  total_revenue: string;
  average_purchase_value: string | null;
}

export interface Purchase {
  id: number;
  transaction_number: string;
  store_id: number;
  purchase_time: string;
  total_amount: string;
  items: PurchaseItem[];
}

export interface CustomerDetail {
  customer: Customer;
  first_visit: string | null;
  last_visit: string | null;
  total_visits: number;
  average_dwell_seconds: number;
  total_spend: string;
  average_purchase_value: string | null;
  purchase_count: number;
  recent_visits: VisitSummary[];
  purchases: Purchase[];
}

export interface CustomerAnalyticsSummary {
  store_id: number | null;
  total_visits: number;
  identified_visits: number;
  anonymous_visits: number;
  registered_customers: number;
  returning_customers: number;
  average_visit_seconds: number;
  total_revenue: string;
  average_purchase_value: string | null;
  purchase_count: number;
  most_visited_zone: string | null;
  most_interacted_product: string | null;
}

export interface ZoneVisitStat {
  zone_id: number | null;
  zone_name: string;
  visits: number;
  average_dwell_seconds: number;
}

export interface VisitsOverTimePoint {
  date: string;
  visits: number;
}

export interface ProductInteractionStat {
  product_id: number | null;
  product_name: string;
  interactions: number;
  total_seconds: number;
}

export interface PurchaseStat {
  product_id: number | null;
  product_name: string;
  quantity: number;
  revenue: string;
}

interface OverviewParams {
  storeId?: number;
  search?: string;
  zoneId?: number;
  dateFrom?: string;
  dateTo?: string;
}

function overviewParams(p: OverviewParams) {
  const params: Record<string, string | number> = {};
  if (p.storeId) params.store_id = p.storeId;
  if (p.search) params.search = p.search;
  if (p.zoneId) params.zone_id = p.zoneId;
  if (p.dateFrom) params.date_from = p.dateFrom;
  if (p.dateTo) params.date_to = p.dateTo;
  return params;
}

export const customersApi = {
  list: (search?: string, storeId?: number) =>
    api.get<Customer[]>("/customers", {
      params: { ...(search ? { search } : {}), ...(storeId ? { store_id: storeId } : {}) },
    }),
  create: (payload: CustomerPayload) => api.post<Customer>("/customers", payload),
  update: (id: number, payload: Partial<CustomerPayload>) => api.put<Customer>(`/customers/${id}`, payload),
  remove: (id: number) => api.delete(`/customers/${id}`),
  overview: (p: OverviewParams = {}) =>
    api.get<CustomerListResponse>("/customers/overview", { params: overviewParams(p) }),
  summary: (storeId?: number) =>
    api.get<StoreCustomerSummary>("/customers/summary", { params: storeId ? { store_id: storeId } : {} }),
  /** One request for the whole details modal - works for a registered
   * customer (customerId) or an anonymous visitor (trackingId). */
  profile: (customerId: number | null, trackingId: string | null) =>
    api.get<CustomerProfile>("/customers/profile", {
      params: customerId != null ? { customer_id: customerId } : { tracking_id: trackingId },
    }),
  detail: (id: number) => api.get<CustomerDetail>(`/customers/${id}`),
  visits: (storeId?: number, trackingId?: string) =>
    api.get<VisitSummary[]>("/customers/visits", {
      params: { ...(storeId ? { store_id: storeId } : {}), ...(trackingId ? { tracking_id: trackingId } : {}) },
    }),
  visitDetail: (visitId: number) => api.get<VisitDetail>(`/customers/visits/${visitId}`),
  visitInteractions: (visitId: number) =>
    api.get<InteractionItem[]>(`/customers/visits/${visitId}/interactions`),
  mapVisit: (visitId: number, customerId: number | null) =>
    api.patch(`/customers/visits/${visitId}/mapping`, { customer_id: customerId }),
};

export const customerAnalyticsApi = {
  summary: (storeId?: number) =>
    api.get<CustomerAnalyticsSummary>("/customer-analytics/summary", {
      params: storeId ? { store_id: storeId } : {},
    }),
  visitsOverTime: (storeId?: number) =>
    api.get<VisitsOverTimePoint[]>("/customer-analytics/visits", {
      params: storeId ? { store_id: storeId } : {},
    }),
  zones: (storeId?: number) =>
    api.get<ZoneVisitStat[]>("/customer-analytics/zones", { params: storeId ? { store_id: storeId } : {} }),
  products: (storeId?: number) =>
    api.get<ProductInteractionStat[]>("/customer-analytics/products", {
      params: storeId ? { store_id: storeId } : {},
    }),
  purchases: (storeId?: number) =>
    api.get<PurchaseStat[]>("/customer-analytics/purchases", { params: storeId ? { store_id: storeId } : {} }),
};
