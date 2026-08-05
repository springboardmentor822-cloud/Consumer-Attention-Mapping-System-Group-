import { useEffect, useState } from "react";
import "../styles/AddConsumerModal.css";

function AddConsumerModal({
  isOpen,
  onClose,
  onSave,
  editConsumer,
}) {

  const initialData = {
    gender: "",
    age_group: "",
    dwell_time: "",
    attention_score: "",
    emotion: "",
    store_name: "",
  };

  const [formData, setFormData] = useState(initialData);

  useEffect(() => {

    if (editConsumer) {

      setFormData({
        gender: editConsumer.gender || "",
        age_group: editConsumer.age_group || "",
        dwell_time: editConsumer.dwell_time || "",
        attention_score: editConsumer.attention_score || "",
        emotion: editConsumer.emotion || "",
        store_name: editConsumer.store_name || "",
      });

    } else {

      setFormData(initialData);

    }

  }, [editConsumer, isOpen]);

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

      !formData.gender ||

      !formData.age_group ||

      formData.dwell_time === "" ||

      formData.attention_score === "" ||

      !formData.emotion ||

      !formData.store_name.trim()

    ) {

      alert("Please fill all required fields.");

      return;

    }

    if (Number(formData.dwell_time) < 0) {

      alert("Dwell Time cannot be negative.");

      return;

    }

    if (

      Number(formData.attention_score) < 0 ||

      Number(formData.attention_score) > 100

    ) {

      alert("Attention Score must be between 0 and 100.");

      return;

    }

    onSave({

      gender: formData.gender,

      age_group: formData.age_group,

      dwell_time: Number(formData.dwell_time),

      attention_score: Number(formData.attention_score),

      emotion: formData.emotion,

      store_name: formData.store_name.trim(),

    });

  };

  return (

    <div className="modal-overlay">

      <div className="modal">

        <h2>

          {editConsumer ? "Edit Consumer" : "Add Consumer"}

        </h2>

        <form onSubmit={handleSubmit}>

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >

            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>

          </select>

          <select
            name="age_group"
            value={formData.age_group}
            onChange={handleChange}
          >

            <option value="">Select Age Group</option>
            <option value="Child">Child</option>
            <option value="Adult">Adult</option>
            <option value="Senior">Senior</option>

          </select>

          <input
            type="number"
            name="dwell_time"
            placeholder="Dwell Time (seconds)"
            value={formData.dwell_time}
            onChange={handleChange}
          />

          <input
            type="number"
            step="0.01"
            name="attention_score"
            placeholder="Attention Score (0-100)"
            value={formData.attention_score}
            onChange={handleChange}
          />

          <select
            name="emotion"
            value={formData.emotion}
            onChange={handleChange}
          >

            <option value="">Select Emotion</option>
            <option value="Happy">Happy</option>
            <option value="Neutral">Neutral</option>
            <option value="Surprised">Surprised</option>
            <option value="Angry">Angry</option>

          </select>

          <input
            type="text"
            name="store_name"
            placeholder="Store Name"
            value={formData.store_name}
            onChange={handleChange}
          />

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

              {editConsumer ? "Update Consumer" : "Save Consumer"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

export default AddConsumerModal;