import { useState } from "react";

import StoreLayout from "../components/StoreLayout";
import PropertyPanel from "../components/PropertyPanel";
import Legend from "../components/Legend";

import "../styles/StoreArchitecture.css";

function StoreArchitecture() {

  const [selectedItem, setSelectedItem] = useState(null);

  const storeInfo = {
    name: "Main Retail Store",
    area: "1200 sq.ft",
    shelves: 5,
    cameras: 2,
    entrances: 1,
    checkouts: 1,
  };

  return (

    <div className="architecture-page">

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="architecture-header">

        <div>

          <h1>

            🏬 Store Architecture

          </h1>

          <p>

            Interactive digital layout of the retail store.

          </p>

        </div>

        <div className="store-summary">

          <div>

            <strong>Store</strong>

            <span>{storeInfo.name}</span>

          </div>

          <div>

            <strong>Area</strong>

            <span>{storeInfo.area}</span>

          </div>

          <div>

            <strong>Shelves</strong>

            <span>{storeInfo.shelves}</span>

          </div>

          <div>

            <strong>Cameras</strong>

            <span>{storeInfo.cameras}</span>

          </div>

        </div>

      </div>

      {/* ======================================
          MAIN GRID
      ====================================== */}

      <div className="architecture-grid">

        {/* LEFT */}

        <div className="layout-section">

          <StoreLayout

            onSelect={setSelectedItem}

          />

          <Legend />

        </div>

        {/* RIGHT */}

        <div className="details-section">

          <PropertyPanel

            selected={selectedItem}

          />

        </div>

      </div>

    </div>

  );

}

export default StoreArchitecture;