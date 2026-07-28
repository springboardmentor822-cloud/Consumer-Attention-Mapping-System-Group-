export interface Zone {
  id: string;
  store_id: string;
  zone_name: string;
  coordinates: Record<string, unknown>;
  created_at: string;
}

export interface ZonePayload {
  zone_name: string;
  coordinates?: Record<string, unknown>;
}
