import AdminDashboardOverviewPage from "../admin/AdminDashboardOverviewPage";
import UserAccessManagement from "../admin/UserAccessManagement";
import StoreDeviceManagement from "../admin/StoreDeviceManagement";
import ShelfManagement from "../admin/ShelfManagement";
import ConsumerAnalytics from "../admin/ConsumerAnalytics";
import AiInfrastructure from "../admin/AiInfrastructure";
import SecurityAudit from "../admin/SecurityAudit";
import ReportsExport from "../admin/ReportsExport";
import AdminNotifications from "../admin/AdminNotifications";

import BackupRecovery from "../admin/BackupRecovery";
import SystemSettings from "../admin/SystemSettings";
import ProfileSupport from "../admin/ProfileSupport";

// Store Manager – high-fidelity standalone pages
import StoreOverview from "../store_manager/StoreOverview";
import LiveCameras from "../store_manager/LiveCameras";
import VisitorsAnalytics from "../store_manager/VisitorsAnalytics";
import StoreTraffic from "../store_manager/StoreTraffic";
import ShelfPerformance from "../store_manager/ShelfPerformance";
import ProductInteraction from "../store_manager/ProductInteraction";
import StoreHeatmap from "../store_manager/StoreHeatmap";
import StoreAlerts from "../store_manager/StoreAlerts";
import StoreReports from "../store_manager/StoreReports";
import StoreSettings from "../store_manager/StoreSettings";
import { StoreActivitiesPage } from "../store_manager/modules/StoreManagerModules";

// Marketing Manager – high-fidelity standalone pages
import MarketingOverview from "../marketing_manager/MarketingOverview";
import CampaignPerformance from "../marketing_manager/CampaignPerformance";
import PromotionEffectiveness from "../marketing_manager/PromotionEffectiveness";
import ProductVisibility from "../marketing_manager/ProductVisibility";
import ProductAttractiveness from "../marketing_manager/ProductAttractiveness";
import CustomerEngagement from "../marketing_manager/CustomerEngagement";
import ConversionAnalysis from "../marketing_manager/ConversionAnalysis";
import AttentionInsights from "../marketing_manager/AttentionInsights";
import TrafficInsights from "../marketing_manager/TrafficInsights";
import MarketingRecommendations from "../marketing_manager/MarketingRecommendations";
import ActionCenter from "../marketing_manager/ActionCenter";
import CampaignReports from "../marketing_manager/CampaignReports";
import ExportReports from "../marketing_manager/ExportReports";
import MarketingSettings from "../marketing_manager/Settings";

// Retail Analyst – module stubs
import {
  AnalystDashboardOverviewPage, AnalystConsumerJourneyPage, AnalystAttentionAnalyticsPage,
  AnalystConsumerSegmentationPage, AnalystShoppingBehaviorPage, AnalystDwellTimePage,
  AnalystTrafficFlowPage, AnalystZonePerformancePage, AnalystProductAnalyticsPage,
  AnalystCategoryPerformancePage, AnalystAiInsightsPage, AnalystReportsPage,
  AnalystExportDataPage, AnalystSettingsPage
} from "../analyst/modules/RetailAnalystModules";

export default function DynamicSubPageRenderer({ role, activeTab, onNavigateTab }) {

  // ── Store Manager ─────────────────────────────────────────────────────────
  if (role === "Store Manager") {
    switch (activeTab) {
      case "Dashboard":         return <StoreOverview onNavigateTab={onNavigateTab} />;
      case "Live Cameras":      return <LiveCameras />;
      case "Visitors":          return <VisitorsAnalytics />;
      case "Store Traffic":     return <StoreTraffic />;
      case "Shelf Performance": return <ShelfPerformance />;
      case "Product Interaction": return <ProductInteraction />;
      case "Heat Map":          return <StoreHeatmap />;
      case "Alerts":            return <StoreAlerts />;
      case "Reports":           return <StoreReports />;
      case "Activities":        return <StoreActivitiesPage />;
      case "Settings":          return <StoreSettings />;
      default:                  return <StoreOverview onNavigateTab={onNavigateTab} />;
    }
  }

  // ── Marketing Manager ─────────────────────────────────────────────────────
  if (role === "Marketing Manager") {
    switch (activeTab) {
      case "Dashboard":               return <MarketingOverview />;
      case "Campaign Performance":    return <CampaignPerformance />;
      case "Promotion Effectiveness": return <PromotionEffectiveness />;
      case "Product Visibility":      return <ProductVisibility />;
      case "Product Attractiveness":  return <ProductAttractiveness />;
      case "Customer Engagement":     return <CustomerEngagement />;
      case "Conversion Analysis":     return <ConversionAnalysis />;
      case "Attention Insights":      return <AttentionInsights />;
      case "Traffic Insights":        return <TrafficInsights />;
      case "Marketing Recommendations": return <MarketingRecommendations />;
      case "Action Center":           return <ActionCenter />;
      case "Campaign Reports":        return <CampaignReports />;
      case "Export Reports":          return <ExportReports />;
      case "Settings":                return <MarketingSettings />;
      default:                        return <MarketingOverview />;
    }
  }

  // ── Retail Analyst ────────────────────────────────────────────────────────
  if (role === "Retail Analyst") {
    switch (activeTab) {
      case "Dashboard":                  return <AnalystDashboardOverviewPage />;
      case "Consumer Journey Analysis":  return <AnalystConsumerJourneyPage />;
      case "Attention Analytics":        return <AnalystAttentionAnalyticsPage />;
      case "Consumer Segmentation":      return <AnalystConsumerSegmentationPage />;
      case "Shopping Behavior Analysis": return <AnalystShoppingBehaviorPage />;
      case "Dwell Time Analysis":        return <AnalystDwellTimePage />;
      case "Traffic Flow Analysis":      return <AnalystTrafficFlowPage />;
      case "Zone Performance":           return <AnalystZonePerformancePage />;
      case "Product Analytics":          return <AnalystProductAnalyticsPage />;
      case "Category Performance":       return <AnalystCategoryPerformancePage />;
      case "AI Insights":                return <AnalystAiInsightsPage />;
      case "Reports":                    return <AnalystReportsPage />;
      case "Export Data":                return <AnalystExportDataPage />;
      case "Settings":                   return <AnalystSettingsPage />;
      default:                           return <AnalystDashboardOverviewPage />;
    }
  }

  // ── Administrator ─────────────────────────────────────────────────────────
  if (role === "Administrator") {
    switch (activeTab) {
      case "Dashboard":                 return <AdminDashboardOverviewPage onNavigateTab={onNavigateTab} />;
      case "User & Access Management":  return <UserAccessManagement onNavigateTab={onNavigateTab} />;
      case "Store & Device Management": return <StoreDeviceManagement onNavigateTab={onNavigateTab} />;
      case "Shelf Management":          return <ShelfManagement onNavigateTab={onNavigateTab} />;
      case "Consumer Analytics":        return <ConsumerAnalytics onNavigateTab={onNavigateTab} />;
      case "AI & Infrastructure":       return <AiInfrastructure onNavigateTab={onNavigateTab} />;
      case "Security & Audit":          return <SecurityAudit onNavigateTab={onNavigateTab} />;
      case "Reports & Export":          return <ReportsExport onNavigateTab={onNavigateTab} />;
      case "Notifications":             return <AdminNotifications onNavigateTab={onNavigateTab} />;

      case "Backup & Recovery":         return <BackupRecovery onNavigateTab={onNavigateTab} />;
      case "System Settings":           return <SystemSettings onNavigateTab={onNavigateTab} />;
      case "Profile & Support":          return <ProfileSupport onNavigateTab={onNavigateTab} />;
      default:                           return <AdminDashboardOverviewPage onNavigateTab={onNavigateTab} />;
    }
  }

  return (
    <div className="bg-[#111827] border border-[#273449] rounded-2xl p-6 text-center">
      <p className="text-slate-400 text-sm">No page found for: <strong className="text-white">{activeTab}</strong></p>
    </div>
  );
}
