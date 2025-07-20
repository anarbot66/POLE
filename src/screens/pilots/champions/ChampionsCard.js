// ChampionsCard.js
import React from "react";
import { NATIONALITY_TO_FLAG, TEAM_COLORS } from "../../recources/json/constants";

const ChampionsCard = ({ champion, onClick }) => {
  const { year, driver, points } = champion;
  const driverFullName = `${driver.firstName} ${driver.lastName}`;
  const countryCode = NATIONALITY_TO_FLAG[driver.nationality] || "un";
  const teamColor = TEAM_COLORS[driver.team] || "#000000";

  return (
    <div onClick={() => onClick(champion)} style={{ cursor: "pointer" }}>
      <div
        style={{
          width: "100%",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          padding: "10px"
        }}
      >
        <div
          style={{
            width: "65px",
            height: "65px",
            borderRadius: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            {year}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
            flex: 1
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ color: "white", fontSize: "14px" }}>
              {driverFullName}
            </div>
            <img
              src={`https://flagcdn.com/w40/${countryCode}.png`}
              alt={driver.nationality}
              style={{
                width: "15px",
                height: "15px",
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
          </div>
          <div style={{ color: teamColor, fontSize: "12px" }}>
            {driver.team}
          </div>
        </div>
        <div style={{ textAlign: "center", minWidth: "60px" }}>
          <span style={{ color: "white", fontSize: "16px" }}>{points}</span>
          <br />
          <span style={{ color: "white", fontSize: "10px" }}>PTS</span>
        </div>
      </div>
    </div>
  );
};

export default ChampionsCard;
