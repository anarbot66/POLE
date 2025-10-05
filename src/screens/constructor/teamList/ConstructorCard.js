// ConstructorCard.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { TEAM_COLORS, DRIVER_TRANSLATIONS } from "../../recources/json/constants";

const toId = (constructorObj) => {
  // сначала пробуем constructorId из Ergast
  const cid = constructorObj?.Constructor?.constructorId;
  if (cid) return cid;
  // fallback: делаем слаг из имени
  const name = constructorObj?.Constructor?.name || "";
  return name.toLowerCase().replace(/[^a-z0-9а-яё\-]+/ig, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
};

const ConstructorCard = ({ constructor, drivers }) => {
  const navigate = useNavigate();
  const teamColor = TEAM_COLORS[constructor.Constructor.name] || "#000000";

  // Отбираем пилотов, связанных с данным конструктором
  const pilots = drivers.filter(driver =>
    // сначала пробуем сопоставление по constructorId (надежнее), затем по name
    driver.Constructors.some(c =>
      (c.constructorId && c.constructorId === constructor.Constructor.constructorId) ||
      c.name === constructor.Constructor.name
    )
  ).slice(0, 2);

  // Формируем имена пилотов с переводом (если есть)
  const pilotNames = pilots
    .map(pilot => {
      const fullName = `${pilot.Driver.givenName} ${pilot.Driver.familyName}`;
      return DRIVER_TRANSLATIONS[fullName] || fullName;
    })
    .join(" & ");

  const handleClick = () => {
    const id = toId(constructor);
    navigate(`/constructor-details/${encodeURIComponent(id)}`, { state: { constructor } });
  };

  return (
    <div onClick={handleClick} style={{ cursor: "pointer" }}>
      <div
        style={{
          width: "100%",
          borderRadius: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          padding: "0px 15px"
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

        <div style={{ textAlign: "center", minWidth: "60px", display: 'flex', flexDirection: 'column'}}>
          <span style={{ color: "white", fontSize: "16px" }}>
            {constructor.points}
          </span>
          <span style={{ color: "white", fontSize: "10px" }}>PTS</span>
        </div>
      </div>
    </div>
  );
};

export default ConstructorCard;
