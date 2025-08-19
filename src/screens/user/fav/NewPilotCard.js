// NewPilotCard.jsx

import { nationalityToFlag, teamColors, driverTranslations } from "../../pilots/driverList/constants";
import React, { useState, useEffect } from "react";

const NewPilotCard = ({ pilot, onClick, suffix }) => {
  const constructorName = pilot.Constructors[0]?.name || "Unknown";
  const teamColor = teamColors[constructorName] || "#000000";
  const nat = pilot.Driver.nationality;
  const countryCode = nationalityToFlag[nat] || "un";
  const [imageSrc, setImageSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    const loadPilotImage = async () => {
      if (!pilot) return;

      const fileName = pilot.Driver.familyName
        .toLowerCase()
        .replace(/\s+/g, '-');

      try {
        const imageModule = await import(
          /* webpackMode: "lazy-once" */
          `../../recources/images/pilots/${fileName}.jpg`
        );
        const img = new Image();
        img.src = imageModule.default;
        img.onload = () => {
          setImageSrc(imageModule.default);
          setImgLoading(false);   // всё, картинка загрузилась
        };
        img.onerror = () => {
          console.error("Ошибка загрузки изображения");
          setImgLoading(false);   // сбросим загрузку, чтобы не вешать экран
        };
      } catch (error) {
        console.error("Ошибка загрузки изображения", error);
        setImgLoading(false);
      }
    };

    loadPilotImage();
  }, [pilot]);

  const translatedName =
    driverTranslations[pilot.Driver.familyName] ||
    `${pilot.Driver.givenName} ${pilot.Driver.familyName}`;

  return (
    <div
      onClick={onClick}
      style={{
        width: "100%",
        borderRadius: 16,
        padding: "20px 10px 0px 10px",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
            {pilot.points}
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

export default NewPilotCard;
