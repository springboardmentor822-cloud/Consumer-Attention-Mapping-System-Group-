import API from "./api";

// ==========================================================
// DASHBOARD
// ==========================================================

export const getDashboardAnalytics = async () => {
  const response = await API.get("/analytics/dashboard");
  return response.data;
};

// ==========================================================
// ANALYTICS
// ==========================================================

export const getAnalytics = async () => {
  const response = await API.get("/analytics/");
  return response.data;
};

// ==========================================================
// LIVE ANALYTICS
// ==========================================================

export const getLiveAnalytics = async (cameraId) => {
  const response = await API.get(`/analytics/live/${cameraId}`);
  return response.data;
};

// ==========================================================
// ALL CAMERAS
// ==========================================================

export const getAllCameraLive = async () => {
  const response = await API.get("/analytics/live");
  return response.data;
};

// ==========================================================
// RESET CAMERA
// ==========================================================

export const resetCameraAnalytics = async (cameraId) => {
  const response = await API.post(`/analytics/reset/${cameraId}`);
  return response.data;
};

// ==========================================================
// TRAJECTORY ANALYTICS
// ==========================================================

export const getTrajectoryAnalytics = async (cameraId) => {
  const response = await API.get(
    `/analytics/trajectory/${cameraId}`
  );

  return response.data;
};

// ==========================================================
// TRAJECTORY SUMMARY
// ==========================================================

export const getTrajectorySummary = async (cameraId) => {
  const response = await API.get(
    `/analytics/trajectory-summary/${cameraId}`
  );

  return response.data;
};
// ==========================================================
// ZONE TRANSITION
// ==========================================================

export const getZoneTransition = async (cameraId) => {
  const response = await API.get(
    `/analytics/zone-transition/${cameraId}`
  );

  return response.data;
};

// ==========================================================
// ZONE SUMMARY
// ==========================================================

export const getZoneSummary = async (cameraId) => {
  const response = await API.get(
    `/analytics/zone-summary/${cameraId}`
  );

  return response.data;
};

// =====================================================
// CUSTOMER BEHAVIOUR ANALYTICS
// =====================================================

export const getCustomerBehaviour = async (cameraId) => {
    const response = await API.get(
        `/analytics/customer-behavior/${cameraId}`
    );

    return response.data;
};

// =====================================================
// CUSTOMER INSIGHTS
// =====================================================

export const getCustomerInsights = async (cameraId) => {
  const [
    behaviour,
    trajectory,
    zone,
    live,
  ] = await Promise.all([
    API.get(`/analytics/customer-behavior/${cameraId}`),
    API.get(`/analytics/trajectory-summary/${cameraId}`),
    API.get(`/analytics/zone-summary/${cameraId}`),
    API.get(`/analytics/live/${cameraId}`),
  ]);

  return {
    behaviour: behaviour.data,
    trajectory: trajectory.data,
    zone: zone.data,
    live: live.data,
  };
};

// ==========================================================
// RECOMMENDATION & OPTIMIZATION ENGINE
// ==========================================================

export const getRecommendations = async (
  cameraId = 1,
  role = "admin"
) => {
  const response = await API.get(
    `/analytics/recommendations/${cameraId}`,
    {
      params: {
        role,
      },
    }
  );

  return response.data;
};