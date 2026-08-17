/**
 * ════════════════════════════════════════════════════════════════════════
 * CAMS CENTRALIZED DATA STORE
 * ════════════════════════════════════════════════════════════════════════
 *
 * Architecture: One Central Database → One Analytics Engine → Multiple
 * Role-Based Portals.
 *
 * This module is the **single source of truth** for the entire CAMS
 * platform.  Every portal (Admin, Store Manager, Retail Analyst,
 * Marketing Manager) reads from these same datasets.  No portal has
 * its own independent data — they each present a role-specific *view*
 * of the same underlying enterprise data.
 *
 * Data domains:
 *   1. Store & Infrastructure  (stores, cameras, shelves)
 *   2. Customers & Traffic     (visitors, traffic, movement paths)
 *   3. Zones & Dwell           (zone metrics, dwell times)
 *   4. Products & Categories   (product + category performance)
 *   5. Attention & Gaze        (attention scores, heatmaps)
 *   6. Customer Segments       (RFM, behavioral cohorts)
 *   7. Campaigns & Promotions  (marketing campaigns, promotions)
 *   8. AI Insights             (predictive insights, recommendations)
 *   9. Alerts & Notifications  (system + business alerts)
 *  10. Reports & Exports       (report history, scheduled exports)
 *  11. Time-Series Analytics   (trends, sparklines, hourly data)
 *
 * When the backend is connected, each section below will be replaced
 * with API calls.  For now the store uses realistic mock data that
 * mirrors the production schema.
 * ════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════
// 1. STORES & INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════
function loadLocalStorageData(key, initialData) {
  if (typeof window === "undefined") return initialData;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  } catch (e) {
    return initialData;
  }
}

export const stores = [];
export const cameras = [];
export const shelves = [];
export const zones = [];
export const products = [];
export const promotions = [];

export function syncModuleArrays() {
  const loadedStores = loadLocalStorageData("cams_stores_v2", [
    { id: "STR-101", name: "Downtown Flagship", address: "123 Main St, New York", manager: "Jane Smith", cameras: 32, shelves: 148, zones: 12, status: "Active", openSince: "2021-03-15", sqft: 28000 },
    { id: "STR-102", name: "Westside Mall", address: "456 West Blvd, Los Angeles", manager: "Alex Rivera", cameras: 24, shelves: 112, zones: 9, status: "Active", openSince: "2022-01-20", sqft: 22000 },
    { id: "STR-103", name: "Metro Center", address: "789 Central Ave, Chicago", manager: "Sam Chen", cameras: 18, shelves: 86, zones: 7, status: "Maintenance", openSince: "2023-06-10", sqft: 16000 },
  ]);
  const loadedCameras = loadLocalStorageData("cams_cameras_v2", [
    { id: "CAM-01", storeId: "STR-101", location: "Main Entrance", name: "Entrance Wide Angle", status: "Online", fps: 30, resolution: "1080p", zone: "Produce", model: "Axis P3255-LVE", lastCalibrated: "2026-07-28", coordsX: 4.0, coordsY: 4.0 },
    { id: "CAM-02", storeId: "STR-101", location: "Bakery Endcap", name: "Bakery Endcap Camera", status: "Online", fps: 30, resolution: "4K", zone: "Bakery", model: "Hikvision DS-2CD2386G2", lastCalibrated: "2026-07-25", coordsX: 12.0, coordsY: 8.0 },
    { id: "CAM-03", storeId: "STR-101", location: "Cosmetics Wall", name: "Cosmetics Wall Camera", status: "Online", fps: 28, resolution: "1080p", zone: "Cosmetics", model: "Axis P3255-LVE", lastCalibrated: "2026-07-30", coordsX: 32.0, coordsY: 14.0 },
    { id: "CAM-04", storeId: "STR-101", location: "Checkout Line", name: "Checkout Line Camera", status: "Online", fps: 30, resolution: "1080p", zone: "Checkout", model: "Dahua IPC-HFW2831T", lastCalibrated: "2026-07-20", coordsX: 40.0, coordsY: 30.0 },
    { id: "CAM-05", storeId: "STR-101", location: "Dairy Section", name: "Dairy Section Camera", status: "Online", fps: 30, resolution: "4K", zone: "Dairy", model: "Hikvision DS-2CD2386G2", lastCalibrated: "2026-07-29", coordsX: 8.0, coordsY: 22.0 },
    { id: "CAM-06", storeId: "STR-101", location: "Electronics Corner", name: "Electronics Corner Camera", status: "Online", fps: 25, resolution: "1080p", zone: "Electronics", model: "Axis M3106-LV", lastCalibrated: "2026-07-22", coordsX: 22.0, coordsY: 18.0 },
  ]);
  const loadedShelves = loadLocalStorageData("cams_shelves_v2", [
    { id: "SH-101", name: "Shelf A1 - Bread & Pastry", store: "STR-101", storeId: "STR-101", zone: "Bakery", category: "Bakery", coordsX: 14.0, coordsY: 5.2, width: 2.0, height: 1.6, capacity: 80, attachedCamera: "CAM-02", status: "Active", attentionScore: 86, occupancyRate: 84 },
    { id: "SH-102", name: "Shelf B2 - Dairy & Eggs", store: "STR-101", storeId: "STR-101", zone: "Dairy", category: "Dairy", coordsX: 8.5, coordsY: 18.3, width: 3.2, height: 2.0, capacity: 150, attachedCamera: "CAM-05", status: "Active", attentionScore: 89, occupancyRate: 95 },
    { id: "SH-103", name: "Shelf C1 - Fresh Produce", store: "STR-101", storeId: "STR-101", zone: "Produce", category: "Produce", coordsX: 22.4, coordsY: 12.1, width: 1.8, height: 1.5, capacity: 100, attachedCamera: "CAM-01", status: "Active", attentionScore: 82, occupancyRate: 88 },
    { id: "SH-104", name: "Shelf D4 - Cosmetics Wall", store: "STR-101", storeId: "STR-101", zone: "Cosmetics", category: "Cosmetics", coordsX: 30.1, coordsY: 15.6, width: 2.8, height: 1.8, capacity: 200, attachedCamera: "CAM-03", status: "Active", attentionScore: 91, occupancyRate: 90 },
    { id: "SH-105", name: "Shelf E1 - Electronics Display", store: "STR-101", storeId: "STR-101", zone: "Electronics", category: "Electronics", coordsX: 16.2, coordsY: 8.7, width: 2.4, height: 1.8, capacity: 120, attachedCamera: "CAM-06", status: "Active", attentionScore: 94, occupancyRate: 92 },
    { id: "SH-106", name: "Shelf F1 - Household Cleaner", store: "STR-101", storeId: "STR-101", zone: "Household", category: "Household", coordsX: 34.5, coordsY: 20.2, width: 3.0, height: 2.2, capacity: 180, attachedCamera: "CAM-06", status: "Active", attentionScore: 74, occupancyRate: 78 }
  ]);
  const loadedZones = loadLocalStorageData("cams_zones_v2", [
    { id: "ZN-01", name: "Bakery", store: "STR-101", status: "Active" },
    { id: "ZN-02", name: "Dairy", store: "STR-101", status: "Active" },
    { id: "ZN-03", name: "Produce", store: "STR-101", status: "Active" },
    { id: "ZN-04", name: "Cosmetics", store: "STR-101", status: "Active" },
    { id: "ZN-05", name: "Electronics", store: "STR-101", status: "Active" },
    { id: "ZN-06", name: "Household", store: "STR-101", status: "Active" },
    { id: "ZN-07", name: "Frozen Foods", store: "STR-101", status: "Active" },
    { id: "ZN-08", name: "Checkout", store: "STR-101", status: "Active" },
  ]);
  const loadedProducts = loadLocalStorageData("cams_products_v2", [
    { id: "P-001", name: "Artisan Sourdough Bread", sku: "SKU-1001", category: "Bakery", sellingPrice: 7.50, price: 7.50, costPrice: 5.00, cost: 5.00, profit: 2.50, stockQty: 45, shelf: "SH-104", store: "STR-101", promo: "Summer Sale Spectacular", status: "Active", subcategory: "Bread", brand: "Bakers Pride", views: 3420, pickups: 2180, purchases: 1640, convRate: 47.9, revenue: 12300, attentionScore: 96, avgDwell: 4.8 },
    { id: "P-002", name: "Organic Almond Milk", sku: "SKU-1002", category: "Dairy", sellingPrice: 7.00, price: 7.00, costPrice: 4.50, cost: 4.50, profit: 2.50, stockQty: 60, shelf: "SH-103", store: "STR-101", promo: "Weekend Bonanza", status: "Active", subcategory: "Milk", brand: "BioNature", views: 2810, pickups: 1720, purchases: 1280, convRate: 45.6, revenue: 8960, attentionScore: 91, avgDwell: 3.2 },
    { id: "P-003", name: "Premium Greek Yogurt", sku: "SKU-1003", category: "Dairy", sellingPrice: 7.00, price: 7.00, costPrice: 4.00, cost: 4.00, profit: 3.00, stockQty: 80, shelf: "SH-103", store: "STR-101", promo: "None", status: "Active", subcategory: "Yogurt", brand: "Chobani", views: 2540, pickups: 1580, purchases: 1120, convRate: 44.1, revenue: 7840, attentionScore: 89, avgDwell: 2.8 },
    { id: "P-004", name: "Free-Range Eggs (12pk)", sku: "SKU-1004", category: "Dairy", sellingPrice: 7.00, price: 7.00, costPrice: 3.80, cost: 3.80, profit: 3.20, stockQty: 50, shelf: "SH-103", store: "STR-101", promo: "None", status: "Active", subcategory: "Eggs", brand: "Eggland", views: 2280, pickups: 1640, purchases: 1380, convRate: 60.5, revenue: 9660, attentionScore: 87, avgDwell: 1.4 },
    { id: "P-005", name: "Avocado (Hass, 4-pack)", sku: "SKU-1005", category: "Produce", sellingPrice: 8.00, price: 8.00, costPrice: 5.20, cost: 5.20, profit: 2.80, stockQty: 30, shelf: "SH-102", store: "STR-101", promo: "None", status: "Active", subcategory: "Fruits", brand: "FreshGrow", views: 2120, pickups: 1320, purchases: 940, convRate: 44.3, revenue: 7520, attentionScore: 85, avgDwell: 2.2 },
    { id: "P-006", name: "Luxury Face Serum", sku: "SKU-1006", category: "Cosmetics", sellingPrice: 35.00, price: 35.00, costPrice: 20.00, cost: 20.00, profit: 15.00, stockQty: 15, shelf: "SH-201", store: "STR-101", promo: "None", status: "Active", subcategory: "Skincare", brand: "Estee", views: 1980, pickups: 1420, purchases: 680, convRate: 34.3, revenue: 23800, attentionScore: 92, avgDwell: 5.8 },
    { id: "P-007", name: "Wireless Earbuds Pro", sku: "SKU-1007", category: "Electronics", sellingPrice: 80.00, price: 80.00, costPrice: 55.00, cost: 55.00, profit: 25.00, stockQty: 25, shelf: "SH-301", store: "STR-101", promo: "New Arrival Launch", status: "Active", subcategory: "Audio", brand: "Sony", views: 1860, pickups: 1080, purchases: 420, convRate: 22.6, revenue: 33600, attentionScore: 88, avgDwell: 6.4 },
    { id: "P-008", name: "Multi-Surface Cleaner", sku: "SKU-1008", category: "Household", sellingPrice: 8.00, price: 8.00, costPrice: 5.00, cost: 5.00, profit: 3.00, stockQty: 75, shelf: "SH-302", store: "STR-101", promo: "None", status: "Active", subcategory: "Cleaner", brand: "Clorox", views: 940, pickups: 420, purchases: 340, convRate: 36.2, revenue: 2720, attentionScore: 58, avgDwell: 1.2 },
    { id: "P-009", name: "Organic Granola Mix", sku: "SKU-1009", category: "Bakery", sellingPrice: 8.00, price: 8.00, costPrice: 5.50, cost: 5.50, profit: 2.50, stockQty: 40, shelf: "SH-104", store: "STR-101", promo: "None", status: "Active", subcategory: "Cereal", brand: "BioNature", views: 1640, pickups: 980, purchases: 720, convRate: 43.9, revenue: 5760, attentionScore: 82, avgDwell: 3.1 },
    { id: "P-010", name: "Fresh Salmon Fillet", sku: "SKU-1010", category: "Produce", sellingPrice: 20.00, price: 20.00, costPrice: 13.00, cost: 13.00, profit: 7.00, stockQty: 25, shelf: "SH-102", store: "STR-101", promo: "None", status: "Active", subcategory: "Fish", brand: "OceanCatch", views: 1420, pickups: 890, purchases: 640, convRate: 45.1, revenue: 12800, attentionScore: 84, avgDwell: 3.8 }
  ]);
  const loadedPromos = loadLocalStorageData("cams_promotions_v2", [
    { id: "PRM-001", name: "Summer Sale Spectacular", zone: "Bakery", category: "Bakery", type: "Discount", value: "20% Off", lift: "+28%", revenue: 15000, status: "Active", startDate: "2026-08-01", endDate: "2026-08-31", products: ["P-001"] },
    { id: "PRM-002", name: "Weekend Bonanza", zone: "Dairy", category: "Dairy", type: "Bundle", value: "Buy 2 Get 1", lift: "+15%", revenue: 9800, status: "Active", startDate: "2026-08-05", endDate: "2026-08-28", products: ["P-002"] },
    { id: "PRM-003", name: "New Arrival Launch", zone: "Electronics", category: "Electronics", type: "Display", value: "Demo Highlight", lift: "+35%", revenue: 45000, status: "Active", startDate: "2026-08-10", endDate: "2026-08-25", products: ["P-007"] }
  ]);

  // Update in place
  stores.length = 0; stores.push(...loadedStores);
  cameras.length = 0; cameras.push(...loadedCameras);
  shelves.length = 0; shelves.push(...loadedShelves);
  zones.length = 0; zones.push(...loadedZones);
  products.length = 0; products.push(...loadedProducts);
  promotions.length = 0; promotions.push(...loadedPromos);
}

// Initial invocation
if (typeof window !== "undefined") {
  syncModuleArrays();
}

// ═══════════════════════════════════════════════════════════════════════
// 2. CUSTOMERS & TRAFFIC  (used by ALL portals)
// ═══════════════════════════════════════════════════════════════════════
export const trafficOverview = {
  totalVisitors: 14270,
  totalVisitorsChange: 12.4,
  avgDwellTime: 18.4,
  avgDwellTimeChange: 8.2,
  conversionRate: 18.2,
  conversionRateChange: 5.1,
  avgAttentionTime: 5.4,
  avgAttentionTimeChange: 12.6,
  salesRevenue: 108400,
  salesRevenueChange: 22.3,
  avgOrderValue: 42.5,
  avgOrderValueChange: 3.8,
  peakHour: "5:00 PM – 7:00 PM",
  peakHourTraffic: 320,
  busiestDay: "Saturday",
  busiestDayTraffic: 2450,
};

export const dailyTrafficTrend = [
  { day: "Mon", visitors: 7820, newVisitors: 3120, returning: 4700 },
  { day: "Tue", visitors: 8150, newVisitors: 3260, returning: 4890 },
  { day: "Wed", visitors: 8430, newVisitors: 3380, returning: 5050 },
  { day: "Thu", visitors: 8920, newVisitors: 3570, returning: 5350 },
  { day: "Fri", visitors: 9810, newVisitors: 3920, returning: 5890 },
  { day: "Sat", visitors: 10640, newVisitors: 4260, returning: 6380 },
  { day: "Sun", visitors: 8710, newVisitors: 3480, returning: 5230 },
];

export const hourlyTraffic = [
  { hour: "9AM", traffic: 320 }, { hour: "10AM", traffic: 480 }, { hour: "11AM", traffic: 620 },
  { hour: "12PM", traffic: 840 }, { hour: "1PM", traffic: 920 }, { hour: "2PM", traffic: 780 },
  { hour: "3PM", traffic: 860 }, { hour: "4PM", traffic: 1020 }, { hour: "5PM", traffic: 1180 },
  { hour: "6PM", traffic: 1240 }, { hour: "7PM", traffic: 1100 }, { hour: "8PM", traffic: 680 },
  { hour: "9PM", traffic: 340 },
];

export const entryExitPoints = [
  { name: "Main Entrance", entries: 8420, exits: 7980, pct: 58.2 },
  { name: "Side Entrance (Parking)", entries: 3640, exits: 3890, pct: 25.4 },
  { name: "Mall Connector", entries: 2360, exits: 2410, pct: 16.4 },
];

// Customer journey data (funnel)
export const journeyFunnel = [
  { stage: "Store Entry", count: 14270, pct: 100 },
  { stage: "Zone Browsing", count: 12840, pct: 89.9 },
  { stage: "Product Discovery", count: 9620, pct: 67.4 },
  { stage: "Product Interaction", count: 6430, pct: 45.1 },
  { stage: "Cart Addition", count: 3810, pct: 26.7 },
  { stage: "Checkout Complete", count: 2596, pct: 18.2 },
];

export const commonPaths = [
  { path: "Entry → Bakery → Dairy → Checkout", freq: 2840, convRate: 32.4, avgTime: 18.2 },
  { path: "Entry → Produce → Dairy → Aisle 1 → Checkout", freq: 2210, convRate: 28.6, avgTime: 24.1 },
  { path: "Entry → Promo → Electronics → Checkout", freq: 1680, convRate: 18.4, avgTime: 15.6 },
  { path: "Entry → Bakery → Produce → Dairy → Frozen → Checkout", freq: 1420, convRate: 42.1, avgTime: 32.8 },
  { path: "Entry → Cosmetics → Household → Checkout", freq: 980, convRate: 14.2, avgTime: 12.4 },
];

export const zoneTransitions = [
  { from: "Entry", to: "Produce", count: 4820, pct: 33.8 },
  { from: "Entry", to: "Bakery", count: 3960, pct: 27.8 },
  { from: "Entry", to: "Promo Zone", count: 2850, pct: 20.0 },
  { from: "Produce", to: "Dairy", count: 3210, pct: 66.6 },
  { from: "Bakery", to: "Dairy", count: 2680, pct: 67.7 },
  { from: "Dairy", to: "Aisle 1", count: 2940, pct: 49.9 },
  { from: "Aisle 1", to: "Checkout", count: 1820, pct: 61.9 },
  { from: "Promo Zone", to: "Electronics", count: 1420, pct: 49.8 },
];

export const dropoffPoints = [
  { zone: "After Entry (no browse)", pct: 10.1, count: 1440, severity: "high" },
  { zone: "Product Discovery → Interaction", pct: 22.3, count: 3190, severity: "critical" },
  { zone: "Cart Addition → Checkout", pct: 31.9, count: 1214, severity: "high" },
  { zone: "Aisle 3 → Aisle 4 transition", pct: 8.4, count: 620, severity: "medium" },
  { zone: "Electronics → Checkout", pct: 12.8, count: 540, severity: "medium" },
];

// ═══════════════════════════════════════════════════════════════════════
// 3. ZONES & DWELL TIME
// ═══════════════════════════════════════════════════════════════════════
// Zones array is initialized and updated dynamically in-place from localStorage

export const dwellDistribution = [
  { range: "0-2 min", visitors: 1820 },
  { range: "2-5 min", visitors: 3540 },
  { range: "5-10 min", visitors: 4210 },
  { range: "10-20 min", visitors: 3180 },
  { range: "20-30 min", visitors: 1420 },
  { range: "30+ min", visitors: 620 },
];

export const dwellTrend = [
  { day: "Mon", avgDwell: 15.1, bakery: 20.2, dairy: 16.4, cosmetics: 18.8, electronics: 24.1 },
  { day: "Tue", avgDwell: 16.3, bakery: 21.4, dairy: 17.1, cosmetics: 19.4, electronics: 25.2 },
  { day: "Wed", avgDwell: 17.0, bakery: 22.1, dairy: 17.8, cosmetics: 20.1, electronics: 26.4 },
  { day: "Thu", avgDwell: 18.2, bakery: 23.4, dairy: 18.2, cosmetics: 21.2, electronics: 27.1 },
  { day: "Fri", avgDwell: 17.4, bakery: 22.8, dairy: 17.6, cosmetics: 20.6, electronics: 26.8 },
  { day: "Sat", avgDwell: 19.1, bakery: 25.2, dairy: 19.4, cosmetics: 22.8, electronics: 29.4 },
  { day: "Sun", avgDwell: 18.4, bakery: 24.2, dairy: 18.6, cosmetics: 22.1, electronics: 28.4 },
];

// Store heatmap (4x4 grid representing store zones)
export const storeHeatmap = [
  { name: "Entry", heat: 95 }, { name: "Promo", heat: 88 }, { name: "Bakery", heat: 92 }, { name: "Deli", heat: 72 },
  { name: "Aisle 1", heat: 65 }, { name: "Aisle 2", heat: 78 }, { name: "Aisle 3", heat: 58 }, { name: "Aisle 4", heat: 84 },
  { name: "Dairy", heat: 82 }, { name: "Frozen", heat: 48 }, { name: "Produce", heat: 76 }, { name: "Cosmetics", heat: 70 },
  { name: "Electronics", heat: 55 }, { name: "Household", heat: 35 }, { name: "Checkout", heat: 90 }, { name: "Exit", heat: 88 },
];

// Traffic flow bottlenecks
export const bottlenecks = [
  { zone: "Central Aisle 4", density: 92, avgWait: "2.4 min", status: "Critical" },
  { zone: "Checkout Queue", density: 88, avgWait: "4.2 min", status: "High" },
  { zone: "Bakery Counter", density: 76, avgWait: "1.8 min", status: "Medium" },
  { zone: "Produce Section", density: 64, avgWait: "0.8 min", status: "Normal" },
];

// ═══════════════════════════════════════════════════════════════════════
// 4. PRODUCTS & CATEGORIES
// ═══════════════════════════════════════════════════════════════════════
// Products array is initialized and updated dynamically in-place from localStorage

export const categories = [
  { name: "Bread & Pastry", products: 24, totalViews: 8420, totalPickups: 5240, totalPurchases: 3820, convRate: 45.4, revenue: 28680, attentionScore: 92, avgDwell: 4.2, engagement: 88, trend: 12.4 },
  { name: "Dairy & Eggs", products: 36, totalViews: 12840, totalPickups: 8120, totalPurchases: 6480, convRate: 50.5, revenue: 38420, attentionScore: 88, avgDwell: 3.1, engagement: 82, trend: 8.2 },
  { name: "Fresh Produce", products: 42, totalViews: 9620, totalPickups: 5840, totalPurchases: 4120, convRate: 42.8, revenue: 24800, attentionScore: 82, avgDwell: 2.6, engagement: 76, trend: 5.4 },
  { name: "Beauty & Personal Care", products: 58, totalViews: 7840, totalPickups: 5640, totalPurchases: 2680, convRate: 34.2, revenue: 52400, attentionScore: 91, avgDwell: 5.4, engagement: 92, trend: 18.6 },
  { name: "Electronics", products: 32, totalViews: 6240, totalPickups: 3620, totalPurchases: 1420, convRate: 22.8, revenue: 68400, attentionScore: 86, avgDwell: 6.2, engagement: 78, trend: -2.4 },
  { name: "Household", products: 28, totalViews: 3840, totalPickups: 1720, totalPurchases: 1380, convRate: 35.9, revenue: 8280, attentionScore: 62, avgDwell: 1.4, engagement: 48, trend: -4.8 },
  { name: "Frozen Foods", products: 34, totalViews: 5420, totalPickups: 3240, totalPurchases: 2680, convRate: 49.4, revenue: 16080, attentionScore: 72, avgDwell: 2.1, engagement: 64, trend: 3.2 },
  { name: "Snacks & Beverages", products: 46, totalViews: 8240, totalPickups: 4820, totalPurchases: 3420, convRate: 41.5, revenue: 20520, attentionScore: 78, avgDwell: 1.8, engagement: 72, trend: 6.8 },
];

// ═══════════════════════════════════════════════════════════════════════
// 5. ATTENTION & GAZE ANALYTICS
// ═══════════════════════════════════════════════════════════════════════
export const attentionOverview = {
  avgAttentionTime: 5.4,
  avgAttentionTimeChange: 12.6,
  gazeDirectionScore: 92,
  fixationCount: 34120,
  fixationCountChange: 15.2,
  attentionHotspots: 8,
  lowAttentionZones: 3,
  attentionChangePercent: 8.4,
};

export const attentionTrend = [
  { day: "Mon", attention: 4.2, dwell: 15.1, conversion: 14.2 },
  { day: "Tue", attention: 4.5, dwell: 16.3, conversion: 15.1 },
  { day: "Wed", attention: 4.8, dwell: 17.0, conversion: 15.5 },
  { day: "Thu", attention: 5.0, dwell: 18.2, conversion: 16.0 },
  { day: "Fri", attention: 5.3, dwell: 17.4, conversion: 17.2 },
  { day: "Sat", attention: 5.1, dwell: 19.1, conversion: 17.5 },
  { day: "Sun", attention: 5.4, dwell: 18.4, conversion: 18.2 },
];

export const attentionByZone = [
  { zone: "Bakery Endcap A1", score: 96, avgGaze: 5.8, trend: 4.2 },
  { zone: "Cosmetics Wall D4", score: 94, avgGaze: 6.2, trend: 8.4 },
  { zone: "Promo Display", score: 92, avgGaze: 4.4, trend: -2.1 },
  { zone: "Dairy Section B2", score: 88, avgGaze: 3.6, trend: 3.8 },
  { zone: "Electronics E1", score: 86, avgGaze: 6.8, trend: 1.2 },
  { zone: "Produce C1", score: 82, avgGaze: 2.4, trend: -1.4 },
  { zone: "Frozen Foods", score: 72, avgGaze: 1.8, trend: -3.2 },
  { zone: "Household F1", score: 58, avgGaze: 1.2, trend: -6.8 },
];

export const gazeDirectionData = [
  { direction: "Eye Level (120-160cm)", dir: "Eye Level", pct: 42, score: 96, color: "#8B5CF6" },
  { direction: "Above Eye Level", dir: "Above Eye", pct: 18, score: 72, color: "#3B82F6" },
  { direction: "Below Eye Level", dir: "Below Eye", pct: 14, score: 64, color: "#10B981" },
  { direction: "Left Peripheral", dir: "Left Peripheral", pct: 12, score: 58, color: "#F59E0B" },
  { direction: "Right Peripheral", dir: "Right Peripheral", pct: 14, score: 62, color: "#EC4899" },
];

// Attention heatmap (same grid as store heatmap but attention-focused)
export const attentionHeatmap = [
  { name: "Entry Display", attention: 88 }, { name: "Promo Endcap", attention: 92 }, { name: "Bakery Shelf", attention: 96 }, { name: "Deli Counter", attention: 78 },
  { name: "Aisle 1 Eye-Level", attention: 72 }, { name: "Aisle 2 Eye-Level", attention: 82 }, { name: "Aisle 3 Eye-Level", attention: 64 }, { name: "Aisle 4 Eye-Level", attention: 86 },
  { name: "Dairy Cooler", attention: 84 }, { name: "Frozen Door", attention: 52 }, { name: "Produce Stand", attention: 78 }, { name: "Cosmetics Display", attention: 94 },
  { name: "Electronics Demo", attention: 82 }, { name: "Household Shelf", attention: 38 }, { name: "Checkout Impulse", attention: 74 }, { name: "Exit Signage", attention: 46 },
];

// ═══════════════════════════════════════════════════════════════════════
// 6. CUSTOMER SEGMENTS
// ═══════════════════════════════════════════════════════════════════════
export const customerSegments = [
  { name: "Loyal Champions", count: 4820, pct: 22, avgSpend: 68.40, frequency: 4.2, recency: 2, convRate: 34.2, revenue: 329688, color: "#10B981", retention: 92 },
  { name: "Potential Loyalists", count: 5640, pct: 26, avgSpend: 52.10, frequency: 2.8, recency: 5, convRate: 28.4, revenue: 293844, color: "#3B82F6", retention: 78 },
  { name: "At-Risk Customers", count: 3200, pct: 15, avgSpend: 42.80, frequency: 1.4, recency: 18, convRate: 18.2, revenue: 136960, color: "#F59E0B", retention: 45 },
  { name: "New Customers", count: 4100, pct: 19, avgSpend: 38.20, frequency: 1.2, recency: 3, convRate: 22.6, revenue: 156620, color: "#8B5CF6", retention: 62 },
  { name: "Hibernating", count: 2480, pct: 11, avgSpend: 28.60, frequency: 0.6, recency: 42, convRate: 8.4, revenue: 70928, color: "#EF4444", retention: 18 },
  { name: "Price Sensitive", count: 1560, pct: 7, avgSpend: 24.20, frequency: 3.1, recency: 4, convRate: 42.8, revenue: 37752, color: "#F97316", retention: 72 },
];

export const rfmDistribution = [
  { recency: 2, frequency: 4.2, monetary: 68.4, segment: "Loyal Champions", size: 4820, color: "#10B981" },
  { recency: 5, frequency: 2.8, monetary: 52.1, segment: "Potential Loyalists", size: 5640, color: "#3B82F6" },
  { recency: 18, frequency: 1.4, monetary: 42.8, segment: "At-Risk", size: 3200, color: "#F59E0B" },
  { recency: 3, frequency: 1.2, monetary: 38.2, segment: "New Customers", size: 4100, color: "#8B5CF6" },
  { recency: 42, frequency: 0.6, monetary: 28.6, segment: "Hibernating", size: 2480, color: "#EF4444" },
  { recency: 4, frequency: 3.1, monetary: 24.2, segment: "Price Sensitive", size: 1560, color: "#F97316" },
];

// ═══════════════════════════════════════════════════════════════════════
// 7. SHOPPING BEHAVIOUR
// ═══════════════════════════════════════════════════════════════════════
export const shoppingBehavior = [
  { action: "Browse Only", count: 4820, pct: 33.8 },
  { action: "Product Pickup", count: 3560, pct: 24.9 },
  { action: "Compare & Return", count: 2140, pct: 15.0 },
  { action: "Add to Cart", count: 2380, pct: 16.7 },
  { action: "Purchase", count: 1370, pct: 9.6 },
];

export const behaviorTrend = [
  { day: "Mon", interactions: 8420, pickups: 3280, purchases: 1240, returns: 820 },
  { day: "Tue", interactions: 9140, pickups: 3560, purchases: 1380, returns: 780 },
  { day: "Wed", interactions: 9680, pickups: 3820, purchases: 1520, returns: 840 },
  { day: "Thu", interactions: 10420, pickups: 4120, purchases: 1680, returns: 920 },
  { day: "Fri", interactions: 11840, pickups: 4680, purchases: 1920, returns: 1040 },
  { day: "Sat", interactions: 13620, pickups: 5420, purchases: 2280, returns: 1180 },
  { day: "Sun", interactions: 11280, pickups: 4480, purchases: 1840, returns: 980 },
];

// Hourly activity heatmap (hour x day-of-week)
export const hourlyActivityHeatmap = [
  { hour: "9AM", Mon: 28, Tue: 32, Wed: 30, Thu: 34, Fri: 38, Sat: 52, Sun: 42 },
  { hour: "10AM", Mon: 42, Tue: 45, Wed: 48, Thu: 46, Fri: 52, Sat: 68, Sun: 58 },
  { hour: "11AM", Mon: 56, Tue: 58, Wed: 62, Thu: 60, Fri: 68, Sat: 82, Sun: 72 },
  { hour: "12PM", Mon: 72, Tue: 74, Wed: 78, Thu: 76, Fri: 82, Sat: 92, Sun: 84 },
  { hour: "1PM", Mon: 78, Tue: 80, Wed: 82, Thu: 84, Fri: 88, Sat: 96, Sun: 86 },
  { hour: "2PM", Mon: 68, Tue: 72, Wed: 74, Thu: 72, Fri: 78, Sat: 88, Sun: 80 },
  { hour: "3PM", Mon: 62, Tue: 66, Wed: 68, Thu: 70, Fri: 76, Sat: 86, Sun: 78 },
  { hour: "4PM", Mon: 74, Tue: 78, Wed: 80, Thu: 82, Fri: 86, Sat: 94, Sun: 84 },
  { hour: "5PM", Mon: 86, Tue: 88, Wed: 92, Thu: 94, Fri: 96, Sat: 98, Sun: 88 },
  { hour: "6PM", Mon: 92, Tue: 94, Wed: 96, Thu: 98, Fri: 98, Sat: 100, Sun: 92 },
  { hour: "7PM", Mon: 82, Tue: 84, Wed: 86, Thu: 88, Fri: 92, Sat: 96, Sun: 86 },
  { hour: "8PM", Mon: 52, Tue: 54, Wed: 56, Thu: 58, Fri: 64, Sat: 72, Sun: 62 },
  { hour: "9PM", Mon: 28, Tue: 30, Wed: 32, Thu: 34, Fri: 42, Sat: 48, Sun: 38 },
];

// ═══════════════════════════════════════════════════════════════════════
// 8. CAMPAIGNS & PROMOTIONS (Marketing Manager primary, shared)
// ═══════════════════════════════════════════════════════════════════════
export const campaigns = [
  { id: 1, name: "Summer Sale Spectacular", type: "Seasonal", status: "Active", impressions: 820000, engagement: 34.5, conversion: 16.2, revenue: 32500, roi: 4.2, startDate: "2026-07-15", endDate: "2026-08-15", budget: 8000 },
  { id: 2, name: "New Arrival Launch", type: "Product Launch", status: "Active", impressions: 610000, engagement: 33.1, conversion: 14.8, revenue: 21800, roi: 3.8, startDate: "2026-07-20", endDate: "2026-08-10", budget: 6000 },
  { id: 3, name: "Weekend Bonanza", type: "Recurring", status: "Active", impressions: 540000, engagement: 28.9, conversion: 12.7, revenue: 17200, roi: 3.2, startDate: "2026-08-01", endDate: "2026-08-31", budget: 5500 },
  { id: 4, name: "Festive Offer", type: "Seasonal", status: "Scheduled", impressions: 310000, engagement: 26.7, conversion: 11.3, revenue: 11200, roi: 2.6, startDate: "2026-08-10", endDate: "2026-08-25", budget: 4500 },
  { id: 5, name: "Clearance Sale", type: "Clearance", status: "Completed", impressions: 170000, engagement: 19.3, conversion: 8.6, revenue: 6500, roi: 2.1, startDate: "2026-06-01", endDate: "2026-06-30", budget: 3200 },
];

// ═══════════════════════════════════════════════════════════════════════
// 9. AI INSIGHTS & RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════
export const aiInsights = [
  { id: 1, title: "Relocate Organic Dairy endcap closer to Bakery zone", desc: "Cross-category dwell analysis shows 38% of bakery visitors also seek dairy. Moving endcap 2m closer increases dual-pickup conversion by +18.4%.", confidence: 98, impact: 14200, category: "Layout", priority: "High", status: "New" },
  { id: 2, title: "Extend evening lighting in Cosmetics zone (6-9 PM)", desc: "Attention scores drop 22% after 6 PM despite high traffic. Enhanced lighting correlates with +31% engagement in similar stores.", confidence: 94, impact: 8600, category: "Engagement", priority: "High", status: "New" },
  { id: 3, title: "Add promotional signage at Aisle 4 bottleneck", desc: "Traffic flow analysis identifies Aisle 4 as highest-density corridor. Strategic signage placement yields estimated +12% impulse purchase lift.", confidence: 91, impact: 6800, category: "Traffic", priority: "Medium", status: "In Progress" },
  { id: 4, title: "Restock Electronics displays during 2-4 PM window", desc: "Product interaction data shows peak pickup at 2 PM but 34% out-of-stock rate on popular items. Restocking improves conversion by +9.2%.", confidence: 88, impact: 5400, category: "Inventory", priority: "Medium", status: "In Progress" },
  { id: 5, title: "Create cross-merchandising display: Bread + Cheese + Wine", desc: "Customer journey data shows 24% of bread buyers also visit dairy and beverages. Co-located display estimated to generate +$4,200/month.", confidence: 86, impact: 4200, category: "Merchandising", priority: "Medium", status: "New" },
  { id: 6, title: "Reduce Household aisle width by 15% to increase product density", desc: "Low traffic and low attention scores suggest customers pass through quickly. Increasing product density may improve visibility scores.", confidence: 78, impact: 2400, category: "Layout", priority: "Low", status: "Under Review" },
];

export const aiPredictions = [
  { metric: "Weekend Traffic", prediction: "+18% increase expected", confidence: 94, timeframe: "Next 48h" },
  { metric: "Bakery Revenue", prediction: "$14.2K projected", confidence: 91, timeframe: "This week" },
  { metric: "Conversion Rate", prediction: "19.4% peak Saturday", confidence: 88, timeframe: "Saturday" },
  { metric: "Electronics Zone", prediction: "High demand detected", confidence: 85, timeframe: "Next 72h" },
];

export const anomalies = [
  { id: 1, type: "Traffic Spike", desc: "Unusual 42% traffic increase in Cosmetics zone at 3 PM", severity: "Warning", time: "2h ago" },
  { id: 2, type: "Attention Drop", desc: "Household zone attention score dropped below threshold (58→42)", severity: "Alert", time: "4h ago" },
  { id: 3, type: "Conversion Anomaly", desc: "Electronics conversion rate 28% above baseline today", severity: "Info", time: "6h ago" },
];

// ═══════════════════════════════════════════════════════════════════════
// 10. ALERTS & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════
export const systemAlerts = [
  { id: 1, type: "Low Stock", msg: "Bakery A1 stock down to 6 units", time: "10m ago", level: "High", zone: "Bakery A1" },
  { id: 2, type: "Camera Offline", msg: "CAM-04 Checkout feed interrupted", time: "25m ago", level: "Critical", zone: "Checkout C2" },
  { id: 3, type: "Crowd Surge", msg: "High density detected in Aisle 4", time: "1h ago", level: "Medium", zone: "Aisle 4" },
  { id: 4, type: "AI Alert", msg: "Conversion drop detected in Household zone", time: "2h ago", level: "High", zone: "Household F1" },
  { id: 5, type: "Maintenance", msg: "CAM-06 scheduled recalibration due", time: "3h ago", level: "Low", zone: "Electronics E1" },
];

// ═══════════════════════════════════════════════════════════════════════
// 11. REPORTS & EXPORTS
// ═══════════════════════════════════════════════════════════════════════
export const reportHistory = [
  { id: 1, name: "Weekly Performance Summary", type: "Executive", format: "PDF", date: "2026-08-03", size: "2.4 MB", status: "Ready" },
  { id: 2, name: "Customer Journey Report", type: "Analytics", format: "Excel", date: "2026-08-02", size: "5.8 MB", status: "Ready" },
  { id: 3, name: "Attention Heatmap Analysis", type: "Operational", format: "PDF", date: "2026-08-01", size: "8.2 MB", status: "Ready" },
  { id: 4, name: "Product Performance Q3", type: "Product", format: "Excel", date: "2026-07-31", size: "4.1 MB", status: "Ready" },
  { id: 5, name: "Zone Revenue Breakdown", type: "Analytics", format: "CSV", date: "2026-07-30", size: "1.2 MB", status: "Ready" },
  { id: 6, name: "AI Insights Monthly Digest", type: "Executive", format: "PDF", date: "2026-07-28", size: "3.6 MB", status: "Ready" },
];

export const scheduledReports = [
  { id: 1, name: "Daily Traffic Summary", frequency: "Daily 8:00 AM", format: "PDF", recipients: 3, lastRun: "2026-08-04", status: "Active" },
  { id: 2, name: "Weekly Performance Report", frequency: "Monday 9:00 AM", format: "Excel", recipients: 5, lastRun: "2026-08-03", status: "Active" },
  { id: 3, name: "Monthly Executive Summary", frequency: "1st of Month", format: "PDF", recipients: 8, lastRun: "2026-08-01", status: "Active" },
  { id: 4, name: "Quarterly Category Review", frequency: "Quarterly", format: "Excel", recipients: 4, lastRun: "2026-07-01", status: "Active" },
];

// ═══════════════════════════════════════════════════════════════════════
// 12. TIME-SERIES / SPARKLINE DATA
// ═══════════════════════════════════════════════════════════════════════
export const sparklines = {
  visitors:   [{ v: 38 },{ v: 41 },{ v: 43 },{ v: 46 },{ v: 52 },{ v: 58 },{ v: 62 }],
  attention:  [{ v: 4.2 },{ v: 4.5 },{ v: 4.8 },{ v: 5.0 },{ v: 5.3 },{ v: 5.1 },{ v: 5.4 }],
  dwell:      [{ v: 15 },{ v: 16 },{ v: 17 },{ v: 18 },{ v: 17 },{ v: 19 },{ v: 18.4 }],
  conversion: [{ v: 14 },{ v: 15 },{ v: 15.5 },{ v: 16 },{ v: 17 },{ v: 17.5 },{ v: 18.2 }],
  revenue:    [{ v: 82 },{ v: 88 },{ v: 91 },{ v: 95 },{ v: 98 },{ v: 102 },{ v: 108 }],
  aov:        [{ v: 38 },{ v: 39 },{ v: 40 },{ v: 41 },{ v: 42 },{ v: 41.5 },{ v: 42.5 }],
};

// ═══════════════════════════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════════════
export const heatColor = (v) => {
  if (v >= 85) return "bg-rose-500/80 text-white";
  if (v >= 70) return "bg-orange-500/70 text-white";
  if (v >= 55) return "bg-amber-500/60 text-white";
  if (v >= 40) return "bg-yellow-500/40 text-slate-100";
  return "bg-emerald-500/30 text-slate-200";
};

export const severityColor = (level) => {
  const map = { Critical: "text-rose-400 bg-rose-500/10 border-rose-500/30", High: "text-amber-400 bg-amber-500/10 border-amber-500/30", Medium: "text-blue-400 bg-blue-500/10 border-blue-500/30", Low: "text-slate-400 bg-slate-500/10 border-slate-500/30", Info: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
  return map[level] || map.Low;
};

export const formatNumber = (n) => n?.toLocaleString?.() ?? n;
export const formatCurrency = (n) => `$${(n / 1000).toFixed(1)}K`;
export const formatPct = (n) => `${n.toFixed(1)}%`;

// ═══════════════════════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH FOR DATE-FILTERED TELEMETRY DATA
// ═══════════════════════════════════════════════════════════════════════
// Base products list for mock data generation
export const MOCK_PRODUCTS = [
  { id: "P-001", name: "Artisan Sourdough Bread", price: 7.50, category: "Bread & Pastry", zone: "Bakery A1" },
  { id: "P-002", name: "Organic Almond Milk", price: 7.00, category: "Dairy & Eggs", zone: "Dairy B2" },
  { id: "P-003", name: "Premium Greek Yogurt", price: 7.00, category: "Dairy & Eggs", zone: "Dairy B2" },
  { id: "P-004", name: "Free-Range Eggs (12pk)", price: 7.00, category: "Dairy & Eggs", zone: "Dairy B2" },
  { id: "P-005", name: "Avocado (Hass, 4-pack)", price: 8.00, category: "Fresh Produce", zone: "Produce C1" },
  { id: "P-006", name: "Luxury Face Serum", price: 35.00, category: "Beauty & Personal Care", zone: "Cosmetics D4" },
  { id: "P-007", name: "Wireless Earbuds Pro", price: 80.00, category: "Electronics", zone: "Electronics E1" },
  { id: "P-008", name: "Multi-Surface Cleaner", price: 8.00, category: "Household", zone: "Household F1" },
  { id: "P-009", name: "Organic Granola Mix", price: 8.00, category: "Bread & Pastry", zone: "Bakery A1" },
  { id: "P-010", name: "Fresh Salmon Fillet", price: 20.00, category: "Fresh Produce", zone: "Deli" },
];

const MOCK_STORES = [
  "Downtown Flagship",
  "Westside Mall",
  "Metro Center"
];

const MOCK_ZONES = [
  "Bakery",
  "Dairy",
  "Produce",
  "Cosmetics",
  "Electronics",
  "Household",
  "Frozen Foods",
  "Checkout"
];

function seededRandom(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDatesForPeriod(period, customRange) {
  const dates = [];
  const today = new Date(2026, 7, 11); // August 11, 2026 local time

  let start = new Date(today);
  let end = new Date(today);

  if (period === "Today") {
    start = new Date(today);
    end = new Date(today);
  } else if (period === "Yesterday") {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
  } else if (period === "Last 7 Days") {
    start.setDate(today.getDate() - 6);
    end = new Date(today);
  } else if (period === "Last 30 Days") {
    start.setDate(today.getDate() - 29);
    end = new Date(today);
  } else if (period === "This Month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today);
  } else if (period === "Custom Date Range" && customRange?.startDate && customRange?.endDate) {
    const partsStart = customRange.startDate.split("-").map(Number);
    const partsEnd = customRange.endDate.split("-").map(Number);
    start = new Date(partsStart[0], partsStart[1] - 1, partsStart[2]);
    end = new Date(partsEnd[0], partsEnd[1] - 1, partsEnd[2]);
  } else {
    start.setDate(today.getDate() - 6);
    end = new Date(today);
  }

  const cur = new Date(start);
  while (cur <= end) {
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function generateCustomerTransactionHistory(period, customRange) {
  const dates = getDatesForPeriod(period, customRange);
  const numDays = dates.length;

  // Stable visitor targeting
  const totalTargetVisits = numDays === 1 ? 25 : numDays <= 7 ? 70 : 150;
  const visitsPerDay = Math.max(2, Math.floor(totalTargetVisits / numDays));

  const customerList = [];
  const transactionList = [];

  let custSeq = 1;
  let txnSeq = 1;

  dates.forEach((dateStr) => {
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed += dateStr.charCodeAt(i);
    }

    for (let v = 0; v < visitsPerDay; v++) {
      const vSeed = seed + v * 37;

      const rand1 = seededRandom(vSeed);
      const rand2 = seededRandom(vSeed + 1);
      const rand3 = seededRandom(vSeed + 2);
      const rand4 = seededRandom(vSeed + 3);
      const rand5 = seededRandom(vSeed + 4);

      // Select store dynamically from loaded stores
      const storeIndex = Math.floor(rand1 * stores.length);
      const storeObj = stores[storeIndex] || { name: "Downtown Flagship" };
      const store = storeObj.name;

      const entryHour = 8 + Math.floor(rand2 * 13);
      const entryMin = Math.floor(rand3 * 60);
      const entryTime = `${String(entryHour).padStart(2, '0')}:${String(entryMin).padStart(2, '0')}`;

      const dwellTime = 10 + Math.floor(rand4 * 56);
      
      let exitHour = entryHour;
      let exitMin = entryMin + dwellTime;
      if (exitMin >= 60) {
        exitHour += Math.floor(exitMin / 60);
        exitMin = exitMin % 60;
      }
      const exitTime = `${String(exitHour).padStart(2, '0')}:${String(exitMin).padStart(2, '0')}`;

      // Select products dynamically from loaded products
      const numViewed = 2 + Math.floor(rand5 * 5);
      const viewedIndices = [];
      for (let i = 0; i < numViewed; i++) {
        const pIdx = Math.floor(seededRandom(vSeed + 5 + i) * products.length);
        if (!viewedIndices.includes(pIdx)) {
          viewedIndices.push(pIdx);
        }
      }
      const productsViewed = viewedIndices.map(idx => products[idx]).filter(Boolean);

      const isPurchased = seededRandom(vSeed + 20) < 0.40;
      let purchaseStatus = "No Purchase";
      let productsPurchased = [];
      let purchaseAmount = 0;
      let transactionId = null;

      // Deterministically assign zone — match against actual zone names in the zones array
      // so that even if zone names are customized in localStorage the data stays consistent.
      const zoneKeywords = [
        { keywords: ["bread", "bakery", "pastry"], cats: ["Bread", "Bakery"] },
        { keywords: ["dairy", "milk", "egg"],      cats: ["Dairy"] },
        { keywords: ["produce", "fresh", "fruit", "veg", "salmon", "fish"], cats: ["Produce"] },
        { keywords: ["beauty", "cosmetic", "personal care", "skincare"], cats: ["Beauty", "Cosmetics"] },
        { keywords: ["electronic", "tech", "audio", "earbu"],            cats: ["Electronics"] },
        { keywords: ["household", "clean", "home"],                       cats: ["Household"] },
        { keywords: ["frozen", "ice"],                                    cats: ["Frozen"] },
        { keywords: ["snack", "beverage", "drink", "granola", "cereal"],  cats: ["Snack", "Beverage"] },
      ];
      let zoneObj = zones[Math.floor(seededRandom(vSeed + 30) * zones.length)] || { name: zones[0]?.name || "Bakery" };
      let zone = zoneObj.name;
      if (productsViewed.length > 0 && zones.length > 0) {
        const prodName = (productsViewed[0].name || "").toLowerCase();
        const prodCat  = (productsViewed[0].category || "").toLowerCase();
        const combined = prodName + " " + prodCat;
        // Find matching keyword group
        const matchedGroup = zoneKeywords.find(g =>
          g.keywords.some(kw => combined.includes(kw))
        );
        if (matchedGroup) {
          // Try to find a zone in the actual zones array whose name contains one of those keywords
          const matchedZone = zones.find(z =>
            matchedGroup.keywords.some(kw => z.name.toLowerCase().includes(kw)) ||
            matchedGroup.cats.some(cat => z.name.toLowerCase().includes(cat.toLowerCase()))
          );
          if (matchedZone) zone = matchedZone.name;
        }
      }

      if (isPurchased && productsViewed.length > 0) {
        purchaseStatus = "Purchased";
        const numPurchased = Math.min(productsViewed.length, 1 + Math.floor(seededRandom(vSeed + 21) * 3));
        const purchasedIndices = [];
        for (let i = 0; i < numPurchased; i++) {
          const idx = Math.floor(seededRandom(vSeed + 22 + i) * productsViewed.length);
          if (!purchasedIndices.includes(idx)) {
            purchasedIndices.push(idx);
          }
        }
        productsPurchased = purchasedIndices.map(idx => productsViewed[idx]);
        purchaseAmount = productsPurchased.reduce((sum, p) => sum + (p.price || p.sellingPrice), 0);
        transactionId = `TXN-${String(txnSeq++).padStart(6, '0')}`;
      }

      const customerId = `CUST-${String(custSeq++).padStart(6, '0')}`;

      customerList.push({
        customerId,
        visitDate: dateStr,
        entryTime,
        exitTime,
        dwellTime,
        productsViewed,
        productsPurchased,
        purchaseStatus,
        purchaseAmount,
        transactionId: transactionId || "—",
        store,
        zone
      });

      if (purchaseStatus === "Purchased") {
        const txnProductsNames = productsPurchased.map(p => p.name).join(", ");
        const quantity = productsPurchased.length;
        // Compute actual profit (Selling Price - Cost Price)
        const profit = parseFloat(productsPurchased.reduce((sum, p) => sum + ((p.price || p.sellingPrice) - (p.cost || p.costPrice || (p.price || p.sellingPrice) * 0.65)), 0).toFixed(2));
        
        const payVal = seededRandom(vSeed + 40);
        const paymentStatus = payVal < 0.90 ? "Completed" : payVal < 0.98 ? "Pending" : "Refunded";

        transactionList.push({
          transactionId,
          customerId,
          date: dateStr,
          time: exitTime,
          products: txnProductsNames,
          quantity,
          amount: purchaseAmount,
          profit,
          paymentStatus
        });
      }
    }
  });

  return { customerList, transactionList };
}

// ═══════════════════════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH FOR DATE-FILTERED TELEMETRY DATA
// ═══════════════════════════════════════════════════════════════════════
// Helper to compute KPIs for Yesterday vs Today comparisons
export function getCentralKPIsForPeriod(period, customRange, filterStore, filterCamera, filterZone, filterCategory) {
  let customerList, transactionList;
  const dbCusts = window.db_customers;
  const dbTxns = window.db_transactions;
  if (dbCusts && dbTxns) {
    const dates = getDatesForPeriod(period, customRange);
    customerList = dbCusts.filter(c => dates.includes(c.visitDate));
    transactionList = dbTxns.filter(t => dates.includes(t.date));
  } else {
    const res = generateCustomerTransactionHistory(period, customRange);
    customerList = res.customerList;
    transactionList = res.transactionList;
  }

  // Apply filters
  if (filterStore !== "All") {
    const storeObj = stores.find(s => s.id === filterStore || s.name === filterStore);
    if (storeObj) {
      customerList = customerList.filter(c => c.store === storeObj.name);
      const custIds = new Set(customerList.map(c => c.customerId));
      transactionList = transactionList.filter(t => custIds.has(t.customerId));
    }
  }

  let cameraZone = null;
  if (filterCamera !== "All") {
    const cam = cameras.find(c => c.id === filterCamera);
    if (cam) cameraZone = cam.zone;
  }

  const targetZone = filterZone !== "All" ? filterZone : cameraZone;
  if (targetZone) {
    customerList = customerList.filter(c => c.zone.toLowerCase().includes(targetZone.toLowerCase()));
    const custIds = new Set(customerList.map(c => c.customerId));
    transactionList = transactionList.filter(t => custIds.has(t.customerId));
  }

  if (filterCategory !== "All") {
    customerList = customerList.filter(c => 
      c.productsViewed.some(p => p.category.toLowerCase().includes(filterCategory.toLowerCase()))
    );
    const custIds = new Set(customerList.map(c => c.customerId));
    transactionList = transactionList.filter(t => custIds.has(t.customerId));
  }

  const totalCustomers = customerList.length;
  const purchasedCustomers = customerList.filter(c => c.purchaseStatus === "Purchased").length;
  const totalSales = transactionList.reduce((sum, t) => sum + t.amount, 0);
  const totalProfit = parseFloat(transactionList.reduce((sum, t) => sum + t.profit, 0).toFixed(2));
  const avgDwellTime = totalCustomers > 0 
    ? parseFloat((customerList.reduce((sum, c) => sum + c.dwellTime, 0) / totalCustomers).toFixed(1)) 
    : 0;
  const conversionRate = totalCustomers > 0 
    ? parseFloat(((purchasedCustomers / totalCustomers) * 100).toFixed(1)) 
    : 0;

  return { totalCustomers, totalSales, totalProfit, avgDwellTime, conversionRate };
}

export function getDynamicAiInsights(kpis) {
  const visitors = kpis.totalVisitors;
  const sales = kpis.salesRevenue;
  const conv = kpis.conversionRate;
  const dwell = kpis.avgDwellTime;

  return [
    {
      id: 1,
      title: "Optimizing High-Dwell Low-Conversion Shelves",
      desc: `Cosmetics has high average dwell time (${dwell} min) but conversion stands at only ${conv}%. Co-locating promotional products will lift conversion rate.`,
      confidence: 98,
      impact: Math.round(sales * 0.12),
      category: "Layout",
      priority: conv < 20 ? "High" : "Medium",
      status: "New"
    },
    {
      id: 2,
      title: "Adjusting staffing for peak traffic times",
      desc: `Traffic flow peak detected at ${kpis.peakHour || "5:00 PM"} with ${kpis.peakHourTraffic || 300} visitors. Adjusting personnel allocations will improve conversion.`,
      confidence: 94,
      impact: Math.round(sales * 0.08),
      category: "Operations",
      priority: "Medium",
      status: "In Progress"
    },
    {
      id: 3,
      title: "Cross-merchandising opportunity",
      desc: `Transactional analysis of ${kpis.totalCustomers} visitors indicates high affinity between Bakery and Dairy. Consider bundle promotions.`,
      confidence: 88,
      impact: Math.round(sales * 0.05),
      category: "Merchandising",
      priority: "Low",
      status: "New"
    }
  ];
}

// Database cached variables
let dbJourneyFunnel = null;
let dbCommonPaths = null;
let dbZoneTransitions = null;
let dbCustomerSegments = null;
let dbAiInsights = null;
let dbHourlyActivityHeatmap = null;
let dbRfmDistribution = null;
let dbShoppingBehavior = null;
let dbBottlenecks = null;

export function getCentralScaledData(periodOrFilter, customRange = null) {
  let period = "Last 7 Days";
  let filterStore = "All";
  let filterCamera = "All";
  let filterZone = "All";
  let filterCategory = "All";

  if (periodOrFilter && typeof periodOrFilter === "object") {
    period = periodOrFilter.dateRange ?? "Last 7 Days";
    filterStore = periodOrFilter.store ?? "All";
    filterCamera = periodOrFilter.camera ?? "All";
    filterZone = periodOrFilter.zone ?? "All";
    filterCategory = periodOrFilter.category ?? "All";
    customRange = periodOrFilter;
  } else if (typeof periodOrFilter === "string") {
    period = periodOrFilter;
  }

  // Ensure sync module arrays is called to fetch newest state from localStorage
  if (typeof window !== "undefined") {
    syncModuleArrays();
  }

  let mult = 1.0;
  if (period === "Today")          mult = 0.14;
  else if (period === "Yesterday") mult = 0.92;
  else if (period === "Last 7 Days")  mult = 6.4;
  else if (period === "Last 30 Days") mult = 26.5;
  else if (period === "This Month") {
    const now = new Date();
    const dayOfMonth = now.getDate();
    mult = parseFloat((dayOfMonth * 0.95).toFixed(2));
  }
  else if (period === "Custom Date Range") {
    if (customRange?.startDate && customRange?.endDate) {
      const diffTime = Math.abs(new Date(customRange.endDate) - new Date(customRange.startDate));
      const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      mult = parseFloat((days * 0.95).toFixed(2));
    } else {
      mult = 1.8;
    }
  }

  // Generate customer & transaction records (from DB if populated, otherwise deterministic fallback)
  const dbCusts = window.db_customers;
  const dbTxns = window.db_transactions;

  let baseCustomers, baseTransactions;
  if (dbCusts && dbTxns) {
    const dates = getDatesForPeriod(period, customRange);
    baseCustomers = dbCusts.filter(c => dates.includes(c.visitDate));
    baseTransactions = dbTxns.filter(t => dates.includes(t.date));
  } else {
    const res = generateCustomerTransactionHistory(period, customRange);
    baseCustomers = res.customerList;
    baseTransactions = res.transactionList;
  }

  // Merge live sessions if they exist (only for Today/Yesterday/Last 7 Days periods where live data fits)
  const liveSessions = window.cams_live_sessions || [];
  
  // Transform live sessions to transaction list format
  const liveTransactions = [];
  liveSessions.forEach(s => {
    if (s.purchaseStatus === "Purchased" && s.transactionId !== "—") {
      const txnProductsNames = s.productsPurchased.map(p => p.name).join(", ");
      const quantity = s.productsPurchased.length;
      const profit = parseFloat(s.productsPurchased.reduce((sum, p) => sum + ((p.price || p.sellingPrice) - (p.cost || p.costPrice || (p.price || p.sellingPrice) * 0.65)), 0).toFixed(2));
      liveTransactions.push({
        transactionId: s.transactionId,
        customerId: s.customerId,
        date: s.visitDate,
        time: s.exitTime,
        products: txnProductsNames,
        quantity,
        amount: s.purchaseAmount,
        profit,
        paymentStatus: "Completed"
      });
    }
  });

  let customerList = [...liveSessions, ...baseCustomers];
  let transactionList = [...liveTransactions, ...baseTransactions];

  // Map Camera ID to Zone Name
  let cameraZone = null;
  if (filterCamera !== "All") {
    const cam = cameras.find(c => c.id === filterCamera);
    if (cam) cameraZone = cam.zone;
  }

  // Apply filters
  if (filterStore !== "All") {
    const storeObj = stores.find(s => s.id === filterStore || s.name === filterStore);
    if (storeObj) {
      customerList = customerList.filter(c => c.store === storeObj.name);
      const custIds = new Set(customerList.map(c => c.customerId));
      transactionList = transactionList.filter(t => custIds.has(t.customerId));
    }
  }

  const targetZone = filterZone !== "All" ? filterZone : cameraZone;
  if (targetZone) {
    customerList = customerList.filter(c => c.zone.toLowerCase().includes(targetZone.toLowerCase()));
    const custIds = new Set(customerList.map(c => c.customerId));
    transactionList = transactionList.filter(t => custIds.has(t.customerId));
  }

  if (filterCategory !== "All") {
    customerList = customerList.filter(c => 
      c.productsViewed.some(p => p.category.toLowerCase().includes(filterCategory.toLowerCase()))
    );
    const custIds = new Set(customerList.map(c => c.customerId));
    transactionList = transactionList.filter(t => custIds.has(t.customerId));
  }

  const totalCustomers = customerList.length;
  const purchasedCustomers = customerList.filter(c => c.purchaseStatus === "Purchased").length;
  const nonPurchasingCustomers = customerList.filter(c => c.purchaseStatus === "No Purchase").length;
  const unitsSold = transactionList.reduce((sum, t) => sum + t.quantity, 0);
  const totalSales = transactionList.reduce((sum, t) => sum + t.amount, 0);
  const totalProfit = parseFloat(transactionList.reduce((sum, t) => sum + t.profit, 0).toFixed(2));

  const avgDwellTime = totalCustomers > 0 
    ? parseFloat((customerList.reduce((sum, c) => sum + c.dwellTime, 0) / totalCustomers).toFixed(1)) 
    : 18.4;

  const conversionRate = totalCustomers > 0 
    ? parseFloat(((purchasedCustomers / totalCustomers) * 100).toFixed(1)) 
    : 18.2;

  const peakTraffic = Math.round(320 * mult);

  // Compute Yesterday / Same-Length Previous Period Baseline for Historical Shifts
  let prevPeriod = "Yesterday";
  let prevRange = null;

  if (period === "Today") {
    prevPeriod = "Yesterday";
  } else if (period === "Yesterday") {
    prevPeriod = "Custom Date Range";
    prevRange = { startDate: "2026-08-09", endDate: "2026-08-09" };
  } else if (period === "Last 7 Days") {
    prevPeriod = "Custom Date Range";
    prevRange = { startDate: "2026-07-29", endDate: "2026-08-04" };
  } else if (period === "Last 30 Days") {
    prevPeriod = "Custom Date Range";
    prevRange = { startDate: "2026-07-01", endDate: "2026-07-30" };
  } else if (period === "This Month") {
    prevPeriod = "Custom Date Range";
    prevRange = { startDate: "2026-07-01", endDate: "2026-07-31" };
  } else if (period === "Custom Date Range" && customRange?.startDate && customRange?.endDate) {
    const diffTime = Math.abs(new Date(customRange.endDate) - new Date(customRange.startDate));
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const prevEnd = new Date(customRange.startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - days + 1);

    prevPeriod = "Custom Date Range";
    prevRange = {
      startDate: `${prevStart.getFullYear()}-${String(prevStart.getMonth() + 1).padStart(2, '0')}-${String(prevStart.getDate()).padStart(2, '0')}`,
      endDate: `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2, '0')}-${String(prevEnd.getDate()).padStart(2, '0')}`
    };
  }

  const prevKPIs = getCentralKPIsForPeriod(prevPeriod, prevRange, filterStore, filterCamera, filterZone, filterCategory);

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  };

  const totalVisitorsChange = calculateChange(totalCustomers, prevKPIs.totalCustomers);
  const salesRevenueChange = calculateChange(totalSales, prevKPIs.totalSales);
  const avgDwellTimeChange = calculateChange(avgDwellTime, prevKPIs.avgDwellTime);
  const conversionRateChange = calculateChange(conversionRate, prevKPIs.conversionRate);
  const productsPickedChange = calculateChange(Math.round(2140 * mult), Math.round(2140 * (mult * 0.9)));

  // Generate dynamic AI insights
  const kpisTemp = {
    totalVisitors: totalCustomers,
    salesRevenue: totalSales,
    conversionRate,
    avgDwellTime,
    peakHour: "5:00 PM – 7:00 PM",
    peakHourTraffic: peakTraffic,
    totalCustomers
  };
  const dynInsights = getDynamicAiInsights(kpisTemp);
  aiInsights.length = 0;
  aiInsights.push(...dynInsights);

  // Compute customersByZone dynamically
  const zoneCounts = {};
  customerList.forEach(c => {
    zoneCounts[c.zone] = (zoneCounts[c.zone] || 0) + 1;
  });
  const customersByZone = Object.keys(zoneCounts).map((zName, idx) => {
    const colors = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#06B6D4", "#F97316", "#14B8A6", "#EF4444"];
    return {
      zone: zName,
      name: zName,
      val: zoneCounts[zName],
      count: zoneCounts[zName],
      scaledVisitors: zoneCounts[zName],
      fill: colors[idx % colors.length],
      color: colors[idx % colors.length]
    };
  });

  // Compute topPickedProducts dynamically
  const productPurchaseCounts = {};
  customerList.forEach(c => {
    c.productsPurchased.forEach(p => {
      productPurchaseCounts[p.name] = (productPurchaseCounts[p.name] || 0) + 1;
    });
  });
  const topPickedProducts = Object.keys(productPurchaseCounts)
    .map(name => {
      const prod = products.find(p => p.name === name) || {};
      return {
        name,
        category: prod.category || "General",
        picked: productPurchaseCounts[name],
        change: "↑ " + Math.floor(seededRandom(name.charCodeAt(0)) * 15 + 5) + "%",
        color: "text-emerald-400"
      };
    })
    .sort((a, b) => b.picked - a.picked)
    .slice(0, 5)
    .map((p, idx) => ({ rank: idx + 1, ...p }));

  return {
    mult,
    customerList,
    transactionList,
    shelves,
    kpis: {
      totalVisitors: totalCustomers,
      totalVisitorsChange,
      currentCustomers: Math.round(42 * (mult > 1 ? 1 : mult)),
      avgDwellTime,
      avgDwellTimeChange,
      avgAttentionTime: parseFloat((avgDwellTime * 0.35).toFixed(1)),
      avgAttentionTimeChange: avgDwellTimeChange,
      avgOrderValue: purchasedCustomers > 0 ? parseFloat((totalSales / purchasedCustomers).toFixed(2)) : 42.50,
      avgOrderValueChange: salesRevenueChange,
      productsPicked: Math.round(2140 * mult),
      productsPickedChange,
      conversionRate,
      conversionRateChange,
      cameraStatus: "5/6 Online",
      salesRevenue: totalSales,
      salesRevenueChange,
      peakHourTraffic: peakTraffic,
      peakHour: "5:00 PM – 7:00 PM",

      // Store Manager specific metrics
      totalCustomers,
      purchasedCustomers,
      nonPurchasingCustomers,
      unitsSold,
      todaySales: totalSales,
      todayProfit: totalProfit,
    },
    visitorsByHour: [
      { time: "9 AM", val: Math.round(peakTraffic * 0.25), visitors: Math.round(peakTraffic * 0.25) },
      { time: "10 AM", val: Math.round(peakTraffic * 0.45), visitors: Math.round(peakTraffic * 0.45) },
      { time: "11 AM", val: Math.round(peakTraffic * 0.60), visitors: Math.round(peakTraffic * 0.60) },
      { time: "12 PM", val: Math.round(peakTraffic * 0.75), visitors: Math.round(peakTraffic * 0.75) },
      { time: "1 PM", val: Math.round(peakTraffic * 0.95), visitors: Math.round(peakTraffic * 0.95) },
      { time: "2 PM", val: Math.round(peakTraffic * 0.85), visitors: Math.round(peakTraffic * 0.85) },
      { time: "3 PM", val: Math.round(peakTraffic * 0.90), visitors: Math.round(peakTraffic * 0.90) },
      { time: "4 PM", val: Math.round(peakTraffic * 0.75), visitors: Math.round(peakTraffic * 0.75) },
      { time: "5 PM", val: peakTraffic, visitors: peakTraffic },
      { time: "6 PM", val: Math.round(peakTraffic * 0.95), visitors: Math.round(peakTraffic * 0.95) },
      { time: "7 PM", val: Math.round(peakTraffic * 0.80), visitors: Math.round(peakTraffic * 0.80) },
      { time: "8 PM", val: Math.round(peakTraffic * 0.55), visitors: Math.round(peakTraffic * 0.55) },
      { time: "9 PM", val: Math.round(peakTraffic * 0.30), visitors: Math.round(peakTraffic * 0.30) }
    ],
    customersByZone,
    segmentationData: [
      { name: "New Visitors", value: Math.round(totalCustomers * 0.63), color: "#2563EB" },
      { name: "Returning Visitors", value: Math.round(totalCustomers * 0.37), color: "#10B981" }
    ],
    productInteraction: [
      { name: "Picked", value: purchasedCustomers, color: "#10B981" },
      { name: "Viewed", value: totalCustomers, color: "#2563EB" },
      { name: "Returned", value: Math.round(totalCustomers * 0.12), color: "#F59E0B" },
      { name: "Compared", value: Math.round(totalCustomers * 0.22), color: "#8B5CF6" }
    ],
    topPickedProducts,
    entryExitPoints: !!window.db_customers ? entryExitPoints : [
      { name: "Main Entrance", entries: Math.round(8420 * mult), exits: Math.round(7980 * mult), pct: 58.2, scaledEntries: Math.round(8420 * mult) },
      { name: "Side Entrance (Parking)", entries: Math.round(3640 * mult), exits: Math.round(3890 * mult), pct: 25.4, scaledEntries: Math.round(3640 * mult) },
      { name: "Mall Connector", entries: Math.round(2360 * mult), exits: Math.round(2410 * mult), pct: 16.4, scaledEntries: Math.round(2360 * mult) }
    ],
    dailyTrafficTrend: !!window.db_customers ? dailyTrafficTrend : dailyTrafficTrend.map(d => ({
      ...d,
      visitors: Math.round(d.visitors * (mult > 1 ? mult * 0.15 : mult)),
      newVisitors: Math.round(d.newVisitors * (mult > 1 ? mult * 0.15 : mult)),
      returning: Math.round(d.returning * (mult > 1 ? mult * 0.15 : mult)),
      scaledVisitors: Math.round(d.visitors * (mult > 1 ? mult * 0.15 : mult))
    })),
    hourlyTraffic: !!window.db_customers ? hourlyTraffic : hourlyTraffic.map(h => ({
      ...h,
      traffic: Math.round(h.traffic * (mult > 1 ? mult * 0.15 : mult))
    })),
    journeyFunnel: (!!window.db_customers && dbJourneyFunnel) ? dbJourneyFunnel : journeyFunnel,
    commonPaths: (!!window.db_customers && dbCommonPaths) ? dbCommonPaths : commonPaths,
    zoneTransitions: (!!window.db_customers && dbZoneTransitions) ? dbZoneTransitions : zoneTransitions,
    dropoffPoints: !!window.db_customers ? dropoffPoints : dropoffPoints.map(d => ({
      ...d,
      count: Math.round(d.count * (mult > 1 ? mult * 0.15 : mult))
    })),
    zones: zones.map((z, zIdx) => {
      // Use partial case-insensitive matching so zone names customized in localStorage
      // still match customer records that were assigned via keyword lookup above.
      const zNameLower = z.name.toLowerCase();
      const zCusts = customerList.filter(c => {
        const cZone = (c.zone || "").toLowerCase();
        return cZone === zNameLower ||
               cZone.includes(zNameLower) ||
               zNameLower.includes(cZone);
      });
      const zTxns = transactionList.filter(t => {
        const cust = customerList.find(c => c.customerId === t.customerId);
        if (!cust) return false;
        const cZone = (cust.zone || "").toLowerCase();
        return cZone === zNameLower ||
               cZone.includes(zNameLower) ||
               zNameLower.includes(cZone);
      });
      const zRev = zTxns.reduce((sum, t) => sum + t.amount, 0);
      const zPurchased = zCusts.filter(c => c.purchaseStatus === "Purchased").length;
      const zConv = zCusts.length > 0 ? parseFloat(((zPurchased / zCusts.length) * 100).toFixed(1)) : 0;
      // Deterministic color palette so each zone always has a distinct color
      const zoneColors = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#06B6D4", "#F97316", "#14B8A6", "#EF4444"];
      return {
        ...z,
        visitors: zCusts.length,
        scaledVisitors: zCusts.length,
        revenue: zRev,
        conversionRate: zConv,
        dwellTime: zCusts.length > 0 
          ? parseFloat((zCusts.reduce((sum, c) => sum + c.dwellTime, 0) / zCusts.length).toFixed(1)) 
          : 15.0,
        attentionScore: Math.round(75 + seededRandom(z.name.charCodeAt(0)) * 20),
        color: z.color || zoneColors[zIdx % zoneColors.length]
      };
    }),
    dwellDistribution: !!window.db_customers ? dwellDistribution : dwellDistribution.map(d => ({
      ...d,
      visitors: Math.round(d.visitors * (mult > 1 ? mult * 0.15 : mult))
    })),
    dwellTrend: !!window.db_customers ? dwellTrend : dwellTrend.map(dt => ({
      ...dt,
      avgDwell: parseFloat((dt.avgDwell * (mult > 5 ? 1.05 : mult < 1 ? 0.95 : 1.0)).toFixed(1))
    })),
    storeHeatmap: !!window.db_customers ? storeHeatmap : storeHeatmap.map(h => ({
      ...h,
      heat: Math.min(100, Math.max(10, Math.round(h.heat * (mult > 5 ? 1.05 : mult < 1 ? 0.6 : 0.9))))
    })),
    bottlenecks: (!!window.db_customers && dbBottlenecks) ? dbBottlenecks : bottlenecks,
    products: products.map(p => {
      const pViews = customerList.filter(c => c.productsViewed.some(pv => (pv.id === p.id || pv.product_id === p.id))).length;
      const pPurchased = customerList.filter(c => c.productsPurchased.some(pp => (pp.id === p.id || pp.product_id === p.id))).length;
      const pRev = transactionList.reduce((sum, t) => {
        const cust = customerList.find(c => c.customerId === t.customerId);
        if (cust && cust.productsPurchased.some(pp => (pp.id === p.id || pp.product_id === p.id))) {
          return sum + (p.price || p.sellingPrice || 10.0);
        }
        return sum;
      }, 0);
      const isDb = !!window.db_customers;
      return {
        ...p,
        views: isDb ? pViews : (pViews || Math.round(15 * mult)),
        pickups: isDb ? Math.round(pViews * 0.6) : (pViews ? Math.round(pViews * 0.6) : Math.round(9 * mult)),
        purchases: isDb ? pPurchased : (pPurchased || Math.round(5 * mult)),
        convRate: pViews > 0 ? parseFloat(((pPurchased / pViews) * 100).toFixed(1)) : 0,
        revenue: isDb ? pRev : (pRev || Math.round((pPurchased || Math.round(5 * mult)) * p.price)),
        attentionScore: Math.round(80 + seededRandom(p.id.charCodeAt(2)) * 18),
        avgDwell: parseFloat((2.5 + seededRandom(p.id.charCodeAt(2)) * 3.5).toFixed(1))
      };
    }),
    customerSegments: (!!window.db_customers && dbCustomerSegments) ? dbCustomerSegments : customerSegments,
    rfmDistribution: (!!window.db_customers && dbRfmDistribution) ? dbRfmDistribution : rfmDistribution,
    shoppingBehavior: (!!window.db_customers && dbShoppingBehavior) ? dbShoppingBehavior : shoppingBehavior,
    hourlyActivityHeatmap: (!!window.db_customers && dbHourlyActivityHeatmap) ? dbHourlyActivityHeatmap : hourlyActivityHeatmap,
    attentionTrend: attentionTrend.map(a => ({
      ...a,
      attention: parseFloat((a.attention * (mult > 5 ? 1.08 : mult < 1 ? 0.92 : 1.0)).toFixed(1)),
      dwell: parseFloat((a.dwell * (mult > 5 ? 1.05 : mult < 1 ? 0.95 : 1.0)).toFixed(1)),
      conversion: parseFloat((a.conversion * (mult > 5 ? 1.03 : mult < 1 ? 0.97 : 1.0)).toFixed(1)),
      totalAttn: Math.round(a.attention * 2700 * (mult > 1 ? mult * 0.15 : mult)),
      avgFixation: parseFloat((a.attention * (mult > 5 ? 1.08 : mult < 1 ? 0.92 : 1.0)).toFixed(1))
    })),
    attentionByZone: attentionByZone.map(az => ({
      ...az,
      share: az.score,
      shareLabel: az.score + '%'
    })),
    gazeDirectionData: gazeDirectionData,
    aiInsights: (!!window.db_customers && dbAiInsights) ? dbAiInsights : dynInsights
  };
}

export async function fetchAllFromDatabase() {
  try {
    const fetchWithFallback = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json;
    };

    const [dbStores, dbCameras, dbShelves, dbZones, dbProducts, dbPromotions, dbCustomers, dbTransactions] = await Promise.all([
      fetchWithFallback("http://localhost:5001/api/stores"),
      fetchWithFallback("http://localhost:5001/api/cameras"),
      fetchWithFallback("http://localhost:5001/api/shelves"),
      fetchWithFallback("http://localhost:5001/api/zones"),
      fetchWithFallback("http://localhost:5001/api/products"),
      fetchWithFallback("http://localhost:5001/api/promotions"),
      fetchWithFallback("http://localhost:5001/api/customers"),
      fetchWithFallback("http://localhost:5001/api/transactions")
    ]);

    if (dbStores && dbStores.length > 0) {
      stores.length = 0;
      stores.push(...dbStores.map(s => ({
        id: s.store_id || `STR-${s.id}`,
        name: s.name,
        address: s.address,
        manager: s.manager_id ? `Manager #${s.manager_id}` : "Jane Smith",
        cameras: 6,
        shelves: 12,
        zones: 8,
        status: s.status === 'active' ? 'Active' : s.status === 'maintenance' ? 'Maintenance' : 'Inactive',
        openSince: "2021-03-15",
        sqft: s.total_area_sqft
      })));
    }

    if (dbCameras && dbCameras.length > 0) {
      cameras.length = 0;
      cameras.push(...dbCameras.map(c => {
        const matchingStore = dbStores.find(st => st.id === c.store_id);
        const storeId = matchingStore ? (matchingStore.store_id || `STR-${matchingStore.id}`) : "STR-101";
        return {
          id: c.camera_id,
          storeId: storeId,
          location: c.location || "Aisle B",
          name: c.name,
          status: c.is_active ? "Online" : "Offline",
          fps: c.fps || 30,
          resolution: c.resolution || "1080p",
          zone: c.zones && c.zones.length > 0 ? c.zones[0] : "Checkout",
          model: c.camera_type || "fixed",
          lastCalibrated: "2026-07-28",
          coordsX: c.position_x || 4.0,
          coordsY: c.position_y || 4.0
        };
      }));
    }

    if (dbShelves && dbShelves.length > 0) {
      shelves.length = 0;
      shelves.push(...dbShelves.map(s => {
        const matchingStore = dbStores.find(st => st.id === s.store_id);
        const storeName = matchingStore ? matchingStore.name : "Downtown Flagship";
        const storeId = matchingStore ? (matchingStore.store_id || `STR-${matchingStore.id}`) : "STR-101";
        return {
          id: s.shelf_id,
          name: s.name || `Shelf ${s.shelf_number} - ${s.zone}`,
          store: storeName,
          storeId: storeId,
          zone: s.zone || "Bakery",
          category: s.zone || "Bakery",
          coordsX: s.position_x || 10.0,
          coordsY: s.position_y || 10.0,
          width: s.width || 2.0,
          height: s.height || 1.6,
          capacity: s.capacity || 100,
          attachedCamera: s.attachedCamera || "CAM-01",
          status: "Active",
          dims: `${s.width || 2.0}m x ${s.height || 1.6}m x 0.6m`,
          dimsX: s.width,
          dimsY: s.height,
          attentionScore: s.attentionScore || 85,
          occupancyRate: s.occupancyRate || 80
        };
      }));
    }

    if (dbZones && dbZones.length > 0) {
      zones.length = 0;
      zones.push(...dbZones.map(z => {
        const matchingStore = dbStores.find(st => st.id === z.store_id);
        const storeId = matchingStore ? (matchingStore.store_id || `STR-${matchingStore.id}`) : "STR-101";
        return {
          id: z.zone_id,
          name: z.name,
          store: storeId,
          status: z.status || "Active",
          color: z.color || "#10B981"
        };
      }));
    }

    if (dbProducts && dbProducts.length > 0) {
      products.length = 0;
      products.push(...dbProducts.map(p => {
        const matchingStore = dbStores.find(st => st.name === p.store || st.store_id === p.store);
        const storeName = matchingStore ? matchingStore.name : "Downtown Flagship";
        const storeId = matchingStore ? (matchingStore.store_id || `STR-${matchingStore.id}`) : "STR-101";
        return {
          id: p.product_id,
          name: p.name,
          sku: p.sku,
          category: p.category || "General",
          sellingPrice: p.selling_price || p.price || 10.0,
          price: p.price || 10.0,
          costPrice: p.cost_price || (p.price * 0.7) || 7.0,
          cost: p.cost_price || (p.price * 0.7) || 7.0,
          profit: p.profit || (p.price - (p.cost_price || p.price * 0.7)) || 3.0,
          stockQty: p.stock_qty || 50,
          shelf: p.shelf || "SH-101",
          store: storeName,
          storeId: storeId,
          promo: p.promo || "None",
          status: p.status === 'active' ? 'Active' : 'Inactive',
          subcategory: p.subcategory || "",
          brand: p.brand || ""
        };
      }));
    }

    if (dbPromotions && dbPromotions.length > 0) {
      promotions.length = 0;
      promotions.push(...dbPromotions.map(p => ({
        id: p.promo_id,
        name: p.name,
        zone: p.zone,
        category: p.category,
        type: p.type,
        value: p.value,
        lift: p.lift,
        revenue: p.revenue,
        status: p.status,
        startDate: p.start_date,
        endDate: p.end_date,
        products: p.products || []
      })));
    }

    if (dbCustomers && dbCustomers.length > 0) {
      window.db_customers = dbCustomers.map(c => ({
        id: c.id,
        customerId: c.customer_id,
        visitDate: c.visit_date,
        entryTime: c.entry_time,
        exitTime: c.exit_time,
        dwellTime: c.dwell_time,
        purchaseStatus: c.purchase_status,
        purchaseAmount: c.purchase_amount,
        transactionId: c.transaction_id,
        store: c.store || "Downtown Flagship",
        zone: c.zone || "Bakery",
        productsViewed: c.products_viewed || [],
        productsPurchased: c.products_purchased || [],
        isActive: c.is_active
      }));
    }

    if (dbTransactions && dbTransactions.length > 0) {
      window.db_transactions = dbTransactions.map(t => ({
        transactionId: t.transaction_id,
        customerId: t.customer_id,
        date: t.date,
        time: t.time,
        products: t.products,
        quantity: t.quantity,
        amount: t.amount,
        profit: t.profit,
        paymentStatus: t.payment_status
      }));
    }

    try {
      const dbHeatmap = await fetchWithFallback("http://localhost:5001/api/analytics/heatmap");
      const MAP_HOTSPOT_TO_STOREHEATMAP = {
        "entrance": "Entry",
        "promo": "Promo",
        "bakery": "Bakery",
        "frozen": "Frozen",
        "produce": "Produce",
        "personal": "Cosmetics",
        "electronics": "Electronics",
        "household": "Household",
        "checkout": "Checkout",
        "exit": "Exit",
        "beverages": "Aisle 1",
        "snacks": "Aisle 2",
        "dairy": "Dairy"
      };
      if (dbHeatmap && dbHeatmap.hotspots) {
        const keys = Object.keys(dbHeatmap.hotspots);
        keys.forEach(k => {
          const mappedName = MAP_HOTSPOT_TO_STOREHEATMAP[k];
          if (mappedName) {
            const idx = storeHeatmap.findIndex(h => h.name === mappedName);
            if (idx !== -1) {
              storeHeatmap[idx].heat = dbHeatmap.hotspots[k].heat;
            }
          }
        });
      }
    } catch (e) {
      console.warn("Failed to fetch database heatmap:", e);
    }

    try {
      const dbAttractiveness = await fetchWithFallback("http://localhost:5001/api/analytics/attractiveness");
      if (dbAttractiveness && dbAttractiveness.length > 0) {
        dbAttractiveness.forEach(item => {
          const prod = products.find(p => p.sku === item.sku || p.id === item.sku);
          if (prod) {
            prod.attentionScore = Math.round(item.score);
            prod.views = item.interactions;
            prod.pickups = item.pickups;
            prod.purchases = item.purchases;
            prod.convRate = item.pickups > 0 ? parseFloat(((item.purchases / item.pickups) * 100).toFixed(1)) : 0.0;
          }
        });
      }
    } catch (e) {
      console.warn("Failed to fetch database product attractiveness:", e);
    }

    try {
      const recs = await fetchWithFallback("http://localhost:5001/api/analytics/recommendations");
      if (recs) {
        dbAiInsights = recs.map(r => ({
          id: parseInt(r.id.replace('REC-', '')) || 101,
          title: r.rule,
          desc: r.recommendation,
          confidence: parseFloat(r.expected_conversion_improvement.replace('%', '')) || 90,
          impact: 4200,
          category: r.rule.includes("Traffic") ? "Traffic" : "Attractiveness",
          priority: r.priority,
          status: "Active"
        }));
      }
    } catch (e) {
      console.warn("Failed to fetch database recommendations:", e);
    }

    try {
      const journey = await fetchWithFallback("http://localhost:5001/api/analytics/journey");
      if (journey) {
        dbCommonPaths = journey.common_paths;
        dbZoneTransitions = journey.zone_transitions;
        const SEG_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#F97316", "#06B6D4", "#EC4899"];
        const totalSegCount = journey.segmentation.reduce((s, x) => s + (x.count || 0), 0);
        dbCustomerSegments = journey.segmentation.map((s, idx) => {
          const count = s.count || 0;
          const computedPct = totalSegCount > 0 ? parseFloat(((count / totalSegCount) * 100).toFixed(1)) : (s.share || 0);
          return {
            name: s.segment,
            count,
            pct: computedPct,
            share: s.share || computedPct,
            revenue: Math.round(count * 45),
            color: SEG_COLORS[idx % SEG_COLORS.length],
            avgSpend: s.avg_spend || 45,
            frequency: s.frequency || 2.0,
            recency: s.recency || 7,
            convRate: s.conv_rate || 20,
            retention: s.retention || 60
          };
        });
        if (journey.hourly_activity_heatmap) dbHourlyActivityHeatmap = journey.hourly_activity_heatmap;
        if (journey.rfm_distribution) dbRfmDistribution = journey.rfm_distribution;
        if (journey.shopping_behavior) dbShoppingBehavior = journey.shopping_behavior;
        if (journey.bottlenecks) dbBottlenecks = journey.bottlenecks;
      }
    } catch (e) {
      console.warn("Failed to fetch database customer journeys:", e);
    }

    console.log("✅ Successfully populated centralData arrays from PostgreSQL");
    return true;
  } catch (err) {
    console.error("❌ Failed to fetch authoritative data from backend:", err);
    return false;
  }
}
