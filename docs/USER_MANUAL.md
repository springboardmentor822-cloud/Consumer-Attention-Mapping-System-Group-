# User Manual - Consumer Attention Mapping System

Welcome to the **Consumer Attention Mapping System (CAMS)**. This manual provides user guidelines for each of the four system roles.

---

## Default Login Credentials

| Role | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@cams.com` | `admin123` | Full System & Platform Admin (`/admin`) |
| **Store Manager** | `manager@cams.com` | `manager123` | Store Operations (`/store-manager`) |
| **Retail Analyst** | `analyst@cams.com` | `analyst123` | Analytics & Segmentation (`/analyst`) |
| **Marketing Manager** | `market@cams.com` | `market123` | Marketing & Campaigns (`/marketing`) |

---

## Role Guidelines

### 1. Administrator Dashboard (`/admin`)
- **User Management**: View platform users, create new users, edit user roles, and toggle enable/disable user account status.
- **Camera Control**: Inspect camera streams, location mapping, and status (online/offline).
- **Platform Monitoring**: Review backend status, database health, processing pipeline latency, and active operational alerts.

### 2. Store Manager Dashboard (`/store-manager`)
- **Store Traffic**: Monitor real-time shopper count, peak dwell hours, and zone occupancy.
- **Shelf Performance**: Track shelf dwell times, occupancy percentages, and inventory health.
- **Conversion Metrics**: Evaluate shopper footfall vs purchase conversion rates.
- **Alerts**: Review active store alerts and take operational actions.

### 3. Retail Analyst Dashboard (`/analyst`)
- **Shopper Segmentation**: Analyze customer classification across 5 categories (*Explorer*, *Quick Buyer*, *Comparison Shopper*, *Impulse Buyer*, *Brand Loyal Customer*).
- **Heatmaps**: Access interactive 2D spatial heatmaps for store traffic, shelf engagement, product attention, and hotspots.
- **Product Attractiveness**: Evaluate product attractiveness scores ($0.35\text{Attn} + 0.25\text{Inter} + 0.20\text{Pick} + 0.15\text{Conv} + 0.05\text{Rep}$) and rankings.
- **AI Recommendations**: View placement recommendations.

### 4. Marketing Manager Dashboard (`/marketing`)
- **Campaign Analytics**: Monitor active campaign reach, visitor footfall, and engagement lift.
- **Product Visibility**: Identify high-value products with poor visibility in current placements.
- **Sales Conversion**: Analyze promotional impact and sales lift metrics.

---

## Report Exporting

Every role can export comprehensive reports from the **Reports** page (`/reports`):
- Click **Export PDF** to generate an executive PDF report.
- Click **Export Excel** to download multi-sheet structured spreadsheets.
