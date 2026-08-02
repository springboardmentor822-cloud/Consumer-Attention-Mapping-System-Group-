const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type Store = {
  id: string;
  name: string;
  location: string | null;
  store_metadata: Record<string, unknown> | null;
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
};

export { ApiError };
