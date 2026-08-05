import { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
} from "react-icons/fa";

import AddConsumerModal from "./AddConsumerModal";
import "../styles/ConsumerTable.css";

import {
  getConsumers,
  createConsumer,
  updateConsumer,
  deleteConsumer,
} from "../services/consumerService";

function ConsumerTable() {

  const [consumers, setConsumers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editConsumer, setEditConsumer] = useState(null);

  const loadConsumers = async () => {

    try {

      setLoading(true);

      setError("");

      const data = await getConsumers();

      setConsumers(data);

    }

    catch (err) {

      console.error(err);

      setError("Unable to load consumers.");

    }

    finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadConsumers();

  }, []);

  const filteredConsumers = useMemo(() => {

    const keyword = search.toLowerCase();

    return consumers.filter((consumer) =>

      consumer.gender?.toLowerCase().includes(keyword) ||

      consumer.age_group?.toLowerCase().includes(keyword) ||

      consumer.emotion?.toLowerCase().includes(keyword) ||

      consumer.store_name?.toLowerCase().includes(keyword)

    );

  }, [consumers, search]);
    // =====================================
  // SAVE CONSUMER
  // =====================================

  const handleSave = async (consumerData) => {

    try {

      if (editConsumer) {

        await updateConsumer(
          editConsumer.id,
          consumerData
        );

      } else {

        await createConsumer(consumerData);

      }

      await loadConsumers();

      setEditConsumer(null);

      setShowModal(false);

    } catch (err) {

      console.error(err);

      alert("Unable to save consumer.");

    }

  };

  // =====================================
  // EDIT CONSUMER
  // =====================================

  const handleEdit = (consumer) => {

    setEditConsumer(consumer);

    setShowModal(true);

  };

  // =====================================
  // DELETE CONSUMER
  // =====================================

  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this consumer?"
    );

    if (!confirmDelete) return;

    try {

      await deleteConsumer(id);

      await loadConsumers();

    } catch (err) {

      console.error(err);

      alert("Unable to delete consumer.");

    }

  };

  // =====================================
  // CLOSE MODAL
  // =====================================

  const handleCloseModal = () => {

    setEditConsumer(null);

    setShowModal(false);

  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {

    return (

      <div className="consumer-container">

        <h2>Loading Consumers...</h2>

      </div>

    );

  }

  // =====================================
  // ERROR
  // =====================================

  if (error) {

    return (

      <div className="consumer-container">

        <h2>{error}</h2>

      </div>

    );

  }

    return (

    <div className="consumer-container">

      {/* Header */}

      <div className="consumer-header">

        <h2>👥 Consumer Management</h2>

        <button
          className="add-consumer-btn"
          onClick={() => {

            setEditConsumer(null);

            setShowModal(true);

          }}
        >

          <FaPlus />

          Add Consumer

        </button>

      </div>

      {/* Search */}

      <div className="search-consumer">

        <FaSearch />

        <input
          type="text"
          placeholder="Search Consumer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* Table */}

      <table className="consumer-table">

        <thead>

          <tr>

            <th>ID</th>

            <th>Gender</th>

            <th>Age Group</th>

            <th>Dwell Time (sec)</th>

            <th>Attention Score</th>

            <th>Emotion</th>

            <th>Store</th>

            <th>Visit Time</th>

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>

          {

            filteredConsumers.length > 0

            ?

            filteredConsumers.map((consumer) => (

              <tr key={consumer.id}>

                <td>{consumer.id}</td>

                <td>{consumer.gender}</td>

                <td>{consumer.age_group}</td>

                <td>{consumer.dwell_time}</td>

                <td>

                  {Number(consumer.attention_score).toFixed(2)}

                </td>

                <td>{consumer.emotion}</td>

                <td>{consumer.store_name}</td>

                <td>

                  {

                    consumer.visit_time

                    ?

                    new Date(
                      consumer.visit_time
                    ).toLocaleString()

                    :

                    "-"

                  }

                </td>

                <td>

                  <button
                    className="edit-btn"
                    onClick={() =>
                      handleEdit(consumer)
                    }
                  >

                    <FaEdit />

                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(consumer.id)
                    }
                  >

                    <FaTrash />

                  </button>

                </td>

              </tr>

            ))

            :

            (

              <tr>

                <td
                  colSpan="9"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >

                  No consumers found.

                </td>

              </tr>

            )

          }

        </tbody>

      </table>

      {/* Modal */}

      <AddConsumerModal

        isOpen={showModal}

        editConsumer={editConsumer}

        onClose={handleCloseModal}

        onSave={handleSave}

      />

    </div>

  );

}

export default ConsumerTable;