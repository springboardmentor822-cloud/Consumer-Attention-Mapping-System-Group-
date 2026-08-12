import { useEffect, useState } from "react";

import { getRecommendations } from "../services/analyticsService";

import "../styles/RecommendationEngine.css";


// ==========================================================
// RECOMMENDATION ENGINE PAGE
// ==========================================================

export default function RecommendationEngine() {

  // ========================================================
  // STATE
  // ========================================================

  const [cameraId, setCameraId] = useState(1);

  const [recommendationData, setRecommendationData] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ========================================================
  // USER ROLE
  // ========================================================

  const storedUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const role = (
    storedUser.role ||
    localStorage.getItem("role") ||
    "admin"
  )
    .toLowerCase()
    .replace(/\s+/g, "_");


  // ========================================================
  // ROLE DISPLAY NAME
  // ========================================================

  const roleLabels = {
    admin: "Administrator",
    store_manager: "Store Manager",
    marketing_manager: "Marketing Manager",
    retail_analyst: "Retail Analyst",
  };

  const roleLabel =
    roleLabels[role] || "Administrator";


  // ========================================================
  // LOAD RECOMMENDATIONS
  // ========================================================

  useEffect(() => {

    loadRecommendations();

  }, [cameraId, role]);


  async function loadRecommendations() {

    try {

      setLoading(true);

      setError("");

      const response = await getRecommendations(
        cameraId,
        role
      );

      console.log(
        "Recommendation API Response:",
        response
      );

      setRecommendationData(response);

    }

    catch (err) {

      console.error(
        "Recommendation Engine Error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to load recommendations."
      );

    }

    finally {

      setLoading(false);

    }

  }


  // ========================================================
  // LOADING STATE
  // ========================================================

  if (loading) {

    return (

      <div className="recommendation-page">

        <div className="recommendation-loading">

          <div className="recommendation-spinner"></div>

          <h2>
            Loading Recommendations
          </h2>

          <p>
            AI is analyzing current store analytics...
          </p>

        </div>

      </div>

    );

  }


  // ========================================================
  // ERROR STATE
  // ========================================================

  if (error) {

    return (

      <div className="recommendation-page">

        <div className="recommendation-error">

          <div className="error-icon">
            !
          </div>

          <h2>
            Recommendation Engine
          </h2>

          <p>
            {error}
          </p>

          <button
            className="recommendation-retry"
            onClick={loadRecommendations}
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  // ========================================================
  // SAFE DATA
  // ========================================================

  const recommendations =
    recommendationData?.recommendations || [];

  const summary =
    recommendationData?.summary || {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
    };


  // ========================================================
  // PRIORITY ICON
  // ========================================================

  const getPriorityIcon = (priority) => {

    if (priority === "HIGH") {
      return "!";
    }

    if (priority === "MEDIUM") {
      return "•";
    }

    return "✓";

  };


  // ========================================================
  // PRIORITY CLASS
  // ========================================================

  const getPriorityClass = (priority) => {

    if (priority === "HIGH") {
      return "priority-high";
    }

    if (priority === "MEDIUM") {
      return "priority-medium";
    }

    return "priority-low";

  };


  // ========================================================
  // PAGE
  // ========================================================

  return (

    <div className="recommendation-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="recommendation-header">

        <div>

          <div className="recommendation-title-row">

            <div className="recommendation-ai-icon">
              AI
            </div>

            <div>

              <h1>
                Recommendation & Optimization
              </h1>

              <p>
                AI-powered retail recommendations
                based on customer behaviour and store
                analytics
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            CAMERA SELECTOR
        ================================================= */}

        <div className="recommendation-controls">

          <label>
            Camera
          </label>

          <select
            value={cameraId}
            onChange={(event) =>
              setCameraId(
                Number(event.target.value)
              )
            }
          >

            <option value={1}>
              Camera 1
            </option>

            <option value={2}>
              Camera 2
            </option>

          </select>

        </div>

      </div>


      {/* ==================================================
          ROLE BADGE
      ================================================== */}

      <div className="recommendation-role">

        <span className="role-dot"></span>

        Recommendations for:

        <strong>
          {roleLabel}
        </strong>

      </div>


      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="recommendation-summary">

        {/* TOTAL */}

        <div className="recommendation-summary-card">

          <div className="summary-card-icon total">
            AI
          </div>

          <div>

            <p>
              Total Recommendations
            </p>

            <h2>
              {summary.total}
            </h2>

          </div>

        </div>


        {/* HIGH */}

        <div className="recommendation-summary-card">

          <div className="summary-card-icon high">
            !
          </div>

          <div>

            <p>
              High Priority
            </p>

            <h2>
              {summary.high}
            </h2>

          </div>

        </div>


        {/* MEDIUM */}

        <div className="recommendation-summary-card">

          <div className="summary-card-icon medium">
            •
          </div>

          <div>

            <p>
              Medium Priority
            </p>

            <h2>
              {summary.medium}
            </h2>

          </div>

        </div>


        {/* LOW */}

        <div className="recommendation-summary-card">

          <div className="summary-card-icon low">
            ✓
          </div>

          <div>

            <p>
              Low Priority
            </p>

            <h2>
              {summary.low}
            </h2>

          </div>

        </div>

      </div>


      {/* ==================================================
          RECOMMENDATION SECTION
      ================================================== */}

      <div className="recommendation-section">

        <div className="section-heading">

          <div>

            <h2>
              AI Recommendations
            </h2>

            <p>
              Actionable optimization suggestions
              generated from current analytics
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={loadRecommendations}
          >
            ↻ Refresh
          </button>

        </div>


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {recommendations.length === 0 ? (

          <div className="recommendation-empty">

            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No Recommendations Available
            </h3>

            <p>
              There are currently no actionable
              recommendations for this camera.
            </p>

          </div>

        ) : (

          <div className="recommendation-list">

            {recommendations.map(
              (recommendation, index) => (

                <div
                  className="recommendation-card"
                  key={`${recommendation.type}-${index}`}
                >

                  {/* =======================================
                      CARD TOP
                  ======================================= */}

                  <div className="recommendation-card-top">

                    <div className="recommendation-type">

                      <div
                        className={`priority-icon ${getPriorityClass(
                          recommendation.priority
                        )}`}
                      >

                        {getPriorityIcon(
                          recommendation.priority
                        )}

                      </div>

                      <div>

                        <h3>
                          {recommendation.type}
                        </h3>

                        <span>
                          {recommendation.target}
                        </span>

                      </div>

                    </div>


                    <span
                      className={`priority-badge ${getPriorityClass(
                        recommendation.priority
                      )}`}
                    >
                      {recommendation.priority}
                    </span>

                  </div>


                  {/* =======================================
                      ACTION
                  ======================================= */}

                  <div className="recommendation-action">

                    <span>
                      Recommended Action
                    </span>

                    <p>
                      {recommendation.action}
                    </p>

                  </div>


                  {/* =======================================
                      REASON
                  ======================================= */}

                  <div className="recommendation-reason">

                    <span>
                      Why this recommendation?
                    </span>

                    <p>
                      {recommendation.reason}
                    </p>

                  </div>


                  {/* =======================================
                      IMPACT
                  ======================================= */}

                  <div className="recommendation-impact">

                    <span>
                      Expected Impact
                    </span>

                    <p>
                      {recommendation.expected_impact}
                    </p>

                  </div>


                  {/* =======================================
                      FOOTER
                  ======================================= */}

                  <div className="recommendation-card-footer">

                    <span>
                      Generated by AI Recommendation
                      Engine
                    </span>

                    <span>
                      Camera {cameraId}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  );

}