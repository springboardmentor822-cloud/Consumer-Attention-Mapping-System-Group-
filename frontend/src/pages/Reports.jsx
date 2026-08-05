import { useEffect, useState } from "react";

import ReportCards from "../components/ReportCards";
import CameraSelector from "../components/CameraSelector";

import { useCamera } from "../context/CameraContext";

import {
  getReportDashboard,
  getLiveAnalytics,
  exportPDF,
  exportExcel,
  exportCSV,
} from "../services/reportService";

import "../styles/Reports.css";

function Reports() {

  const { selectedCamera } = useCamera();

  const [reportData, setReportData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    loadDashboard();

  }, []);

  useEffect(() => {

    loadLiveAnalytics();

    const timer = setInterval(() => {

      loadLiveAnalytics();

    }, 1000);

    return () => clearInterval(timer);

  }, [selectedCamera]);

  // ============================================
  // Dashboard Data
  // ============================================

  const loadDashboard = async () => {

    try {

      const data = await getReportDashboard();

      setReportData(data);

    }

    catch (error) {

      console.error(error);

      alert("Unable to load reports.");

    }

    finally {

      setLoading(false);

    }

  };

  // ============================================
  // Live Analytics
  // ============================================

  const loadLiveAnalytics = async () => {

    try {

      const data = await getLiveAnalytics(selectedCamera);

      setLiveData(data);

    }

    catch (error) {

      console.error(error);

    }

  };
    // ============================================
  // UI
  // ============================================

  return (

    <div className="reports-page">

      <div className="reports-header">

        <h1>📄 Reports Dashboard</h1>

        <p>

          View, analyse and export AI Consumer Attention reports.

        </p>

        <CameraSelector />

      </div>

      {

        loading ? (

          <h2 className="loading-text">

            Loading Reports...

          </h2>

        ) : (

          <>

            <ReportCards

              data={{

                ...(reportData || {}),

                ...(liveData || {}),

                selectedCamera,

              }}

            />

            {

              liveData && (

                <div

                  style={{

                    marginTop: "35px",

                    background: "#1f2937",

                    padding: "25px",

                    borderRadius: "15px",

                    color: "white",

                  }}

                >

                  <h2

                    style={{

                      marginBottom: "20px",

                    }}

                  >

                    🤖 Live AI Analytics

                  </h2>

                  <div

                    style={{

                      display: "grid",

                      gridTemplateColumns: "repeat(3,1fr)",

                      gap: "18px",

                    }}

                  >

                    <LiveItem

                      title="Selected Camera"

                      value={`Camera ${selectedCamera}`}

                    />

                    <LiveItem

                      title="Current Persons"

                      value={liveData.current_persons}

                    />

                    <LiveItem

                      title="Total Customers"

                      value={liveData.total_customers}

                    />

                    <LiveItem

                      title="Attention Score"

                      value={`${liveData.attention_score ?? 0}%`}

                    />

                    <LiveItem

                      title="Average Dwell"

                      value={`${liveData.average_dwell ?? 0}s`}

                    />

                    <LiveItem

                      title="Product Interactions"

                      value={liveData.product_interactions}

                    />

                    <LiveItem

                      title="Products Detected"

                      value={liveData.products_detected}

                    />

                    <LiveItem

                      title="Tracked Paths"

                      value={liveData.tracked_paths}

                    />

                    <LiveItem

                      title="Heatmap Points"

                      value={liveData.heatmap_points}

                    />

                    <LiveItem

                      title="Camera Status"

                      value={liveData.camera_status}

                    />

                    <LiveItem

                      title="System Status"

                      value={liveData.system_status}

                    />

                    <LiveItem

                      title="Last Updated"

                      value={

                        liveData.last_updated

                          ? new Date(

                              liveData.last_updated

                            ).toLocaleString()

                          : new Date().toLocaleString()

                      }

                    />

                  </div>

                </div>

              )

            }

            <div className="report-actions">

              <button

                className="pdf-btn"

                onClick={() => exportPDF(selectedCamera)}

              >

                Export PDF

              </button>

              <button

                className="excel-btn"

                onClick={() => exportExcel(selectedCamera)}

              >

                Export Excel

              </button>

              <button

                className="csv-btn"

                onClick={() => exportCSV(selectedCamera)}

              >

                Export CSV

              </button>

            </div>

          </>

        )

      }
          </div>

  );

}

function LiveItem({

  title,

  value,

}) {

  return (

    <div

      style={{

        background: "#111827",

        padding: "18px",

        borderRadius: "12px",

        textAlign: "center",

        border: "1px solid #374151",

        transition: "0.3s",

      }}

    >

      <h4

        style={{

          color: "#94a3b8",

          marginBottom: "10px",

          fontSize: "15px",

        }}

      >

        {title}

      </h4>

      <h2

        style={{

          color: "white",

          fontWeight: "bold",

          fontSize: "20px",

          wordBreak: "break-word",

        }}

      >

        {value ?? "-"}

      </h2>

    </div>

  );

}

export default Reports;
