// PilotCard.js
import React from "react";
import { nationalityToFlag, teamColors, driverTranslations } from "./constants";

const PilotCard = ({ pilot, onClick }) => {
  const constructorName = pilot.Constructors[0].name;
  const teamColor = teamColors[constructorName] || "#000000";
  const nat = pilot.Driver.nationality;
  const countryCode = nationalityToFlag[nat] || "un";

  const translatedName =
    driverTranslations[pilot.Driver.familyName] ||
    `${pilot.Driver.givenName} ${pilot.Driver.familyName}`;

  return (
    <div
      onClick={onClick}
      style={{
        width: "100%",
        borderRadius: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        padding: "0px 15px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "45px",
          height: "65px",
          borderRadius: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: teamColor,
            fontSize: "24px",
            fontWeight: "600"
          }}
        >
          {pilot.position}
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
            {translatedName}
          </div>
          <img
            src={`https://flagcdn.com/w40/${countryCode}.png`}
            alt={nat}
            style={{
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              objectFit: "cover"
            }}
          />
        </div>
        <div style={{ color: teamColor, fontSize: "12px" }}>
          {constructorName}
        </div>
      </div>

      <div style={{ textAlign: "center", minWidth: "60px", display: 'flex', flexDirection: 'column'}}>
        <span style={{ color: "white", fontSize: "16px" }}>
          {pilot.points}
        </span>
        <span style={{ color: "white", fontSize: "10px" }}>PTS</span>
      </div>
    </div>
  );
};

export default PilotCard;
