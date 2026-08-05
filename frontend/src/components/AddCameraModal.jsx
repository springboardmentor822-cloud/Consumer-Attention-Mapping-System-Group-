import { useEffect, useState } from "react";
import "../styles/AddCameraModal.css";

function AddCameraModal({
  isOpen,
  onClose,
  onSave,
  editCamera,
}) {

  const [formData, setFormData] = useState({
    camera_name: "",
    location: "",
    status: "Online",
    health: "Good",
    ip_address: "",
    store_id: 1,
  });

  useEffect(() => {

    if (editCamera) {

      setFormData({
        camera_name: editCamera.camera_name || "",
        location: editCamera.location || "",
        status: editCamera.status || "Online",
        health: editCamera.health || "Good",
        ip_address: editCamera.ip_address || "",
        store_id: editCamera.store_id || 1,
      });

    } else {

      setFormData({
        camera_name: "",
        location: "",
        status: "Online",
        health: "Good",
        ip_address: "",
        store_id: 1,
      });

    }

  }, [editCamera]);

  if (!isOpen) return null;

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]:
        name === "store_id"
          ? Number(value)
          : value,
    });

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    if (
      !formData.camera_name ||
      !formData.location ||
      !formData.ip_address
    ) {

      alert("Please fill all required fields.");

      return;

    }

    onSave(formData);

  };

  return (

    <div className="modal-overlay">

      <div className="modal">

        <h2>

          {editCamera ? "Edit Camera" : "Add Camera"}

        </h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="camera_name"
            placeholder="Camera Name"
            value={formData.camera_name}
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
            name="ip_address"
            placeholder="IP Address"
            value={formData.ip_address}
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
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>

          <select
            name="health"
            value={formData.health}
            onChange={handleChange}
          >
            <option value="Good">Good</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
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
              {editCamera ? "Update Camera" : "Save Camera"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

export default AddCameraModal;