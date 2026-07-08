export interface Shelf {
  id: string;
  store_id: string;
  shelf_name: string;
  zone_coordinates: Record<string, unknown>;
  created_at: string;
}

export interface ShelfPayload {
  shelf_name: string;
  zone_coordinates: Record<string, unknown>;
}
