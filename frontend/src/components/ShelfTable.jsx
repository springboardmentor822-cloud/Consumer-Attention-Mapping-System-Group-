import { useEffect, useMemo, useState } from "react";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaLayerGroup,
  FaBoxes,
  FaWarehouse,
  FaCheckCircle,
} from "react-icons/fa";

import AddShelfModal from "./AddShelfModal";
import "../styles/ShelfTable.css";

import {
  getShelves,
  createShelf,
  updateShelf,
  deleteShelf,
} from "../services/shelfService";

function ShelfTable() {

  /* ===========================
        STATES
  =========================== */

  const [shelves, setShelves] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editShelf, setEditShelf] = useState(null);

  /* ===========================
        LOAD SHELVES
  =========================== */

  const loadShelves = async () => {

    try {

      setLoading(true);

      setError("");

      const data = await getShelves();

      if (Array.isArray(data)) {

        setShelves(data);

      } else {

        console.error("Unexpected shelf response:", data);

        setShelves([]);

      }

    } catch (err) {

      console.error(err);

      setError("Unable to load shelves.");

      setShelves([]);

    } finally {

      setLoading(false);

    }

  };

  /* ===========================
        LOAD ON START
  =========================== */

  useEffect(() => {

    loadShelves();

  }, []);

  /* ===========================
        SEARCH FILTER
  =========================== */

  const filteredShelves = useMemo(() => {

    const keyword = search.toLowerCase();

    return shelves.filter((item) => {

      return (

        item.shelf_name?.toLowerCase().includes(keyword) ||

        item.zone?.toLowerCase().includes(keyword) ||

        item.status?.toLowerCase().includes(keyword) ||

        String(item.store_id).includes(keyword)

      );

    });

  }, [shelves, search]);

  /* ===========================
        KPI CALCULATIONS
  =========================== */

  const totalShelves = shelves.length;

  const availableShelves = shelves.filter(

    (shelf) => shelf.status === "Available"

  ).length;

  const totalCapacity = shelves.reduce(

    (sum, shelf) => sum + Number(shelf.capacity || 0),

    0

  );

  const connectedStores = new Set(

    shelves.map((shelf) => shelf.store_id)

  ).size;
  /* ===========================
        SAVE SHELF
  =========================== */

  const handleSave = async (shelfData) => {

    try {

      if (editShelf) {

        await updateShelf(editShelf.id, shelfData);

      } else {

        await createShelf(shelfData);

      }

      await loadShelves();

      setEditShelf(null);

      setShowModal(false);

    } catch (err) {

      console.error(err);

      alert("Failed to save shelf.");

    }

  };

  /* ===========================
        EDIT SHELF
  =========================== */

  const handleEdit = (shelf) => {

    setEditShelf(shelf);

    setShowModal(true);

  };

  /* ===========================
        DELETE SHELF
  =========================== */

  const handleDelete = async (id) => {

    if (!window.confirm("Delete this shelf?")) return;

    try {

      await deleteShelf(id);

      await loadShelves();

    } catch (err) {

      console.error(err);

      alert("Unable to delete shelf.");

    }

  };

  /* ===========================
        CLOSE MODAL
  =========================== */

  const closeModal = () => {

    setEditShelf(null);

    setShowModal(false);

  };

  /* ===========================
        LOADING
  =========================== */

  if (loading) {

    return (

      <div className="store-container">

        <div className="loading-box">

          <h2>Loading Shelves...</h2>

        </div>

      </div>

    );

  }

  /* ===========================
        ERROR
  =========================== */

  if (error) {

    return (

      <div className="store-container">

        <div className="error-box">

          <h2>{error}</h2>

        </div>

      </div>

    );

  }

  /* ===========================
        MAIN UI
  =========================== */

  return (

    <div className="store-container">

      {/* ================= HEADER ================= */}

      <div className="store-header">

        <div>

          <h2>

            <FaLayerGroup />

            Shelf Management

          </h2>

          <p>

            Manage shelf inventory, capacities, store zones and shelf availability.

          </p>

        </div>

        <div className="header-actions">

          <button

            className="refresh-btn"

            onClick={loadShelves}

          >

            <FaSyncAlt />

            Refresh

          </button>

          <button

            className="add-store-btn"

            onClick={() => {

              setEditShelf(null);

              setShowModal(true);

            }}

          >

            <FaPlus />

            Add Shelf

          </button>

        </div>

      </div>

      {/* ================= SEARCH ================= */}

      <div className="search-box">

        <FaSearch />

        <input

          type="text"

          placeholder="Search shelves by name, zone, status or store..."

          value={search}

          onChange={(e) => setSearch(e.target.value)}

        />

      </div>

      {/* ================= KPI CARDS ================= */}

      <div className="kpi-grid">

        <div className="kpi-card">

          <FaLayerGroup className="kpi-icon" />

          <h3>Total Shelves</h3>

          <h1>{totalShelves}</h1>

        </div>

        <div className="kpi-card">

          <FaCheckCircle className="kpi-icon" />

          <h3>Available Shelves</h3>

          <h1>{availableShelves}</h1>

        </div>

        <div className="kpi-card">

          <FaBoxes className="kpi-icon" />

          <h3>Total Capacity</h3>

          <h1>{totalCapacity}</h1>

        </div>

        <div className="kpi-card">

          <FaWarehouse className="kpi-icon" />

          <h3>Connected Stores</h3>

          <h1>{connectedStores}</h1>

        </div>

      </div>
      {/* ================= SHELF OVERVIEW ================= */}

      <div className="store-overview-card">

        <div className="overview-grid">

          {/* ================= Shelf Information ================= */}

          <div className="info-card">

            <h3>

              <FaLayerGroup />

              Shelf Information

            </h3>

            <div className="info-row">

              <span>Total Shelves</span>

              <strong>{totalShelves}</strong>

            </div>

            <div className="info-row">

              <span>Available Shelves</span>

              <strong>{availableShelves}</strong>

            </div>

            <div className="info-row">

              <span>Connected Stores</span>

              <strong>{connectedStores}</strong>

            </div>

            <div className="info-row">

              <span>Total Capacity</span>

              <strong>{totalCapacity}</strong>

            </div>

          </div>

          {/* ================= Shelf Statistics ================= */}

          <div className="info-card">

            <h3>

              <FaBoxes />

              Shelf Statistics

            </h3>

            <div className="info-row">

              <span>Average Capacity</span>

              <strong>

                {totalShelves > 0
                  ? Math.round(totalCapacity / totalShelves)
                  : 0}

              </strong>

            </div>

            <div className="info-row">

              <span>Largest Capacity</span>

              <strong>

                {Math.max(
                  ...shelves.map((s) => Number(s.capacity || 0)),
                  0
                )}

              </strong>

            </div>

            <div className="info-row">

              <span>Zones Available</span>

              <strong>

                {

                  new Set(

                    shelves.map((s) => s.zone)

                  ).size

                }

              </strong>

            </div>

            <div className="info-row">

              <span>System Status</span>

              <strong className="status active">

                Operational

              </strong>

            </div>

          </div>

        </div>

        {/* ================= Description ================= */}

        <div className="description-card">

          <h3>

            <FaWarehouse />

            Shelf Overview

          </h3>

          <p>

            This dashboard provides a centralized view of all shelves
            across connected stores. Monitor shelf capacity,
            availability, zone allocation and storage utilization in
            real time while managing shelf operations efficiently
            through the integrated management system.

          </p>

        </div>

      </div>

      {/* ================= Configuration ================= */}

      <div className="configuration-card">

        <h3>

          <FaWarehouse />

          Shelf Configuration

        </h3>

        <div className="configuration-grid">

          <div className="config-item">

            <span>Total Capacity</span>

            <strong>{totalCapacity}</strong>

          </div>

          <div className="config-item">

            <span>Available Shelves</span>

            <strong>{availableShelves}</strong>

          </div>

          <div className="config-item">

            <span>Connected Stores</span>

            <strong>{connectedStores}</strong>

          </div>

          <div className="config-item">

            <span>Total Shelf Records</span>

            <strong>{totalShelves}</strong>

          </div>

        </div>

      </div>

      {/* ================= Recent Activity ================= */}

      <div className="updates-card">

        <h3>

          <FaBoxes />

          Recent Activity

        </h3>

        <div className="timeline">

          <div className="timeline-item">

            <div className="timeline-dot"></div>

            <div>

              <strong>Shelf Monitoring Active</strong>

              <p>

                Shelf availability and capacity are being monitored
                continuously.

              </p>

            </div>

          </div>

          <div className="timeline-item">

            <div className="timeline-dot"></div>

            <div>

              <strong>Store Connectivity Verified</strong>

              <p>

                All linked store shelves are synchronized with the
                management system.

              </p>

            </div>

          </div>

          <div className="timeline-item">

            <div className="timeline-dot"></div>

            <div>

              <strong>Inventory Ready</strong>

              <p>

                Shelf records are ready for inventory tracking and
                analytics.

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ================= DATA TABLE ================= */}

      <table className="store-table">
        <thead>

          <tr>

            <th>Shelf Name</th>

            <th>Zone</th>

            <th>Capacity</th>

            <th>Store ID</th>

            <th>Status</th>

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>

          {filteredShelves.length === 0 ? (

            <tr>

              <td
                colSpan="6"
                style={{
                  textAlign: "center",
                  padding: "30px",
                }}
              >
                No Shelves Found
              </td>

            </tr>

          ) : (

            filteredShelves.map((shelf) => (

              <tr key={shelf.id}>

                <td>{shelf.shelf_name}</td>

                <td>{shelf.zone}</td>

                <td>{shelf.capacity}</td>

                <td>{shelf.store_id}</td>

                <td>

                  <span
                    className={
                      shelf.status === "Available"
                        ? "status active"
                        : "status inactive"
                    }
                  >
                    {shelf.status}
                  </span>

                </td>

                <td>

                  <div className="store-actions">

                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(shelf)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(shelf.id)}
                    >
                      <FaTrash />
                    </button>

                  </div>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

      <AddShelfModal
        isOpen={showModal}
        onClose={closeModal}
        onSave={handleSave}
        editShelf={editShelf}
      />

    </div>

  );

}

export default ShelfTable;