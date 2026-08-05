function AttentionPanel({ data }) {

  if (!data) return null;

  const score = data.attention_score ?? data.average_attention ?? 0;

  const engagement = data.engagement_level ?? "Low";

  const flow = data.customer_flow ?? "Normal";

  const behaviour = data.shopping_behavior ?? "Browsing";

  const dwell = data.average_dwell ?? data.average_dwell_time ?? 0;

  const persons = data.current_persons ?? 0;

  const interactions = data.product_interactions ?? 0;

  let color = "#ef4444";

  if (score >= 80) {
    color = "#22c55e";
  } else if (score >= 60) {
    color = "#3b82f6";
  } else if (score >= 40) {
    color = "#f59e0b";
  }

  return (
    <div className="ai-panel">

      <h2>👀 Attention Score</h2>

      <div
        style={{
          fontSize: "60px",
          fontWeight: "bold",
          color,
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        {score}%
      </div>

      <div
        style={{
          background: "#374151",
          height: "12px",
          borderRadius: "20px",
          marginTop: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: color,
            transition: "0.5s",
          }}
        />
      </div>

      <div
        style={{
          marginTop: "25px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
        }}
      >
        <div>
          <strong>Engagement</strong>
          <br />
          {engagement}
        </div>

        <div>
          <strong>Customer Flow</strong>
          <br />
          {flow}
        </div>

        <div>
          <strong>Behaviour</strong>
          <br />
          {behaviour}
        </div>

        <div>
          <strong>Current Persons</strong>
          <br />
          {persons}
        </div>

        <div>
          <strong>Avg Dwell</strong>
          <br />
          {dwell}s
        </div>

        <div>
          <strong>Interactions</strong>
          <br />
          {interactions}
        </div>

      </div>

    </div>
  );
}

export default AttentionPanel;