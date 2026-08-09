import api from "./client";

export interface Promotion {
  id: number;
  name: string;
  promotion_type: string;
  status: string;
  campaign_id: number | null;
  product_id: number | null;
  discount_percent: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface PromotionPerformance {
  promotion_id: number;
  data_available: boolean;
  reach: number | null;
  avg_engagement_seconds: number | null;
  note: string;
}

export const PROMOTION_TYPES = [
  "Product Promotion",
  "Bundle Offer",
  "Festival Offer",
  "Seasonal Campaign",
  "Flash Sale",
  "Discount Offer",
];
export const PROMOTION_STATUSES = ["Scheduled", "Active", "Expired", "Cancelled"];

export interface PromotionPayload {
  name: string;
  promotion_type: string;
  status: string;
  campaign_id: number | null;
  product_id: number | null;
  discount_percent: number | null;
  start_date: string;
  end_date: string;
}

export const promotionsApi = {
  list: () => api.get<Promotion[]>("/promotions"),
  create: (payload: PromotionPayload) => api.post<Promotion>("/promotions", payload),
  update: (id: number, payload: Partial<PromotionPayload>) => api.put<Promotion>(`/promotions/${id}`, payload),
  remove: (id: number) => api.delete(`/promotions/${id}`),
  activate: (id: number) => api.post<Promotion>(`/promotions/${id}/activate`),
  expire: (id: number) => api.post<Promotion>(`/promotions/${id}/expire`),
  duplicate: (id: number) => api.post<Promotion>(`/promotions/${id}/duplicate`),
  performance: (id: number) => api.get<PromotionPerformance>(`/promotions/${id}/performance`),
};
