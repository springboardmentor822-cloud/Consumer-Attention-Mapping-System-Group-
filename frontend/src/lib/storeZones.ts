// Single source of truth for store zone layout, shared between HeatmapTab /
// OverviewTab (draw these rectangles), StoreLayoutTab (blueprint editor),
// JourneyTab (floor-plan flow view), CamerasTab (maps each camera's
// detections into a point inside its assigned zone), and backend main.py's
// /dashboard/heatmap (mirrors these same coordinates server-side — keep
// both in sync if you edit this file).
// Coordinates are normalized 0..1.
//
// LAYOUT: 4 cameras are clustered together near the center of the floor.
// The 6 product shelves ring around that camera cluster (each camera
// covers the nearby shelves, not just its own tile). Entrance sits on the
// right wall, checkout sits bottom-left — matching the physical floor
// plan the store actually has.

export interface StoreZone {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const STORE_ZONES = {
  // Entrance — right wall
  entrance: { label: 'Entrance', x: 0.88, y: 0.38, w: 0.08, h: 0.16 },

  // Checkout — bottom-left, no camera coverage
  checkout: { label: 'Checkout', x: 0.06, y: 0.76, w: 0.16, h: 0.14 },

  // 4 cameras, clustered center — each covered by one real camera feed
  camera1: { label: 'Camera 1', x: 0.40, y: 0.34, w: 0.07, h: 0.08 },
  camera2: { label: 'Camera 2', x: 0.49, y: 0.34, w: 0.07, h: 0.08 },
  camera3: { label: 'Camera 3', x: 0.40, y: 0.44, w: 0.07, h: 0.08 },
  camera4: { label: 'Camera 4', x: 0.49, y: 0.44, w: 0.07, h: 0.08 },

  // 6 shelves ringed around the camera cluster, for product placement.
  // StoreLayoutTab fills these with the dataset's real product-line
  // categories (currently 6 in the supermarket_sales dataset).
  shelf1: { label: 'Shelf 1', x: 0.20, y: 0.16, w: 0.16, h: 0.14 }, // top-left
  shelf2: { label: 'Shelf 2', x: 0.39, y: 0.08, w: 0.16, h: 0.14 }, // top-center
  shelf3: { label: 'Shelf 3', x: 0.58, y: 0.16, w: 0.16, h: 0.14 }, // top-right
  shelf4: { label: 'Shelf 4', x: 0.20, y: 0.56, w: 0.16, h: 0.14 }, // bottom-left
  shelf5: { label: 'Shelf 5', x: 0.39, y: 0.64, w: 0.16, h: 0.14 }, // bottom-center
  shelf6: { label: 'Shelf 6', x: 0.58, y: 0.56, w: 0.16, h: 0.14 }, // bottom-right
} as const satisfies Record<string, StoreZone>;

export type StoreZoneKey = keyof typeof STORE_ZONES;

// Which store zone each physical camera feed is pointed at — the four
// center-cluster tiles. Shelf zones, entrance, and checkout have no direct
// camera-mounted-here zone (though the cameras' fields of view cover the
// surrounding shelves — see CamerasTab for detection-to-zone mapping).
export const CAMERA_ZONE_MAP: Record<number, StoreZoneKey> = {
  1: 'camera1',
  2: 'camera2',
  3: 'camera3',
  4: 'camera4',
};

// Zones with real camera coverage — used by HeatmapTab/OverviewTab/
// StoreLayoutTab to visually distinguish "real live tracking" zones from
// "sales-data-only" zones (shelves + entrance + checkout).
export const CAMERA_COVERED_ZONES: Set<StoreZoneKey> = new Set(
  Object.values(CAMERA_ZONE_MAP)
);

// Shelf zone keys, in display order — shared by StoreLayoutTab and
// JourneyTab so both fill/position the same 6 slots the same way.
export const SHELF_ZONE_KEYS: StoreZoneKey[] = [
  'shelf1', 'shelf2', 'shelf3', 'shelf4', 'shelf5', 'shelf6',
];
