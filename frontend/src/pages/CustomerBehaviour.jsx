import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Bar,
} from "recharts";

import { getCustomerBehaviour } from "../services/analyticsService";

import "../styles/CustomerBehaviour.css";


// ==========================================================
// CHART COLORS
// ==========================================================

const COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#A855F7",
];


// ==========================================================
// REQUIRED MILESTONE 3 SEGMENTS
// ==========================================================

const REQUIRED_SEGMENTS = [
  "Explorer",
  "Quick Buyer",
  "Comparison Shopper",
  "Impulse Buyer",
  "Brand Loyal Customer",
];


export default function CustomerBehaviour() {

  // ========================================================
  // CAMERA
  // ========================================================

  const [cameraId] = useState(1);


  // ========================================================
  // REPORT STATE
  // ========================================================

  const [report, setReport] = useState(null);


  // ========================================================
  // LOAD DATA
  // ========================================================

  useEffect(() => {

    console.log("Loading Customer Behaviour...");

    loadData();

  }, []);


  // ========================================================
  // API CALL
  // ========================================================

  async function loadData() {

    try {

      const res = await getCustomerBehaviour(
        cameraId
      );

      console.log(
        "Customer Behaviour API Response:",
        res
      );

      setReport(res);

    } catch (err) {

      console.error(
        "Customer Behaviour Error:",
        err
      );

    }

  }


  // ========================================================
  // LOADING
  // ========================================================

  if (!report) {

    return (
      <div className="behaviour-loading">

        Loading...

      </div>
    );

  }


  // ========================================================
  // EXISTING BEHAVIOUR CHART
  // ========================================================

  const behaviourChart = Object.entries(
    report.behaviour_distribution || {}
  ).map(([name, value]) => ({

    name,
    value,

  }));


  // ========================================================
  // MILESTONE 3 SEGMENT DISTRIBUTION
  // ========================================================
  //
  // The backend now returns:
  //
  // segment_distribution
  //
  // We intentionally create all five required segments
  // even when the current value is 0.
  //
  // This keeps the dashboard consistent.
  // ========================================================

  const segmentChart = REQUIRED_SEGMENTS.map(
    (segment) => ({

      name: segment,

      value:
        report.segment_distribution?.[
          segment
        ] || 0,

    })
  );


  // ========================================================
  // CUSTOMER SUMMARY
  // ========================================================

  const customerSummary =
    Array.isArray(report.customer_summary)
      ? report.customer_summary
      : [];


  // ========================================================
  // SORT CUSTOMERS
  // ========================================================
  //
  // IMPORTANT:
  // We use [...customerSummary] instead of directly
  // sorting report.customer_summary.
  //
  // This prevents mutation of the API response.
  // ========================================================

  const sortedCustomers = [
    ...customerSummary,
  ]
    .sort(
      (a, b) =>
        (
          (b.purchase_intent || 0) * 100 +
          (b.journey_length || 0) +
          (b.zones || 0)
        ) -
        (
          (a.purchase_intent || 0) * 100 +
          (a.journey_length || 0) +
          (a.zones || 0)
        )
    )
    .slice(0, 5);


  // ========================================================
  // SEGMENT CUSTOMER COUNT
  // ========================================================

  const totalSegmentedCustomers =
    segmentChart.reduce(
      (total, item) =>
        total + item.value,
      0
    );


  // ========================================================
  // MOST COMMON SEGMENT
  // ========================================================

  const mostCommonSegment =
    segmentChart.length > 0
      ? [...segmentChart].sort(
          (a, b) =>
            b.value - a.value
        )[0]
      : null;


  // ========================================================
  // RENDER
  // ========================================================

  return (

    <div className="behaviour-page">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="behaviour-header">

        <div>

          <h1>
            Customer Behaviour Analytics
          </h1>

          <p>
            AI powered customer behaviour monitoring
          </p>

        </div>

      </div>


      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="behaviour-summary">


        {/* Average Journey */}

        <div className="summary-card">

          <div className="summary-title">
            Average Journey
          </div>

          <div className="summary-value">
            {report.average_journey}
          </div>

        </div>


        {/* Average Zones */}

        <div className="summary-card">

          <div className="summary-title">
            Average Zones
          </div>

          <div className="summary-value">
            {report.average_zones}
          </div>

        </div>


        {/* Customers */}

        <div className="summary-card">

          <div className="summary-title">
            Customers
          </div>

          <div className="summary-value">
            {customerSummary.length}
          </div>

        </div>


        {/* Existing Behaviours */}

        <div className="summary-card">

          <div className="summary-title">
            Behaviours
          </div>

          <div className="summary-value">
            {behaviourChart.length}
          </div>

        </div>

      </div>


      {/* ==================================================
          EXISTING BEHAVIOUR CHARTS
      ================================================== */}

      <div className="behaviour-grid">


        {/* =================================================
            BEHAVIOUR DISTRIBUTION
        ================================================= */}

        <div className="behaviour-card">

          <h3>
            Behaviour Distribution
          </h3>

          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <PieChart>

              <Pie
                data={behaviourChart}
                dataKey="value"
                outerRadius={95}
                label
              >

                {behaviourChart.map(
                  (entry, index) => (

                    <Cell
                      key={index}
                      fill={
                        COLORS[
                          index %
                          COLORS.length
                        ]
                      }
                    />

                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>


        {/* =================================================
            BEHAVIOUR OVERVIEW
        ================================================= */}

        <div className="behaviour-card">

          <h3>
            Behaviour Overview
          </h3>

          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <BarChart
              data={behaviourChart}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="name"
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="value"
                fill="#3B82F6"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>


      {/* ==================================================
          NEW MILESTONE 3 SHOPPER SEGMENTATION
      ================================================== */}

      <div className="behaviour-grid">


        {/* =================================================
            SHOPPER SEGMENT DISTRIBUTION
        ================================================= */}

        <div className="behaviour-card">

          <h3>
            Shopper Segmentation
          </h3>

          <p
            style={{
              marginBottom: "10px",
              opacity: 0.75,
            }}
          >
            Milestone 3 customer segment distribution
          </p>

          <ResponsiveContainer
            width="100%"
            height={320}
          >

            <PieChart>

              <Pie
                data={segmentChart}
                dataKey="value"
                nameKey="name"
                outerRadius={105}
                label
              >

                {segmentChart.map(
                  (entry, index) => (

                    <Cell
                      key={entry.name}
                      fill={
                        COLORS[
                          index %
                          COLORS.length
                        ]
                      }
                    />

                  )
                )}

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>


        {/* =================================================
            SEGMENT OVERVIEW
        ================================================= */}

        <div className="behaviour-card">

          <h3>
            Shopper Segment Overview
          </h3>

          <ResponsiveContainer
            width="100%"
            height={320}
          >

            <BarChart
              data={segmentChart}
              layout="vertical"
              margin={{
                top: 10,
                right: 20,
                left: 30,
                bottom: 10,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={125}
                tick={{
                  fontSize: 11,
                }}
              />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="value"
                name="Customers"
                fill="#3B82F6"
                radius={[
                  0,
                  5,
                  5,
                  0,
                ]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>


      {/* ==================================================
          SEGMENT SUMMARY
      ================================================== */}

      <div className="behaviour-card">

        <h3>
          Shopper Segment Summary
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginTop: "20px",
          }}
        >

          {segmentChart.map(
            (segment, index) => (

              <div
                key={segment.name}
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  border:
                    "1px solid rgba(255,255,255,0.1)",
                  background:
                    "rgba(255,255,255,0.03)",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >

                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      display: "inline-block",
                      background:
                        COLORS[
                          index %
                          COLORS.length
                        ],
                    }}
                  />

                  <strong>
                    {segment.name}
                  </strong>

                </div>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                  }}
                >
                  {segment.value}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.65,
                  }}
                >
                  Customers
                </div>

              </div>

            )
          )}

        </div>

      </div>


      {/* ==================================================
          CUSTOMER BEHAVIOUR TABLE
      ================================================== */}

      <div className="behaviour-card">

        <h3>
          Customer Behaviour Table
        </h3>

        <div className="behaviour-table">

          <table>

            <thead>

              <tr>

                <th>ID</th>

                <th>Behaviour</th>

                <th>Segment</th>

                <th>Journey</th>

                <th>Zones</th>

                <th>Purchase</th>

              </tr>

            </thead>

            <tbody>

              {sortedCustomers.map(
                (item) => (

                  <tr
                    key={item.track_id}
                  >

                    <td>
                      {item.track_id}
                    </td>

                    <td>
                      {item.behaviour || "-"}
                    </td>

                    <td>

                      <strong>
                        {item.segment || "-"}
                      </strong>

                    </td>

                    <td>
                      {item.journey_length}
                    </td>

                    <td>
                      {item.zones}
                    </td>

                    <td>
                      {item.purchase_intent}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ==================================================
          AI BEHAVIOUR INSIGHTS
      ================================================== */}

      <div className="behaviour-card">

        <h3>
          AI Behaviour Insights
        </h3>

        <ul className="insight-list">


          <li>

            Average customer journey :

            <strong>
              {" "}
              {report.average_journey}
            </strong>

          </li>


          <li>

            Average zones visited :

            <strong>
              {" "}
              {report.average_zones}
            </strong>

          </li>


          <li>

            Detected customer behaviours :

            <strong>
              {" "}
              {behaviourChart.length}
            </strong>

          </li>


          <li>

            Total segmented customers :

            <strong>
              {" "}
              {totalSegmentedCustomers}
            </strong>

          </li>


          <li>

            Most common shopper segment :

            <strong>

              {" "}

              {mostCommonSegment
                ? mostCommonSegment.name
                : "No data"}

            </strong>

          </li>


          <li>
            Live customer tracking active.
          </li>


        </ul>

      </div>


    </div>

  );

}