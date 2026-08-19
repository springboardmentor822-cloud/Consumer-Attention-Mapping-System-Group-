// Consumer Attention Mapping System (CAMS) - Core Data & Logic Engine

export const DEMO_USERS = [
  {
    id: 'usr_admin',
    name: 'System Administrator',
    email: 'admin@cams.ai',
    password: 'password123',
    role: 'Admin',
    avatar: 'SA',
    title: 'Super Administrator',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    id: 'usr_store',
    name: 'Store Manager',
    email: 'store.manager@cams.ai',
    password: 'password123',
    role: 'Store Manager',
    avatar: 'SM',
    title: 'Store Operations Manager',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: 'usr_analyst',
    name: 'Retail Analyst',
    email: 'analyst@cams.ai',
    password: 'password123',
    role: 'Retail Analyst',
    avatar: 'RA',
    title: 'Lead Behavioral Data Scientist',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'usr_marketing',
    name: 'Marketing Manager',
    email: 'marketing@cams.ai',
    password: 'password123',
    role: 'Marketing Manager',
    avatar: 'MM',
    title: 'Head of Retail Campaigns',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
];

export const STORES = [
  { id: 'store_01', name: 'Store 01 - City Mall Flagship', location: 'Downtown Hub', totalCameras: 6, onlineCameras: 6, status: 'Active' },
  { id: 'store_02', name: 'Store 02 - Downtown Plaza', location: 'Financial District', totalCameras: 4, onlineCameras: 4, status: 'Active' },
  { id: 'store_03', name: 'Store 03 - Metro Center', location: 'Metro Station North', totalCameras: 8, onlineCameras: 7, status: 'Active' },
  { id: 'store_04', name: 'Store 04 - Grand Galleria', location: 'East Wing Level 2', totalCameras: 5, onlineCameras: 4, status: 'Active' },
];

export const CAMERAS = [
  { id: 'cam_1', name: 'Camera 1 - Entrance Foyer', zone: 'Zone 1 (Entrance)', video: '/videos/camera1-entrance.mp4', image: '/images/cam_1_photoreal.jpg', fps: 30, resolution: '1080p', status: 'Online', count: 12 },
  { id: 'cam_2', name: 'Camera 2 - Main Aisle A', zone: 'Zone 2 (Aisle A)', video: '/videos/camera2-main-aisle.mp4', image: '/images/cam_2_photoreal.jpg', fps: 30, resolution: '1080p', status: 'Online', count: 8 },
  { id: 'cam_3', name: 'Camera 3 - Shelf 1 & 2 Engagement', zone: 'Zone 2 (Shelf Section)', video: '/videos/camera3-shelf-engagement.mp4', image: '/images/cam_3_photoreal.jpg', fps: 30, resolution: '1080p', status: 'Online', count: 15 },
  { id: 'cam_4', name: 'Camera 4 - Promotional Area', zone: 'Zone 2 (Promo Zone)', video: '/videos/camera4-promotional.mp4', image: '/images/cam_4_photoreal.jpg', fps: 30, resolution: '1080p', status: 'Online', count: 6 },
  { id: 'cam_5', name: 'Camera 5 - Checkout Lanes', zone: 'Zone 3 (Checkout)', video: '/videos/camera5-checkout.mp4', image: '/images/cam_5_checkout.jpg', fps: 30, resolution: '1080p', status: 'Online', count: 18 },
  { id: 'cam_6', name: 'Camera 6 - Exit Foyer', zone: 'Zone 1 (Exit)', video: '/videos/camera6-exit.mp4', image: '/images/cam_6_photoreal.jpg', fps: 30, resolution: '1080p', status: 'Online', count: 9 },
];

export const PRODUCTS_CATALOG = [
  {
    id: 'sku_101',
    name: 'Coca-Cola 500ml',
    category: 'Beverages',
    shelfLocation: 'Shelf 1 - Eye Level (ROI 1)',
    passingTraffic: 88,
    dwellTime: 85,
    interactionCount: 78,
    stockoutRate: 5,
    views: 450,
    pickups: 369,
    purchases: 276,
    currentShelfHeight: 'Eye Level',
  },
  {
    id: 'sku_102',
    name: 'Lays Classic Chips 50g',
    category: 'Snacks',
    shelfLocation: 'Shelf 1 - Top Slot (ROI 1)',
    passingTraffic: 95,
    dwellTime: 92,
    interactionCount: 88,
    stockoutRate: 8,
    views: 610,
    pickups: 427,
    purchases: 277,
    currentShelfHeight: 'Top Slot',
  },
  {
    id: 'sku_103',
    name: 'Parle-G 120g Biscuits',
    category: 'Bakery',
    shelfLocation: 'Shelf 2 - Bottom Slot (ROI 2)',
    passingTraffic: 90,
    dwellTime: 88,
    interactionCount: 90,
    stockoutRate: 2,
    views: 520,
    pickups: 442,
    purchases: 353,
    currentShelfHeight: 'Bottom Slot',
  },
  {
    id: 'sku_104',
    name: 'Maggi 2-Minute Noodles',
    category: 'Instant Food',
    shelfLocation: 'Shelf 2 - Eye Level (ROI 2)',
    passingTraffic: 82,
    dwellTime: 75,
    interactionCount: 80,
    stockoutRate: 4,
    views: 480,
    pickups: 403,
    purchases: 314,
    currentShelfHeight: 'Eye Level',
  },
  {
    id: 'sku_105',
    name: 'Organic Almond Milk 1L',
    category: 'Dairy Alternative',
    shelfLocation: 'Shelf 3 - Bottom Slot (ROI 3)',
    passingTraffic: 92,
    dwellTime: 18,
    interactionCount: 15,
    stockoutRate: 0,
    views: 380,
    pickups: 95,
    purchases: 19,
    currentShelfHeight: 'Bottom Slot',
  },
  {
    id: 'sku_106',
    name: 'Nutella Hazelnut Spread 350g',
    category: 'Spreads',
    shelfLocation: 'Shelf 2 - Middle Slot (ROI 2)',
    passingTraffic: 70,
    dwellTime: 85,
    interactionCount: 65,
    stockoutRate: 25,
    views: 290,
    pickups: 174,
    purchases: 87,
    currentShelfHeight: 'Middle Slot',
  }
];

export function calculateAttractivenessScore(product) {
  const w1 = 0.25;
  const w2 = 0.35;
  const w3 = 0.30;
  const w4 = 0.10;

  const score = (
    w1 * product.passingTraffic +
    w2 * product.dwellTime +
    w3 * product.interactionCount -
    w4 * product.stockoutRate
  );

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

export function generateRecommendations(catalog) {
  const recommendations = [];

  catalog.forEach(product => {
    const score = calculateAttractivenessScore(product);

    if (product.passingTraffic >= 85 && product.dwellTime < 30) {
      recommendations.push({
        id: `rec_${product.id}_stopping_power`,
        skuId: product.id,
        productName: product.name,
        priority: 'High',
        category: 'Visual Merchandising Alert',
        issue: 'High Foot Traffic but Low Dwell Time (Lacks Stopping Power)',
        actionItem: `High passing traffic (${product.passingTraffic}%) but shoppers walk past without stopping (Dwell: ${product.dwellTime}s). Improve visual merchandising, shelf talker, or promotional pricing sign.`,
        targetShelf: product.shelfLocation,
        expectedUplift: '+22% Stopping Power & Dwell Lift',
      });
    }

    if (product.dwellTime >= 70 && (product.stockoutRate > 15 || product.purchases / product.views < 0.35)) {
      recommendations.push({
        id: `rec_${product.id}_conversion_fail`,
        skuId: product.id,
        productName: product.name,
        priority: 'Critical',
        category: 'Conversion & Stockout Audit',
        issue: 'High Dwell Time but Low Sales Conversion (Stockout / Price Barrier)',
        actionItem: `High customer interest (Dwell: ${product.dwellTime}s) but conversion fails (Stockout Rate: ${product.stockoutRate}%). Replenish shelf inventory and audit price point immediately.`,
        targetShelf: product.shelfLocation,
        expectedUplift: '+31% Purchase Conversion',
      });
    }

    if (score >= 75 && product.currentShelfHeight === 'Bottom Slot') {
      recommendations.push({
        id: `rec_${product.id}_relocate`,
        skuId: product.id,
        productName: product.name,
        priority: 'High',
        category: 'Eye-Level Slot Optimization',
        issue: 'Top-Performing SKU Placed on Bottom Shelf Slot',
        actionItem: `Product Attractiveness Score is ${score}/100, but item sits on bottom shelf. Relocate to Eye-Level slot (vertical height with highest gaze density).`,
        targetShelf: 'Shelf 1 - Eye Level Slot',
        expectedUplift: '+28% Sales Uplift',
      });
    }
  });

  recommendations.push({
    id: 'rec_dead_zone_aisle3',
    skuId: 'ZONE_03',
    productName: 'Aisle 3 Rear Section',
    priority: 'High',
    category: 'Dead Zone Optimization',
    issue: 'Consistently Low Foot Traffic & Cold Dwell Metrics',
    actionItem: 'Aisle 3 rear has 65% lower traffic than store baseline. Reposition high-demand anchor products (e.g. Coca-Cola, Maggi) here to draw customer flow.',
    targetShelf: 'Aisle 3 - Rear Wall Display',
    expectedUplift: '+40% Traffic Redirection',
  });

  return recommendations;
}

export const SHOPPER_SEGMENTS = [
  { id: 'explorers', name: 'Explorers', percentage: 32, avgDwell: '8m 45s', pickupRate: '15%', description: 'High total path distance, high dwell time across multiple zones, low pickup frequency.' },
  { id: 'quick_buyers', name: 'Quick Buyers', percentage: 28, avgDwell: '2m 10s', pickupRate: '85%', description: 'Low dwell time, direct path trajectory to single zone, immediate product pickup & checkout.' },
  { id: 'comparison', name: 'Comparison Shoppers', percentage: 18, avgDwell: '6m 20s', pickupRate: '60%', description: 'Extended dwell time at single shelf, high product pickup and return events.' },
  { id: 'impulse', name: 'Impulse Buyers', percentage: 14, avgDwell: '3m 50s', pickupRate: '70%', description: 'Moderate path length, short view duration followed by immediate pickup.' },
  { id: 'brand_loyal', name: 'Brand Loyal Customers', percentage: 8, avgDwell: '4m 15s', pickupRate: '92%', description: 'Targeted navigation to specific brand zones with high purchase conversion.' },
];

export const MOCK_ALERTS = [
  { id: 1, type: 'danger', title: 'High Crowd Detected', subtitle: 'Aisle B is crowded (18 shoppers)', time: '10:24 AM', icon: 'Users' },
  { id: 2, type: 'warning', title: 'Shelf C - Low Attention', subtitle: 'Attention time dropped below threshold', time: '10:18 AM', icon: 'EyeOff' },
  { id: 3, type: 'info', title: 'Camera 6 Offline Alert', subtitle: 'Promotion Area camera reconnected', time: '10:15 AM', icon: 'VideoOff' },
  { id: 4, type: 'danger', title: 'Long Queue at Checkout', subtitle: '8 customers in queue at Checkout 2', time: '10:10 AM', icon: 'Clock' },
];
