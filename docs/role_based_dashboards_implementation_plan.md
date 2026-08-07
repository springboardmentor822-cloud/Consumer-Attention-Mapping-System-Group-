# Role-Based Frontend Dashboard Implementation Plan

---

## Overview & Architecture

This implementation plan details the frontend architecture for the **Role-Based System Dashboards** based on the system overview, reference design PDF (`images_reference.pdf`), and role specifications:

1. **Store Manager Dashboard**: Focused on day-to-day store operations, camera feeds, traffic trends, zone occupancy, shelf engagement, product interactions, conversion funnels, and real-time operational alerts.
2. **Retail Analyst Dashboard**: Deep dive analytics on customer behavior, consumer journey flow (Sankey Diagram), attention duration trends, box plots, dwell time distributions (Violin Plot), customer segmentation, and behavioral scatter/bubble correlations.
3. **Marketing Manager Dashboard**: Campaign performance metrics, dual-bar promotional lift analysis (Before vs. After), sales lift waterfall chart, radar charts for visibility and attractiveness, category interest, attention vs. conversion scatter plots, and AI decision/priority matrices.
4. **Administrator Dashboard**: System control, hardware diagnostics (CPU, GPU, RAM, Disk, Network), user management data table, camera status diagnostics grid, security logging (login attempts, failed logins), and audit trail timeline.

---

## 1. Store Manager Dashboard Specifications

| Dashboard Section | Component / Chart Implementation | Details & Interaction |
| --- | --- | --- |
| **KPI Cards** | `Today's Visitors`, `Current Customers`, `Avg Dwell Time`, `Products Picked`, `Conversion Rate`, `Online Cameras` | Top horizontal bar with quick metrics & percentage comparison badges. |
| **Live Store Cameras** | 6-Camera Grid View (`Entrance`, `Aisle A`, `Aisle B`, `Promotion Area`, `Checkout`, `Exit`) | Displays live video canvas feed, live count overlay, zone tag, crowd level status (Low/Medium/High), shelf activity score, and camera health indicator. |
| **Store Traffic** | `Hourly Visitor Trend` Line Chart & `Daily Store Footfall Trend` Area Chart | Visualizes hourly footfall distribution and daily store traffic volume. |
| **Zone Occupancy** | `Visitors per Zone` Vertical Bar Chart & `Zone Occupancy Distribution` Donut Chart | Compares visitor volume and percentage breakdown per store zone. |
| **Shelf Performance** | `Shelf Engagement Score` Horizontal Bar Chart, `Viewed vs Picked vs Purchased` Stacked Bar Chart, and `Shelf Attention Heatmap` | Tracks shelf interaction metrics and visual attention zones. |
| **Product Interaction** | `Top Picked Products`, `Most Returned Products`, `Most Compared Products` Horizontal Bar Charts & `Product Pickup Trend` Line Chart | Tracks product movement trends and comparison analytics. |
| **Store Conversion** | `Entry → View → Pickup → Purchase` Funnel Chart & `Store Conversion Rate` Gauge Chart | Monitors customer progression from store entry to final purchase. |
| **Store Alerts & Timeline** | `Recent Alerts` Timeline Chart & `Critical Alert Cards` | Real-time notifications for camera offline, low attention, overcrowding, queue congestion, and out-of-stock items. |

---

## 2. Retail Analyst Dashboard Specifications

| Dashboard Section | Component / Chart Implementation | Details & Interaction |
| --- | --- | --- |
| **KPI Cards** | `Avg Attention Time`, `Avg Dwell Time`, `Repeat Visitors Rate`, `Avg Session Length`, `Customer Segments`, `Engagement Score` | Core analytical benchmarks. |
| **Consumer Journey** | `Sankey Diagram` (Entrance → Category Aisles → Checkout) & `Movement Flow Diagram` | Visualizes flow volume, transition paths, and store navigation sequences. |
| **Attention Analytics** | `Average Attention Duration` Line Chart, `Attention Trend` Area Chart, and `Attention Time Distribution` Box Plot | Deep attention analytics showing medians, quartiles, and time trends. |
| **Customer Segmentation** | `Customer Segments` Pie Chart (*Explorers*, *Quick Buyers*, *Comparison Buyers*, *Impulse Buyers*, *Brand Loyal*) & `Segment Distribution` Donut Chart | Categorizes shopper archetypes and volume proportions. |
| **Shopping Behaviour** | `Most Viewed`, `Most Ignored`, `Most Compared` Horizontal Bar Charts & `Product Category Interest` Tree Map | Hierarchical representation of category interest and ignored shelf items. |
| **Heatmaps Suite** | Multi-tab/Grid Visual Heatmaps (`Customer Traffic`, `Store Dwell`, `Shelf Attention`, `Zone Congestion`) | Visual spatial intensity heatmaps across store floorplan. |
| **Dwell Time Analysis** | `Dwell Time Distribution` Violin Plot & `Avg Dwell Time by Hour` Line Chart | Visualizes dwell probability density and hourly patterns. |
| **Behavioral Analytics** | `Attention vs Purchase` Scatter Plot & `Attention vs Dwell vs Conversion` Bubble Chart | Correlates dwell time, attention depth, conversion rate, and revenue impact. |

---

## 3. Marketing Manager Dashboard Specifications

| Dashboard Section | Component / Chart Implementation | Details & Interaction |
| --- | --- | --- |
| **KPI Cards** | `Campaign Reach`, `Promotion Engagement`, `Product Visibility`, `Conversion Rate`, `Attractiveness Score`, `Campaign ROI` | Marketing ROI & campaign reach highlights. |
| **Campaign Performance** | `Campaign Comparison` Grouped Bar Chart & `Performance Trend` Line Chart | Side-by-side metric comparison across active promotional campaigns. |
| **Promotion Effectiveness** | `Before vs After` Dual-Bar Comparison Chart (with % Lift Badges), `Sales Lift` Waterfall Chart, and `Campaign Conversion` Funnel Chart | Evaluates baseline vs. promo uplift and incremental sales breakdown. |
| **Product Visibility** | `Visibility Metrics` Radar Chart, `Visibility Score` Horizontal Bar Chart, and `Shelf Visibility Heatmap` | Multi-dimensional scoring (angle, height, lighting, obstruction). |
| **Product Attractiveness** | `Product Attractiveness Ranking` Horizontal Bar Chart & `Attractiveness Score Breakdown` Radar Chart | Ranks products by visual appeal, placement score, pick rate, and dwell time. |
| **Customer Engagement** | `Engagement Trend` Line Chart & `Engagement Distribution` Donut Chart | Tracks customer engagement over time. |
| **Conversion Analysis** | `Attention vs Conversion` Scatter Plot & `Engagement vs Sales` Bubble Chart | Quadrant analysis mapping low/medium/high conversion drivers. |
| **AI Recommendations** | `Decision Matrix` & `Priority Matrix` (High / Medium / Low Impact) | Actionable AI recommendations (e.g. *Relocate Product D to Shelf A*, *Extend Weekend Bonanza Campaign*). |

---

## 4. Administrator Dashboard Specifications

| Dashboard Section | Component / Chart Implementation | Details & Interaction |
| --- | --- | --- |
| **KPI Cards** | `Total Users`, `Total Stores`, `Total Cameras`, `Running Services`, `System Uptime`, `API Requests` | Enterprise health & hardware metrics. |
| **User Analytics** | `Users by Role` Pie Chart & `Active Users per Store` Bar Chart | Role allocation and store activity breakdown. |
| **User Management** | Comprehensive Data Table (`User`, `Role`, `Assigned Store`, `Status`, `Last Login`, `Action Buttons`) | Complete user account administration table with interactive action buttons. |
| **Camera Infrastructure** | `Camera Status` Donut Chart, `Cameras by Store` Bar Chart, and `Diagnostic Camera Grid` | Real-time diagnostic stream monitoring (FPS, resolution, status, restart action). |
| **Infrastructure Monitoring** | Multi-Line Charts (`CPU Usage`, `Memory Usage`, `GPU Usage`, `Disk Usage`, `Network Traffic`) | System resource utilization over time. |
| **API Performance** | `API Response Time` Line Chart, `Endpoint Latency` Bar Chart, and `Request Volume` Area Chart | Endpoint latency and traffic volume monitoring. |
| **Security Monitoring** | `Login Attempts` Line Chart, `Failed Logins` Bar Chart, and `Auth Status` Donut Chart | Security event monitoring and authentication tracking. |
| **Audit Logs & Activity** | `System Events` Timeline Chart & `Audit History` Activity Feed / Table | System-wide audit log tracking user changes, camera updates, and configuration edits. |

---

## Verification & Deployment Strategy

1. **Routing & Navigation**: Header tab switching supporting role selection (`Store Manager`, `Retail Analyst`, `Marketing Manager`, `Administrator`).
2. **Theme Consistency**: Enterprise BI dark-mode aesthetic consistent with `images_reference.pdf`.
3. **Data Integrity & Mock Services**: `mockDashboardData.js` supplying realistic, role-specific data payloads for seamless demo and backend API binding.
