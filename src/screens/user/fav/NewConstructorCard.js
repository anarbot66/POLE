// NewConstructorCard.jsx
import React from "react";
import { TEAM_COLORS, DRIVER_TRANSLATIONS } from "../../recources/json/constants";

const NewConstructorCard = ({ constructor, drivers, onClick, suffix }) => {
  const teamName = constructor.Constructor?.name || "Unknown";
  const teamColor = TEAM_COLORS[teamName] || "#000000";

  // отображаем имена до двух пилотов
  const pilotNames = drivers
    .slice(0, 2)
    .map(d => {
      const full = `${d.Driver.givenName} ${d.Driver.familyName}`;
      return DRIVER_TRANSLATIONS[full] || full;
    })
    .join(" & ");

  return (
    <div
      onClick={onClick}
      style={{
        width: "100%",
        borderRadius: 16,
        padding: "0px 10px 0px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: teamColor }}>
            {teamName}
          </div>
          <div style={{ fontSize: 12, color: "#ddd", marginTop: 4 }}>
            {pilotNames}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
            {constructor.points}
          </div>
          <div style={{ fontSize: 10, color: "#ccc" }}>PTS</div>
        </div>
      </div>

      {suffix && (
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
          {suffix}
        </div>
      )}
    </div>
  );
};

export default NewConstructorCard;
