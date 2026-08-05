// =======================================
// IMPORTS
// =======================================

// React
import { useEffect, useMemo, useState } from "react";
import { getShelves } from "../services/shelfService";
import { getProducts } from "../services/productService";
// Icons
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaStore,
  FaMapMarkerAlt,
  FaUserTie,
  FaPhone,
  FaClock,
  FaChartBar,
  FaBoxOpen,
  FaUsers,
  FaSyncAlt,
  FaCog,
  FaClipboardList,
} from "react-icons/fa";

// Modal
import AddStoreModal from "./AddStoreModal";

// CSS
import "../styles/StoreTable.css";

// Services
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
} from "../services/storeService";

// =======================================
// COMPONENT
// =======================================

function StoreTable() {

  // =======================================
  // STATES
  // =======================================

  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStore, setEditStore] = useState(null);

  const role = localStorage.getItem("role") || "Admin";
  const [shelves, setShelves] = useState([]);
  const [products, setProducts] = useState([]);

  // =======================================
  // LOAD STORES
  // =======================================

  useEffect(() => {
    loadStores();
  }, []);

  // =======================================
  // SEARCH FILTER
  // =======================================

  useEffect(() => {
    const filtered = stores.filter((store) => {
      const query = search.toLowerCase();

      return (
        store.store_name.toLowerCase().includes(query) ||
        store.manager.toLowerCase().includes(query) ||
        store.location.toLowerCase().includes(query) ||
        store.status.toLowerCase().includes(query)
      );
    });

    setFilteredStores(filtered);
  }, [stores, search]);

  // =======================================
  // KPI CALCULATIONS
  // =======================================

  const dashboardStats = useMemo(() => {

    return {
      totalStores: stores.length,

      activeStores: stores.filter(
        (s) => s.status === "Active"
      ).length,

      totalShelves: shelves.length,

      totalProducts: products.length,
    };

  }, [stores]);

  // =======================================
  // LOAD DATA
  // =======================================

  const loadStores = async () => {
    try {
      setLoading(true);
      setError("");

      const [storeData, shelfData, productData] =
        await Promise.all([
          getStores(),
          getShelves(),
          getProducts(),
        ]);

        setStores(storeData);
        setFilteredStores(storeData);

        setShelves(
          Array.isArray(shelfData) ? shelfData : []
        );

        setProducts(
          Array.isArray(productData)
            ? productData
            : []
        );

      
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load stores."
      );

    } finally {
      setLoading(false);
    }
  };

  // =======================================
  // CRUD FUNCTIONS
  // =======================================

  const addStore = async (storeData) => {
    return await createStore(storeData);
  };

  const editExistingStore = async (id, storeData) => {
    return await updateStore(id, storeData);
  };

  const removeStore = async (id) => {
    return await deleteStore(id);
  };
  // =======================================
  // SAVE STORE
  // =======================================

  const handleSave = async (storeData) => {
    try {
      setLoading(true);

      if (editStore) {
        await editExistingStore(editStore.id, storeData);
        alert("Store updated successfully.");
      } else {
        await addStore(storeData);
        alert("Store created successfully.");
      }

      await loadStores();

      setEditStore(null);
      setIsModalOpen(false);

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.detail ||
        "Unable to save store."
      );

    } finally {
      setLoading(false);
    }
  };

  // =======================================
  // EDIT STORE
  // =======================================

  const handleEdit = (store) => {
    setEditStore(store);
    setIsModalOpen(true);
  };

  // =======================================
  // DELETE STORE
  // =======================================

  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this store?"
    );

    if (!confirmDelete) return;

    try {

      setLoading(true);

      await removeStore(id);

      alert("Store deleted successfully.");

      await loadStores();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.detail ||
        "Unable to delete store."
      );

    } finally {

      setLoading(false);

    }
  };

  // =======================================
  // MODAL
  // =======================================

  const openAddModal = () => {
    setEditStore(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditStore(null);
    setIsModalOpen(false);
  };

  // =======================================
  // LOADING
  // =======================================

  if (loading) {
    return (
      <div className="store-container">
        <div className="loading-box">
          Loading Store Information...
        </div>
      </div>
    );
  }

  // =======================================
  // ERROR
  // =======================================

  if (error) {
    return (
      <div className="store-container">
        <div className="error-box">
          {error}
        </div>
      </div>
    );
  }

  // =======================================
  // UI
  // =======================================

  return (

    <div className="store-container">

      {/* ================= HEADER ================= */}

      <div className="store-header">

        <div>

          <h2>
            <FaStore />
            &nbsp; Store Overview
          </h2>

          <p>
            Smart Retail Consumer Attention Mapping System
          </p>

        </div>

        <div className="header-actions">

          <button
            className="refresh-btn"
            onClick={loadStores}
          >
            <FaSyncAlt />
            Refresh
          </button>

          {(role === "Admin" ||
            role === "Store Manager") && (

            <button
              className="add-store-btn"
              onClick={openAddModal}
            >
              <FaPlus />
              Add Store
            </button>

          )}

        </div>

      </div>

      {/* ================= SEARCH ================= */}

      <div className="search-box">

        <FaSearch />

        <input
          type="text"
          placeholder="Search store..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* ================= KPI CARDS ================= */}

      <div className="kpi-grid">

        <div className="kpi-card">

          <FaStore className="kpi-icon" />

          <h3>Total Stores</h3>

          <h1>{dashboardStats.totalStores}</h1>

        </div>

        <div className="kpi-card">

          <FaUsers className="kpi-icon" />

          <h3>Active Stores</h3>

          <h1>{dashboardStats.activeStores}</h1>

        </div>

        <div className="kpi-card">

          <FaClipboardList className="kpi-icon" />

          <h3>Total Shelves</h3>

          <h1>{dashboardStats.totalShelves}</h1>

        </div>

        <div className="kpi-card">

          <FaBoxOpen className="kpi-icon" />

          <h3>Total Products</h3>

          <h1>{dashboardStats.totalProducts}</h1>

        </div>

      </div>

      {/* ======================================================
           NEXT PART STARTS HERE
           Store Profile
           Store Statistics
           Store Description
      ====================================================== */}
      {/* ================= STORE DETAILS ================= */}

      {filteredStores.length === 0 ? (

        <div className="empty-store">

          <h2>No Store Found</h2>

          <p>
            There are currently no stores available.
          </p>

        </div>

      ) : (

        filteredStores.map((store) => (

          <div
            className="store-overview-card"
            key={store.id}
          >

            {/* ================= TOP GRID ================= */}

            <div className="overview-grid">

              {/* Store Profile */}

              <div className="info-card">

                <h3>

                  <FaStore />

                  &nbsp; Store Profile

                </h3>

                <div className="info-row">

                  <span>Store Name</span>

                  <strong>
                    {
                      shelves.filter(
                        (shelf) =>
                          shelf.store_id === store.id
                      ).length
                    }
                  </strong>

                </div>

                <div className="info-row">

                  <span>Manager</span>

                  <strong>
                    {store.manager}
                  </strong>

                </div>

                <div className="info-row">

                  <span>Location</span>

                  <strong>
                    {store.location}
                  </strong>

                </div>

                <div className="info-row">

                  <span>Address</span>

                  <strong>
                    {store.address}
                  </strong>

                </div>

                <div className="info-row">

                  <span>Phone</span>

                  <strong>
                    {store.phone}
                  </strong>

                </div>

                <div className="info-row">

                  <span>Status</span>

                  <span
                    className={
                      store.status === "Active"
                        ? "status active"
                        : "status inactive"
                    }
                  >
                    {store.status}
                  </span>

                </div>

              </div>

              {/* Statistics */}

              <div className="info-card">

                <h3>

                  <FaChartBar />

                  &nbsp; Store Statistics

                </h3>

                <div className="info-row">

                  <span>Store ID</span>

                  <strong>
                    {store.id}
                  </strong>

                </div>

                <div className="info-row">

                  <span>Today's Customers</span>

                  <strong>126</strong>

                </div>

                <div className="info-row">

                  <span>Current Customers</span>

                  <strong>18</strong>

                </div>

                <div className="info-row">

                  <span>Registered Cameras</span>

                  <strong>2</strong>

                </div>

                <div className="info-row">

                  <span>Registered Shelves</span>

                  <strong>
                    {store.total_shelves || 0}
                  </strong>

                </div>

                <div className="info-row">

                  <span>Registered Products</span>

                  <strong>
                    {
                      products.filter(
                        (product) =>
                          product.store_id === store.id
                      ).length
                    }
                  </strong>

                </div>

              </div>

            </div>

            {/* ================= DESCRIPTION ================= */}

            <div className="description-card">

              <h3>

                <FaClipboardList />

                &nbsp; Store Description

              </h3>

              <p>

                This smart retail store uses AI-powered
                customer attention mapping to analyse
                customer movement, dwell time,
                product interactions and shelf engagement.
                The collected insights help improve
                product placement, customer experience
                and retail decision making while
                providing live analytics through the dashboard.

              </p>

            </div>

            {/* ======================================================
                 PART 4 STARTS HERE
                 Store Configuration
                 Recent Updates
                 Action Buttons
                 ====================================================== */}
                 {/* ================= STORE CONFIGURATION ================= */}

            <div className="configuration-card">

              <h3>

                <FaCog />

                &nbsp; Store Configuration

              </h3>

              <div className="configuration-grid">

                <div className="config-item">

                  <span>Store Name</span>

                  <strong>{store.store_name}</strong>

                </div>

                <div className="config-item">

                  <span>Manager</span>

                  <strong>{store.manager}</strong>

                </div>

                <div className="config-item">

                  <span>Location</span>

                  <strong>{store.location}</strong>

                </div>

                <div className="config-item">

                  <span>Address</span>

                  <strong>{store.address}</strong>

                </div>

                <div className="config-item">

                  <span>Phone</span>

                  <strong>{store.phone}</strong>

                </div>

                <div className="config-item">

                  <span>Status</span>

                  <strong>{store.status}</strong>

                </div>

                <div className="config-item">

                  <span>Opening Hours</span>

                  <strong>09:00 AM - 10:00 PM</strong>

                </div>

                <div className="config-item">

                  <span>Store Type</span>

                  <strong>Retail Store</strong>

                </div>

                <div className="config-item">

                  <span>Registered Shelves</span>

                  <strong>
                    {
                      shelves.filter(
                        (shelf) =>
                          shelf.store_id === store.id
                      ).length
                    }
                  </strong>

                </div>

                <div className="config-item">

                  <span>Registered Products</span>

                  <strong>
                    {
                      products.filter(
                        (product) =>
                          product.store_id === store.id
                      ).length
                    }
                  </strong>

                </div>

                <div className="config-item">

                  <span>Registered Cameras</span>

                  <strong>2</strong>

                </div>

                <div className="config-item">

                  <span>System Version</span>

                  <strong>v1.0</strong>

                </div>

              </div>

            </div>


            {/* ================= RECENT UPDATES ================= */}

            <div className="updates-card">

              <h3>

                <FaClipboardList />

                &nbsp; Recent Updates

              </h3>

              <div className="timeline">

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <strong>Dashboard Refreshed</strong>

                    <p>
                      Latest analytics loaded successfully.
                    </p>

                  </div>

                </div>

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <strong>Customer Statistics Updated</strong>

                    <p>
                      Store customer information synchronized.
                    </p>

                  </div>

                </div>

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <strong>Product Catalogue Updated</strong>

                    <p>
                      Product information refreshed successfully.
                    </p>

                  </div>

                </div>

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <strong>Shelf Configuration Synced</strong>

                    <p>
                      Shelf information synchronized with database.
                    </p>

                  </div>

                </div>

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <strong>Store Status Verified</strong>

                    <p>

                      Current Store Status :
                      <span
                        className={
                          store.status === "Active"
                            ? "status active"
                            : "status inactive"
                        }
                      >
                        {" "}
                        {store.status}
                      </span>

                    </p>

                  </div>

                </div>

              </div>

            </div>


            {/* ================= ACTION BUTTONS ================= */}

            {(role === "Admin" ||
              role === "Store Manager") && (

              <div className="store-actions">

                <button
                  className="edit-btn"
                  onClick={() => handleEdit(store)}
                >

                  <FaEdit />

                  Edit Store

                </button>

                <button
                  className="delete-btn"
                  onClick={() =>
                    handleDelete(store.id)
                  }
                >

                  <FaTrash />

                  Delete Store

                </button>

              </div>

            )}

          </div>

        ))

      )}

      {/* ======================================================
           PART 5 STARTS HERE

           AddStoreModal

           Closing JSX

           export default

      ====================================================== */}
      {/* ================= ADD / EDIT STORE MODAL ================= */}

      <AddStoreModal
        isOpen={isModalOpen}
        editStore={editStore}
        onClose={closeModal}
        onSave={handleSave}
      />

    </div>

  );

}

export default StoreTable;