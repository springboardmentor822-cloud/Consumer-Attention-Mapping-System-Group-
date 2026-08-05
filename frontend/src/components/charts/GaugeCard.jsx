import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";

function GaugeCard({ value = 0 }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  const data = [
    {
      name: "Attention",
      value: score,
      fill: getColor(score),
    },
  ];

  function getStatus(score) {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Low";
  }

  function getColor(score) {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <div
      style={{
        background: "#1f2937",
        borderRadius: 18,
        padding: 25,
        height: 420,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 25px rgba(0,0,0,.35)",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          color: "#fff",
          marginBottom: 15,
          fontWeight: 700,
        }}
      >
        🎯 Attention Score
      </h3>

      {/* Gauge Container */}

      <div
        style={{
          position: "relative",
          width: "100%",
          height: 260,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="72%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            barSize={18}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />

            <RadialBar
              dataKey="value"
              background
              cornerRadius={20}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center Text */}

        <div
          style={{
            position: "absolute",
            top: "58%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: "100%",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 52,
              fontWeight: 800,
              color: getColor(score),
              lineHeight: 1,
            }}
          >
            {score}%
          </h1>

          <p
            style={{
              marginTop: 12,
              fontSize: 22,
              fontWeight: 700,
              color: getColor(score),
            }}
          >
            {getStatus(score)}
          </p>
        </div>
      </div>

      {/* Bottom Scale */}

      <div
        style={{
          marginTop: 5,
          padding: "0 12px",
        }}
      >
        <div
          style={{
            height: 4,
            borderRadius: 10,
            background:
              "linear-gradient(90deg,#ef4444,#f59e0b,#22c55e)",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          <span style={{ color: "#ef4444" }}>
            Low
          </span>

          <span style={{ color: "#f59e0b" }}>
            Average
          </span>

          <span style={{ color: "#22c55e" }}>
            High
          </span>
        </div>
      </div>
    </div>
  );
}

export default GaugeCard;