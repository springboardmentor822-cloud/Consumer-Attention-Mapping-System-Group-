import API from "./api";

// ======================================
// AI DASHBOARD
// ======================================

export const getAIDashboard = async () => {

  const response = await API.get(
    "/ai-dashboard"
  );

  return response.data;

};

// ======================================
// LIVE AI STATUS
// ======================================

export const getAIStatus = async () => {

  const response = await API.get(
    "/ai-dashboard/status"
  );

  return response.data;

};

// ======================================
// CUSTOMER BEHAVIOUR
// ======================================

export const getBehaviour = async () => {

  const response = await API.get(
    "/ai-dashboard/behaviour"
  );

  return response.data;

};

// ======================================
// AI INSIGHTS
// ======================================

export const getAIInsights = async () => {

  const response = await API.get(
    "/ai-dashboard/insights"
  );

  return response.data;

};

// ======================================
// HEATMAP
// ======================================

export const getHeatmap = async () => {

  const response = await API.get(
    "/ai-dashboard/heatmap"
  );

  return response.data;

};

// ======================================
// CUSTOMER PATHS
// ======================================

export const getCustomerPaths = async () => {

  const response = await API.get(
    "/ai-dashboard/paths"
  );

  return response.data;

};

// ======================================
// LIVE ANALYTICS
// ======================================

export const getLiveAnalytics = async () => {

  const response = await API.get(
    "/analytics/live"
  );

  return response.data;

};

// ======================================
// RESET LIVE ANALYTICS
// ======================================

export const resetLiveAnalytics = async () => {

  const response = await API.post(
    "/analytics/reset"
  );

  return response.data;

};