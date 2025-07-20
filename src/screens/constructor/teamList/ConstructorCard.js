// ConstructorCard.js
import React from "react";
import { TEAM_COLORS, DRIVER_TRANSLATIONS } from "../../recources/json/constants";

const ConstructorCard = ({ constructor, drivers, onClick }) => {
  const teamColor = TEAM_COLORS[constructor.Constructor.name] || "#000000";

  // Отбираем пилотов, связанных с данным конструктором
  const pilots = drivers.filter(driver =>
    driver.Constructors.some(c => c.name === constructor.Constructor.name)
  ).slice(0, 2);

  // Формируем имена пилотов с переводом (если есть)
  const pilotNames = pilots
    .map(pilot => {
      const fullName = `${pilot.Driver.givenName} ${pilot.Driver.familyName}`;
      return DRIVER_TRANSLATIONS[fullName] || fullName;
    })
    .join(" & ");

  return (
    <div onClick={() => onClick(constructor)} style={{ cursor: "pointer" }}>
      <div
        style={{
          width: "100%",
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: "15px",
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
              color: teamColor,
              fontSize: "24px",
              fontWeight: "600"
            }}
          >
            {constructor.position}
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
          <div style={{ color: "white", fontSize: "14px" }}>
            {constructor.Constructor.name}
          </div>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>
            {pilotNames}
          </div>
        </div>

        <div style={{ textAlign: "center", minWidth: "60px" }}>
          <span style={{ color: "white", fontSize: "16px" }}>
            {constructor.points}
          </span>
          <br />
          <span style={{ color: "white", fontSize: "10px" }}>PTS</span>
        </div>
      </div>
    </div>
  );
};

export default ConstructorCard;
