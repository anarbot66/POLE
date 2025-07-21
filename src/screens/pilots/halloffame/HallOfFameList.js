// src/components/HallOfFameList.js
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  hallOfFamePilots,
  nationalityToFlag,
  driverTranslations
} from "./hallOfFamePilots"
import { TEAM_COLORS } from "../../recources/json/constants";
import BackButton from "../../components/BackButton";

const normalizeName = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

    const getMedalColor = (index) => {
        switch (index) {
          case 0:
            return "#FFD700"; // Золото
          case 1:
            return "#C0C0C0"; // Серебро
          case 2:
            return "#CD7F32"; // Бронза
          default:
            return "#FFFFFF"; // Белый
        }
      };
const HallOfFameList = () => {
  const navigate = useNavigate();


  return (
    <div
        style={{
          width: "calc(100% - 30px)",
          margin: "0 auto",
          height: "100%",
          marginBottom: "100px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px"
        }}
      >
      <div style={{position: 'fixed'}}>
      <BackButton
        label="Назад"
        style={{}}
      />
        
      </div>
      <div style={{marginTop: '50px', display: "flex",
          flexDirection: "column",
          gap: "15px",}}>
      {hallOfFamePilots.map((pilot, index) => {
        const translatedName =
          driverTranslations[pilot.familyName] ||
          `${pilot.givenName} ${pilot.familyName}`;
        const countryCode =
          nationalityToFlag[pilot.nationality] || "un";
          const teamColor = TEAM_COLORS[pilot.team] || "#aaa"; // <-- тут цвет команды
          const positionColor = getMedalColor(index);

        return (
            <div
            style={{
              width: "100%",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              cursor: "pointer",
              paddingTop: "10px",
              
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
                  color: positionColor,
                  fontSize: "24px",
                  fontWeight: "600"
                }}
              >
                {index + 1}
              </div>
            </div>
      
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
                flex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ color: "white", fontSize: "14px" }}>
                  {translatedName}
                </div>
                <img
                  src={`https://flagcdn.com/w40/${countryCode}.png`}
                  alt={countryCode}
                  style={{
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%",
                    objectFit: "cover"
                  }}
                />
              </div>
              <div style={{ color: teamColor, fontSize: "12px" }}>
                {pilot.team}
              </div>
            </div>
      
            <div style={{ textAlign: "center", minWidth: "60px" }}>
              <span style={{ color: "white", fontSize: "16px" }}>
                {pilot.titles}
              </span>
              <br />
              <span style={{ color: "white", fontSize: "10px" }}>WDC</span>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default HallOfFameList;
