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
  // User Access Management State
  const [users, setUsers] = useState([]);

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

  const fetchUsers = useCallback(async () => {
    try {
      const rawSession = localStorage.getItem("cams_session");
      if (!rawSession) return;
      const session = JSON.parse(rawSession);
      if (!session || !session.token) return;

      const response = await fetch("http://localhost:5001/api/auth/users", {
        headers: {
          "Authorization": `Bearer ${session.token}`
        }
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const roleLabels = {
          "admin": "Administrator",
          "store_manager": "Store Manager",
          "retail_analyst": "Retail Analyst",
          "marketing_manager": "Marketing Manager",
        };
        const mapped = result.data.map(u => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: roleLabels[u.role] || u.role,
          status: u.is_active ? "Active" : "Inactive"
        }));
        setUsers(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

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
      fetchUsers();
    }
  }, [globalFilter, fetchUsers]);

  useEffect(() => {
    refreshDb();
    const interval = setInterval(refreshDb, 10000);
    return () => clearInterval(interval);
  }, [refreshDb]);

  // User Management Actions
  const addUser = async (newUser) => {
    try {
      const rawSession = localStorage.getItem("cams_session");
      if (!rawSession) return;
      const session = JSON.parse(rawSession);
      
      const response = await fetch("http://localhost:5001/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({
          full_name: newUser.name,
          email: newUser.email,
          role: newUser.role
        })
      });
      const result = await response.json();
      if (result.success) {
        fetchUsers();
      } else {
        alert(result.message || "Failed to create user");
      }
    } catch (err) {
      console.error("Add user error:", err);
    }
  };

  const editUser = async (updatedUser) => {
    try {
      const rawSession = localStorage.getItem("cams_session");
      if (!rawSession) return;
      const session = JSON.parse(rawSession);

      const response = await fetch(`http://localhost:5001/api/auth/users/${updatedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({
          full_name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        })
      });
      const result = await response.json();
      if (result.success) {
        fetchUsers();
      } else {
        alert(result.message || "Failed to update user");
      }
    } catch (err) {
      console.error("Edit user error:", err);
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const rawSession = localStorage.getItem("cams_session");
      if (!rawSession) return;
      const session = JSON.parse(rawSession);

      const response = await fetch(`http://localhost:5001/api/auth/users/${id}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${session.token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        fetchUsers();
      } else {
        alert(result.message || "Failed to toggle user status");
      }
    } catch (err) {
      console.error("Toggle user status error:", err);
    }
  };

  const deleteUser = async (id) => {
    try {
      const rawSession = localStorage.getItem("cams_session");
      if (!rawSession) return;
      const session = JSON.parse(rawSession);

      const response = await fetch(`http://localhost:5001/api/auth/users/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        fetchUsers();
      } else {
        alert(result.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
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

