// Comprehensive Mock Data Generator for Role-Based System Dashboards

export const mockDashboardData = {
  // Common Stores & System Meta
  stores: [
    { id: 'store-01', name: 'City Mall Superstore', location: 'Downtown' },
    { id: 'store-02', name: 'Metro Plaza Express', location: 'Suburbs' },
    { id: 'store-03', name: 'Central Hub Outlet', location: 'Commercial Zone' },
  ],

  // 1. Store Manager Dashboard Data
  storeManager: {
    kpis: {
      todayVisitors: { value: 1248, change: '+12.5%', isPositive: true },
      currentCustomers: { value: 78, change: 'Live in store', isPositive: true },
      avgDwellTime: { value: '3m 42s', change: '+6.3%', isPositive: true },
      productsPicked: { value: 362, change: '+15.7%', isPositive: true },
      conversionRate: { value: '24.6%', change: '+5.6%', isPositive: true },
      onlineCameras: { value: '8/8', change: 'All online', isPositive: true },
    },
    liveCameras: [
      { id: 'cam-01', name: 'Entrance Camera 1', zone: 'Entrance', count: 18, crowd: 'Medium', health: 'Online', activity: 85, live: true },
      { id: 'cam-02', name: 'Aisle A - Electronics', zone: 'Aisle A', count: 12, crowd: 'Low', health: 'Online', activity: 92, live: true },
      { id: 'cam-03', name: 'Aisle B - Apparel', zone: 'Aisle B', count: 24, crowd: 'High', health: 'Online', activity: 78, live: true },
      { id: 'cam-04', name: 'Promotion Area', zone: 'Promo Zone', count: 15, crowd: 'Medium', health: 'Online', activity: 94, live: true },
      { id: 'cam-05', name: 'Checkout Queue', zone: 'Checkout', count: 9, crowd: 'Medium', health: 'Online', activity: 60, live: true },
      { id: 'cam-06', name: 'Exit Stream 2', zone: 'Exit', count: 4, crowd: 'Low', health: 'Online', activity: 40, live: true },
    ],
    trafficHourly: [
      { hour: '9 AM', visitors: 120, current: 45 },
      { hour: '11 AM', visitors: 280, current: 95 },
      { hour: '1 PM', visitors: 340, current: 110 },
      { hour: '3 PM', visitors: 260, current: 85 },
      { hour: '5 PM', visitors: 410, current: 130 },
      { hour: '7 PM', visitors: 310, current: 90 },
      { hour: '9 PM', visitors: 150, current: 35 },
    ],
    dailyFootfall: [
      { date: 'May 16', footfall: 1120 },
      { date: 'May 17', footfall: 1250 },
      { date: 'May 18', footfall: 1080 },
      { date: 'May 19', footfall: 1390 },
      { date: 'May 20', footfall: 1450 },
      { date: 'May 21', footfall: 1680 },
      { date: 'May 22', footfall: 1248 },
    ],
    zoneOccupancy: [
      { zone: 'Entrance', count: 320, percentage: 25 },
      { zone: 'Electronics', count: 280, percentage: 22 },
      { zone: 'Apparel', count: 390, percentage: 31 },
      { zone: 'Home & Living', count: 180, percentage: 14 },
      { zone: 'Checkout', count: 105, percentage: 8 },
    ],
    shelfPerformance: {
      scores: [
        { shelf: 'Shelf A (Electronics)', score: 92, status: 'High' },
        { shelf: 'Shelf B (Apparel)', score: 74, status: 'Good' },
        { shelf: 'Shelf C (Home Care)', score: 61, status: 'Medium' },
        { shelf: 'Shelf D (Groceries)', score: 54, status: 'Needs Attention' },
        { shelf: 'Shelf E (Footwear)', score: 38, status: 'Low' },
      ],
      funnel: [
        { category: 'Electronics', viewed: 850, picked: 420, purchased: 290 },
        { category: 'Apparel', viewed: 920, picked: 510, purchased: 310 },
        { category: 'Home Care', viewed: 640, picked: 280, purchased: 190 },
        { category: 'Personal Care', viewed: 510, picked: 210, purchased: 140 },
        { category: 'Groceries', viewed: 780, picked: 490, purchased: 380 },
      ],
    },
    productInteraction: {
      topPicked: [
        { name: 'Wireless Headphones', category: 'Electronics', picks: 142 },
        { name: 'Men Casual Shirt', category: 'Apparel', picks: 118 },
        { name: 'Aroma Diffuser', category: 'Home', picks: 95 },
        { name: 'Running Shoes', category: 'Footwear', picks: 84 },
      ],
      mostReturned: [
        { name: 'Denim Jacket XL', returns: 18, reason: 'Size fit' },
        { name: 'Bluetooth Speaker', returns: 12, reason: 'Sound test' },
        { name: 'Smartwatch Gen 2', returns: 9, reason: 'Color preference' },
      ],
      mostCompared: [
        { name: 'Phone 14 vs Galaxy S23', count: 85 },
        { name: 'Noise ANC vs Sony XM4', count: 64 },
        { name: '4K OLED vs QLED TV', count: 42 },
      ],
      pickupTrend: [
        { time: '10:00', pickups: 24 },
        { time: '12:00', pickups: 58 },
        { time: '14:00', pickups: 76 },
        { time: '16:00', pickups: 89 },
        { time: '18:00', pickups: 65 },
        { time: '20:00', pickups: 50 },
      ],
    },
    conversion: {
      funnel: [
        { stage: 'Store Entry', count: 1248, percentage: '100%' },
        { stage: 'Shelf View', count: 980, percentage: '78.5%' },
        { stage: 'Product Pickup', count: 540, percentage: '43.2%' },
        { stage: 'Checkout Purchase', count: 307, percentage: '24.6%' },
      ],
      gaugeValue: 24.6,
      targetValue: 28.0,
    },
    alerts: [
      { id: 'alt-1', title: 'High Crowd Detected', time: '10:24 AM', zone: 'Aisle B (Apparel)', priority: 'High', type: 'crowd' },
      { id: 'alt-2', title: 'Shelf C Low Attention', time: '10:18 AM', zone: 'Home Care', priority: 'Medium', type: 'attention' },
      { id: 'alt-3', title: 'Camera 6 Brief Offline', time: '10:15 AM', zone: 'Promo Area', priority: 'High', type: 'camera' },
      { id: 'alt-4', title: 'Long Queue at Checkout', time: '10:10 AM', zone: 'Checkout 3', priority: 'Medium', type: 'queue' },
      { id: 'alt-5', title: 'Rice Bag Out of Stock', time: '10:08 AM', zone: 'Grocery Shelf 2', priority: 'Low', type: 'inventory' },
    ],
  },

  // 2. Retail Analyst Dashboard Data
  retailAnalyst: {
    kpis: {
      avgAttentionTime: { value: '28.6s', change: '+8.7%', isPositive: true },
      avgDwellTime: { value: '4m 12s', change: '+5.2%', isPositive: true },
      repeatVisitors: { value: '33%', change: '+3.1%', isPositive: true },
      avgSessionLength: { value: '14m 20s', change: '+2.4%', isPositive: true },
      customerSegments: { value: 5, change: 'Active models', isPositive: true },
      engagementScore: { value: '78 / 100', change: '+6.4%', isPositive: true },
    },
    sankeyData: {
      nodes: [
        { id: 0, name: 'Entrance (10,000)' },
        { id: 1, name: 'Aisle 1: Grocery (4,500)' },
        { id: 2, name: 'Aisle 2: Electronics (3,000)' },
        { id: 3, name: 'Aisle 3: Apparel (2,500)' },
        { id: 4, name: 'Checkout 1' },
        { id: 5, name: 'Checkout 2' },
        { id: 6, name: 'Exit' },
      ],
      links: [
        { source: 0, target: 1, value: 4500 },
        { source: 0, target: 2, value: 3000 },
        { source: 0, target: 3, value: 2500 },
        { source: 1, target: 4, value: 3200 },
        { source: 1, target: 6, value: 1300 },
        { source: 2, target: 4, value: 2100 },
        { source: 2, target: 5, value: 900 },
        { source: 3, target: 5, value: 2000 },
        { source: 3, target: 6, value: 500 },
      ],
    },
    attentionAnalytics: {
      overTime: [
        { date: 'May 16', attention: 4.2 },
        { date: 'May 17', attention: 5.1 },
        { date: 'May 18', attention: 6.8 },
        { date: 'May 19', attention: 6.2 },
        { date: 'May 20', attention: 6.9 },
        { date: 'May 21', attention: 7.3 },
        { date: 'May 22', attention: 6.4 },
      ],
      boxPlot: [
        { category: 'Electronics', min: 2.1, q1: 4.5, median: 7.2, q3: 11.4, max: 18.5 },
        { category: 'Apparel', min: 1.8, q1: 3.8, median: 6.4, q3: 9.8, max: 15.2 },
        { category: 'Home Living', min: 1.2, q1: 2.9, median: 5.1, q3: 8.2, max: 12.8 },
        { category: 'Personal Care', min: 0.8, q1: 2.1, median: 4.3, q3: 6.5, max: 9.6 },
        { category: 'Groceries', min: 1.5, q1: 3.2, median: 5.8, q3: 8.9, max: 14.1 },
      ],
    },
    segmentation: [
      { name: 'High Value Explorers', value: 3720, percentage: 20, color: '#6366f1' },
      { name: 'Frequent Shoppers', value: 5592, percentage: 30, color: '#3b82f6' },
      { name: 'Occasional Shoppers', value: 6151, percentage: 33, color: '#10b981' },
      { name: 'New Visitors', value: 3179, percentage: 17, color: '#f59e0b' },
    ],
    shoppingBehaviour: {
      viewed: [
        { product: 'Wireless ANC Headphones', score: 94 },
        { product: '4K Smart LED TV 55"', score: 88 },
        { product: 'Designer Linen Shirt', score: 79 },
        { product: 'Espresso Coffee Machine', score: 72 },
      ],
      ignored: [
        { product: 'Old Gen Wired Earphones', score: 82 },
        { product: 'Basic Plastic Water Bottle', score: 74 },
        { product: 'Generic Floor Cleaner', score: 68 },
      ],
      treeMap: [
        { name: 'Electronics', size: 45, color: '#4f46e5' },
        { name: 'Apparel', size: 30, color: '#06b6d4' },
        { name: 'Home & Living', size: 15, color: '#10b981' },
        { name: 'Personal Care', size: 10, color: '#f59e0b' },
      ],
    },
    dwellTime: {
      violin: [
        { bucket: '0-10s', percentage: 28 },
        { bucket: '10-30s', percentage: 24 },
        { bucket: '30-60s', percentage: 28 },
        { bucket: '60s+', percentage: 20 },
      ],
      hourly: [
        { hour: '10:00', avgSec: 180 },
        { hour: '12:00', avgSec: 240 },
        { hour: '14:00', avgSec: 310 },
        { hour: '16:00', avgSec: 280 },
        { hour: '18:00', avgSec: 350 },
        { hour: '20:00', avgSec: 210 },
      ],
    },
    behavioralAnalytics: {
      scatter: [
        { attention: 2, conversion: 5, category: 'Low' },
        { attention: 4, conversion: 12, category: 'Medium' },
        { attention: 6, conversion: 18, category: 'Medium' },
        { attention: 8, conversion: 28, category: 'High' },
        { attention: 10, conversion: 35, category: 'High' },
        { attention: 12, conversion: 42, category: 'High' },
      ],
      bubble: [
        { name: 'Electronics', attention: 8.5, dwell: 6.2, conversion: 32, sales: 850 },
        { name: 'Apparel', attention: 6.8, dwell: 5.4, conversion: 28, sales: 620 },
        { name: 'Home & Kitchen', attention: 5.2, dwell: 4.1, conversion: 21, sales: 410 },
        { name: 'Beauty & Skincare', attention: 7.4, dwell: 4.8, conversion: 36, sales: 530 },
        { name: 'Footwear', attention: 4.9, dwell: 3.8, conversion: 19, sales: 340 },
      ],
    },
  },

  // 3. Marketing Manager Dashboard Data
  marketingManager: {
    kpis: {
      campaignReach: { value: '2.45M', change: '+18.6%', isPositive: true },
      promotionEngagement: { value: '32.8%', change: '+9.7%', isPositive: true },
      productVisibility: { value: '84.2', change: '+4.5%', isPositive: true },
      conversionRate: { value: '14.6%', change: '+7.8%', isPositive: true },
      attractivenessScore: { value: '6.42s', change: '+14.3%', isPositive: true },
      campaignROI: { value: '8.92L', change: '+22.1%', isPositive: true },
    },
    campaignPerformance: [
      { name: 'Summer Sale', impressions: 1800, engagement: 34.5, conversion: 19.2, revenue: 4.2 },
      { name: 'New Arrival Launch', impressions: 610, engagement: 33.1, conversion: 14.8, revenue: 3.8 },
      { name: 'Weekend Bonanza', impressions: 640, engagement: 28.9, conversion: 12.7, revenue: 3.2 },
      { name: 'Festive Offer', impressions: 310, engagement: 26.7, conversion: 11.2, revenue: 2.0 },
      { name: 'Clearance Sale', impressions: 170, engagement: 19.3, conversion: 8.6, revenue: 1.3 },
    ],
    promotionEffectiveness: {
      beforeAfter: [
        { metric: 'Footfall', before: 12.5, after: 18.9, lift: '+51%' },
        { metric: 'Avg Attention Time', before: 4.1, after: 6.8, lift: '+66%' },
        { metric: 'Pickup Rate', before: 15, after: 33, lift: '+120%' },
        { metric: 'Engagement Rate', before: 1.57, after: 2.15, lift: '+37%' },
        { metric: 'Conversion Rate', before: 7.9, after: 14.6, lift: '+85%' },
        { metric: 'Revenue (Lakhs)', before: 5.6, after: 8.9, lift: '+59%' },
      ],
      waterfall: [
        { name: 'Baseline Sales', value: 5.6, isTotal: false },
        { name: 'Promo Banner Lift', value: 1.2, isTotal: false },
        { name: 'Shelf Eye-Level Lift', value: 1.1, isTotal: false },
        { name: 'Discount Attraction', value: 1.0, isTotal: false },
        { name: 'Final Revenue', value: 8.9, isTotal: true },
      ],
      funnel: [
        { stage: 'Impressions', count: 2450000 },
        { stage: 'Viewed', count: 1255000 },
        { stage: 'Engaged', count: 802000 },
        { stage: 'Interested', count: 358000 },
        { stage: 'Converted', count: 179000 },
      ],
    },
    productVisibility: {
      radarMetrics: [
        { metric: 'Angle', score: 88 },
        { metric: 'Height', score: 92 },
        { metric: 'Lighting', score: 76 },
        { metric: 'Distance', score: 84 },
        { metric: 'Unobstructed', score: 90 },
      ],
      shelfScores: [
        { shelf: 'Shelf A (Eye Level)', score: 92 },
        { shelf: 'Shelf B (Top)', score: 79 },
        { shelf: 'Shelf C (Middle)', score: 64 },
        { shelf: 'Shelf D (Lower)', score: 58 },
        { shelf: 'Shelf E (Bottom)', score: 42 },
      ],
    },
    productAttractiveness: {
      ranking: [
        { name: 'Wireless Headphones ANC', rank: 1, score: 9.4 },
        { name: '4K Smart LED TV', rank: 2, score: 8.8 },
        { name: 'Linen Casual Shirt', rank: 3, score: 8.1 },
        { name: 'Aroma Diffuser Luxe', rank: 4, score: 7.6 },
        { name: 'Smart Fitness Band', rank: 5, score: 6.9 },
      ],
      radarBreakdown: [
        { axis: 'Visual Appeal', ProductA: 90, ProductB: 70, ProductC: 60 },
        { axis: 'Placement', ProductA: 85, ProductB: 78, ProductC: 65 },
        { axis: 'Purchase Impact', ProductA: 80, ProductB: 82, ProductC: 55 },
        { axis: 'Pick Rate', ProductA: 92, ProductB: 65, ProductC: 58 },
        { axis: 'Engagement', ProductA: 88, ProductB: 72, ProductC: 62 },
      ],
    },
    recommendations: [
      { id: 'rec-1', title: 'Increase Visibility of Product C on Shelf B', detail: 'High attention, low conversion detected.', impact: 'High Impact', badge: 'high' },
      { id: 'rec-2', title: 'Extend Weekend Bonanza Campaign', detail: 'Performing well with high engagement.', impact: 'Medium Impact', badge: 'medium' },
      { id: 'rec-3', title: 'Relocate Product D to Shelf A', detail: 'Low visibility detected on current shelf.', impact: 'Medium Impact', badge: 'medium' },
      { id: 'rec-4', title: 'Increase Promotion in 6 PM - 9 PM Slot', detail: 'High footfall but low conversion in this time window.', impact: 'Low Impact', badge: 'low' },
    ],
  },

  // 4. Administrator Dashboard Data
  administrator: {
    kpis: {
      totalStores: { value: 28, change: '+7.69% vs last week', isPositive: true },
      totalUsers: { value: 142, change: '+8.33% vs last week', isPositive: true },
      totalCameras: { value: 156, change: '+5.41% vs last week', isPositive: true },
      camerasOnline: { value: 138, detail: '88.46% of total', status: 'Healthy' },
      systemUptime: { value: '99.85%', change: '+0.32% vs last week', isPositive: true },
      activeAlerts: { value: 12, change: '+14.29% vs last week', isPositive: false },
    },
    userAnalytics: {
      roles: [
        { role: 'Store Manager', count: 56, percentage: 39.4, color: '#3b82f6' },
        { role: 'Retail Analyst', count: 32, percentage: 22.5, color: '#10b981' },
        { role: 'Marketing Manager', count: 22, percentage: 15.5, color: '#f59e0b' },
        { role: 'Store Staff', count: 20, percentage: 14.1, color: '#8b5cf6' },
        { role: 'Administrator', count: 12, percentage: 8.5, color: '#ec4899' },
      ],
      userList: [
        { id: 1, name: 'John Doe', email: 'john.doe@attention.ai', role: 'Store Manager', store: 'City Mall Superstore', status: 'Active', lastLogin: '10 mins ago' },
        { id: 2, name: 'Riya Mehta', email: 'riya.m@attention.ai', role: 'Retail Analyst', store: 'All Stores', status: 'Active', lastLogin: '25 mins ago' },
        { id: 3, name: 'Ananya Sharma', email: 'ananya.s@attention.ai', role: 'Marketing Manager', store: 'Corporate Office', status: 'Active', lastLogin: '1 hour ago' },
        { id: 4, name: 'Admin Super', email: 'admin@attention.ai', role: 'Administrator', store: 'Global System', status: 'Active', lastLogin: 'Just now' },
        { id: 5, name: 'Marcus Vance', email: 'marcus.v@attention.ai', role: 'Store Staff', store: 'Metro Plaza Express', status: 'Inactive', lastLogin: '2 days ago' },
      ],
    },
    cameraMonitoring: {
      statusBreakdown: [
        { status: 'Online', count: 138, percentage: 88.46, color: '#10b981' },
        { status: 'Offline', count: 12, percentage: 7.69, color: '#ef4444' },
        { status: 'Maintenance', count: 4, percentage: 2.56, color: '#f59e0b' },
        { status: 'Error', count: 2, percentage: 1.28, color: '#6b7280' },
      ],
      diagnosticGrid: [
        { id: 'cam-101', store: 'City Mall Superstore', resolution: '1080p', fps: 30, status: 'Online', health: '99.4%' },
        { id: 'cam-102', store: 'Metro Plaza Express', resolution: '1080p', fps: 28, status: 'Online', health: '98.2%' },
        { id: 'cam-103', store: 'Central Hub Outlet', resolution: '720p', fps: 15, status: 'Offline', health: '0.0%' },
        { id: 'cam-104', store: 'City Mall Superstore', resolution: '4K Ultra', fps: 60, status: 'Online', health: '99.9%' },
      ],
    },
    infrastructure: {
      systemPerformance: [
        { date: 'May 21', cpu: 42, memory: 58, disk: 34, network: 65 },
        { date: 'May 22', cpu: 48, memory: 62, disk: 35, network: 72 },
        { date: 'May 23', cpu: 55, memory: 68, disk: 36, network: 78 },
        { date: 'May 24', cpu: 61, memory: 72, disk: 38, network: 85 },
        { date: 'May 25', cpu: 58, memory: 70, disk: 38, network: 80 },
        { date: 'May 26', cpu: 50, memory: 65, disk: 39, network: 74 },
        { date: 'May 27', cpu: 45, memory: 60, disk: 40, network: 68 },
      ],
      apiResponseTime: [
        { time: '12:00', latencyMs: 145, requests: 3200 },
        { time: '13:00', latencyMs: 180, requests: 4500 },
        { time: '14:00', latencyMs: 210, requests: 5200 },
        { time: '15:00', latencyMs: 165, requests: 4100 },
        { time: '16:00', latencyMs: 130, requests: 3400 },
      ],
      healthStatus: [
        { service: 'Database Server', status: 'Healthy', uptime: '99.9%' },
        { service: 'API Server', status: 'Healthy', uptime: '99.7%' },
        { service: 'Stream Processing', status: 'Healthy', uptime: '99.8%' },
        { service: 'AI Inference Engine', status: 'Warning', uptime: '97.2%' },
        { service: 'File Storage', status: 'Healthy', uptime: '99.9%' },
      ],
    },
    security: {
      logins: [
        { time: '08:00', successful: 120, failed: 2 },
        { time: '10:00', successful: 340, failed: 8 },
        { time: '12:00', successful: 480, failed: 5 },
        { time: '14:00', successful: 390, failed: 3 },
        { time: '16:00', successful: 290, failed: 1 },
      ],
      auditLogs: [
        { id: 'log-1', time: '10:24 AM', category: 'Camera', message: 'Camera 12 in Store 04 went offline', user: 'System' },
        { id: 'log-2', time: '10:18 AM', category: 'User', message: 'User john.doe@store.com logged in', user: 'john.doe' },
        { id: 'log-3', time: '10:15 AM', category: 'System', message: 'Backup completed successfully', user: 'System' },
        { id: 'log-4', time: '10:10 AM', category: 'User', message: 'New user jana.smith@admin.com created', user: 'admin' },
        { id: 'log-5', time: '10:05 AM', category: 'Settings', message: 'Settings updated for Store 03', user: 'ananya.s' },
      ],
    },
  },
};
