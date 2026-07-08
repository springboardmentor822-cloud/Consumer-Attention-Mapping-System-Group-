export interface Store {
  id: string;
  store_name: string;
  location: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface StorePayload {
  store_name: string;
  location: string;
  metadata: Record<string, unknown>;
}
