import { useEffect, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
} from "react-icons/fa";

import AddCameraModal from "./AddCameraModal";
import "../styles/CameraTable.css";

import {
  getCameras,
  createCamera,
  updateCamera,
  deleteCamera,
} from "../services/cameraService";

function CameraTable() {

  const [cameras, setCameras] = useState([]);
  const [filteredCameras, setFilteredCameras] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editCamera, setEditCamera] = useState(null);

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {

    setFilteredCameras(

      cameras.filter((camera) =>

        camera.camera_name
          .toLowerCase()
          .includes(search.toLowerCase())

      )

    );

  }, [search, cameras]);



  // ===================================
  // LOAD CAMERAS
  // ===================================

  const loadCameras = async () => {

    try {

      setLoading(true);

      const data = await getCameras();

      setCameras(data);

      setFilteredCameras(data);

    }

    catch (err) {

      console.log(err);

      alert("Unable to load cameras.");

    }

    finally {

      setLoading(false);

    }

  };



  // ===================================
  // SAVE CAMERA
  // ===================================

  const handleSave = async (cameraData) => {

    try {

      if (editCamera) {

        await updateCamera(
          editCamera.id,
          cameraData
        );

      }

      else {

        await createCamera(cameraData);

      }

      loadCameras();

      setEditCamera(null);

      setIsModalOpen(false);

    }

    catch (err) {

      console.log(err);

      alert("Unable to save camera.");

    }

  };



  // ===================================
  // EDIT
  // ===================================

  const handleEdit = (camera) => {

    setEditCamera(camera);

    setIsModalOpen(true);

  };



  // ===================================
  // DELETE
  // ===================================

  const handleDelete = async (id) => {

    if (!window.confirm("Delete this camera?"))
      return;

    try {

      await deleteCamera(id);

      loadCameras();

    }

    catch (err) {

      console.log(err);

      alert("Unable to delete camera.");

    }

  };



  return (

    <div className="camera-container">

      <div className="camera-header">

        <h2>📹 Camera Management</h2>

        <button
          className="add-camera-btn"
          onClick={() => {

            setEditCamera(null);

            setIsModalOpen(true);

          }}
        >

          <FaPlus />

          Add Camera

        </button>

      </div>



      <div className="search-camera">

        <FaSearch />

        <input

          placeholder="Search Camera..."

          value={search}

          onChange={(e) =>
            setSearch(e.target.value)
          }

        />

      </div>



      {

        loading ?

        (

          <h3 style={{
            color:"#fff",
            marginTop:"30px"
          }}>

            Loading Cameras...

          </h3>

        )

        :

        (

          <table className="camera-table">

            <thead>

              <tr>

                <th>Camera</th>

                <th>Location</th>

                <th>Status</th>

                <th>Health</th>

                <th>IP Address</th>

                <th>Store ID</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {

                filteredCameras.map((camera)=>(

                  <tr key={camera.id}>

                    <td>{camera.camera_name}</td>

                    <td>{camera.location}</td>

                    <td>

                      <span className={

                        camera.status==="Online"

                        ?

                        "status online"

                        :

                        "status offline"

                      }>

                        {camera.status}

                      </span>

                    </td>

                    <td>{camera.health}</td>

                    <td>{camera.ip_address}</td>

                    <td>{camera.store_id}</td>

                    <td>

                      <button

                        className="edit-btn"

                        onClick={()=>handleEdit(camera)}

                      >

                        <FaEdit/>

                      </button>

                      <button

                        className="delete-btn"

                        onClick={()=>handleDelete(camera.id)}

                      >

                        <FaTrash/>

                      </button>

                    </td>

                  </tr>

                ))

              }

            </tbody>

          </table>

        )

      }



      <AddCameraModal

        isOpen={isModalOpen}

        editCamera={editCamera}

        onClose={() => {

          setEditCamera(null);

          setIsModalOpen(false);

        }}

        onSave={handleSave}

      />

    </div>

  );

}

export default CameraTable;