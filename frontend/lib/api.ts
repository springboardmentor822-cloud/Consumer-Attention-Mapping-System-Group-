const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

// NEW — backs /api/auth/me, added so the frontend has one authoritative
// place to ask "who is this, and what role are they" instead of the
// role-switcher sidebar just trusting whatever route got clicked.
export type CurrentUser = {
  id: string;
  email: string;
  role_name: string | null;
};

export type Store = {
  id: string;
  name: string;
  location: string | null;
  store_metadata: Record<string, unknown> | null;
  // NEW — owner_id added this session (Store.owner_id, nullable FK to
  // user.id). Only meaningful for StoreManager-owned stores — Analyst/
  // SuperAdmin list_stores is unrestricted regardless of this value.
  owner_id?: string | null;
};

export type Shelf = {
  id: string;
  store_id: string;
  shelf_name: string;
  zone_coordinates: number[][] | null;
};

// NEW — added for the dashboard. Route paths follow the shelves.py convention
// (/api/stores/{store_id}/...) since that's the confirmed pattern; verify
// against zones.py / cameras.py if these 404.
export type ZoneType = "entrance" | "aisle" | "checkout";

export type Zone = {
  id: string;
  store_id: string;
  name: string;
  zone_type: ZoneType;
};

export type Camera = {
  id: string;
  store_id: string;
  zone_id: string;
  name: string;
  source_path: string;
  is_active: boolean;
};

// NEW — for the dwell-time-by-shelf dashboard chart. Backed by
// compute_dwell_time.py's run-isolated, x-range-proxy logic — see that
// file's module docstring for what these numbers actually mean (not
// full polygon containment, not summed across every run ever pushed).
export type DwellTimeEntry = {
  shelf_id: string;
  shelf_name: string;
  total_seconds: number;
  distinct_visitors: number;
};

// NEW — for the traffic-over-time line chart.
export type TrafficPoint = {
  bucket_start_seconds: number;
  event_count: number;
};

// NEW — for the zone comparison chart. distinct_visitors is now a
// conservative MAX-across-cameras estimate (was a naive sum that
// double-counted shoppers seen by 2+ cameras in one zone — fixed this
// session). distinct_visitors_by_camera is the raw per-camera breakdown
// behind that estimate, added so the UI can show its work instead of
// presenting one opaque number — see traffic_analytics_service.py.
export type ZoneTraffic = {
  zone_id: string;
  zone_name: string;
  event_count: number;
  distinct_visitors: number;
  distinct_visitors_by_camera: {
    camera_id: string;
    camera_name: string;
    distinct_visitors: number;
  }[];
};

// Product/SKU-level visibility analytics derived from real product tracking events.
export type ProductInteractionShelf = {
  shelf_id: string;
  shelf_name: string;
  observed_track_count: number;
};

export type ProductInteractionEntry = {
  product_name: string;
  observed_track_count: number;
  observation_count: number;
  estimated_visible_seconds: number;
  shelves: ProductInteractionShelf[];
  pickup_count: number | null;
  return_count: number | null;
  comparison_count: number | null;
  purchase_count: number | null;
  interaction_status: string;
};

export type ProductInteractionResponse = {
  store_id: string;
  camera_id: string;
  window: { start: string | null; end: string | null };
  data_quality: {
    product_visibility: string;
    pickup: string;
    return: string;
    comparison: string;
    purchase: string;
  };
  products: ProductInteractionEntry[];
};

// NEW — for the product attractiveness score chart. Real attention_score
// is dwell-time-derived (compute_dwell_time.py); the other four component
// scores are placeholder/mock values, flagged per-entry via mock_metrics —
// see app/services/attractiveness_score.py for the formula and provider
// wiring behind this.
export type AttractivenessEntry = {
  shelf_id: string;
  shelf_name: string;
  camera_id: string;
  store_id: string;
  final_score: number;
  attention_score: number;
  interaction_score: number;
  pickup_score: number;
  purchase_score: number;
  repeat_score: number;
  mock_metrics: string[];
};

// NEW — for the recommendations feed. Store-scoped (not per-camera) —
// see app/services/recommendation_engine.py for the 4 rules behind this
// (high_attention_low_pickup, high_pickup_low_purchase, cold_zone,
// eye_level_relocation). expected_conversion_uplift_pct is an
// ILLUSTRATIVE estimate, not a fitted prediction — is_estimate is always
// true right now. based_on_mock lists which inputs behind a given
// recommendation are still placeholder values, not real data — don't
// hide this in the UI, it's load-bearing for interpreting the alert.
export type RecommendationEntry = {
  shelf_id: string | null;
  zone_id: string | null;
  camera_id: string | null;
  rule_type: string;
  priority: "high" | "medium" | "low";
  action_item: string;
  target_description: string;
  expected_conversion_uplift_pct: number;
  is_estimate: boolean;
  based_on_mock: string[];
};

// NEW — for the attractiveness trend chart. Only meaningful once the
// scheduler (recommendation_scheduler.py) has run more than once for a
// camera — a single point is a snapshot, not a trend. Bounded by the
// scheduler's RETENTION_DAYS window.
export type AttractivenessHistoryPoint = {
  shelf_id: string;
  shelf_name: string;
  computed_at: string;
  final_score: number;
};

// NEW — for the shopper segment distribution + dwell-time-bucket charts.
// "Latest run" isolation on the backend is a timestamp-proximity
// heuristic (see shopper_segments_read.py) since ShopperSegment has no
// hard run-boundary marker like TrackingEvent's frame_index reset.
export type SegmentDistribution = {
  segment_counts: { segment_label: string; count: number }[];
  dwell_time_buckets: { bucket: string; count: number }[];
  total_sessions: number;
};

// Admin overview page. active_cameras_flagged is the DB active flag;
// online_cameras is the live heartbeat-based count.
export type AdminOverview = {
  total_stores: number;
  total_users: number;
  total_cameras: number;
  active_cameras_flagged: number;
  online_cameras: number;
};

// NEW — Admin Platform Monitoring (CPU/RAM/disk/GPU/services/API stats).
// system is null when psutil isn't installed on the backend — check
// system_available before rendering CPU/RAM/disk numbers.
export type AdminAlert = {
  target_type: string;
  category: string;
  event_type: string;
  target_id: string | null;
  event_metadata: Record<string, unknown>;
  created_at: string;
  id: string;
  actor_user_id: string | null;
  description: string;
  ip_address: string | null;
};

// EventLog rows returned by /api/admin/logs/security and /api/admin/logs/audit.
// Same shape as AdminAlert (both come from EventLog) but kept as a distinct
// alias since they're conceptually different lists in the UI.
export type AdminLogEntry = AdminAlert;

// Response shape of GET /api/admin/cameras/health (admin_logs.py get_camera_health).
export type CameraHealth = {
  camera_id: string;
  name: string | null;
  online: boolean;
  last_seen_at: string | null;
  recording: boolean;
  streaming: boolean;
  network_quality: string | null;
};

// Campaign CRUD (campaigns.py) + campaign analytics (campaign_analytics.py).
export type CampaignStatusValue = "upcoming" | "active" | "completed";

export type Campaign = {
  id: string;
  store_id: string;
  shelf_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: CampaignStatusValue;
  created_by: string | null;
  created_at: string;
};

export type CampaignAnalytics = {
  campaign: {
    id: string;
    name: string;
    store_id: string;
    shelf_id: string;
    shelf_name: string;
    start_date: string;
    end_date: string;
    status: CampaignStatusValue;
  };
  has_data: boolean;
  message?: string;
  summary: {
    latest_final_score: number;
    average_final_score: number;
    latest_attention_score: number;
    average_attention_score: number;
    before_final_score: number;
    after_final_score: number;
    final_score_change: number;
    before_attention_score: number;
    after_attention_score: number;
    attention_score_change: number;
    average_interaction_score: number;
    average_pickup_score: number;
    average_purchase_score: number;
    average_repeat_score: number;
    sample_count: number;
  } | null;
  trend: Array<{
    computed_at: string;
    final_score: number;
    attention_score: number;
    interaction_score: number;
    pickup_score: number;
    purchase_score: number;
    repeat_score: number;
  }>;
  mock_metrics: string[];
  data_quality: Record<string, string> | null;
  promotion_effectiveness: {
    attractiveness_lift: number;
    attention_lift: number;
    purchase_proxy_lift: number;
    method: string;
    purchase_proxy_is_real: boolean;
  } | null;
  engagement: {
    attention: number;
    interaction: number;
    pickup: number;
    repeat: number;
    all_components_observed: boolean;
  } | null;
  conversion: {
    attention_to_purchase_proxy: number | null;
    purchase_score: number;
    is_observed_conversion: boolean;
  } | null;
};

// Completion analytics (completion_analytics.py) — journey, conversion,
// derived interactions, and persisted alerts for a store/camera.
export type CompletionInteractions = {
  store_id: string;
  camera_id: string;
  interaction_events: number;
  comparison_events: number;
  pickup_candidates: number;
  return_candidates: number;
  data_quality: {
    interaction: string;
    comparison: string;
    pickup: string;
    return: string;
  };
  events: Array<{
    person_track_id: number;
    product_track_id: string;
    product_name: string;
    event_type: string;
    event_time: string;
    confidence: number;
  }>;
};

export type JourneyData = {
  store_id: string;
  sessions: number;
  nodes: Array<{ name: string }>;
  links: Array<{ source: string; target: string; value: number }>;
  zone_observations: Array<{ zone: string; count: number }>;
  data_quality: string;
};

export type ConversionSummary = {
  attention_events: number;
  purchase: {
    store_id: string;
    transactions: number;
    items: number;
    revenue: number;
    by_sku: Array<{ sku: string; quantity: number; revenue: number }>;
    data_quality: string;
  };
  conversion_available: boolean;
  note: string;
};

export type CompletionAlert = AdminAlert;

export type AdminMonitoring = {
  system: {
    cpu_percent: number;
    ram_percent: number;
    ram_used_gb: number;
    ram_total_gb: number;
    disk_percent: number;
    disk_used_gb: number;
    disk_total_gb: number;
  } | null;
  system_available: boolean;
  gpu: {
    name: string;
    utilization_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
  }[] | null;
  services: {
    postgres: boolean;
    timescaledb: boolean;
    redis: boolean;
  };
  services_running_count: number;
  services_total_count: number;
  api: {
    uptime_seconds: number;
    total_requests: number;
    avg_response_time_ms: number | null;
    avg_response_time_window: number;
  };
};

// NEW — forgot/reset password. Dev-mode: dev_reset_token is returned
// directly in the response, not emailed — see password_reset.py's
// module docstring. Never treat this as "email sent" in the UI copy.
export type ForgotPasswordResponse = {
  dev_reset_token?: string | null;
  message: string;
  warning?: string | null;
};

// NEW — Admin User Management section. Backs GET /api/users and the two
// PATCH endpoints. Both PATCH routes reject an admin acting on their own
// account (role-away-from-SuperAdmin, or deactivate) — see users.py for
// the self-lockout reasoning. The frontend should still disable those
// controls for the logged-in admin's own row rather than relying on the
// 400 alone, so it doesn't read as a broken button.
export type UserAccount = {
  id: string;
  email: string;
  role_name: string | null;
  is_active: boolean;
};

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // response wasn't JSON - fall back to statusText
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return res.json();
}

// Exported so the dashboard can build a ws:// or wss:// URL from the same
// base the rest of the app already uses, instead of hardcoding a second one.
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getAuthToken(): string | null {
  return getToken();
}

export const api = {
  register: (email: string, password: string, role_name: string) =>
    request<TokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role_name }),
    }),

  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    return request<TokenResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  },

  // NEW
  getMe: () => request<CurrentUser>("/api/auth/me"),

  // NEW
  forgotPassword: (email: string) =>
    request<ForgotPasswordResponse>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // NEW
  resetPassword: (token: string, new_password: string) =>
    request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),

  listStores: () => request<Store[]>("/api/stores"),

  createStore: (name: string, location?: string) =>
    request<Store>("/api/stores", {
      method: "POST",
      body: JSON.stringify({ name, location }),
    }),

  listShelves: (storeId: string) =>
    request<Shelf[]>(`/api/stores/${storeId}/shelves`),

  createShelf: (storeId: string, shelf_name: string, zone_coordinates?: number[][]) =>
    request<Shelf>(`/api/stores/${storeId}/shelves`, {
      method: "POST",
      body: JSON.stringify({ shelf_name, zone_coordinates }),
    }),

  // NEW
  listZones: (storeId: string) =>
    request<Zone[]>(`/api/stores/${storeId}/zones`),

  listCameras: (storeId: string) =>
    request<Camera[]>(`/api/stores/${storeId}/cameras`),

  // NEW — Admin Camera Management toggle. Only flips the DB flag; see
  // cameras.py's set_camera_active for what this does and doesn't do.
  setCameraActive: (storeId: string, cameraId: string, is_active: boolean) =>
    request<Camera>(`/api/stores/${storeId}/cameras/${cameraId}/active`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    }),

  // NEW
  getDwellTime: (storeId: string, cameraId: string) =>
    request<DwellTimeEntry[]>(`/api/stores/${storeId}/cameras/${cameraId}/dwell-time`),

  getTrafficOverTime: (storeId: string, cameraId: string) =>
    request<TrafficPoint[]>(`/api/stores/${storeId}/cameras/${cameraId}/traffic-over-time`),

  getZoneTraffic: (storeId: string) =>
    request<ZoneTraffic[]>(`/api/stores/${storeId}/zone-traffic`),

  // Shelf-level attractiveness is optional: cameras without a ShelfCameraView
  // (for example entrance/checkout cameras) have no shelf analytics. Treat
  // that specific backend 404 as an empty result instead of a console error.
  getAttractiveness: async (storeId: string, cameraId: string): Promise<AttractivenessEntry[]> => {
    try {
      return await request<AttractivenessEntry[]>(
        `/api/stores/${storeId}/cameras/${cameraId}/attractiveness`
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 404 &&
        error.message.toLowerCase().includes("shelfcameraview")
      ) {
        return [];
      }
      throw error;
    }
  },

  // NEW
  getRecommendations: (storeId: string) =>
    request<RecommendationEntry[]>(`/api/stores/${storeId}/recommendations`),

  // A camera without shelf views also has no attractiveness history.
  getAttractivenessHistory: async (storeId: string, cameraId: string): Promise<AttractivenessHistoryPoint[]> => {
    try {
      return await request<AttractivenessHistoryPoint[]>(
        `/api/stores/${storeId}/cameras/${cameraId}/attractiveness/history`
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 404 &&
        error.message.toLowerCase().includes("shelfcameraview")
      ) {
        return [];
      }
      throw error;
    }
  },

  // NEW
  getSegmentDistribution: (storeId: string, cameraId: string) =>
    request<SegmentDistribution>(`/api/stores/${storeId}/cameras/${cameraId}/segments`),

  getProductInteractions: (storeId: string, cameraId: string) =>
    request<ProductInteractionResponse>(`/api/stores/${storeId}/cameras/${cameraId}/product-interactions`),

  // NEW
  getAdminOverview: () => request<AdminOverview>("/api/admin/overview"),

  // NEW
  getAdminMonitoring: () => request<AdminMonitoring>("/api/admin/monitoring"),

  getAdminAlerts: (alert_type?: string) => {
    const params = new URLSearchParams();
    if (alert_type) params.set("alert_type", alert_type);
    const query = params.toString();
    return request<AdminAlert[]>(`/api/admin/alerts${query ? `?${query}` : ""}`);
  },

  // NEW — Admin Security/Audit logs + Camera Health (admin_logs.py, SuperAdmin only).
  getSecurityLogs: (limit = 50) =>
    request<AdminLogEntry[]>(`/api/admin/logs/security?limit=${limit}`),

  getAuditLogs: (limit = 50) =>
    request<AdminLogEntry[]>(`/api/admin/logs/audit?limit=${limit}`),

  getCameraHealth: () => request<CameraHealth[]>("/api/admin/cameras/health"),

  // NEW — Marketing Manager Campaign CRUD (campaigns.py). store_id is optional
  // on the backend (filters if passed); omit to list all campaigns the
  // caller's role can see.
  listCampaigns: (storeId?: string) => {
    const params = new URLSearchParams();
    if (storeId) params.set("store_id", storeId);
    const query = params.toString();
    return request<Campaign[]>(`/api/campaigns${query ? `?${query}` : ""}`);
  },

  getCampaign: (campaignId: string) =>
    request<Campaign>(`/api/campaigns/${campaignId}`),

  createCampaign: (data: {
    store_id: string;
    shelf_id: string;
    name: string;
    start_date: string;
    end_date: string;
  }) =>
    request<Campaign>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCampaign: (
    campaignId: string,
    data: Partial<{
      name: string;
      shelf_id: string;
      start_date: string;
      end_date: string;
      status: CampaignStatusValue;
    }>
  ) =>
    request<Campaign>(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCampaign: (campaignId: string) =>
    request<void>(`/api/campaigns/${campaignId}`, { method: "DELETE" }),

  // NEW — Marketing Manager campaign analytics (campaign_analytics.py).
  getCampaignAnalytics: (campaignId: string) =>
    request<CampaignAnalytics>(`/api/campaigns/${campaignId}/analytics`),

  // NEW — Completion analytics (completion_analytics.py): journey/conversion/
  // interactions/alerts for a store, optionally scoped to a camera.
  getJourney: (storeId: string) =>
    request<JourneyData>(`/api/v1/completion/${storeId}/journey`),

  getConversion: (storeId: string, cameraId?: string) => {
    const params = new URLSearchParams();
    if (cameraId) params.set("camera_id", cameraId);
    const query = params.toString();
    return request<ConversionSummary>(
      `/api/v1/completion/${storeId}/conversion${query ? `?${query}` : ""}`
    );
  },

  getCompletionInteractions: (storeId: string, cameraId: string) =>
    request<CompletionInteractions>(
      `/api/v1/completion/${storeId}/cameras/${cameraId}/interactions`
    ),

  getCompletionAlerts: (storeId: string) =>
    request<CompletionAlert[]>(`/api/v1/completion/${storeId}/alerts`),

  // NEW — Admin User Management section (users.py, SuperAdmin only).
  listUsers: () => request<UserAccount[]>("/api/users"),

  setUserRole: (userId: string, role_name: string) =>
    request<UserAccount>(`/api/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role_name }),
    }),

  setUserActive: (userId: string, is_active: boolean) =>
    request<UserAccount>(`/api/users/${userId}/active`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    }),

  // NEW — Store Manager report export. Doesn't use request<T>() above
  // since the response is a file, not JSON — fetches the blob directly,
  // reads the real filename from Content-Disposition (server strips
  // unsafe characters from the store name - see reports.py), and
  // triggers a browser download. Current-snapshot only, no date range —
  // see report_export.py for why Daily/Weekly/Monthly isn't real yet.
  exportStoreReport: async (storeId: string, format: "pdf" | "excel"): Promise<void> => {
    const token = getAuthToken();
    const res = await fetch(
      `${getApiBaseUrl()}/api/stores/${storeId}/reports/export?format=${format}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail ?? detail;
      } catch {
        // response wasn't JSON - fall back to statusText
      }
      throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail));
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="(.+)"/);
    const filename = match?.[1] ?? `report.${format === "pdf" ? "pdf" : "xlsx"}`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export { ApiError };
