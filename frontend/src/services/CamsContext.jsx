import React, { createContext, useContext, useState, useEffect } from "react";
import * as cd from "./centralData";

const CamsContext = createContext();

export function CamsProvider({ children }) {
  // Global Filters
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const [selectedCamera, setSelectedCamera] = useState("CAM-01");
  const [selectedStore, setSelectedStore] = useState("STR-101");

  // User Access Management State
  const [users, setUsers] = useState([
    { id: 1, name: "Priya Mehta", email: "priya@cams-retail.com", role: "Retail Analyst", status: "Active" },
    { id: 2, name: "Arjun Singh", email: "arjun@cams-retail.com", role: "Store Manager", status: "Active" },
    { id: 3, name: "Rohan Das", email: "rohan@cams-retail.com", role: "Marketing Manager", status: "Active" },
    { id: 4, name: "Admin CAMS", email: "admin@cams-retail.com", role: "Administrator", status: "Active" },
  ]);

  // Role Permissions Configuration
  const [rolePermissions, setRolePermissions] = useState({
    "Administrator": { manageUsers: true, configureSystem: true, viewAnalytics: true, exportReports: true },
    "Store Manager": { manageUsers: false, configureSystem: false, viewAnalytics: true, exportReports: true },
    "Retail Analyst": { manageUsers: false, configureSystem: false, viewAnalytics: true, exportReports: true },
    "Marketing Manager": { manageUsers: false, configureSystem: false, viewAnalytics: true, exportReports: true },
  });

  // Dynamic Telemetry Data Generator based on dateRange & selectedCamera
  const [telemetry, setTelemetry] = useState(cd.trafficOverview);

  useEffect(() => {
    // Generate scaled/filtered telemetry dynamically based on filters for dynamic feel
    let scaleFactor = 1.0;
    if (dateRange === "Today") scaleFactor = 0.10;
    else if (dateRange === "Yesterday") scaleFactor = 0.095;
    else if (dateRange === "Last 7 Days") scaleFactor = 1.0;
    else if (dateRange === "Last 30 Days") scaleFactor = 4.2;
    else if (dateRange === "This Month") scaleFactor = 3.8;
    else if (dateRange === "Custom Date Range") scaleFactor = 2.0;

    // Apply slight modifications based on active camera
    const camIndex = parseInt(selectedCamera.replace("CAM-", "")) || 1;
    const cameraModifier = 0.85 + (camIndex * 0.05);

    const base = cd.trafficOverview;
    setTelemetry({
      totalVisitors: Math.round(base.totalVisitors * scaleFactor * cameraModifier),
      totalVisitorsChange: base.totalVisitorsChange,
      avgDwellTime: parseFloat((base.avgDwellTime * cameraModifier).toFixed(1)),
      avgDwellTimeChange: base.avgDwellTimeChange,
      conversionRate: parseFloat((base.conversionRate * cameraModifier).toFixed(1)),
      conversionRateChange: base.conversionRateChange,
      avgAttentionTime: parseFloat((base.avgAttentionTime * cameraModifier).toFixed(1)),
      avgAttentionTimeChange: base.avgAttentionTimeChange,
      salesRevenue: Math.round(base.salesRevenue * scaleFactor * cameraModifier),
      salesRevenueChange: base.salesRevenueChange,
      avgOrderValue: parseFloat((base.avgOrderValue * cameraModifier).toFixed(2)),
      avgOrderValueChange: base.avgOrderValueChange,
      peakHour: base.peakHour,
      peakHourTraffic: Math.round(base.peakHourTraffic * scaleFactor * cameraModifier),
      busiestDay: base.busiestDay,
      busiestDayTraffic: Math.round(base.busiestDayTraffic * scaleFactor * cameraModifier),
      currentCustomers: Math.round(42 * cameraModifier),
      productsPicked: Math.round(2140 * scaleFactor * cameraModifier),
      cameraStatus: "3/4 Online",
    });
  }, [dateRange, selectedCamera]);

  // User Management Actions
  const addUser = (newUser) => {
    setUsers(prev => [...prev, { id: Date.now(), ...newUser, status: "Active" }]);
  };

  const editUser = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
  };

  const toggleUserStatus = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u));
  };

  const deleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Role Permissions Save
  const saveRolePermissions = (role, newPermissions) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], ...newPermissions }
    }));
  };

  return (
    <CamsContext.Provider
      value={{
        dateRange,
        setDateRange,
        selectedCamera,
        setSelectedCamera,
        selectedStore,
        setSelectedStore,
        users,
        addUser,
        editUser,
        toggleUserStatus,
        deleteUser,
        rolePermissions,
        saveRolePermissions,
        telemetry,
      }}
    >
      {children}
    </CamsContext.Provider>
  );
}

export const useCams = () => useContext(CamsContext);
