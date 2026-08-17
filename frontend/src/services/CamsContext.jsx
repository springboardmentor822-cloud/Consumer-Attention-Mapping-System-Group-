import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import * as cd from "./centralData";
import { DEFAULT_FILTER } from "../components/PortalDataFilter";

const CamsContext = createContext();

// ── Zone mapper (stable, module-level) ────────────────────────────────────────
function mapCamZoneToStoreZone(camZone) {
  if (!camZone) return "Checkout";
  const z = camZone.toLowerCase();
  if (z.includes("bakery")) return "Bakery";
  if (z.includes("dairy")) return "Dairy";
  if (z.includes("produce") || z.includes("organic") || z.includes("scale")) return "Produce";
  if (z.includes("cosmetics") || z.includes("beauty") || z.includes("personal")) return "Cosmetics";
  if (z.includes("electronics")) return "Electronics";
  if (z.includes("household")) return "Household";
  if (z.includes("frozen")) return "Frozen Foods";
  return "Checkout";
}

function getProductForZone(zoneName) {
  const allProds = cd.products;
  return (
    allProds.find(p => p.category.toLowerCase().includes(zoneName.toLowerCase()) || p.zone?.toLowerCase().includes(zoneName.toLowerCase())) ||
    allProds[0] ||
    { id: "P-001", name: "Artisan Sourdough Bread", price: 7.50, cost: 5.00 }
  );
}

export function CamsProvider({ children }) {
  // Global Filters
  const [globalFilter, setGlobalFilter] = useState(DEFAULT_FILTER);
  const [selectedCamera, setSelectedCamera] = useState("CAM-01");
  const [selectedStore, setSelectedStore] = useState("STR-101");

  // Database-backed states
  const [stores, setStores] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [zones, setZones] = useState([]);
  const [products, setProducts] = useState([]);

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

  // Dynamic Telemetry Data resolved from unified getCentralScaledData
  const [telemetry, setTelemetry] = useState(() => cd.getCentralScaledData(DEFAULT_FILTER).kpis);
  const [dbLoaded, setDbLoaded] = useState(false);

  const refreshDb = useCallback(async () => {
    console.log("Loading PostgreSQL database records into central data store...");
    const success = await cd.fetchAllFromDatabase();
    if (success) {
      setStores([...cd.stores]);
      setShelves([...cd.shelves]);
      setCameras([...cd.cameras]);
      setZones([...cd.zones]);
      setProducts([...cd.products]);
      const centralData = cd.getCentralScaledData(globalFilter);
      setTelemetry(centralData.kpis);
      setDbLoaded(true);
    }
  }, [globalFilter]);

  useEffect(() => {
    refreshDb();
    const interval = setInterval(refreshDb, 10000);
    return () => clearInterval(interval);
  }, [refreshDb]);

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

  // ── Live Tracking State ─────────────────────────────────────────────────────
  const [liveTrackedPersons, setLiveTrackedPersons] = useState([]);
  const [liveHeatmapPoints, setLiveHeatmapPoints] = useState([]);

  // Session history is kept in a ref (not state) to avoid cascading re-renders.
  const liveSessionRef = useRef({});  // keyed by person.id
  const lastStateUpdateRef = useRef(0);

  // ── updateLiveTrackingState — STABLE reference via useCallback ──────────────
  const updateLiveTrackingState = useCallback((activePersons, newPoints = []) => {
    // 1. Update live session registry (ref-based, no re-render cascade)
    const sessions = liveSessionRef.current;
    const activeIds = new Set(activePersons.map(p => p.id));

    // Mark missing ids as inactive
    Object.keys(sessions).forEach(id => {
      if (!activeIds.has(id)) {
        sessions[id] = { ...sessions[id], isActive: false };
      }
    });

    // Resolve active store name from globalFilter
    const storeObj = cd.stores.find(s => s.id === globalFilter?.store || s.name === globalFilter?.store);
    const activeStoreName = storeObj ? storeObj.name : "Downtown Flagship";

    // Upsert active persons
    activePersons.forEach(person => {
      const mappedZone = mapCamZoneToStoreZone(person.zone);
      const prod = getProductForZone(mappedZone);

      const entryTimeMs = Date.now() - (person.totalDwellSeconds * 1000);
      const entryTime = new Date(entryTimeMs).toLocaleTimeString("en-US", { hour12: false });
      const exitTime  = new Date().toLocaleTimeString("en-US", { hour12: false });

      const hasPurchase =
        person.productsPicked > 0 ||
        person.activity === "Picking Product" ||
        person.activity === "Viewing Product";

      sessions[person.id] = {
        id:               person.id,
        customerId:       `CUST-TRK-${person.id}`,
        visitDate:        new Date().toISOString().split("T")[0],
        entryTime,
        exitTime,
        dwellTime:        Math.max(0.1, parseFloat((person.totalDwellSeconds / 60).toFixed(2))),
        productsViewed:   [prod],
        productsPurchased: hasPurchase ? [prod] : [],
        purchaseStatus:   hasPurchase ? "Purchased" : "No Purchase",
        purchaseAmount:   hasPurchase ? prod.price : 0,
        transactionId:    hasPurchase ? `TXN-TRK-${person.id}` : "—",
        store:            activeStoreName,
        zone:             mappedZone,
        isActive:         true,
      };
    });

    // 2. Publish to shared global so getCentralScaledData can merge
    window.cams_live_sessions = Object.values(sessions);

    // 3. Throttle React state updates (triggers page re-renders)
    const now = Date.now();
    if (now - lastStateUpdateRef.current > 300 || activePersons.length === 0) {
      lastStateUpdateRef.current = now;
      setLiveTrackedPersons(activePersons);
      if (newPoints.length > 0) {
        setLiveHeatmapPoints(prev => [...prev, ...newPoints].slice(-500));
      }
    }
  }, [globalFilter]); // depends on globalFilter to resolve store

  return (
    <CamsContext.Provider
      value={{
        globalFilter,
        setGlobalFilter,
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
        stores,
        shelves,
        cameras,
        zones,
        products,
        refreshDb,
        liveTrackedPersons,
        liveHeatmapPoints,
        liveSessionHistory: Object.values(liveSessionRef.current),
        updateLiveTrackingState,
      }}
    >
      {children}
    </CamsContext.Provider>
  );
}

export const useCams = () => useContext(CamsContext);

