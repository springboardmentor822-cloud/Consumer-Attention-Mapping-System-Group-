import api from "./client";

export interface Campaign {
  id: number;
  name: string;
  campaign_type: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: string;
  store_id: number | null;
  zone_id: number | null;
  description: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignPerformance {
  campaign_id: number;
  data_available: boolean;
  reach: number | null;
  avg_engagement_seconds: number | null;
  note: string;
}

export interface CampaignSummary {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  draft_campaigns: number;
  total_budget: number;
  total_promotions: number;
  active_promotions: number;
  avg_attention_seconds: number;
}

export const CAMPAIGN_TYPES = ["In-Store", "Digital", "Social Media", "Email", "Print", "Event"];
export const CAMPAIGN_STATUSES = ["Draft", "Active", "Paused", "Completed", "Cancelled"];

export interface CampaignPayload {
  name: string;
  campaign_type: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  store_id: number | null;
  zone_id: number | null;
  description: string | null;
}

export const campaignsApi = {
  list: () => api.get<Campaign[]>("/campaigns"),
  create: (payload: CampaignPayload) => api.post<Campaign>("/campaigns", payload),
  update: (id: number, payload: Partial<CampaignPayload>) => api.put<Campaign>(`/campaigns/${id}`, payload),
  remove: (id: number) => api.delete(`/campaigns/${id}`),
  activate: (id: number) => api.post<Campaign>(`/campaigns/${id}/activate`),
  deactivate: (id: number) => api.post<Campaign>(`/campaigns/${id}/deactivate`),
  duplicate: (id: number) => api.post<Campaign>(`/campaigns/${id}/duplicate`),
  performance: (id: number) => api.get<CampaignPerformance>(`/campaigns/${id}/performance`),
  summary: () => api.get<CampaignSummary>("/dashboard/marketing/campaign-summary"),
};
