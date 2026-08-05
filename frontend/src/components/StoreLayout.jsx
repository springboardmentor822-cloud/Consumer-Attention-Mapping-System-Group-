import { useEffect, useState } from "react";
import {
  FaVideo,
  FaDoorOpen,
  FaCashRegister,
  FaUser,
} from "react-icons/fa";

function StoreLayout({ onSelect }) {
  // =====================================
  // SHELVES (Fixed Layout)
  // =====================================

  const shelves = [
    {
      id: "Shelf 1",
      left: "18%",
      top: "18%",
      products: 42,
      category: "Beverages",
      capacity: "80%",
    },
    {
      id: "Shelf 2",
      left: "42%",
      top: "18%",
      products: 36,
      category: "Snacks",
      capacity: "65%",
    },
    {
      id: "Shelf 3",
      left: "66%",
      top: "18%",
      products: 28,
      category: "Dairy",
      capacity: "72%",
    },
    {
      id: "Shelf 4",
      left: "28%",
      top: "58%",
      products: 54,
      category: "Household",
      capacity: "90%",
    },
    {
      id: "Shelf 5",
      left: "60%",
      top: "58%",
      products: 31,
      category: "Frozen",
      capacity: "70%",
    },
  ];

  // =====================================
  // STATES
  // =====================================

  const [customers, setCustomers] = useState([]);

  const [selectedId, setSelectedId] = useState(null);

  // =====================================
  // FETCH CUSTOMERS
  // =====================================

  useEffect(() => {
    const fetchCustomers = () => {
      fetch("http://127.0.0.1:8000/store-layout/customers")
        .then((res) => res.json())
        .then((data) => {
          setCustomers(data);
        })
        .catch((err) => {
          console.log(err);
        });
    };

    fetchCustomers();

    const interval = setInterval(fetchCustomers, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="store-layout">

      {/* CAMERA 1 */}

      <div
        className={`camera camera1 ${
          selectedId === "Camera 1" ? "selected-object" : ""
        }`}
        onClick={() => {
          setSelectedId("Camera 1");

          onSelect({
            type: "camera",
            id: "Camera 1",
            location: "Entrance",
            status: "Online",
            resolution: "1080P",
            coverage: "Entrance, Shelf 1, Shelf 2",
          });
        }}
      >
        <FaVideo />
        <span>Camera 1</span>
      </div>

      {/* CAMERA 2 */}

      <div
        className={`camera camera2 ${
          selectedId === "Camera 2" ? "selected-object" : ""
        }`}
        onClick={() => {
          setSelectedId("Camera 2");

          onSelect({
            type: "camera",
            id: "Camera 2",
            location: "Checkout",
            status: "Online",
            resolution: "1080P",
            coverage: "Shelf 4, Shelf 5, Checkout",
          });
        }}
      >
        <FaVideo />
        <span>Camera 2</span>
      </div>

      {/* ENTRANCE */}

      <div
        className={`entrance ${
          selectedId === "Entrance" ? "selected-object" : ""
        }`}
        onClick={() => {
          setSelectedId("Entrance");

          onSelect({
            type: "entrance",
            id: "Main Entrance",
            width: "3 m",
            status: "Open",
          });
        }}
      >
        <FaDoorOpen />
        Entrance
      </div>

      {/* CHECKOUT */}

      <div
        className={`checkout ${
          selectedId === "Checkout" ? "selected-object" : ""
        }`}
        onClick={() => {
          setSelectedId("Checkout");

          onSelect({
            type: "checkout",
            id: "Checkout Counter",
            counters: 1,
            status: "Open",
          });
        }}
      >
        <FaCashRegister />
        Checkout
      </div>

      {/* SHELVES */}

      {shelves.map((shelf) => (
        <div
          key={shelf.id}
          className={`shelf ${
            selectedId === shelf.id ? "selected-object" : ""
          }`}
          style={{
            left: shelf.left,
            top: shelf.top,
          }}
          onClick={() => {
            setSelectedId(shelf.id);

            onSelect({
              type: "shelf",
              ...shelf,
            });
          }}
        >
          {shelf.id}
        </div>
      ))}

      

      {/* CUSTOMERS */}

      {customers.map((customer) => (
        <div
          key={customer.id}
          className={`customer ${
            selectedId === customer.id
              ? "selected-customer"
              : ""
          }`}
          style={{
            left: customer.left,
            top: customer.top,
          }}
          onClick={() => {
            setSelectedId(customer.id);

            onSelect({
              type: "customer",
              ...customer,
            });
          }}
        >
          <FaUser />
        </div>
      ))}
    </div>
  );
}

export default StoreLayout;