import React from "react";
import { nationalityToFlag, teamColors, driverTranslations } from "./constants";

const PilotCard = ({ pilot, onClick }) => {
  const constructorName = pilot.Constructors[0].name;
  const teamColor = teamColors[constructorName] || "#000000";
  const nationality = pilot.Driver.nationality;
  const countryCode = nationalityToFlag[nationality] || "un";

  // Перевод имени пилота
  const translatedName = driverTranslations[pilot.Driver.familyName] || `${pilot.Driver.givenName} ${pilot.Driver.familyName}`;

  return (
    <div
      onClick={onClick}
      style={{
        width: "100%",
        background: "#212124",
        borderRadius: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        padding: "10px",
        cursor: "pointer",
        paddingTop: "10px"
      }}
    >
      {/* Позиция пилота */}
      <div
        style={{
          width: "65px",
          height: "65px",
          borderRadius: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#212124"
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

      {/* Информация о пилоте */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", flex: 1 }}>
        {/* Имя пилота + флаг */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ color: "white", fontSize: "14px" }}>{translatedName}</div>
          <img
            src={`https://flagcdn.com/w40/${countryCode}.png`}
            alt={nationality}
            style={{ width: "15px", height: "15px", borderRadius: "50%", objectFit: "cover" }}
          />
        </div>
        {/* Название команды */}
        <div
          style={{
            color: teamColor,
            fontSize: "12px"
          }}
        >
          {constructorName}
        </div>
      </div>

      {/* Очки пилота */}
      <div style={{ textAlign: "center", minWidth: "60px" }}>
        <span style={{ color: "white", fontSize: "16px" }}>{pilot.points}</span>
        <br />
        <span style={{ color: "white", fontSize: "10px" }}>PTS</span>
      </div>
    </div>
  );
};

export default PilotCard;
