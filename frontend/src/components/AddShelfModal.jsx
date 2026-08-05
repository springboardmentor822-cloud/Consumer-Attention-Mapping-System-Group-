import { useEffect, useState } from "react";
import "../styles/AddShelfModal.css";

function AddShelfModal({
  isOpen,
  onClose,
  onSave,
  editShelf,
}) {

  const initialData = {
    shelf_name: "",
    zone: "",
    capacity: "",
    status: "Available",
    store_id: "",
  };

  const [formData, setFormData] = useState(initialData);

  useEffect(() => {

    if (editShelf) {

      setFormData({
        shelf_name: editShelf.shelf_name || "",
        zone: editShelf.zone || "",
        capacity: editShelf.capacity || "",
        status: editShelf.status || "Available",
        store_id: editShelf.store_id || "",
      });

    }

    else {

      setFormData(initialData);

    }

  }, [editShelf, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    if (
      !formData.shelf_name.trim() ||
      !formData.zone.trim() ||
      formData.capacity === "" ||
      formData.store_id === ""
    ) {

      alert("Please fill all required fields.");

      return;

    }

    if (Number(formData.capacity) <= 0) {

      alert("Capacity must be greater than zero.");

      return;

    }

    if (Number(formData.store_id) <= 0) {

      alert("Store ID must be valid.");

      return;

    }

    onSave({

      shelf_name: formData.shelf_name.trim(),

      zone: formData.zone.trim(),

      capacity: Number(formData.capacity),

      status: formData.status,

      store_id: Number(formData.store_id),

    });

  };

  return (

    <div className="modal-overlay">

      <div className="modal-box">

        <h2>

          {editShelf ? "Edit Shelf" : "Add Shelf"}

        </h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="shelf_name"
            placeholder="Shelf Name"
            value={formData.shelf_name}
            onChange={handleChange}
          />

          <input
            type="text"
            name="zone"
            placeholder="Zone"
            value={formData.zone}
            onChange={handleChange}
          />

          <input
            type="number"
            name="capacity"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={handleChange}
          />

          <input
            type="number"
            name="store_id"
            placeholder="Store ID"
            value={formData.store_id}
            onChange={handleChange}
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >

            <option value="Available">
              Available
            </option>

            <option value="Occupied">
              Occupied
            </option>

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
              {editShelf ? "Update Shelf" : "Save Shelf"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

export default AddShelfModal;