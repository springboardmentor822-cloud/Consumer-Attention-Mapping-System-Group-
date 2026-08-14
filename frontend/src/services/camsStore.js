export const camsNavMap = {
  Administrator: [
    "Dashboard", "Store Management", "Camera Management", "Shelf Management", 
    "Platform Monitoring", "User & Role Management", "Reports", "Settings", "Notifications"
  ],
  "Store Manager": [
    "Dashboard", "Live Cameras", "Visitors", "Store Traffic", "Shelf Performance", 
    "Product Interaction", "Heat Map", "Alerts", "Reports", "Settings"
  ],
  "Marketing Manager": [
    "Dashboard", "Campaign Performance", "Promotion Effectiveness", "Product Visibility", 
    "Product Attractiveness", "Customer Engagement", "Conversion Analysis", "Attention Insights", 
    "Traffic Insights", "Marketing Recommendations", "Action Center", "Campaign Reports", "Export Reports", "Settings"
  ],
  "Retail Analyst": [
    "Dashboard", "Consumer Journey Analysis", "Attention Analytics", "Consumer Segmentation", 
    "Shopping Behavior Analysis", "Dwell Time Analysis", "Traffic Flow Analysis", "Zone Performance", 
    "Product Analytics", "Category Performance", "AI Insights", "Reports", "Export Data", "Settings"
  ]
};

export const camsKpis = [
  { label: "Today's Visitors", value: "1,450", change: "+12.4%", color: "#3B82F6" },
  { label: "Products Picked", value: "12,337", change: "+8.1%", color: "#00E676" },
  { label: "Avg Dwell Time", value: "18.5 Min", change: "+2.3%", color: "#A855F7" },
  { label: "Active Cameras", value: "32 / 32", change: "100% Online", color: "#00BCD4" },
  { label: "Conversion Rate", value: "14.8%", change: "+3.1%", color: "#FB8C00" },
  { label: "Total Revenue", value: "$309,005", change: "+18.2%", color: "#00E676" },
  { label: "Peak Zone Score", value: "94/100", change: "Bakery A1", color: "#FFC107" },
  { label: "Platform Health", value: "99.9%", change: "Optimal", color: "#00E676" }
];

export const pageContentConfig = {
  // Administrator Pages
  "Store Management": { title: "Store Management", desc: "Add, edit, delete, and configure store locations, manager assignments, and regional status." },
  "Camera Management": { title: "Camera Management", desc: "Register cameras, monitor health, map stream URLs, and set spatial configurations." },
  "Shelf Management": { title: "Shelf Management", desc: "Manage shelf layouts, bounding box coordinates, zone mapping, and category linkages." },
  "Platform Monitoring": { title: "Platform Monitoring", desc: "Real-time infrastructure health: API, Database, GPU/CPU loads, memory usage, and AI services." },
  "User & Role Management": { title: "User & Role Management", desc: "Access Control (RBAC), user permissions, credentials, and role provisioning." },

  // Store Manager Pages
  "Live Cameras": { title: "Live AI Camera Feeds", desc: "Full-screen streaming with live YOLOv8 detection, ByteTrack tracking, gaze vectors, and FPS stats." },
  "Visitors": { title: "Visitor Analytics", desc: "Hourly visitor distribution, peak traffic hours, returning customer analysis, and demographics." },
  "Store Traffic": { title: "Store Traffic & Flow", desc: "Customer density, department traffic breakdown, pathing vectors, and entrance/exit velocity." },
  "Shelf Performance": { title: "Shelf Performance Analytics", desc: "Pickup vs Return metrics, shelf conversion rates, and engagement performance ranks." },
  "Product Interaction": { title: "Product Interaction Insights", desc: "Product views, pickups, returns, average dwell time per item, and purchase probability scores." },
  "Heat Map": { title: "Store Density & Attention Heatmap", desc: "Real-time spatial overlays for shopper density, zone heatmaps, and camera coverage zones." },
  "Alerts": { title: "Store Alerts & Incident Center", desc: "Low stock warnings, camera offline alerts, high crowd density thresholds, and AI anomaly detection." },

  // Marketing Manager Pages
  "Campaign Performance": { title: "Campaign Performance", desc: "Track impressions, reach, active promotional lift, and historical campaign trends." },
  "Promotion Effectiveness": { title: "Promotion Effectiveness", desc: "Before vs After promotional impact, sales lift calculations, and campaign ROI metrics." },
  "Product Visibility": { title: "Product Visibility Analytics", desc: "Shelf placement visibility scores, visual heatmaps, and eye-level exposure ranking." },
  "Product Attractiveness": { title: "Product Attractiveness Index", desc: "Spider/Radar graph analysis comparing dwell time, pickup rate, and gaze retention per product." },
  "Customer Engagement": { title: "Customer Engagement Overview", desc: "Engagement participation rate, session length, interaction counts, and brand affinity." },
  "Conversion Analysis": { title: "Conversion & Funnel Pipeline", desc: "6-stage physical funnel tracking from Awareness to Purchase & Retention with Attention vs Conversion charts." },
  "Attention Insights": { title: "Attention Insights", desc: "Consumer focus timelines, gaze duration trends, and high-impact zone mapping." },
  "Traffic Insights": { title: "Marketing Traffic Analysis", desc: "Promotional traffic draw, department conversion, and campaign foot-traffic attribution." },
  "Marketing Recommendations": { title: "AI Marketing Recommendations", desc: "Real-time recommendations for optimal product placement, cross-merchandising, and endcap swaps." },
  "Action Center": { title: "Marketing Action Center", desc: "Task management, pending campaign approvals, and automated merchandising actions." },
  "Export Reports": { title: "Export Marketing Reports", desc: "Export comprehensive analytics in PDF, Excel, CSV, or JSON formats." },

  // Retail Analyst Pages
  "Consumer Journey Analysis": { title: "Consumer Journey Analysis", desc: "Pathing flow analysis, journey completion rates, and cross-departmental navigation paths." },
  "Attention Analytics": { title: "Attention Analytics", desc: "Gaze vector retention timelines, department attention distribution, and focal point analysis." },
  "Consumer Segmentation": { title: "Consumer Segmentation", desc: "Behavioral clustering, shopping style grouping, and purchasing pattern segments." },
  "Shopping Behavior Analysis": { title: "Shopping Behavior Analysis", desc: "Pattern recognition, touch-to-buy ratios, decision delay metrics, and cart abandonment." },
  "Dwell Time Analysis": { title: "Dwell Time Analysis", desc: "Zone-by-zone, department, and product-specific dwell time distributions." },
  "Traffic Flow Analysis": { title: "Traffic Flow & Bottlenecks", desc: "Walking paths, choke-point detection, zone congestion, and entry/exit flow dynamics." },
  "Zone Performance": { title: "Zone Performance Ranks", desc: "Top vs lowest performing store zones, conversion density, and spatial ROI comparison." },
  "Product Analytics": { title: "Product Analytics", desc: "Product conversion curves, attention decay rates, and comparative performance indexes." },
  "Category Performance": { title: "Category Performance Analysis", desc: "Macro category revenue, attention share, sales conversion, and cross-category affinity." },
  "AI Insights": { title: "AI Predictive Insights & Forecasts", desc: "Machine learning trend predictions, future sales velocity, and automated spatial suggestions." },
  "Export Data": { title: "Export Raw Analytical Data", desc: "Data export center supporting CSV, JSON, Excel, and automated scheduled reporting." }
};
