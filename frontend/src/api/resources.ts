import client, { API_BASE_URL } from "./client";
import type {
  AttentionEvent,
  Camera,
  Heatmap,
  LiveCamera,
  Notification,
  OccupancySnapshot,
  ProductAttractivenessScore,
  ProductInteraction,
  ReportItem,
  Shelf,
  ShelfDwell,
  ShelfLevel,
  Store,
  User,
  Zone,
} from "../types";

export const authApi = {
  async login(email: string, password: string) {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const { data } = await client.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data as { access_token: string; refresh_token: string; token_type: string };
  },

  async register(payload: { full_name: string; email: string; password: string; role: string }) {
    const { data } = await client.post("/auth/register", payload);
    return data as User;
  },

  async me() {
    const { data } = await client.get("/auth/me");
    return data as User;
  },
};

export const storesApi = {
  async list() {
    const { data } = await client.get("/stores");
    return data as Store[];
  },
  async get(id: number) {
    const { data } = await client.get(`/stores/${id}`);
    return data as Store;
  },
  async create(payload: Partial<Store>) {
    const { data } = await client.post("/stores", payload);
    return data as Store;
  },
  async update(id: number, payload: Partial<Store>) {
    const { data } = await client.put(`/stores/${id}`, payload);
    return data as Store;
  },
};

export const zonesApi = {
  async list(storeId: number) {
    const { data } = await client.get(`/stores/${storeId}/zones`);
    return data as Zone[];
  },
};

export const liveTrackingApi = {
  async start(storeId: number) {
    const { data } = await client.post(`/tracking/simulate/${storeId}/start`);
    return data as { store_id: number; running: boolean; already_running: boolean };
  },
  async stop(storeId: number) {
    const { data } = await client.post(`/tracking/simulate/${storeId}/stop`);
    return data as { store_id: number; running: boolean; was_running: boolean };
  },
  async status(storeId: number) {
    const { data } = await client.get(`/tracking/simulate/${storeId}/status`);
    return data as { store_id: number; running: boolean };
  },
  async occupancy(storeId: number) {
    const { data } = await client.get(`/tracking/occupancy/${storeId}`);
    return data as OccupancySnapshot;
  },
  async uploadVideo(storeId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await client.post(`/tracking/detect-video/${storeId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as { store_id: number; processing: boolean; filename: string };
  },
  async detectionStatus(storeId: number) {
    const { data } = await client.get(`/tracking/detect-video/${storeId}/status`);
    return data as { store_id: number; processing: boolean };
  },
  async detectFrame(storeId: number, blob: Blob) {
    const form = new FormData();
    form.append("file", blob, "frame.jpg");
    const { data } = await client.post(`/tracking/detect-frame/${storeId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as {
      store_id: number;
      people: { norm_x: number; norm_y: number; norm_w: number; norm_h: number; confidence: number }[];
      products: { norm_x: number; norm_y: number; norm_w: number; norm_h: number; confidence: number }[];
      people_count: number;
      product_count: number;
    };
  },
};

export const liveCamerasApi = {
  async list() {
    const { data } = await client.get("/live-cameras");
    return data as LiveCamera[];
  },
  streamUrl(cameraId: string) {
    return `${API_BASE_URL}/live-cameras/${cameraId}/stream`;
  },
};

export const camerasApi = {
  async list(storeId?: number) {
    const { data } = await client.get("/cameras", { params: storeId ? { store_id: storeId } : {} });
    return data as Camera[];
  },
  async create(payload: {
    store_id: number;
    name: string;
    camera_type: string;
    stream_url?: string;
  }) {
    const { data } = await client.post("/cameras", payload);
    return data as Camera;
  },
};

export const shelvesApi = {
  async list(storeId?: number) {
    const { data } = await client.get("/shelves", { params: storeId ? { store_id: storeId } : {} });
    return data as Shelf[];
  },
  async create(payload: {
    store_id: number;
    name: string;
    aisle?: string;
    position_coordinates?: string;
    shelf_level?: ShelfLevel;
  }) {
    const { data } = await client.post("/shelves", payload);
    return data as Shelf;
  },
  async update(shelfId: number, payload: {
    shelf_level?: ShelfLevel;
    name?: string;
    aisle?: string;
    position_coordinates?: string;
    shelf_width_m?: number;
    shelf_height_m?: number;
  }) {
    const { data } = await client.put(`/shelves/${shelfId}`, payload);
    return data as Shelf;
  },
};

export const productsApi = {
  async list(shelfId?: number) {
    const { data } = await client.get("/products", { params: shelfId ? { shelf_id: shelfId } : {} });
    return data;
  },
  async create(payload: { sku: string; name: string; brand?: string; price?: number; shelf_id?: number }) {
    const { data } = await client.post("/products", payload);
    return data;
  },
};

export const analyticsApi = {
  async summary(storeId: number, periodStart: string, periodEnd: string) {
    const { data } = await client.get("/analytics/summary", {
      params: { store_id: storeId, period_start: periodStart, period_end: periodEnd },
    });
    return data;
  },
  async productRanking(storeId: number, periodStart: string, periodEnd: string) {
    const { data } = await client.get("/analytics/product-ranking", {
      params: { store_id: storeId, period_start: periodStart, period_end: periodEnd },
    });
    return data;
  },
};

export const scoresApi = {
  async compute(storeId: number, periodStart: string, periodEnd: string) {
    const { data } = await client.post("/scores/compute", null, {
      params: { store_id: storeId, period_start: periodStart, period_end: periodEnd },
    });
    return data;
  },
  async list(productId?: number) {
    const { data } = await client.get("/scores", { params: productId ? { product_id: productId } : {} });
    return data;
  },
};

export const recommendationsApi = {
  async generate(storeId: number) {
    const { data } = await client.post(`/recommendations/generate/${storeId}`);
    return data;
  },
  async list(storeId: number) {
    const { data } = await client.get("/recommendations", { params: { store_id: storeId } });
    return data;
  },
  async dismiss(id: number) {
    const { data } = await client.patch(`/recommendations/${id}/dismiss`);
    return data;
  },
};

export const notificationsApi = {
  async list(storeId?: number) {
    const { data } = await client.get("/notifications", {
      params: storeId ? { store_id: storeId } : {},
    });
    return data as Notification[];
  },
};

export const usersApi = {
  async list() {
    const { data } = await client.get("/users");
    return data as User[];
  },
  async updateRole(userId: number, role: string) {
    const { data } = await client.patch(`/users/${userId}/role`, { role });
    return data as User;
  },
  async updateStatus(userId: number, isActive: boolean) {
    const { data } = await client.patch(`/users/${userId}/status`, { is_active: isActive });
    return data as User;
  },
  async remove(userId: number) {
    await client.delete(`/users/${userId}`);
  },
};

export const heatmapsApi = {
  async list(storeId?: number, heatmapType?: string) {
    const { data } = await client.get("/heatmaps", {
      params: { store_id: storeId, heatmap_type: heatmapType },
    });
    return data as Heatmap[];
  },
  async generate(payload: {
    store_id: number;
    camera_id?: number;
    heatmap_type: string;
    period_start: string;
    period_end: string;
    segment?: string;
    shelf_id?: number;
  }) {
    const { data } = await client.post("/heatmaps/generate", payload);
    return data as Heatmap;
  },
};

export const reportsApi = {
  async list(storeId?: number) {
    const { data } = await client.get("/reports", { params: storeId ? { store_id: storeId } : {} });
    return data as ReportItem[];
  },
  async request(payload: {
    store_id: number;
    report_type: string;
    report_format: string;
    period_start: string;
    period_end: string;
  }) {
    const { data } = await client.post("/reports", payload);
    return data as ReportItem;
  },
  /**
   * Downloads a report file with the login token properly attached, then
   * triggers a normal browser "Save File" using a temporary blob URL.
   * A plain <a href="..."> can't send the Authorization header this
   * endpoint requires, so it would 401 no matter who clicks it.
   */
  async download(reportId: number, suggestedFilename?: string) {
    const response = await client.get(`/reports/${reportId}/download`, {
      responseType: "blob",
    });
    const blobUrl = window.URL.createObjectURL(response.data as Blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = suggestedFilename || `report-${reportId}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};

export const attentionApi = {
  async listEvents(params: { session_id?: number; shelf_id?: number; product_id?: number } = {}) {
    const { data } = await client.get("/attention/events", { params });
    return data as AttentionEvent[];
  },
  async listInteractions(
    params: { session_id?: number; product_id?: number; interaction_type?: string } = {}
  ) {
    const { data } = await client.get("/attention/interactions", { params });
    return data as ProductInteraction[];
  },
  async shelfDwell(storeId: number, periodStart: string, periodEnd: string) {
    const { data } = await client.get("/attention/shelf-dwell", {
      params: { store_id: storeId, period_start: periodStart, period_end: periodEnd },
    });
    return data as ShelfDwell[];
  },
};

export const productScoresApi = {
  async list(productId?: number) {
    const { data } = await client.get("/scores", { params: productId ? { product_id: productId } : {} });
    return data as ProductAttractivenessScore[];
  },
};

export const sessionsApi = {
  async list(storeId: number) {
    const { data } = await client.get("/sessions", { params: { store_id: storeId } });
    return data;
  },
  async computeSegments(storeId: number) {
    const { data } = await client.post("/sessions/segment/compute", null, {
      params: { store_id: storeId },
    });
    return data;
  },
};
