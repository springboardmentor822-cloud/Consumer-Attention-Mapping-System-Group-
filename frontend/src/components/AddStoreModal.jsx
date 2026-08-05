import { useEffect, useState } from "react";
import "../styles/AddStoreModal.css";

function AddStoreModal({
  isOpen,
  onClose,
  onSave,
  editStore,
}) {
  const initialFormData = {
    store_name: "",
    manager: "",
    location: "",
    address: "",
    phone: "",
    status: "Active",
  };

  const [formData, setFormData] = useState(initialFormData);

  // ==========================================
  // LOAD STORE DATA
  // ==========================================

  useEffect(() => {
    if (editStore) {
      setFormData({
        store_name: editStore.store_name || "",
        manager: editStore.manager || "",
        location: editStore.location || "",
        address: editStore.address || "",
        phone: editStore.phone || "",
        status: editStore.status || "Active",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editStore, isOpen]);

  if (!isOpen) return null;

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // HANDLE SUBMIT
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.store_name.trim() ||
      !formData.manager.trim() ||
      !formData.location.trim() ||
      !formData.address.trim() ||
      !formData.phone.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(formData.phone.trim())) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    onSave({
      store_name: formData.store_name.trim(),
      manager: formData.manager.trim(),
      location: formData.location.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      status: formData.status,
    });
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>
          {editStore ? "Edit Store" : "Add Store"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="store_name"
            placeholder="Store Name"
            value={formData.store_name}
            onChange={handleChange}
          />

          <input
            type="text"
            name="manager"
            placeholder="Manager"
            value={formData.manager}
            onChange={handleChange}
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
            >
              {editStore ? "Update Store" : "Save Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStoreModal;