// StatsCard.js
import React from "react";

const StatsCard = ({ label, value }) => (
  <div style={{ width: "65px", textAlign: "center" }}>
    <span
      style={{
        color: "white",
        fontSize: "16px",
        fontFamily: "Inter",
      }}
    >
      {value}
    </span>
    <div style={{ color: "#B9B9B9", fontSize: "10px" }}>{label}</div>
  </div>
);

export default StatsCard;
