function StatCard({ title, value, icon, color }) {
  return (
    <div
      className="stat-card"
      style={{
        borderTop: `3px solid ${color}`,
      }}
    >
      <div
        className="stat-icon"
        style={{
          background: color,
          boxShadow: `0 0 25px ${color}`,
        }}
      >
        {icon}
      </div>

      <h3 className="stat-title">{title}</h3>

      <h2 className="stat-value">{value}</h2>

      <svg
        className="stat-line"
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          points="
          0,25
          12,22
          22,24
          34,18
          46,20
          58,12
          70,15
          82,8
          100,10
          "
        />
      </svg>
    </div>
  );
}

export default StatCard;