import {
  FaInfoCircle,
  FaUser,
  FaStore,
  FaVideo,
  FaDoorOpen,
  FaCashRegister,
  FaCircle,
} from "react-icons/fa";

function PropertyPanel({ selected }) {
  if (!selected) {
    return (
      <div className="property-panel">

        <h2>
          <FaInfoCircle />
          Object Details
        </h2>

        <div className="empty-panel">

          <FaInfoCircle />

          <h3>No Object Selected</h3>

          <p>
            Click any shelf, customer, camera,
            entrance or checkout to view
            its details.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="property-panel">

      <h2>

        <FaInfoCircle />

        {selected.type.charAt(0).toUpperCase() +
          selected.type.slice(1)}{" "}
        Details

      </h2>

      <div className="property-grid">

        {/* ==================================
            CUSTOMER
        ================================== */}

        {selected.type === "customer" && (
          <>
            <div>
              <strong>ID</strong>
              <span>{selected.id}</span>
            </div>

            <div>
              <strong>Current Zone</strong>
              <span>{selected.zone}</span>
            </div>

            <div>
              <strong>Dwell Time</strong>
              <span>{selected.dwell}</span>
            </div>

            <div>
              <strong>Status</strong>
              <span>{selected.status}</span>
            </div>

            <div>
              <strong>Visited Shelves</strong>
              <span>3</span>
            </div>

            <div>
              <strong>Current Camera</strong>
              <span>Camera 1</span>
            </div>

            <div>
              <strong>AI Confidence</strong>
              <span>98.7%</span>
            </div>

            <div>
              <strong>Last Updated</strong>
              <span>Just Now</span>
            </div>

            <div>
              <strong>Live Status</strong>

              <span
                style={{
                  color: "#22c55e",
                  fontWeight: 700,
                }}
              >
                <FaCircle
                  style={{
                    fontSize: 10,
                    marginRight: 8,
                  }}
                />
                Tracking
              </span>
            </div>
          </>
        )}

        {/* ==================================
            SHELF
        ================================== */}

        {selected.type === "shelf" && (
          <>
            <div>
              <strong>Shelf</strong>
              <span>{selected.id}</span>
            </div>

            <div>
              <strong>Category</strong>
              <span>{selected.category}</span>
            </div>

            <div>
              <strong>Products</strong>
              <span>{selected.products}</span>
            </div>

            <div>
              <strong>Capacity</strong>
              <span>{selected.capacity}</span>
            </div>

            <div>
              <strong>Status</strong>
              <span>Available</span>
            </div>

            <div>
              <strong>Nearby Customers</strong>
              <span>2</span>
            </div>
          </>
        )}

        {/* ==================================
            CAMERA
        ================================== */}

        {selected.type === "camera" && (
          <>
            <div>
              <strong>Camera</strong>
              <span>{selected.id}</span>
            </div>

            <div>
              <strong>Location</strong>
              <span>{selected.location}</span>
            </div>

            <div>
              <strong>Status</strong>
              <span>{selected.status}</span>
            </div>

            <div>
              <strong>Resolution</strong>
              <span>{selected.resolution}</span>
            </div>

            <div>
              <strong>Coverage</strong>
              <span>{selected.coverage}</span>
            </div>
          </>
        )}

        {/* ==================================
            ENTRANCE
        ================================== */}

        {selected.type === "entrance" && (
          <>
            <div>
              <strong>Entrance</strong>
              <span>{selected.id}</span>
            </div>

            <div>
              <strong>Width</strong>
              <span>{selected.width}</span>
            </div>

            <div>
              <strong>Status</strong>
              <span>{selected.status}</span>
            </div>
          </>
        )}

        {/* ==================================
            CHECKOUT
        ================================== */}

        {selected.type === "checkout" && (
          <>
            <div>
              <strong>Checkout</strong>
              <span>{selected.id}</span>
            </div>

            <div>
              <strong>Counters</strong>
              <span>{selected.counters}</span>
            </div>

            <div>
              <strong>Status</strong>
              <span>{selected.status}</span>
            </div>

            <div>
              <strong>Queue Length</strong>
              <span>2 Customers</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PropertyPanel;