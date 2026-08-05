import React from "react";
import { FaChartBar } from "react-icons/fa";

const DwellBoxPlot = ({ analytics }) => {
  const min = Number(analytics.min_dwell || 0);
  const q1 = Number(analytics.q1 || 0);
  const median = Number(analytics.median_dwell || 0);
  const q3 = Number(analytics.q3 || 0);
  const max = Number(analytics.max_dwell || 0);

  const getPosition = (value) => {
    if (max === 0) return 0;
    return (value / max) * 100;
  };

  return (
    <div className="dwell-chart-container">

      <div className="chart-header">
        <h3>Customer Dwell Statistics</h3>
        <p>
          Live statistical distribution generated from AI analytics
        </p>
      </div>

      <div className="boxplot-wrapper">

        <div className="boxplot-axis">

          {/* Main Line */}
          <div className="box-line"></div>

          {/* Left Whisker */}
          <div
            className="box-whisker left"
            style={{
              left: `${getPosition(min)}%`,
            }}
          />

          {/* Right Whisker */}
          <div
            className="box-whisker right"
            style={{
              left: `${getPosition(max)}%`,
            }}
          />

          {/* Box */}
          <div
            className="box-middle"
            style={{
              left: `${getPosition(q1)}%`,
              width: `${getPosition(q3) - getPosition(q1)}%`,
            }}
          />

          {/* Median */}
          <div
            className="median-line"
            style={{
              left: `${getPosition(median)}%`,
            }}
          />

        </div>

      </div>

      <div className="boxplot-stats">

        <div className="box-card">
          <h4>Minimum</h4>
          <span>{min}s</span>
        </div>

        <div className="box-card">
          <h4>Q1</h4>
          <span>{q1}s</span>
        </div>

        <div className="box-card active">
          <FaChartBar />
          <h4>Median</h4>
          <span>{median}s</span>
        </div>

        <div className="box-card">
          <h4>Q3</h4>
          <span>{q3}s</span>
        </div>

        <div className="box-card">
          <h4>Maximum</h4>
          <span>{max}s</span>
        </div>

      </div>

      <div className="boxplot-note">

        <strong>AI Insight</strong>

        <p>
          Customers currently spend between
          <strong> {min}s</strong> and
          <strong> {max}s</strong> inside the monitored zone.
          The median dwell time is
          <strong> {median}s</strong>.
        </p>

      </div>

    </div>
  );
};

export default DwellBoxPlot;