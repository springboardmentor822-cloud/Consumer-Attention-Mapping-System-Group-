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
export const stores = [
  { id: "STR-101", name: "Downtown Flagship", address: "123 Main St, New York", manager: "Jane Smith", cameras: 32, shelves: 148, zones: 12, status: "Active", openSince: "2021-03-15", sqft: 28000 },
  { id: "STR-102", name: "Westside Mall", address: "456 West Blvd, Los Angeles", manager: "Alex Rivera", cameras: 24, shelves: 112, zones: 9, status: "Active", openSince: "2022-01-20", sqft: 22000 },
  { id: "STR-103", name: "Metro Center", address: "789 Central Ave, Chicago", manager: "Sam Chen", cameras: 18, shelves: 86, zones: 7, status: "Maintenance", openSince: "2023-06-10", sqft: 16000 },
];

export const cameras = [
  { id: "CAM-01", storeId: "STR-101", location: "Main Entrance", status: "Online", fps: 30, resolution: "1080p", zone: "Entrance A", model: "Axis P3255-LVE", lastCalibrated: "2026-07-28" },
  { id: "CAM-02", storeId: "STR-101", location: "Bakery Endcap", status: "Online", fps: 30, resolution: "4K", zone: "Bakery A1", model: "Hikvision DS-2CD2386G2", lastCalibrated: "2026-07-25" },
  { id: "CAM-03", storeId: "STR-101", location: "Cosmetics Wall", status: "Online", fps: 28, resolution: "1080p", zone: "Cosmetics D4", model: "Axis P3255-LVE", lastCalibrated: "2026-07-30" },
  { id: "CAM-04", storeId: "STR-101", location: "Checkout Line", status: "Offline", fps: 0, resolution: "1080p", zone: "Checkout C2", model: "Dahua IPC-HFW2831T", lastCalibrated: "2026-07-20" },
  { id: "CAM-05", storeId: "STR-101", location: "Dairy Section", status: "Online", fps: 30, resolution: "4K", zone: "Dairy B2", model: "Hikvision DS-2CD2386G2", lastCalibrated: "2026-07-29" },
  { id: "CAM-06", storeId: "STR-101", location: "Electronics Corner", status: "Online", fps: 25, resolution: "1080p", zone: "Electronics E1", model: "Axis M3106-LV", lastCalibrated: "2026-07-22" },
];

export const shelves = [
  { id: "SHL-001", storeId: "STR-101", zone: "Bakery A1", category: "Bread & Pastry", products: 24, capacity: 30, stockLevel: 80, lastRestocked: "2026-08-04 09:30" },
  { id: "SHL-002", storeId: "STR-101", zone: "Dairy B2", category: "Dairy & Eggs", products: 36, capacity: 40, stockLevel: 90, lastRestocked: "2026-08-04 08:15" },
  { id: "SHL-003", storeId: "STR-101", zone: "Produce C1", category: "Fresh Produce", products: 42, capacity: 50, stockLevel: 68, lastRestocked: "2026-08-04 07:00" },
  { id: "SHL-004", storeId: "STR-101", zone: "Cosmetics D4", category: "Beauty & Personal Care", products: 58, capacity: 60, stockLevel: 95, lastRestocked: "2026-08-04 10:00" },
  { id: "SHL-005", storeId: "STR-101", zone: "Electronics E1", category: "Electronics", products: 32, capacity: 40, stockLevel: 72, lastRestocked: "2026-08-03 16:00" },
  { id: "SHL-006", storeId: "STR-101", zone: "Household F1", category: "Household", products: 28, capacity: 35, stockLevel: 65, lastRestocked: "2026-08-03 14:30" },
];

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
export const zones = [
  { id: "Z-01", name: "Bakery", visitors: 4200, dwellTime: 24.2, attentionScore: 94, conversionRate: 22.4, revenue: 18400, engagement: 88, trafficDensity: 82, color: "#10B981" },
  { id: "Z-02", name: "Dairy", visitors: 3800, dwellTime: 18.6, attentionScore: 88, conversionRate: 19.1, revenue: 14200, engagement: 82, trafficDensity: 78, color: "#3B82F6" },
  { id: "Z-03", name: "Produce", visitors: 3200, dwellTime: 15.4, attentionScore: 82, conversionRate: 16.8, revenue: 11800, engagement: 76, trafficDensity: 72, color: "#06B6D4" },
  { id: "Z-04", name: "Cosmetics", visitors: 2900, dwellTime: 22.1, attentionScore: 91, conversionRate: 24.6, revenue: 21400, engagement: 92, trafficDensity: 68, color: "#8B5CF6" },
  { id: "Z-05", name: "Electronics", visitors: 2100, dwellTime: 28.4, attentionScore: 86, conversionRate: 14.2, revenue: 32600, engagement: 78, trafficDensity: 52, color: "#F59E0B" },
  { id: "Z-06", name: "Household", visitors: 1800, dwellTime: 8.2, attentionScore: 62, conversionRate: 8.4, revenue: 4200, engagement: 48, trafficDensity: 38, color: "#EF4444" },
  { id: "Z-07", name: "Frozen Foods", visitors: 2400, dwellTime: 12.6, attentionScore: 72, conversionRate: 18.2, revenue: 9800, engagement: 64, trafficDensity: 58, color: "#14B8A6" },
  { id: "Z-08", name: "Checkout", visitors: 5200, dwellTime: 6.8, attentionScore: 68, conversionRate: 92.4, revenue: 0, engagement: 42, trafficDensity: 90, color: "#F97316" },
];

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
export const products = [
  { id: "P-001", name: "Artisan Sourdough Bread", category: "Bread & Pastry", zone: "Bakery A1", views: 3420, pickups: 2180, purchases: 1640, convRate: 47.9, revenue: 12300, attentionScore: 96, avgDwell: 4.8, price: 7.50 },
  { id: "P-002", name: "Organic Almond Milk", category: "Dairy & Eggs", zone: "Dairy B2", views: 2810, pickups: 1720, purchases: 1280, convRate: 45.6, revenue: 8960, attentionScore: 91, avgDwell: 3.2, price: 7.00 },
  { id: "P-003", name: "Premium Greek Yogurt", category: "Dairy & Eggs", zone: "Dairy B2", views: 2540, pickups: 1580, purchases: 1120, convRate: 44.1, revenue: 7840, attentionScore: 89, avgDwell: 2.8, price: 7.00 },
  { id: "P-004", name: "Free-Range Eggs (12pk)", category: "Dairy & Eggs", zone: "Dairy B2", views: 2280, pickups: 1640, purchases: 1380, convRate: 60.5, revenue: 9660, attentionScore: 87, avgDwell: 1.4, price: 7.00 },
  { id: "P-005", name: "Avocado (Hass, 4-pack)", category: "Fresh Produce", zone: "Produce C1", views: 2120, pickups: 1320, purchases: 940, convRate: 44.3, revenue: 7520, attentionScore: 85, avgDwell: 2.2, price: 8.00 },
  { id: "P-006", name: "Luxury Face Serum", category: "Beauty & Personal Care", zone: "Cosmetics D4", views: 1980, pickups: 1420, purchases: 680, convRate: 34.3, revenue: 23800, attentionScore: 92, avgDwell: 5.8, price: 35.00 },
  { id: "P-007", name: "Wireless Earbuds Pro", category: "Electronics", zone: "Electronics E1", views: 1860, pickups: 1080, purchases: 420, convRate: 22.6, revenue: 33600, attentionScore: 88, avgDwell: 6.4, price: 80.00 },
  { id: "P-008", name: "Multi-Surface Cleaner", category: "Household", zone: "Household F1", views: 940, pickups: 420, purchases: 340, convRate: 36.2, revenue: 2720, attentionScore: 58, avgDwell: 1.2, price: 8.00 },
  { id: "P-009", name: "Organic Granola Mix", category: "Bread & Pastry", zone: "Bakery A1", views: 1640, pickups: 980, purchases: 720, convRate: 43.9, revenue: 5760, attentionScore: 82, avgDwell: 3.1, price: 8.00 },
  { id: "P-010", name: "Fresh Salmon Fillet", category: "Fresh Produce", zone: "Deli", views: 1420, pickups: 890, purchases: 640, convRate: 45.1, revenue: 12800, attentionScore: 84, avgDwell: 3.8, price: 20.00 },
];

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
  { direction: "Eye Level (120-160cm)", pct: 42, score: 96 },
  { direction: "Above Eye Level", pct: 18, score: 72 },
  { direction: "Below Eye Level", pct: 14, score: 64 },
  { direction: "Left Peripheral", pct: 12, score: 58 },
  { direction: "Right Peripheral", pct: 14, score: 62 },
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
  { recency: 2, frequency: 4.2, monetary: 68.4, segment: "Loyal Champions", size: 4820 },
  { recency: 5, frequency: 2.8, monetary: 52.1, segment: "Potential Loyalists", size: 5640 },
  { recency: 18, frequency: 1.4, monetary: 42.8, segment: "At-Risk", size: 3200 },
  { recency: 3, frequency: 1.2, monetary: 38.2, segment: "New Customers", size: 4100 },
  { recency: 42, frequency: 0.6, monetary: 28.6, segment: "Hibernating", size: 2480 },
  { recency: 4, frequency: 3.1, monetary: 24.2, segment: "Price Sensitive", size: 1560 },
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
export function getCentralScaledData(period) {
  let mult = 1.0;
  if (period === "Yesterday") mult = 0.92;
  else if (period === "Last 7 Days") mult = 6.4;
  else if (period === "Last 30 Days") mult = 26.5;
  else if (period === "Custom Date Range") mult = 1.8;

  const totalVisitors = Math.round(1427 * mult);
  const peakTraffic = Math.round(320 * mult);

  return {
    mult,
    kpis: {
      totalVisitors,
      totalVisitorsChange: 12.4,
      currentCustomers: 42,
      avgDwellTime: 18.4,
      avgDwellTimeChange: 8.2,
      productsPicked: Math.round(2140 * mult),
      productsPickedChange: 11.2,
      conversionRate: 18.2,
      conversionRateChange: 5.1,
      cameraStatus: "3/4 Online",
      salesRevenue: Math.round(14850 * mult),
      salesRevenueChange: 22.3,
      peakHourTraffic: peakTraffic,
      peakHour: "5:00 PM – 7:00 PM",
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
    customersByZone: [
      { zone: "Entrance", name: "Entrance", val: Math.round(totalVisitors * 0.22), count: Math.round(totalVisitors * 0.22), scaledVisitors: Math.round(totalVisitors * 0.22), fill: "#2563EB", color: "#2563EB" },
      { zone: "Bakery", name: "Bakery", val: Math.round(totalVisitors * 0.18), count: Math.round(totalVisitors * 0.18), scaledVisitors: Math.round(totalVisitors * 0.18), fill: "#10B981", color: "#10B981" },
      { zone: "Dairy", name: "Dairy", val: Math.round(totalVisitors * 0.17), count: Math.round(totalVisitors * 0.17), scaledVisitors: Math.round(totalVisitors * 0.17), fill: "#8B5CF6", color: "#8B5CF6" },
      { zone: "Produce", name: "Produce", val: Math.round(totalVisitors * 0.14), count: Math.round(totalVisitors * 0.14), scaledVisitors: Math.round(totalVisitors * 0.14), fill: "#F59E0B", color: "#F59E0B" },
      { zone: "Cosmetics", name: "Cosmetics", val: Math.round(totalVisitors * 0.10), count: Math.round(totalVisitors * 0.10), scaledVisitors: Math.round(totalVisitors * 0.10), fill: "#06B6D4", color: "#06B6D4" },
      { zone: "Electronics", name: "Electronics", val: Math.round(totalVisitors * 0.09), count: Math.round(totalVisitors * 0.09), scaledVisitors: Math.round(totalVisitors * 0.09), fill: "#F97316", color: "#F97316" }
    ],
    segmentationData: [
      { name: "New Visitors", value: Math.round(totalVisitors * 0.63), color: "#2563EB" },
      { name: "Returning Visitors", value: Math.round(totalVisitors * 0.37), color: "#10B981" }
    ],
    productInteraction: [
      { name: "Picked", value: Math.round(totalVisitors * 0.15), color: "#10B981" },
      { name: "Viewed", value: Math.round(totalVisitors * 0.35), color: "#2563EB" },
      { name: "Returned", value: Math.round(totalVisitors * 0.05), color: "#F59E0B" },
      { name: "Compared", value: Math.round(totalVisitors * 0.08), color: "#8B5CF6" }
    ],
    topPickedProducts: [
      { rank: 1, name: "Artisan Sourdough Bread", category: "Bakery", picked: Math.round(totalVisitors * 0.015), change: "↑ 12%", color: "text-emerald-400" },
      { rank: 2, name: "Organic Almond Milk", category: "Dairy", picked: Math.round(totalVisitors * 0.012), change: "↑ 7%", color: "text-emerald-400" },
      { rank: 3, name: "Free-Range Eggs (12pk)", category: "Dairy", picked: Math.round(totalVisitors * 0.011), change: "↑ 3%", color: "text-emerald-400" },
      { rank: 4, name: "Premium Greek Yogurt", category: "Dairy", picked: Math.round(totalVisitors * 0.010), change: "↑ 8%", color: "text-emerald-400" },
      { rank: 5, name: "Avocado (Hass, 4-pack)", category: "Produce", picked: Math.round(totalVisitors * 0.008), change: "↑ 5%", color: "text-emerald-400" }
    ],
    entryExitPoints: [
      { name: "Main Entrance", entries: Math.round(8420 * mult), exits: Math.round(7980 * mult), pct: 58.2, scaledEntries: Math.round(8420 * mult) },
      { name: "Side Entrance (Parking)", entries: Math.round(3640 * mult), exits: Math.round(3890 * mult), pct: 25.4, scaledEntries: Math.round(3640 * mult) },
      { name: "Mall Connector", entries: Math.round(2360 * mult), exits: Math.round(2410 * mult), pct: 16.4, scaledEntries: Math.round(2360 * mult) }
    ]
  };
}
