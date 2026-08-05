import API from "./api";

// ======================================
// REPORT DASHBOARD
// ======================================

export const getReportDashboard = async () => {
  const response = await API.get("/reports/dashboard");
  return response.data;
};

// ======================================
// LIVE ANALYTICS
// ======================================

export const getLiveAnalytics = async (cameraId) => {
  const response = await API.get(`/analytics/live/${cameraId}`);
  return response.data;
};

// ======================================
// DOWNLOAD PDF
// ======================================

export const exportPDF = async (cameraId) => {

  const response = await API.get(
    `/reports/export/pdf/${cameraId}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");

  link.href = url;

  link.download = `AI_Report_Camera_${cameraId}.pdf`;

  document.body.appendChild(link);

  link.click();

  link.remove();
};

// ======================================
// DOWNLOAD EXCEL
// ======================================

export const exportExcel = async (cameraId) => {

  const response = await API.get(
    `/reports/export/excel/${cameraId}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");

  link.href = url;

  link.download = `AI_Report_Camera_${cameraId}.xlsx`;

  document.body.appendChild(link);

  link.click();

  link.remove();

};

// ======================================
// DOWNLOAD CSV
// ======================================

export const exportCSV = async (cameraId) => {

  const response = await API.get(
    `/reports/export/csv/${cameraId}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");

  link.href = url;

  link.download = `AI_Report_Camera_${cameraId}.csv`;

  document.body.appendChild(link);

  link.click();

  link.remove();

};