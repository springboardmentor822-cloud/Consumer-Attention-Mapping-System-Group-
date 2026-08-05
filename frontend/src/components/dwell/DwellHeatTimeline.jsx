import React, { useMemo } from "react";
import { FaFire } from "react-icons/fa";

const DwellHeatTimeline = ({ analytics }) => {
  const averageDwell = Number(analytics.average_dwell || 0);

  const timeline = useMemo(() => {
    return (analytics.hourly_dwell || []).map((item) => {
      let level = "Low";
      let color = "#22C55E";
      let width = "30%";

      if (item.value >= 30 && item.value < 60) {
        level = "Moderate";
        color = "#FACC15";
        width = "55%";
      } else if (item.value >= 60 && item.value < 90) {
        level = "High";
        color = "#F97316";
        width = "80%";
      } else if (item.value >= 90) {
        level = "Very High";
        color = "#EF4444";
        width = "100%";
      }

      return {
        time: item.hour,
        value: item.value,
        level,
        color,
        width,
      };
    });
  }, [analytics.hourly_dwell]);

  const peakHour =
    timeline.length > 0
      ? timeline.reduce((a, b) => (a.value > b.value ? a : b))
      : null;

  return (
    <div className="dwell-chart-container">

      <div className="chart-header">
        <h3>Customer Engagement Timeline</h3>
        <p>Live hourly engagement from AI analytics</p>
      </div>

      <div className="heat-timeline">

        {timeline.map((item, index) => (
          <div
            className="heat-row"
            key={index}
          >
            <span className="heat-time">
              {item.time}
            </span>

            <div className="heat-track">

              <div
                className="heat-bar"
                style={{
                  width: item.width,
                  background: item.color,
                }}
              />

            </div>

            <span
              className="heat-status"
              style={{
                color: item.color,
              }}
            >
              {item.level}
            </span>

          </div>
        ))}

      </div>

      <div className="heat-summary">

        <div className="heat-summary-item">

          <FaFire />

          <div>

            <strong>Average Dwell</strong>

            <p>{averageDwell}s</p>

          </div>

        </div>

        <div className="heat-summary-item">

          <strong>Peak Hour</strong>

          <p>
            {peakHour
              ? `${peakHour.time} (${peakHour.value}s)`
              : "--"}
          </p>

        </div>

      </div>

    </div>
  );
};

export default DwellHeatTimeline;