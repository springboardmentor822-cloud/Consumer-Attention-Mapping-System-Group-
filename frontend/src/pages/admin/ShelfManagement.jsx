import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCams } from "../../services/CamsContext";
import { DEFAULT_FILTER } from "../../components/PortalDataFilter";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";
import CustomDateSelector from "../../components/CustomDateSelector";


// LocalStorage keys for persistence
const STORAGE_KEY_SHELVES = "cams_shelves_v2";
const STORAGE_KEY_CAMERAS = "cams_cameras_v2";
const STORAGE_KEY_ZONES = "cams_zones_v2";
const STORAGE_KEY_PRODUCTS = "cams_products_v2";

function loadShelves() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHELVES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function loadCameras() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMERAS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function loadZones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ZONES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// Pre-seeded initial data arrays
// Pre-seeded initial data arrays aligned with unified data foundation
export const INITIAL_SHELVES = [
  { id: "SH-101", name: "Shelf A1 - Bread & Pastry", store: "Downtown Flagship", storeId: "STR-101", zone: "Bakery", category: "Bakery", coordsX: 14.0, coordsY: 5.2, width: 2.0, height: 1.6, capacity: 80, attachedCamera: "CAM-02", status: "Active", attentionScore: 86, occupancyRate: 84 },
  { id: "SH-102", name: "Shelf B2 - Dairy & Eggs", store: "Downtown Flagship", storeId: "STR-101", zone: "Dairy", category: "Dairy", coordsX: 8.5, coordsY: 18.3, width: 3.2, height: 2.0, capacity: 150, attachedCamera: "CAM-05", status: "Active", attentionScore: 89, occupancyRate: 95 },
  { id: "SH-103", name: "Shelf C1 - Fresh Produce", store: "Downtown Flagship", storeId: "STR-101", zone: "Produce", category: "Produce", coordsX: 22.4, coordsY: 12.1, width: 1.8, height: 1.5, capacity: 100, attachedCamera: "CAM-01", status: "Active", attentionScore: 82, occupancyRate: 88 },
  { id: "SH-104", name: "Shelf D4 - Cosmetics Wall", store: "Downtown Flagship", storeId: "STR-101", zone: "Cosmetics", category: "Cosmetics", coordsX: 30.1, coordsY: 15.6, width: 2.8, height: 1.8, capacity: 200, attachedCamera: "CAM-03", status: "Active", attentionScore: 91, occupancyRate: 90 },
  { id: "SH-105", name: "Shelf E1 - Electronics Display", store: "Downtown Flagship", storeId: "STR-101", zone: "Electronics", category: "Electronics", coordsX: 16.2, coordsY: 8.7, width: 2.4, height: 1.8, capacity: 120, attachedCamera: "CAM-06", status: "Active", attentionScore: 94, occupancyRate: 92 },
  { id: "SH-106", name: "Shelf F1 - Household Cleaner", store: "Downtown Flagship", storeId: "STR-101", zone: "Household", category: "Household", coordsX: 34.5, coordsY: 20.2, width: 3.0, height: 2.2, capacity: 180, attachedCamera: "CAM-06", status: "Active", attentionScore: 74, occupancyRate: 78 }
];

export const INITIAL_CAMERAS = [
  { id: "CAM-01", name: "Entrance Wide Angle", store: "Downtown Flagship", storeId: "STR-101", zone: "Produce", ip: "192.168.1.101", status: "Online", coordsX: 4.0, coordsY: 4.0 },
  { id: "CAM-02", name: "Bakery Endcap Camera", store: "Downtown Flagship", storeId: "STR-101", zone: "Bakery", ip: "192.168.1.102", status: "Online", coordsX: 12.0, coordsY: 8.0 },
  { id: "CAM-03", name: "Cosmetics Wall Camera", store: "Downtown Flagship", storeId: "STR-101", zone: "Cosmetics", ip: "192.168.1.103", status: "Online", coordsX: 32.0, coordsY: 14.0 },
  { id: "CAM-04", name: "Checkout Line Camera", store: "Downtown Flagship", storeId: "STR-101", zone: "Checkout", ip: "192.168.1.104", status: "Online", coordsX: 40.0, coordsY: 30.0 },
  { id: "CAM-05", name: "Dairy Section Camera", store: "Downtown Flagship", storeId: "STR-101", zone: "Dairy", ip: "192.168.1.105", status: "Online", coordsX: 8.0, coordsY: 22.0 },
  { id: "CAM-06", name: "Electronics Corner Camera", store: "Downtown Flagship", storeId: "STR-101", zone: "Electronics", ip: "192.168.1.106", status: "Online", coordsX: 22.0, coordsY: 18.0 }
];

export const INITIAL_ZONES = [
  { id: "ZN-01", name: "Bakery", store: "Downtown Flagship", status: "Active" },
  { id: "ZN-02", name: "Dairy", store: "Downtown Flagship", status: "Active" },
  { id: "ZN-03", name: "Produce", store: "Downtown Flagship", status: "Active" },
  { id: "ZN-04", name: "Cosmetics", store: "Downtown Flagship", status: "Active" },
  { id: "ZN-05", name: "Electronics", store: "Downtown Flagship", status: "Active" },
  { id: "ZN-06", name: "Household", store: "Downtown Flagship", status: "Active" },
  { id: "ZN-07", name: "Frozen Foods", store: "Downtown Flagship", status: "Active" },
  { id: "ZN-08", name: "Checkout", store: "Downtown Flagship", status: "Active" }
];

export const INITIAL_PRODUCTS = [
  { id: "P-001", name: "Artisan Sourdough Bread", sku: "SKU-1001", category: "Bakery", sellingPrice: 7.50, price: 7.50, costPrice: 5.00, cost: 5.00, profit: 2.50, stockQty: 45, shelf: "SH-101", store: "Downtown Flagship", promo: "Summer Sale Spectacular", status: "Active", subcategory: "Bread", brand: "Bakers Pride" },
  { id: "P-002", name: "Organic Almond Milk", sku: "SKU-1002", category: "Dairy", sellingPrice: 7.00, price: 7.00, costPrice: 4.50, cost: 4.50, profit: 2.50, stockQty: 60, shelf: "SH-102", store: "Downtown Flagship", promo: "Weekend Bonanza", status: "Active", subcategory: "Milk", brand: "BioNature" },
  { id: "P-003", name: "Premium Greek Yogurt", sku: "SKU-1003", category: "Dairy", sellingPrice: 7.00, price: 7.00, costPrice: 4.00, cost: 4.00, profit: 3.00, stockQty: 80, shelf: "SH-102", store: "Downtown Flagship", promo: "None", status: "Active", subcategory: "Yogurt", brand: "Chobani" },
  { id: "P-004", name: "Free-Range Eggs (12pk)", sku: "SKU-1004", category: "Dairy", sellingPrice: 7.00, price: 7.00, costPrice: 3.80, cost: 3.80, profit: 3.20, stockQty: 50, shelf: "SH-102", store: "Downtown Flagship", promo: "None", status: "Active", subcategory: "Eggs", brand: "Eggland" },
  { id: "P-005", name: "Avocado (Hass, 4-pack)", sku: "SKU-1005", category: "Produce", sellingPrice: 8.00, price: 8.00, costPrice: 5.20, cost: 5.20, profit: 2.80, stockQty: 30, shelf: "SH-103", store: "Downtown Flagship", promo: "None", status: "Active", subcategory: "Fruits", brand: "FreshGrow" },
  { id: "P-006", name: "Luxury Face Serum", sku: "SKU-1006", category: "Cosmetics", sellingPrice: 35.00, price: 35.00, costPrice: 20.00, cost: 20.00, profit: 15.00, stockQty: 15, shelf: "SH-104", store: "Downtown Flagship", promo: "None", status: "Active", subcategory: "Skincare", brand: "Estee" },
  { id: "P-007", name: "Wireless Earbuds Pro", sku: "SKU-1007", category: "Electronics", sellingPrice: 80.00, price: 80.00, costPrice: 55.00, cost: 55.00, profit: 25.00, stockQty: 25, shelf: "SH-105", store: "Downtown Flagship", promo: "New Arrival Launch", status: "Active", subcategory: "Audio", brand: "Sony" },
  { id: "P-008", name: "Multi-Surface Cleaner", sku: "SKU-1008", category: "Household", sellingPrice: 8.00, price: 8.00, costPrice: 5.00, cost: 5.00, profit: 3.00, stockQty: 75, shelf: "SH-106", store: "Downtown Flagship", promo: "None", status: "Active", subcategory: "Cleaner", brand: "Clorox" },
  { id: "P-009", name: "Organic Granola Mix", sku: "SKU-1009", category: "Bakery", sellingPrice: 8.00, price: 8.00, costPrice: 5.50, cost: 5.50, profit: 2.50, stockQty: 40, shelf: "SH-101", store: "Downtown Flagship", promo: "None", status: "Active", subcategory: "Cereal", brand: "BioNature" },
  { id: "P-010", name: "Fresh Salmon Fillet", sku: "SKU-1010", category: "Produce", sellingPrice: 20.00, price: 20.00, costPrice: 13.00, cost: 13.00, profit: 7.00, stockQty: 25, shelf: "SH-103", store: "Downtown Flagship", promo: "None", status: "Active", subcategory: "Fish", brand: "OceanCatch" }
];

const ZONE_COLORS = {
  "Zone A - Beverages": "border-amber-500 bg-amber-500/10 text-amber-300",
  "Zone A - Bakery": "border-orange-500 bg-orange-500/10 text-orange-300",
  "Zone B - Snacks": "border-purple-500 bg-purple-500/10 text-purple-300",
  "Zone C - Dairy": "border-emerald-500 bg-emerald-500/10 text-emerald-300",
  "Zone D - Personal Care": "border-cyan-500 bg-cyan-500/10 text-cyan-300",
  "Zone D - Household": "border-rose-500 bg-rose-500/10 text-rose-300",
};

function getZoneStyles(zoneName, isSelected) {
  if (isSelected) {
    return "border-emerald-400 bg-emerald-400/20 text-emerald-200 ring-2 ring-emerald-400/50 shadow-emerald-500/30 animate-pulse";
  }
  const base = ZONE_COLORS[zoneName];
  if (base) return base;
  
  // Hash function to get a stable color for dynamic zones
  let hash = 0;
  for (let i = 0; i < zoneName.length; i++) {
    hash = zoneName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "border-blue-500 bg-blue-500/10 text-blue-300",
    "border-pink-500 bg-pink-500/10 text-pink-300",
    "border-teal-500 bg-teal-500/10 text-teal-300",
    "border-indigo-500 bg-indigo-500/10 text-indigo-300",
    "border-yellow-500 bg-yellow-500/10 text-yellow-300",
    "border-violet-500 bg-violet-500/10 text-violet-300",
  ];
  return colors[Math.abs(hash) % colors.length];
}

// ---------------------------------------------------------------------------
// Normalize a raw DB shelf row into the frontend shape expected by this component
// ---------------------------------------------------------------------------
function normalizeDbShelf(s, dbStores) {
  const matchingStore = dbStores ? dbStores.find(st => st.id === s.store_id || st.store_id === s.store_id) : null;
  const storeName = matchingStore ? matchingStore.name : (s.store || "Downtown Flagship");
  const storeIdStr = matchingStore ? (matchingStore.store_id || `STR-${matchingStore.id}`) : "STR-101";
  return {
    id: s.shelf_id || `SH-${s.id}`,
    _dbPk: s.id, // keep the numeric PK for PUT/DELETE
    name: s.name || `Shelf ${s.shelf_number || s.id} - ${s.zone || "General"}`,
    store: storeName,
    storeId: storeIdStr,
    zone: s.zone || "Bakery",
    category: s.zone || "Bakery",
    coordsX: parseFloat(s.position_x) || 10.0,
    coordsY: parseFloat(s.position_y) || 10.0,
    width: parseFloat(s.width) || 2.0,
    height: parseFloat(s.height) || 1.6,
    capacity: parseInt(s.capacity) || 100,
    attachedCamera: s.attached_camera || s.attachedCamera || "CAM-01",
    status: s.status ? (s.status.charAt(0).toUpperCase() + s.status.slice(1)) : "Active",
    dims: `${parseFloat(s.width) || 2.0}m x ${parseFloat(s.height) || 1.6}m x 0.6m`,
    attentionScore: s.attention_score || s.attentionScore || 80,
    occupancyRate: s.occupancy_rate || s.occupancyRate || 80,
    shelfType: s.shelf_type || "Rack",
    aisle: s.aisle || "",
    section: s.section || "",
  };
}

// ---------------------------------------------------------------------------
// Normalize a raw DB product row into the frontend shape
// ---------------------------------------------------------------------------
function normalizeDbProduct(p, dbStores) {
  const matchingStore = dbStores ? dbStores.find(st => st.name === p.store || st.store_id === p.store) : null;
  const storeName = matchingStore ? matchingStore.name : (p.store || "Downtown Flagship");
  const sp = parseFloat(p.selling_price || p.price) || 10.0;
  const cp = parseFloat(p.cost_price) || (sp * 0.7);
  return {
    id: p.product_id || `P-${p.id}`,
    _dbPk: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category || "General",
    subcategory: p.subcategory || "",
    brand: p.brand || "",
    sellingPrice: sp,
    price: sp,
    costPrice: cp,
    cost: cp,
    profit: parseFloat(p.profit) || parseFloat((sp - cp).toFixed(2)),
    stockQty: parseInt(p.stock_qty) || 50,
    shelf: p.shelf || (p.shelf_id ? `SH-${p.shelf_id}` : ""),
    store: storeName,
    promo: p.promo || "None",
    status: p.status === 'active' ? 'Active' : p.status === 'Active' ? 'Active' : (p.status || 'Active'),
  };
}

const API_BASE = "http://localhost:5001/api";

export default function ShelfManagement({ assignedStore = "Store 1 - Koramangala", isStoreManager = false }) {
  const { globalFilter } = useCams();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'layout' | 'zones' | 'products'
  const [filter, setFilter] = useState(null);
  const activeFilter = isStoreManager ? (globalFilter || DEFAULT_FILTER) : (filter || globalFilter || DEFAULT_FILTER);
  const selectedPeriod = activeFilter?.dateRange ?? "Last 7 Days";

  // DB loading state
  const [dbLoading, setDbLoading] = useState(true);
  const [dbStoreNames, setDbStoreNames] = useState([]);
  const [storesList, setStoresList] = useState([]);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState(isStoreManager ? assignedStore : "All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const handleDateChange = (newPeriod, customData = null) => {
    if (newPeriod === "Custom Date Range" && customData) {
      setFilter(customData);
    } else {
      setFilter({ dateRange: newPeriod });
    }
  };


  // Product Inventory Search & Filter State
  const [productSearch, setProductSearch] = useState("");
  const [productStoreFilter, setProductStoreFilter] = useState(isStoreManager ? assignedStore : "All");
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [productStatusFilter, setProductStatusFilter] = useState("All");
  const [productPage, setProductPage] = useState(1);
  const productsPerPage = 6;

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals & Panels State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  const [selectedShelfDetails, setSelectedShelfDetails] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Map Zoom & Interactive Coordinates State
  const [mapZoom, setMapZoom] = useState(1);
  const [hoveredMapShelf, setHoveredMapShelf] = useState(null);
  const [selectedShelfId, setSelectedShelfId] = useState(null);

  // Relational datasets — seeded from localStorage / INITIAL_*, then overwritten by DB
  const [shelvesList, setShelvesList] = useState(() => loadShelves() || INITIAL_SHELVES);
  const [camerasList, setCamerasList] = useState(() => loadCameras() || INITIAL_CAMERAS);
  const [zonesList, setZonesList] = useState(() => loadZones() || INITIAL_ZONES);
  const [productsList, setProductsList] = useState(() => loadProducts() || INITIAL_PRODUCTS);

  // Form Input States
  const [formState, setFormState] = useState({
    name: "",
    store: assignedStore,
    zone: "Zone A - Beverages",
    newZone: "",
    useNewZone: false,
    category: "Beverages",
    coordsX: 16.0,
    coordsY: 10.0,
    status: "Active",
    shelfType: "Rack",
    width: 2.0,
    height: 1.5,
    capacity: 100,
    attachedCamera: "",
  });

  const [cameraFormState, setCameraFormState] = useState({
    id: "",
    name: "",
    store: assignedStore,
    zone: "Zone A - Beverages",
    ip: "",
    status: "Online",
    coordsX: 10.0,
    coordsY: 10.0,
  });

  const [zoneFormState, setZoneFormState] = useState({
    id: "",
    name: "",
    store: assignedStore,
    status: "Active",
  });

  const [productFormState, setProductFormState] = useState({
    name: "",
    sku: "",
    category: "Beverages",
    subcategory: "",
    brand: "",
    sellingPrice: 10.0,
    costPrice: 7.0,
    stockQty: 50,
    shelf: "SH-101",
    store: assignedStore,
    promo: "None",
    status: "Active",
  });

  // Modal display states
  const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});
  const [cameraFormErrors, setCameraFormErrors] = useState({});
  const [zoneFormErrors, setZoneFormErrors] = useState({});
  const [productFormErrors, setProductFormErrors] = useState({});

  // ---------------------------------------------------------------------------
  // Fetch real data from the database on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function loadFromDb() {
      setDbLoading(true);
      try {
        const fetchOrThrow = async (url) => {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const j = await r.json();
          return Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
        };

        const [dbStores, dbShelves, dbProducts, dbZones, dbCameras] = await Promise.all([
          fetchOrThrow(`${API_BASE}/stores`),
          fetchOrThrow(`${API_BASE}/shelves`),
          fetchOrThrow(`${API_BASE}/products`),
          fetchOrThrow(`${API_BASE}/zones`),
          fetchOrThrow(`${API_BASE}/cameras`),
        ]);

        if (cancelled) return;

        if (dbStores.length > 0) {
          setDbStoreNames(dbStores.map(s => s.name).filter(Boolean));
          setStoresList(dbStores);
        }

        const normalizedShelves = dbShelves.map(s => normalizeDbShelf(s, dbStores));
        setShelvesList(normalizedShelves);
        try { localStorage.setItem(STORAGE_KEY_SHELVES, JSON.stringify(normalizedShelves)); } catch {}

        const normalizedProducts = dbProducts.map(p => normalizeDbProduct(p, dbStores));
        setProductsList(normalizedProducts);
        try { localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(normalizedProducts)); } catch {}

        const normalizedZones = dbZones.map(z => ({
          id: z.zone_id || `ZN-${z.id}`,
          name: z.name,
          store: z.store || "",
          status: z.status ? (z.status.charAt(0).toUpperCase() + z.status.slice(1)) : "Active",
        }));
        setZonesList(normalizedZones);
        try { localStorage.setItem(STORAGE_KEY_ZONES, JSON.stringify(normalizedZones)); } catch {}

        const normalizedCameras = dbCameras.map(c => {
          const matchingStore = dbStores.find(st => st.id === c.store_id || st.store_id === c.store_id);
          const storeName = matchingStore ? matchingStore.name : "Downtown Flagship";
          const storeId = matchingStore ? (matchingStore.store_id || `STR-${matchingStore.id}`) : "STR-101";
          return {
            id: c.camera_id || `CAM-${c.id}`,
            name: c.name || `Camera ${c.id}`,
            store: storeName,
            storeId: storeId,
            zone: c.location || c.zone || "Produce",
            ip: c.camera_url || "127.0.0.1",
            status: c.is_active ? "Online" : "Offline",
            coordsX: parseFloat(c.position_x) || 4.0,
            coordsY: parseFloat(c.position_y) || 4.0
          };
        });
        setCamerasList(normalizedCameras);
        try { localStorage.setItem(STORAGE_KEY_CAMERAS, JSON.stringify(normalizedCameras)); } catch {}
      } catch (err) {
        console.warn("ShelfManagement: DB fetch error, using cached/initial data:", err);
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    }
    loadFromDb();
    return () => { cancelled = true; };
  }, [selectedPeriod]);

  // Persist datasets to localStorage whenever they change (for offline fallback)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_SHELVES, JSON.stringify(shelvesList)); } catch {}
  }, [shelvesList]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_CAMERAS, JSON.stringify(camerasList)); } catch {}
  }, [camerasList]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_ZONES, JSON.stringify(zonesList)); } catch {}
  }, [zonesList]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(productsList)); } catch {}
  }, [productsList]);

  // Derive unique zones from current zonesList for the dropdowns
  const existingZones = [...new Set(zonesList.map((z) => z.name))].sort();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Dynamic Occupancy Multiplier
  let occupancyMult = 1.0;
  if (selectedPeriod === "Today") occupancyMult = 0.92;
  else if (selectedPeriod === "Yesterday") occupancyMult = 0.90;
  else if (selectedPeriod === "Last 7 Days") occupancyMult = 1.0;
  else if (selectedPeriod === "Last 30 Days") occupancyMult = 1.05;
  else if (selectedPeriod === "This Month") occupancyMult = 1.03;
  else if (selectedPeriod === "Custom Date Range" && filter?.startDate && filter?.endDate) {
    const diffDays = Math.max(1, Math.round((new Date(filter.endDate) - new Date(filter.startDate)) / (1000 * 60 * 60 * 24)));
    occupancyMult = parseFloat((0.85 + (diffDays / 30) * 0.2).toFixed(2));
  }

  // Filtering Logic
  const filteredShelves = shelvesList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.store.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = storeFilter === "All" || s.store === storeFilter;
    const matchesZone = zoneFilter === "All" || s.zone === zoneFilter;
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStore && matchesZone && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredShelves.length / itemsPerPage) || 1;
  const paginatedShelves = filteredShelves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic Metrics — computed from actual fetched shelvesList
  const activeShelvesCount = shelvesList.filter((s) => s.status === "Active").length;
  const activePct = shelvesList.length > 0 ? Math.round((activeShelvesCount / shelvesList.length) * 100) : 0;
  const uniqueZoneCount = [...new Set(shelvesList.map(s => s.zone).filter(Boolean))].length;
  const rawAvgOccupancy = shelvesList.length > 0
    ? shelvesList.reduce((sum, s) => sum + (parseFloat(s.occupancyRate) || 80), 0) / shelvesList.length
    : 84.5;
  const avgOccupancy = Math.min(99, Math.round(rawAvgOccupancy * occupancyMult));

  // Products Filtering & Pagination Logic
  const filteredProducts = productsList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase());
    const matchesStore = productStoreFilter === "All" || p.store === productStoreFilter;
    const matchesCategory = productCategoryFilter === "All" || p.category === productCategoryFilter;
    const matchesStatus = productStatusFilter === "All" || p.status === productStatusFilter;
    return matchesSearch && matchesStore && matchesCategory && matchesStatus;
  });

  const productTotalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage
  );

  // Handle Form Open (New vs Edit)
  const handleOpenAddForm = () => {
    setEditingShelf(null);
    setFormErrors({});
    setFormState({
      name: "",
      store: assignedStore,
      zone: existingZones[0] || "Zone A - Beverages",
      newZone: "",
      useNewZone: false,
      category: "Beverages",
      coordsX: 16.0,
      coordsY: 10.0,
      status: "Active",
      shelfType: "Rack",
      width: 2.0,
      height: 1.5,
      capacity: 100,
      attachedCamera: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (shelf) => {
    setEditingShelf(shelf);
    setFormErrors({});
    setFormState({
      name: shelf.name,
      store: shelf.store,
      zone: shelf.zone,
      newZone: "",
      useNewZone: false,
      category: shelf.category,
      coordsX: shelf.coordsX,
      coordsY: shelf.coordsY,
      status: shelf.status,
      shelfType: shelf.shelfType || "Rack",
      width: shelf.width || 2.0,
      height: shelf.height || 1.5,
      capacity: shelf.capacity || 100,
      attachedCamera: shelf.attachedCamera || "",
    });
    setIsFormOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formState.name.trim()) errors.name = "Shelf Name is required.";
    if (!formState.store) errors.store = "Store is required.";
    const resolvedZone = formState.useNewZone ? formState.newZone.trim() : formState.zone;
    if (!resolvedZone) errors.zone = "Shelf Zone is required.";
    const x = parseFloat(formState.coordsX);
    const y = parseFloat(formState.coordsY);
    if (isNaN(x) || x < 0 || x > 45) errors.coordsX = "X must be 0–45m.";
    if (isNaN(y) || y < 0 || y > 35) errors.coordsY = "Y must be 0–35m.";
    if (!formState.category) errors.category = "Product Category is required.";
    
    const w = parseFloat(formState.width);
    const h = parseFloat(formState.height);
    const cap = parseInt(formState.capacity);
    if (isNaN(w) || w <= 0) errors.width = "Width must be positive.";
    if (isNaN(h) || h <= 0) errors.height = "Height must be positive.";
    if (isNaN(cap) || cap <= 0) errors.capacity = "Capacity must be positive.";
    return errors;
  };

  // Form Submit Handler — optimistic update + API persist
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const resolvedZone = formState.useNewZone ? formState.newZone.trim() : formState.zone;

    // Ensure new zone is tracked in local zonesList
    if (formState.useNewZone && resolvedZone) {
      const zoneExists = zonesList.some(z => z.name.toLowerCase() === resolvedZone.toLowerCase());
      if (!zoneExists) {
        const newZoneObj = {
          id: `ZN-${Math.floor(100 + Math.random() * 899)}`,
          name: resolvedZone,
          store: formState.store,
          status: "Active"
        };
        setZonesList(prev => [...prev, newZoneObj]);
      }
    }

    // Build the normalized shelf object for optimistic state update
    const sharedFields = {
      zone: resolvedZone,
      category: formState.category,
      store: formState.store,
      coordsX: parseFloat(formState.coordsX),
      coordsY: parseFloat(formState.coordsY),
      status: formState.status,
      shelfType: formState.shelfType,
      width: parseFloat(formState.width),
      height: parseFloat(formState.height),
      capacity: parseInt(formState.capacity),
      attachedCamera: formState.attachedCamera,
      dims: `${formState.width}m x ${formState.height}m x 0.6m`,
    };

    // Build the API payload (uses DB column names)
    const apiPayload = {
      name: formState.name.trim(),
      zone: resolvedZone,
      position_x: parseFloat(formState.coordsX),
      position_y: parseFloat(formState.coordsY),
      width: parseFloat(formState.width),
      height: parseFloat(formState.height),
      capacity: parseInt(formState.capacity),
      shelf_type: (formState.shelfType || "gondola").toLowerCase(),
      status: (formState.status || "Active").toLowerCase(),
    };

    if (editingShelf) {
      // Optimistically update state immediately
      setShelvesList((prev) =>
        prev.map((s) =>
          s.id === editingShelf.id
            ? { ...s, ...sharedFields, name: formState.name.trim() }
            : s
        )
      );
      showToast(`✅ Updated shelf ${editingShelf.id}`);
      // Persist to API asynchronously
      try {
        const pkId = editingShelf._dbPk || editingShelf.id;
        await fetch(`${API_BASE}/shelves/${pkId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        });
      } catch (err) {
        console.warn("ShelfManagement: PUT shelf failed:", err);
      }
    } else {
      // Generate a temporary local ID until the server responds
      const tempId = `SH-${Math.floor(100 + Math.random() * 899)}`;
      const newShelf = {
        id: tempId,
        name: formState.name.trim(),
        attentionScore: Math.floor(70 + Math.random() * 25),
        occupancyRate: Math.floor(75 + Math.random() * 20),
        ...sharedFields,
      };
      setShelvesList((prev) => [newShelf, ...prev]);
      showToast(`✅ Added new shelf`);
      // Persist to API and update the local ID with the real shelf_id
      try {
        const resp = await fetch(`${API_BASE}/shelves`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...apiPayload, shelf_id: tempId }),
        });
        if (resp.ok) {
          const json = await resp.json();
          const created = json.data;
          if (created) {
            const realId = created.shelf_id || tempId;
            setShelvesList(prev => prev.map(s => s.id === tempId ? { ...s, id: realId, _dbPk: created.id } : s));
          }
        }
      } catch (err) {
        console.warn("ShelfManagement: POST shelf failed:", err);
      }
    }
    setIsFormOpen(false);
  };

  // Delete Shelf Handler — optimistic + API
  const handleDeleteShelf = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name} (${id})?`)) {
      const shelf = shelvesList.find(s => s.id === id);
      setShelvesList((prev) => prev.filter((s) => s.id !== id));
      setProductsList((prev) => prev.map(p => p.shelf === id ? { ...p, shelf: "" } : p));
      showToast(`Deleted shelf ${id}`);
      try {
        const pkId = shelf?._dbPk || id;
        await fetch(`${API_BASE}/shelves/${pkId}`, { method: "DELETE" });
      } catch (err) {
        console.warn("ShelfManagement: DELETE shelf failed:", err);
      }
    }
  };

  // Camera Form Action
  const handleOpenAddCamera = () => {
    setCameraFormErrors({});
    setCameraFormState({
      id: `CAM-${Math.floor(10 + Math.random() * 89)}`,
      name: "",
      store: assignedStore,
      zone: existingZones[0] || "Zone A - Beverages",
      ip: "192.168.1." + Math.floor(110 + Math.random() * 90),
      status: "Online",
      coordsX: 10.0,
      coordsY: 10.0,
    });
    setIsAddCameraOpen(true);
  };

  const handleCameraFormSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!cameraFormState.name.trim()) errors.name = "Camera Name is required.";
    if (!cameraFormState.ip.trim()) errors.ip = "IP Address/RTSP IP is required.";
    const x = parseFloat(cameraFormState.coordsX);
    const y = parseFloat(cameraFormState.coordsY);
    if (isNaN(x) || x < 0 || x > 45) errors.coordsX = "X must be 0–45m.";
    if (isNaN(y) || y < 0 || y > 35) errors.coordsY = "Y must be 0–35m.";

    if (Object.keys(errors).length > 0) {
      setCameraFormErrors(errors);
      return;
    }

    const newCam = {
      ...cameraFormState,
      coordsX: x,
      coordsY: y,
    };
    setCamerasList((prev) => [newCam, ...prev]);
    setIsAddCameraOpen(false);
    showToast(`✅ Registered Camera ${newCam.id}`);
  };

  // Zone Form Action
  const handleOpenAddZone = () => {
    setZoneFormErrors({});
    setZoneFormState({
      id: `ZN-${Math.floor(10 + Math.random() * 89)}`,
      name: "",
      store: assignedStore,
      status: "Active",
    });
    setIsAddZoneOpen(true);
  };

  const handleZoneFormSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!zoneFormState.name.trim()) errors.name = "Zone Name is required.";
    if (Object.keys(errors).length > 0) {
      setZoneFormErrors(errors);
      return;
    }

    const newZone = {
      ...zoneFormState,
    };
    setZonesList((prev) => [...prev, newZone]);
    setIsAddZoneOpen(false);
    showToast(`✅ Added Zone ${newZone.name}`);
  };

  // Product Form Action
  const handleOpenAddProduct = () => {
    setProductFormErrors({});
    setEditingProduct(null);
    setProductFormState({
      name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 8999)}`,
      category: "Beverages",
      subcategory: "",
      brand: "",
      sellingPrice: 10.0,
      costPrice: 7.0,
      stockQty: 50,
      shelf: shelvesList[0]?.id || "",
      store: assignedStore,
      promo: "None",
      status: "Active",
    });
    setIsAddProductOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setProductFormErrors({});
    setEditingProduct(prod);
    setProductFormState({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      subcategory: prod.subcategory || "",
      brand: prod.brand,
      sellingPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      stockQty: prod.stockQty,
      shelf: prod.shelf,
      store: prod.store,
      promo: prod.promo || "None",
      status: prod.status,
    });
    setIsAddProductOpen(true);
  };

  const handleProductFormSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!productFormState.name.trim()) errors.name = "Product Name is required.";
    if (!productFormState.sku.trim()) errors.sku = "SKU is required.";
    if (!productFormState.brand.trim()) errors.brand = "Brand is required.";
    if (!productFormState.subcategory.trim()) errors.subcategory = "Subcategory is required.";
    const sp = parseFloat(productFormState.sellingPrice);
    const cp = parseFloat(productFormState.costPrice);
    const stock = parseInt(productFormState.stockQty);
    if (isNaN(sp) || sp < 0) errors.sellingPrice = "Invalid selling price.";
    if (isNaN(cp) || cp < 0) errors.costPrice = "Invalid cost price.";
    if (isNaN(stock) || stock < 0) errors.stockQty = "Invalid stock quantity.";

    if (Object.keys(errors).length > 0) {
      setProductFormErrors(errors);
      return;
    }

    const profitVal = parseFloat((sp - cp).toFixed(2));

    if (editingProduct) {
      setProductsList((prev) => prev.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              ...productFormState, 
              sellingPrice: sp, 
              costPrice: cp, 
              profit: profitVal, 
              stockQty: stock 
            } 
          : p
      ));
      showToast(`✏️ Updated product ${editingProduct.id}`);
    } else {
      const newId = `P-${Math.floor(100 + Math.random() * 899)}`;
      const newProd = {
        id: newId,
        ...productFormState,
        sellingPrice: sp,
        costPrice: cp,
        profit: profitVal,
        stockQty: stock,
      };
      setProductsList((prev) => [newProd, ...prev]);
      showToast(`🛒 Added product ${newId}`);
    }
    setIsAddProductOpen(false);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProductsList((prev) => prev.filter(p => p.id !== id));
      showToast(`Deleted product ${id}`);
    }
  };

  const updateShelfCoords = (shelfId, dx, dy) => {
    setShelvesList((prev) =>
      prev.map((s) => {
        if (s.id === shelfId) {
          const newX = Math.max(0, Math.min(45, parseFloat((s.coordsX + dx).toFixed(1))));
          const newY = Math.max(0, Math.min(35, parseFloat((s.coordsY + dy).toFixed(1))));
          return { ...s, coordsX: newX, coordsY: newY };
        }
        return s;
      })
    );
  };

  const updateShelfSize = (shelfId, dw, dh) => {
    setShelvesList((prev) =>
      prev.map((s) => {
        if (s.id === shelfId) {
          const newW = Math.max(0.5, Math.min(15, parseFloat((s.width + dw).toFixed(1))));
          const newH = Math.max(0.5, Math.min(15, parseFloat((s.height + dh).toFixed(1))));
          return { ...s, width: newW, height: newH, dims: `${newW}m x ${newH}m x 0.6m` };
        }
        return s;
      })
    );
  };

  // Map Click Handler for Setting Coordinates
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const mapWidth = rect.width;
    const mapHeight = rect.height;

    // Convert pixel click to store coordinate meters (0 to 45m X, 0 to 35m Y)
    const storeX = parseFloat(((clickX / mapWidth) * 45).toFixed(1));
    const storeY = parseFloat(((clickY / mapHeight) * 35).toFixed(1));

    setFormState((prev) => ({
      ...prev,
      coordsX: storeX,
      coordsY: storeY,
    }));
    showToast(`Map coordinates picked: X: ${storeX}m, Y: ${storeY}m`);
  };

  // Zone attention overview dataset
  const zoneAttentionData = [
    { zone: "Zone A (Beverages & Bakery)", avgScore: 89, occupancy: 92, activeShelves: 14 },
    { zone: "Zone B (Snacks & Pantry)", avgScore: 84, occupancy: 88, activeShelves: 18 },
    { zone: "Zone C (Dairy & Chilled)", avgScore: 78, occupancy: 94, activeShelves: 22 },
    { zone: "Zone D (Personal Care)", avgScore: 91, occupancy: 85, activeShelves: 10 },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>📦</span> {toastMessage}
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h1 className="text-xl font-black text-white tracking-wide">Shelf Management &amp; Layout Optimization</h1>
            {isStoreManager ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-700/50 border border-slate-600/40 text-slate-300 uppercase tracking-widest">
                {assignedStore}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase tracking-widest">
                Enterprise Administration
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          {selectedPeriod === "Custom Date Range" && activeFilter?.label && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              📅 {activeFilter.label}
            </span>
          )}

          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black transition shadow-md flex items-center gap-2 font-sans"
          >
            <span className="text-sm font-black">+</span> Add Shelf
          </button>
        </div>

      </div>

      {/* 1. DASHBOARD SUMMARY CARDS (DYNAMICALLY SYNCHRONIZED) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase font-sans">Total Shelves</span>
          <h2 className="text-lg font-black text-white font-mono">{shelvesList.length} Shelves</h2>
          <span className="text-[10px] text-emerald-400 font-bold block font-sans">Across all store nodes</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase font-sans">Active Shelves</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">{activeShelvesCount} Active</h2>
          <span className="text-[10px] text-emerald-400 font-bold block font-sans">{activePct}% Active Tracking</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase font-sans">Total Zones</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">{uniqueZoneCount} Zones</h2>
          <span className="text-[10px] text-purple-300 font-bold block font-sans">
            {[...new Set(shelvesList.map(s => s.zone).filter(Boolean))].slice(0, 3).join(", ") || "No zones found"}
          </span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase font-sans">Average Shelf Occupancy</span>
          <h2 className="text-lg font-black text-indigo-400 font-mono">{avgOccupancy}% Occupancy</h2>
          <span className="text-[10px] text-indigo-300 font-bold block font-sans">
            {filter?.label || selectedPeriod}
          </span>
        </div>
      </div>

      {/* TABS SWITCHER — flex-wrap so all 4 tabs are always visible */}
      <div className="flex flex-wrap border-b border-[#1E293B] gap-2 pb-1">
        {[
          { id: "overview", label: "📊 Shelf Directory", count: filteredShelves.length },
          { id: "layout", label: "🗺️ Visual Floorplan", count: "Map" },
          { id: "zones", label: "📍 Zone Analytics", count: `${uniqueZoneCount} Zones` },
          { id: "products", label: "🛒 Product Inventory", count: `${filteredProducts.length} Items` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap
              ${
                activeTab === t.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-[#0F172A] text-slate-400 border border-[#1E293B] hover:text-white"
              }`}
          >
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-black/30 font-mono">{t.count}</span>
          </button>
        ))}
      </div>
      {dbLoading && (
        <div className="text-center py-2 text-xs text-indigo-400 font-mono animate-pulse">
          ⟳ Loading shelf data from database…
        </div>
      )}

      {/* ── TAB 1: SHELF DIRECTORY ENTERPRISE TABLE ─────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4 font-mono text-xs">
          {/* SEARCH & FILTERS ROW */}
          <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3 font-sans">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <input
                type="text"
                placeholder="🔍 Search shelf name, ID, category, or store..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#070C18] border border-[#1E293B] px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1 min-w-[200px]"
              />

              {/* Store Filter — locked for Store Manager, full dropdown for Admin */}
              {isStoreManager ? (
                <span className="bg-emerald-900/30 border border-emerald-700/40 px-3 py-2 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  🏪 {assignedStore}
                </span>
              ) : (
                <select
                  value={storeFilter}
                  onChange={(e) => {
                    setStoreFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="All">Select Store (All)</option>
                  {/* Dynamically populated from DB stores */}
                  {(dbStoreNames.length > 0 ? dbStoreNames : [...new Set(shelvesList.map(s => s.store).filter(Boolean))]).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}

              {/* Zone Filter */}
              <select
                value={zoneFilter}
                onChange={(e) => {
                  setZoneFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">Select Zone (All)</option>
                {existingZones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">Status (All)</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredShelves.length}</strong> matching shelves
            </span>
          </div>

          {/* SHELF DETAILS ENTERPRISE TABLE */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px] font-sans">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Shelf Name</th>
                    <th className="py-3.5 px-4">Store</th>
                    <th className="py-3.5 px-4">Zone</th>
                    <th className="py-3.5 px-4">Coordinates (X,Y)</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {paginatedShelves.map((s, idx) => {
                    const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={s.id} className="hover:bg-[#1E293B]/40 transition font-medium">
                        <td className="py-3.5 px-4 text-slate-400 font-mono font-bold">{rowNum}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-white text-xs block font-sans">{s.name}</span>
                          <span className="text-[10px] text-indigo-400 font-mono">{s.id}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-sans">{s.store}</td>
                        <td className="py-3.5 px-4 text-indigo-300 font-sans font-bold">{s.zone}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          X: {s.coordsX}m, Y: {s.coordsY}m
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-sans">
                            {s.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 font-sans ${
                              s.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                            }`}
                          >
                            ● {s.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right relative">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            {/* Three-Dot Action Dropdown Toggle */}
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setOpenDropdownId(openDropdownId === s.id ? null : s.id)}
                                className="px-2 py-1 bg-[#1E293B] hover:bg-[#273552] text-slate-300 rounded-lg text-[10px] font-bold border border-[#334155]"
                              >
                                •••
                              </button>

                              {openDropdownId === s.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-[#070C18] border border-[#1E293B] rounded-xl shadow-2xl z-30 overflow-hidden font-sans text-left">
                                  <button
                                    onClick={() => {
                                      setSelectedShelfDetails(s);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-indigo-600/20 hover:text-white block font-medium"
                                  >
                                    🔍 View Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleOpenEditForm(s);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[11px] text-indigo-400 hover:bg-indigo-600/20 block font-medium"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteShelf(s.id, s.name);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[11px] text-rose-400 hover:bg-rose-600/20 block font-medium border-t border-[#1E293B]"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            <div className="bg-[#070C18] border-t border-[#1E293B] p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
              <span className="text-slate-400 font-mono">
                Showing <strong className="text-white">{(currentPage - 1) * itemsPerPage + 1}</strong>–
                <strong className="text-white">{Math.min(currentPage * itemsPerPage, filteredShelves.length)}</strong> of{" "}
                <strong className="text-white">{filteredShelves.length}</strong> shelves
              </span>

              <div className="flex items-center gap-1.5 font-mono">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#1E293B] bg-[#0F172A] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 hover:text-white transition font-bold"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded-lg border text-xs font-bold transition ${
                      currentPage === pg
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-[#0F172A] border-[#1E293B] text-slate-400 hover:text-white"
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#1E293B] bg-[#0F172A] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 hover:text-white transition font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INTERACTIVE VISUAL STORE LAYOUT MAP ──────────────────────── */}
      {activeTab === "layout" && (() => {
        const selectedShelf = shelvesList.find((s) => s.id === selectedShelfId);
        return (
          <div className="space-y-4">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#1E293B] pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>🗺️</span> Store Floorplan & Interactive Bounding Box Mapping
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a shelf block to move, resize, attach cameras, and calibrate layouts in real-time.
                  </p>
                </div>

                {/* ZOOM & CONTROLS */}
                <div className="flex items-center gap-2 font-mono">
                  <button
                    onClick={() => setMapZoom((z) => Math.min(1.8, z + 0.15))}
                    className="px-3 py-1.5 bg-[#070C18] border border-[#1E293B] hover:border-indigo-500 rounded-xl text-xs font-bold text-white transition"
                  >
                    Zoom In (+)
                  </button>
                  <button
                    onClick={() => setMapZoom((z) => Math.max(0.7, z - 0.15))}
                    className="px-3 py-1.5 bg-[#070C18] border border-[#1E293B] hover:border-indigo-500 rounded-xl text-xs font-bold text-white transition"
                  >
                    Zoom Out (-)
                  </button>
                  <button
                    onClick={() => setMapZoom(1)}
                    className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold"
                  >
                    Reset Zoom
                  </button>
                </div>
              </div>

              {/* SPLIT SCREEN MAP + INSPECTOR PANEL */}
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Left Column: Interactive Floorplan Map */}
                <div className="flex-1 relative aspect-[16/9] bg-[#080E1E] border border-[#1E293B] rounded-2xl overflow-hidden shadow-inner select-none cursor-crosshair">
                  <div
                    onClick={() => setSelectedShelfId(null)}
                    className="w-full h-full relative transition-transform duration-200"
                    style={{ transform: `scale(${mapZoom})`, transformOrigin: "center center" }}
                  >
                    {/* Store Floor Tile Grid Lines */}
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                      }}
                    />

                    {/* DYNAMIC SVG CAMERA CONNECTION LINE */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                      {selectedShelf && selectedShelf.attachedCamera && (() => {
                        const cam = camerasList.find((c) => c.id === selectedShelf.attachedCamera);
                        if (!cam) return null;
                        
                        const shelfX = (selectedShelf.coordsX / 45) * 100;
                        const shelfY = (selectedShelf.coordsY / 35) * 100;
                        const camX = (cam.coordsX / 45) * 100;
                        const camY = (cam.coordsY / 35) * 100;
                        
                        return (
                          <g>
                            <line
                              x1={`${shelfX}%`}
                              y1={`${shelfY}%`}
                              x2={`${camX}%`}
                              y2={`${camY}%`}
                              stroke="#6366F1"
                              strokeWidth="2"
                              strokeDasharray="5 5"
                              className="animate-pulse"
                            />
                            <foreignObject
                              x={`${(shelfX + camX) / 2 - 35}%`}
                              y={`${(shelfY + camY) / 2 - 8}%`}
                              width="70"
                              height="18"
                            >
                              <div className="bg-indigo-900/90 border border-indigo-500/50 text-[7px] font-mono rounded text-white text-center leading-none py-0.5 shadow-md">
                                LINKED FEED
                              </div>
                            </foreignObject>
                          </g>
                        );
                      })()}
                    </svg>

                    {/* ZONE BOUNDARY OVERLAYS */}
                    {/* Zone A: Top Left */}
                    <div className="absolute top-4 left-4 w-[42%] h-[42%] border-2 border-dashed border-amber-500/20 bg-amber-500/5 rounded-xl p-3 pointer-events-none">
                      <span className="font-extrabold text-amber-400/50 text-[10px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                        Zone A (Beverages & Bakery)
                      </span>
                    </div>

                    {/* Zone B: Top Right */}
                    <div className="absolute top-4 right-4 w-[48%] h-[42%] border-2 border-dashed border-purple-500/20 bg-purple-500/5 rounded-xl p-3 pointer-events-none">
                      <span className="font-extrabold text-purple-400/50 text-[10px] bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-mono">
                        Zone B (Snacks & Pantry)
                      </span>
                    </div>

                    {/* Zone C: Bottom Left */}
                    <div className="absolute bottom-4 left-4 w-[42%] h-[46%] border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 pointer-events-none">
                      <span className="font-extrabold text-emerald-400/50 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        Zone C (Dairy & Chilled)
                      </span>
                    </div>

                    {/* Zone D: Bottom Right */}
                    <div className="absolute bottom-4 right-4 w-[48%] h-[46%] border-2 border-dashed border-cyan-500/20 bg-cyan-500/5 rounded-xl p-3 pointer-events-none">
                      <span className="font-extrabold text-cyan-400/50 text-[10px] bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
                        Zone D (Household & Personal Care)
                      </span>
                    </div>

                    {/* CAMERA PINS ON MAP */}
                    {camerasList.map((cam) => {
                      const camX = (cam.coordsX / 45) * 100;
                      const camY = (cam.coordsY / 35) * 100;
                      return (
                        <div
                          key={cam.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast(`📹 Camera feed: ${cam.name} (${cam.id}) IP: ${cam.ip}`);
                          }}
                          className="absolute z-20 transition-all duration-150 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer bg-blue-600 hover:bg-blue-500 hover:scale-110 border border-white text-white p-1 rounded-full text-[10px] w-6 h-6 flex items-center justify-center shadow-lg shadow-blue-500/20"
                          style={{ left: `${camX}%`, top: `${camY}%` }}
                          title={`${cam.name} (${cam.id}) - Click for Details`}
                        >
                          📹
                        </div>
                      );
                    })}

                    {/* SHELVES BOXES ON MAP (DYNAMIC BOUNDING BOXES) */}
                    {filteredShelves.map((s) => {
                      const isSelected = selectedShelfId === s.id;
                      const leftPos = (s.coordsX / 45) * 100;
                      const topPos = (s.coordsY / 35) * 100;
                      const shelfW = ((s.width || 2.0) / 45) * 100;
                      const shelfH = ((s.height || 1.5) / 35) * 100;

                      const zoneStyleClass = getZoneStyles(s.zone, isSelected);

                      return (
                        <div
                          key={s.id}
                          onMouseEnter={() => setHoveredMapShelf(s)}
                          onMouseLeave={() => setHoveredMapShelf(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShelfId(s.id);
                          }}
                          className={`absolute z-20 transition-all duration-150 cursor-pointer border-2 rounded shadow-md flex flex-col items-center justify-center p-0.5 ${zoneStyleClass}`}
                          style={{
                            left: `${leftPos}%`,
                            top: `${topPos}%`,
                            width: `${shelfW}%`,
                            height: `${shelfH}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <div className="font-sans font-black text-[7px] md:text-[8px] leading-tight select-none pointer-events-none truncate max-w-full">
                            {s.id}
                          </div>
                          {s.attachedCamera && (
                            <span className="text-[6px] md:text-[8px] pointer-events-none select-none">
                              📹
                            </span>
                          )}

                          {/* Hover Tooltip Popover */}
                          {hoveredMapShelf?.id === s.id && (
                            <div
                              className="absolute bg-[#070C18] border border-[#1E293B] p-3 rounded-xl shadow-2xl w-48 text-[11px] font-sans z-40 pointer-events-none text-left text-slate-100"
                              style={{
                                left: "50%",
                                bottom: "105%",
                                transform: "translateX(-50%)",
                              }}
                            >
                              <h4 className="font-extrabold text-white leading-tight">{s.name}</h4>
                              <span className="text-[10px] text-indigo-400 font-mono block">{s.id}</span>
                              <div className="mt-2 space-y-1 text-[10px] font-mono border-t border-[#1E293B] pt-1.5">
                                <div>Zone: <strong className="text-white">{s.zone}</strong></div>
                                <div>Coords: <strong className="text-white">X:{s.coordsX}m, Y:{s.coordsY}m</strong></div>
                                <div>Size: <strong className="text-white">{s.width || 2.0}m x {s.height || 1.5}m</strong></div>
                                <div>Type: <strong className="text-indigo-300">{s.shelfType || "Rack"}</strong></div>
                                <div>Camera: <strong className="text-blue-300">{s.attachedCamera || "None"}</strong></div>
                                <div>Status: <strong className={s.status === "Active" ? "text-emerald-400" : "text-rose-400"}>{s.status}</strong></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Inspector Panel */}
                <div className="lg:w-[30%] bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Admin quick buttons */}
                    <div className="flex flex-wrap gap-2 border-b border-[#1E293B] pb-3.5">
                      <button
                        onClick={handleOpenAddCamera}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 font-sans"
                      >
                        <span>📹</span> Add Camera
                      </button>
                      <button
                        onClick={handleOpenAddZone}
                        className="flex-1 px-3 py-2 bg-[#1E293B] hover:bg-[#273552] text-slate-200 border border-[#334155] rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 font-sans"
                      >
                        <span>📍</span> Add Zone
                      </button>
                    </div>

                    {/* Inspector Details */}
                    {selectedShelf ? (
                      <div className="space-y-4 font-mono text-xs">
                        <div className="flex justify-between items-start border-b border-[#1E293B] pb-2">
                          <div>
                            <h4 className="font-extrabold text-white text-sm font-sans">{selectedShelf.name}</h4>
                            <span className="text-[10px] text-indigo-400 font-mono">{selectedShelf.id}</span>
                          </div>
                          <button 
                            onClick={() => setSelectedShelfId(null)}
                            className="text-slate-400 hover:text-white font-bold font-sans text-xs px-1.5 py-0.5 rounded bg-[#1E293B]"
                          >
                            Clear
                          </button>
                        </div>

                        {/* Coords & Dimensions display */}
                        <div className="bg-[#070C18] border border-[#1E293B] p-3 rounded-xl space-y-2 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Position X:</span>
                            <span className="text-slate-200 font-bold">{selectedShelf.coordsX}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Position Y:</span>
                            <span className="text-slate-200 font-bold">{selectedShelf.coordsY}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Width:</span>
                            <span className="text-slate-200 font-bold">{selectedShelf.width || 2.0}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Height:</span>
                            <span className="text-slate-200 font-bold">{selectedShelf.height || 1.5}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Shelf Type:</span>
                            <span className="text-indigo-300 font-bold">{selectedShelf.shelfType || "Rack"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Capacity:</span>
                            <span className="text-slate-200 font-bold">{selectedShelf.capacity || 100} units</span>
                          </div>
                        </div>

                        {/* MOVE CONTROLS D-PAD */}
                        <div className="space-y-2">
                          <label className="text-slate-400 font-sans font-bold text-[10px] block">MOVE SHELF UNIT (METERS)</label>
                          <div className="flex flex-col items-center gap-1.5 py-2 bg-[#070C18]/50 rounded-xl border border-[#1E293B]/60">
                            {/* Up */}
                            <button
                              onClick={() => updateShelfCoords(selectedShelf.id, 0, -0.5)}
                              className="w-8 h-8 bg-[#1E293B] border border-[#334155] hover:border-indigo-500 rounded-lg text-white font-bold flex items-center justify-center transition active:scale-95"
                              title="Move Up (-0.5m)"
                            >
                              ⬆️
                            </button>
                            <div className="flex gap-4">
                              {/* Left */}
                              <button
                                onClick={() => updateShelfCoords(selectedShelf.id, -0.5, 0)}
                                className="w-8 h-8 bg-[#1E293B] border border-[#334155] hover:border-indigo-500 rounded-lg text-white font-bold flex items-center justify-center transition active:scale-95"
                                title="Move Left (-0.5m)"
                              >
                                ⬅️
                              </button>
                              <div className="w-8 h-8 flex items-center justify-center text-[10px] text-indigo-400 font-extrabold font-sans">
                                D-PAD
                              </div>
                              {/* Right */}
                              <button
                                onClick={() => updateShelfCoords(selectedShelf.id, 0.5, 0)}
                                className="w-8 h-8 bg-[#1E293B] border border-[#334155] hover:border-indigo-500 rounded-lg text-white font-bold flex items-center justify-center transition active:scale-95"
                                title="Move Right (+0.5m)"
                              >
                                ➡️
                              </button>
                            </div>
                            {/* Down */}
                            <button
                              onClick={() => updateShelfCoords(selectedShelf.id, 0, 0.5)}
                              className="w-8 h-8 bg-[#1E293B] border border-[#334155] hover:border-indigo-500 rounded-lg text-white font-bold flex items-center justify-center transition active:scale-95"
                              title="Move Down (+0.5m)"
                            >
                              ⬇️
                            </button>
                          </div>
                        </div>

                        {/* RESIZE CONTROLS */}
                        <div className="space-y-2">
                          <label className="text-slate-400 font-sans font-bold text-[10px] block">RESIZE SHELF UNIT (METERS)</label>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-[#070C18]/50 p-2 rounded-xl border border-[#1E293B]/60 space-y-1">
                              <span className="text-[9px] text-slate-500 font-sans font-bold block">WIDTH</span>
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => updateShelfSize(selectedShelf.id, -0.5, 0)}
                                  className="w-6 h-6 bg-[#1E293B] border border-[#334155] rounded text-white font-bold hover:bg-[#273552] text-[10px]"
                                >
                                  ➖
                                </button>
                                <button
                                  onClick={() => updateShelfSize(selectedShelf.id, 0.5, 0)}
                                  className="w-6 h-6 bg-[#1E293B] border border-[#334155] rounded text-white font-bold hover:bg-[#273552] text-[10px]"
                                >
                                  ➕
                                </button>
                              </div>
                            </div>

                            <div className="bg-[#070C18]/50 p-2 rounded-xl border border-[#1E293B]/60 space-y-1">
                              <span className="text-[9px] text-slate-500 font-sans font-bold block">HEIGHT</span>
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => updateShelfSize(selectedShelf.id, 0, -0.5)}
                                  className="w-6 h-6 bg-[#1E293B] border border-[#334155] rounded text-white font-bold hover:bg-[#273552] text-[10px]"
                                >
                                  ➖
                                </button>
                                <button
                                  onClick={() => updateShelfSize(selectedShelf.id, 0, 0.5)}
                                  className="w-6 h-6 bg-[#1E293B] border border-[#334155] rounded text-white font-bold hover:bg-[#273552] text-[10px]"
                                >
                                  ➕
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ZONE & CAMERA MAPPINGS */}
                        <div className="space-y-3 pt-2 border-t border-[#1E293B]">
                          <div>
                            <label className="text-slate-400 font-sans font-bold text-[10px] block mb-1">ATTACH CAMERA</label>
                            <select
                              value={selectedShelf.attachedCamera || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShelvesList((prev) => prev.map((s) => s.id === selectedShelf.id ? { ...s, attachedCamera: val } : s));
                                showToast(`📹 Attached camera ${val || "None"} to shelf ${selectedShelf.id}`);
                              }}
                              className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white font-sans text-[11px] focus:outline-none focus:border-indigo-500"
                            >
                              <option value="">— No Attached Camera —</option>
                              {camerasList.map((cam) => (
                                <option key={cam.id} value={cam.id}>
                                  📹 {cam.id} - {cam.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-slate-400 font-sans font-bold text-[10px] block mb-1">MAPPED ZONE</label>
                            <select
                              value={selectedShelf.zone}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShelvesList((prev) => prev.map((s) => s.id === selectedShelf.id ? { ...s, zone: val } : s));
                                showToast(`📍 Mapped shelf ${selectedShelf.id} to zone ${val}`);
                              }}
                              className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white font-sans text-[11px] focus:outline-none focus:border-indigo-500"
                            >
                              {existingZones.map((z) => (
                                <option key={z} value={z}>
                                  📍 {z}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Quick Edit and Delete */}
                        <div className="flex gap-2 pt-3 border-t border-[#1E293B] font-sans">
                          <button
                            onClick={() => handleOpenEditForm(selectedShelf)}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold text-center transition"
                          >
                            Full Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteShelf(selectedShelf.id, selectedShelf.name);
                              setSelectedShelfId(null);
                            }}
                            className="flex-1 py-2 bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/40 rounded-xl text-[10px] font-bold text-center transition"
                          >
                            Delete Shelf
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#1E293B] rounded-2xl bg-[#070C18]/30">
                        <span className="text-2xl mb-2">📦</span>
                        <h4 className="font-extrabold text-white text-xs font-sans">Bounding Box Inspector</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-sans">
                          Select any shelf block on the visual floorplan map to move/resize it, edit properties, or link cameras and zones in real-time.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-[9px] text-slate-500 border-t border-[#1E293B] pt-2.5 font-mono text-center">
                    CAMS Coordinate Mapping Space • Grid scale 1m/px
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TAB 3: ZONE ATTENTION ANALYTICS ─────────────────────────────────── */}
      {activeTab === "zones" && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>📍</span> Zone Attention & Occupancy Analytics
            </h3>

            <div className="h-64 w-full pt-2">
              <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneAttentionData}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis dataKey="zone" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B", borderRadius: "12px", color: "#FFF" }} />
                  <Bar dataKey="occupancy" fill="#6366F1" radius={[6, 6, 0, 0]} name="Occupancy %" />
                  <Bar dataKey="avgScore" fill="#10B981" radius={[6, 6, 0, 0]} name="Attention Score" />
                </BarChart>
              </ResponsiveContainer>
</ComponentErrorBoundary>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PRODUCT INVENTORY MANAGEMENT ──────────────────────────────── */}
      {activeTab === "products" && (
        <div className="space-y-4 font-mono text-xs">
          {/* SEARCH & FILTERS ROW */}
          <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3 font-sans">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <input
                type="text"
                placeholder="🔍 Search product name, SKU, brand, or category..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductPage(1);
                }}
                className="bg-[#070C18] border border-[#1E293B] px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1 min-w-[200px]"
              />

              {/* Store Filter — locked for Store Manager, full dropdown for Admin */}
              {isStoreManager ? (
                <span className="bg-emerald-900/30 border border-emerald-700/40 px-3 py-2 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  🏪 {assignedStore}
                </span>
              ) : (
                <select
                  value={productStoreFilter}
                  onChange={(e) => {
                    setProductStoreFilter(e.target.value);
                    setProductPage(1);
                  }}
                  className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="All">All Stores</option>
                  <option value="Store 1 - Koramangala">Store 1 - Koramangala</option>
                  <option value="Store 2 - Indiranagar">Store 2 - Indiranagar</option>
                  <option value="Store 3 - Hyderabad">Store 3 - Hyderabad</option>
                  <option value="Store 4 - Andheri">Store 4 - Andheri</option>
                  <option value="Store 5 - Connaught Place">Store 5 - Connaught Place</option>
                </select>
              )}

              {/* Category Filter */}
              <select
                value={productCategoryFilter}
                onChange={(e) => {
                  setProductCategoryFilter(e.target.value);
                  setProductPage(1);
                }}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">All Categories</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
                <option value="Dairy">Dairy</option>
                <option value="Bakery">Bakery</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Household">Household</option>
                <option value="Fresh Produce">Fresh Produce</option>
                <option value="Frozen Foods">Frozen Foods</option>
                <option value="Electronics">Electronics</option>
                <option value="Wearables">Wearables</option>
                <option value="Cosmetics">Cosmetics</option>
              </select>

              {/* Status Filter */}
              <select
                value={productStatusFilter}
                onChange={(e) => {
                  setProductStatusFilter(e.target.value);
                  setProductPage(1);
                }}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">Status (All)</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                Showing <strong className="text-white">{filteredProducts.length}</strong> matching products
              </span>
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black transition shadow-md flex items-center gap-1.5 font-sans"
              >
                <span>🛒</span> Add Product
              </button>
            </div>
          </div>

          {/* PRODUCT DIRECTORY ENTERPRISE TABLE */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px] font-sans">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Product Details</th>
                    <th className="py-3.5 px-4">SKU &amp; Brand</th>
                    <th className="py-3.5 px-4">Store &amp; Shelf Link</th>
                    <th className="py-3.5 px-4">Finances (Price/Cost/Profit)</th>
                    <th className="py-3.5 px-4">Stock Level</th>
                    <th className="py-3.5 px-4">Promo / Offer</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {paginatedProducts.map((p, idx) => {
                    const rowNum = (productPage - 1) * productsPerPage + idx + 1;
                    const linkedShelf = shelvesList.find((s) => s.id === p.shelf);
                    
                    return (
                      <tr key={p.id} className="hover:bg-[#1E293B]/40 transition font-medium">
                        <td className="py-3.5 px-4 text-slate-400 font-mono font-bold">{rowNum}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-white text-xs block font-sans">
                            <span className="text-indigo-400 font-mono text-[10px] mr-1.5 bg-[#1e293b]/60 px-1 rounded">{p.id}</span>
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">{p.category}{p.subcategory ? ` > ${p.subcategory}` : ""}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-200 block font-sans">{p.brand}</span>
                          <span className="text-[10px] text-indigo-400 font-mono">{p.sku}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 block font-sans">{p.store}</span>
                          {linkedShelf ? (
                            <span 
                              onClick={() => {
                                setSelectedShelfId(linkedShelf.id);
                                setActiveTab("layout");
                                showToast(`🎯 Focused on linked shelf ${linkedShelf.id} on layout`);
                              }}
                              className="text-[10px] text-indigo-400 font-mono font-bold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              📦 {linkedShelf.id} - {linkedShelf.name} (X:{linkedShelf.coordsX}m)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-sans italic">Unassigned Shelf</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          <div className="flex flex-col">
                            <div>Selling: <strong className="text-emerald-400">${p.sellingPrice.toFixed(2)}</strong></div>
                            <div>Cost: <strong className="text-slate-400">${p.costPrice.toFixed(2)}</strong></div>
                            <div>Profit: <strong className="text-indigo-300">${p.profit.toFixed(2)}</strong></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span 
                            className={`font-mono font-bold text-xs ${
                              p.stockQty < 20 ? "text-rose-400 animate-pulse" : "text-emerald-400"
                            }`}
                          >
                            {p.stockQty} Units
                          </span>
                          {p.stockQty < 20 && (
                            <span className="text-[8px] bg-rose-500/15 border border-rose-500/30 text-rose-400 px-1 py-0.5 rounded font-sans block mt-1 w-fit uppercase font-black">
                              Low Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold ${
                            p.promo && p.promo !== "None" 
                              ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" 
                              : "bg-slate-800 text-slate-500"
                          }`}>
                            {p.promo || "None"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 font-sans ${
                              p.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                            }`}
                          >
                            ● {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit Product"
                              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-500/30 transition flex items-center gap-1"
                            >
                              <span>✏️</span> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              title="Delete Product"
                              className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-500/30 transition"
                            >
                              <span>🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PRODUCT PAGINATION FOOTER */}
            <div className="bg-[#070C18] border-t border-[#1E293B] p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
              <span className="text-slate-400 font-mono">
                Showing <strong className="text-white">{(productPage - 1) * productsPerPage + 1}</strong>–
                <strong className="text-white">{Math.min(productPage * productsPerPage, filteredProducts.length)}</strong> of{" "}
                <strong className="text-white">{filteredProducts.length}</strong> products
              </span>

              <div className="flex items-center gap-1.5 font-mono">
                <button
                  disabled={productPage === 1}
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#1E293B] bg-[#0F172A] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 hover:text-white transition font-bold"
                >
                  Previous
                </button>

                {Array.from({ length: productTotalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setProductPage(pg)}
                    className={`w-7 h-7 rounded-lg border text-xs font-bold transition ${
                      productPage === pg
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-[#0F172A] border-[#1E293B] text-slate-400 hover:text-white"
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  disabled={productPage === productTotalPages}
                  onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#1E293B] bg-[#0F172A] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 hover:text-white transition font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL / SIDE PANEL: ADD / EDIT SHELF FORM ───────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 shadow-2xl font-sans text-xs max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">{editingShelf ? "✏️" : "📦"}</span>
                <h3 className="text-base font-extrabold text-white">
                  {editingShelf ? "Edit Shelf" : "Add Shelf"}
                </h3>
                {!editingShelf && (
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-[9px] font-extrabold uppercase tracking-widest">New</span>
                )}
              </div>
              <button onClick={() => { setIsFormOpen(false); setFormErrors({}); }} className="text-slate-400 hover:text-white font-bold text-sm w-7 h-7 rounded-lg bg-[#1E293B] hover:bg-rose-600/30 flex items-center justify-center transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 font-mono" noValidate>

              {/* ── Store ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Store <span className="text-rose-400">*</span>
                </label>
                {isStoreManager ? (
                  <div className="w-full bg-emerald-900/20 border border-emerald-700/40 p-2.5 rounded-xl text-emerald-300 font-bold font-sans flex items-center gap-1.5">
                    🏪 {assignedStore}
                  </div>
                ) : (
                  <select
                    value={formState.store}
                    onChange={(e) => { setFormState({ ...formState, store: e.target.value }); setFormErrors({ ...formErrors, store: "" }); }}
                    className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${formErrors.store ? "border-rose-500" : "border-[#1E293B]"}`}
                  >
                    <option value="">— Select Store —</option>
                    <option value="Store 1 - Koramangala">Store 1 - Koramangala</option>
                    <option value="Store 2 - Indiranagar">Store 2 - Indiranagar</option>
                    <option value="Store 3 - Hyderabad">Store 3 - Hyderabad</option>
                    <option value="Store 4 - Andheri">Store 4 - Andheri</option>
                    <option value="Store 5 - Connaught Place">Store 5 - Connaught Place</option>
                  </select>
                )}
                {formErrors.store && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.store}</p>}
              </div>

              {/* ── Shelf Name ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Shelf Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shelf A1 – Premium Beverages Bay"
                  value={formState.name}
                  onChange={(e) => { setFormState({ ...formState, name: e.target.value }); setFormErrors({ ...formErrors, name: "" }); }}
                  className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${formErrors.name ? "border-rose-500" : "border-[#1E293B]"}`}
                />
                {formErrors.name && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.name}</p>}
              </div>

              {/* ── Shelf Zone ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Shelf Zone <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formState.useNewZone ? "__new__" : formState.zone}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setFormState({ ...formState, useNewZone: true, newZone: "" });
                    } else {
                      setFormState({ ...formState, useNewZone: false, zone: e.target.value });
                    }
                    setFormErrors({ ...formErrors, zone: "" });
                  }}
                  className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${formErrors.zone ? "border-rose-500" : "border-[#1E293B]"}`}
                >
                  <option value="">— Select Zone —</option>
                  {existingZones.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                  <option value="__new__">➕ Create New Zone…</option>
                </select>

                {/* Inline New Zone Input */}
                {formState.useNewZone && (
                  <div className="mt-2 relative">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Enter new zone name (e.g. Zone E – Frozen Foods)"
                      value={formState.newZone}
                      onChange={(e) => { setFormState({ ...formState, newZone: e.target.value }); setFormErrors({ ...formErrors, zone: "" }); }}
                      className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-sans pr-20 transition ${formErrors.zone ? "border-rose-500" : "border-emerald-500/50"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, useNewZone: false, zone: existingZones[0] || "Zone A - Beverages" })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white font-bold"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}
                {formErrors.zone && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.zone}</p>}
              </div>

              {/* ── Shelf Coordinates ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Shelf Coordinates <span className="text-rose-400">*</span>
                  <span className="ml-1.5 text-slate-500 font-normal">(meters, 0–200)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 text-[10px]">X Coordinate</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="200"
                      placeholder="e.g. 16.2"
                      value={formState.coordsX}
                      onChange={(e) => { setFormState({ ...formState, coordsX: e.target.value }); setFormErrors({ ...formErrors, coordsX: "" }); }}
                      className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono transition ${formErrors.coordsX ? "border-rose-500" : "border-[#1E293B]"}`}
                    />
                    {formErrors.coordsX && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.coordsX}</p>}
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 text-[10px]">Y Coordinate</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="200"
                      placeholder="e.g. 8.7"
                      value={formState.coordsY}
                      onChange={(e) => { setFormState({ ...formState, coordsY: e.target.value }); setFormErrors({ ...formErrors, coordsY: "" }); }}
                      className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono transition ${formErrors.coordsY ? "border-rose-500" : "border-[#1E293B]"}`}
                    />
                    {formErrors.coordsY && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.coordsY}</p>}
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] mt-1.5 font-sans">
                  💡 Switch to the <strong className="text-slate-400">Visual Layout</strong> tab to pick coordinates by clicking on the floorplan map.
                </p>
              </div>

              {/* ── Shelf Type ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Shelf Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formState.shelfType}
                  onChange={(e) => setFormState({ ...formState, shelfType: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition"
                >
                  <option value="Rack">Rack</option>
                  <option value="Cooler">Cooler</option>
                  <option value="Wall Endcap">Wall Endcap</option>
                  <option value="Checkout Display">Checkout Display</option>
                  <option value="Gondola">Gondola</option>
                  <option value="Wall Display">Wall Display</option>
                </select>
              </div>

              {/* ── Physical Dimensions ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Physical Dimensions <span className="text-rose-400">*</span>
                  <span className="ml-1 text-slate-500 font-normal font-sans">(meters, Width x Height)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 text-[10px]">Width</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="15"
                      value={formState.width}
                      onChange={(e) => { setFormState({ ...formState, width: e.target.value }); setFormErrors({ ...formErrors, width: "" }); }}
                      className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono transition ${formErrors.width ? "border-rose-500" : "border-[#1E293B]"}`}
                    />
                    {formErrors.width && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.width}</p>}
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 text-[10px]">Height</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="15"
                      value={formState.height}
                      onChange={(e) => { setFormState({ ...formState, height: e.target.value }); setFormErrors({ ...formErrors, height: "" }); }}
                      className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono transition ${formErrors.height ? "border-rose-500" : "border-[#1E293B]"}`}
                    />
                    {formErrors.height && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.height}</p>}
                  </div>
                </div>
              </div>

              {/* ── Shelf Capacity ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Shelf Capacity (Units) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  value={formState.capacity}
                  onChange={(e) => { setFormState({ ...formState, capacity: e.target.value }); setFormErrors({ ...formErrors, capacity: "" }); }}
                  className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono transition ${formErrors.capacity ? "border-rose-500" : "border-[#1E293B]"}`}
                />
                {formErrors.capacity && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.capacity}</p>}
              </div>

              {/* ── Attached Camera ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Attached Surveillance Camera
                </label>
                <select
                  value={formState.attachedCamera}
                  onChange={(e) => setFormState({ ...formState, attachedCamera: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition"
                >
                  <option value="">— Select Camera (None) —</option>
                  {camerasList.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      📹 {cam.id} - {cam.name} ({cam.store})
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Product Category ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Product Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formState.category}
                  onChange={(e) => { setFormState({ ...formState, category: e.target.value }); setFormErrors({ ...formErrors, category: "" }); }}
                  className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${formErrors.category ? "border-rose-500" : "border-[#1E293B]"}`}
                >
                  <option value="">— Select Category —</option>
                  <option value="Beverages">🥤 Beverages</option>
                  <option value="Snacks">🍟 Snacks</option>
                  <option value="Dairy">🥛 Dairy</option>
                  <option value="Bakery">🥐 Bakery</option>
                  <option value="Personal Care">💄 Personal Care</option>
                  <option value="Household">🧹 Household</option>
                  <option value="Smartphones">📱 Smartphones</option>
                  <option value="Wearables">⌚ Wearables</option>
                  <option value="Cosmetics">💋 Cosmetics</option>
                  <option value="Fresh Produce">🥦 Fresh Produce</option>
                  <option value="Frozen Foods">🧊 Frozen Foods</option>
                  <option value="Electronics">💡 Electronics</option>
                </select>
                {formErrors.category && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {formErrors.category}</p>}
              </div>

              {/* ── Shelf Status ── */}
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Shelf Status</label>
                <div className="flex gap-3">
                  {["Active", "Inactive"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormState({ ...formState, status: s })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-extrabold transition ${
                        formState.status === s
                          ? s === "Active"
                            ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                            : "bg-slate-700/40 border-slate-500/60 text-slate-300"
                          : "bg-[#070C18] border-[#1E293B] text-slate-500 hover:border-slate-500"
                      }`}
                    >
                      {s === "Active" ? "● Active" : "○ Inactive"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Submit Buttons ── */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B] font-sans">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setFormErrors({}); }}
                  className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold hover:bg-[#273449] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-extrabold transition shadow-md flex items-center gap-2"
                >
                  {editingShelf ? "✏️ Update Shelf" : "📦 Add Shelf"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ── MODAL: SHELF DETAILS ─────────────────────────────────────────── */}
      {selectedShelfDetails && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-sans">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedShelfDetails.name}</h3>
                <span className="text-xs text-indigo-400 font-mono">{selectedShelfDetails.id}</span>
              </div>
              <button onClick={() => setSelectedShelfDetails(null)} className="text-slate-400 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#070C18] p-4 rounded-xl border border-[#1E293B] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Assigned Store:</span>
                <span className="font-bold text-slate-200">{selectedShelfDetails.store}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Store Zone:</span>
                <span className="font-bold text-indigo-300">{selectedShelfDetails.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Product Category:</span>
                <span className="font-bold text-slate-200">{selectedShelfDetails.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Physical Coordinates:</span>
                <span className="font-mono text-slate-200">X: {selectedShelfDetails.coordsX}m, Y: {selectedShelfDetails.coordsY}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Attention Score:</span>
                <span className="font-mono text-rose-400 font-bold">{selectedShelfDetails.attentionScore} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Occupancy Rate:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedShelfDetails.occupancyRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Status:</span>
                <span className={`font-bold ${selectedShelfDetails.status === "Active" ? "text-emerald-400" : "text-slate-400"}`}>
                  {selectedShelfDetails.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                onClick={() => {
                  handleOpenEditForm(selectedShelfDetails);
                  setSelectedShelfDetails(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
              >
                Edit Shelf Unit
              </button>
              <button
                onClick={() => setSelectedShelfDetails(null)}
                className="px-4 py-2 bg-[#1E293B] text-slate-300 font-bold rounded-xl text-xs hover:bg-[#273449]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL: REGISTER CAMERA ─────────────────────────────────────────── */}
      {isAddCameraOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl font-sans text-xs">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>📹</span> Register Surveillance Camera
              </h3>
              <button 
                onClick={() => setIsAddCameraOpen(false)} 
                className="text-slate-400 hover:text-white font-bold text-sm bg-[#1E293B] hover:bg-rose-600/30 w-7 h-7 rounded-lg flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCameraFormSubmit} className="space-y-4 font-mono">
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Camera ID</label>
                <input
                  type="text"
                  disabled
                  value={cameraFormState.id}
                  className="w-full bg-[#070C18]/65 border border-[#1E293B] p-2.5 rounded-xl text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Camera Name / Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Entrance Dome Camera"
                  value={cameraFormState.name}
                  onChange={(e) => {
                    setCameraFormState({ ...cameraFormState, name: e.target.value });
                    setCameraFormErrors({ ...cameraFormErrors, name: "" });
                  }}
                  className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${
                    cameraFormErrors.name ? "border-rose-500" : "border-[#1E293B]"
                  }`}
                />
                {cameraFormErrors.name && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {cameraFormErrors.name}</p>}
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">IP Address / Stream URL <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.105 or rtsp://..."
                  value={cameraFormState.ip}
                  onChange={(e) => {
                    setCameraFormState({ ...cameraFormState, ip: e.target.value });
                    setCameraFormErrors({ ...cameraFormErrors, ip: "" });
                  }}
                  className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition ${
                    cameraFormErrors.ip ? "border-rose-500" : "border-[#1E293B]"
                  }`}
                />
                {cameraFormErrors.ip && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {cameraFormErrors.ip}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">X Coordinate (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cameraFormState.coordsX}
                    onChange={(e) => setCameraFormState({ ...cameraFormState, coordsX: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Y Coordinate (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cameraFormState.coordsY}
                    onChange={(e) => setCameraFormState({ ...cameraFormState, coordsY: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B] font-sans">
                <button
                  type="button"
                  onClick={() => setIsAddCameraOpen(false)}
                  className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold hover:bg-[#273449] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-extrabold transition shadow-md"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD ZONE ─────────────────────────────────────────────────── */}
      {isAddZoneOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-sm w-full p-6 shadow-2xl font-sans text-xs">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>📍</span> Add Store Zone Area
              </h3>
              <button 
                onClick={() => setIsAddZoneOpen(false)} 
                className="text-slate-400 hover:text-white font-bold text-sm bg-[#1E293B] hover:bg-rose-600/30 w-7 h-7 rounded-lg flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleZoneFormSubmit} className="space-y-4 font-mono">
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Zone ID</label>
                <input
                  type="text"
                  disabled
                  value={zoneFormState.id}
                  className="w-full bg-[#070C18]/65 border border-[#1E293B] p-2.5 rounded-xl text-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Zone Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zone E – Bakery Outer Aisle"
                  value={zoneFormState.name}
                  onChange={(e) => {
                    setZoneFormState({ ...zoneFormState, name: e.target.value });
                    setZoneFormErrors({ ...zoneFormErrors, name: "" });
                  }}
                  className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${
                    zoneFormErrors.name ? "border-rose-500" : "border-[#1E293B]"
                  }`}
                />
                {zoneFormErrors.name && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {zoneFormErrors.name}</p>}
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Store Node</label>
                <select
                  value={zoneFormState.store}
                  onChange={(e) => setZoneFormState({ ...zoneFormState, store: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                >
                  <option value="Store 1 - Koramangala">Store 1 - Koramangala</option>
                  <option value="Store 2 - Indiranagar">Store 2 - Indiranagar</option>
                  <option value="Store 3 - Hyderabad">Store 3 - Hyderabad</option>
                  <option value="Store 4 - Andheri">Store 4 - Andheri</option>
                  <option value="Store 5 - Connaught Place">Store 5 - Connaught Place</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B] font-sans">
                <button
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold hover:bg-[#273449] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-extrabold transition shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT PRODUCT ───────────────────────────────────────── */}
      {isAddProductOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl font-sans text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>🛒</span> {editingProduct ? "Edit Product Details" : "Add Product Unit"}
              </h3>
              <button 
                onClick={() => setIsAddProductOpen(false)} 
                className="text-slate-400 hover:text-white font-bold text-sm bg-[#1E293B] hover:bg-rose-600/30 w-7 h-7 rounded-lg flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit} className="space-y-4 font-mono">
              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic Almond Milk"
                  value={productFormState.name}
                  onChange={(e) => {
                    setProductFormState({ ...productFormState, name: e.target.value });
                    setProductFormErrors({ ...productFormErrors, name: "" });
                  }}
                  className={`w-full bg-[#070C18] border p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${
                    productFormErrors.name ? "border-rose-500" : "border-[#1E293B]"
                  }`}
                />
                {productFormErrors.name && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {productFormErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">SKU Code <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={productFormState.sku}
                    onChange={(e) => {
                      setProductFormState({ ...productFormState, sku: e.target.value });
                      setProductFormErrors({ ...productFormErrors, sku: "" });
                    }}
                    className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition ${
                      productFormErrors.sku ? "border-rose-500" : "border-[#1E293B]"
                    }`}
                  />
                  {productFormErrors.sku && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {productFormErrors.sku}</p>}
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Brand Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. BioNature"
                    value={productFormState.brand}
                    onChange={(e) => {
                      setProductFormState({ ...productFormState, brand: e.target.value });
                      setProductFormErrors({ ...productFormErrors, brand: "" });
                    }}
                    className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${
                      productFormErrors.brand ? "border-rose-500" : "border-[#1E293B]"
                    }`}
                  />
                  {productFormErrors.brand && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {productFormErrors.brand}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Product Category</label>
                  <select
                    value={productFormState.category}
                    onChange={(e) => setProductFormState({ ...productFormState, category: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Beverages">🥤 Beverages</option>
                    <option value="Snacks">🍟 Snacks</option>
                    <option value="Dairy">🥛 Dairy</option>
                    <option value="Bakery">🥐 Bakery</option>
                    <option value="Personal Care">💄 Personal Care</option>
                    <option value="Household">🧹 Household</option>
                    <option value="Fresh Produce">🥦 Fresh Produce</option>
                    <option value="Frozen Foods">🧊 Frozen Foods</option>
                    <option value="Electronics">💡 Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Subcategory <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Milk, Bread, Audio"
                    value={productFormState.subcategory}
                    onChange={(e) => {
                      setProductFormState({ ...productFormState, subcategory: e.target.value });
                      setProductFormErrors({ ...productFormErrors, subcategory: "" });
                    }}
                    className={`w-full bg-[#070C18] border p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans transition ${
                      productFormErrors.subcategory ? "border-rose-500" : "border-[#1E293B]"
                    }`}
                  />
                  {productFormErrors.subcategory && <p className="text-rose-400 text-[10px] mt-1 font-bold">⚠ {productFormErrors.subcategory}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Stock Quantity</label>
                  <input
                    type="number"
                    value={productFormState.stockQty}
                    onChange={(e) => setProductFormState({ ...productFormState, stockQty: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Status</label>
                  <select
                    value={productFormState.status}
                    onChange={(e) => setProductFormState({ ...productFormState, status: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productFormState.sellingPrice}
                    onChange={(e) => setProductFormState({ ...productFormState, sellingPrice: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productFormState.costPrice}
                    onChange={(e) => setProductFormState({ ...productFormState, costPrice: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Store Node</label>
                  <select
                    value={productFormState.store}
                    onChange={(e) => setProductFormState({ ...productFormState, store: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Store 1 - Koramangala">Store 1 - Koramangala</option>
                    <option value="Store 2 - Indiranagar">Store 2 - Indiranagar</option>
                    <option value="Store 3 - Hyderabad">Store 3 - Hyderabad</option>
                    <option value="Store 4 - Andheri">Store 4 - Andheri</option>
                    <option value="Store 5 - Connaught Place">Store 5 - Connaught Place</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Link Shelf Unit</label>
                  <select
                    value={productFormState.shelf}
                    onChange={(e) => setProductFormState({ ...productFormState, shelf: e.target.value })}
                    className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="">— Unassigned —</option>
                    {shelvesList
                      .filter((s) => s.store === productFormState.store)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          📦 {s.id} - {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 font-sans text-[11px]">Promotion Offer</label>
                <input
                  type="text"
                  placeholder="e.g. 10% Off or None"
                  value={productFormState.promo}
                  onChange={(e) => setProductFormState({ ...productFormState, promo: e.target.value })}
                  className="w-full bg-[#070C18] border border-[#1E293B] p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B] font-sans">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold hover:bg-[#273449] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-extrabold transition shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
