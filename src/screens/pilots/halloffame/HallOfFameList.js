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
          marginBottom: "80px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px"
        }}
      >
      <div style={{display: "flex",
        flexDirection: "column",
        gap: "19px", position: 'fixed', width: '100%', background: 'rgb(17, 17, 19)', left: '0', top: '0', padding: '20px 20px 20px 20px', zIndex: 100}}>
      <div style={{display: 'flex', width: "100%", gap: "10px", alignItems: "center"}}>
      <BackButton
        label="Назад"
        style={{}}
      />
      <span style={{ color: 'white', fontSize: '18px'}}>
          Лучшие пилоты всех времен
        </span>
      </div>
      
      </div>
      <div style={{marginTop: '60px', display: "flex",
          flexDirection: "column",
          gap: "10px",}}>
      {hallOfFamePilots.map((pilot, index) => {
        const translatedName =
          driverTranslations[pilot.familyName] ||
          `${pilot.givenName} ${pilot.familyName}`;
        const countryCode =
          nationalityToFlag[pilot.nationality] || "un";
          const teamColor = TEAM_COLORS[pilot.team] || "#aaa"; // <-- тут цвет команды
          const positionColor = getMedalColor(index);

        return (
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <div
            style={{
              width: "100%",
              borderRadius: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "0px 0px 10px 0px",
              cursor: "pointer",
              
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
              <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "12px",
          padding: '15px',
          background: '#141416',
          borderRadius: '15px'
        }}
      >
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
          {pilot.gp}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>GP</div>
        </div>

        {/* Победы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            {pilot.wins}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>Побед</div>
        </div>

        {/* Поулы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
          {pilot.poles}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>Поулов</div>
        </div>

        {/* Подиумы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
          {pilot.podiums}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>Подиумов</div>
        </div>

        {/* Очки */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
          {pilot.pts}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>Очков</div>
        </div>

        {/* Сходы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            {pilot.dnf}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
        </div>
      </div>
              </div>
        );
      })}
      </div>
    </div>
  );
};

export default HallOfFameList;
