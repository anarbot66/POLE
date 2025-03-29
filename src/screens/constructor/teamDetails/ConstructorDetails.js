// ConstructorDetails.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../../user/components/CustomSelect";
import SocialIcons from "../../../screens/recources/SocialIcons";
import seasonsData from "../../recources/json/seasons";
import StatsCard from "./StatsCard";
import {
  TEAM_SOCIAL,
  CONSTRUCTOR_API_NAMES,
  TEAM_COLORS,
  TEAM_BIOGRAPHIES
} from "../../recources/json/constants";
import { useConstructorStats } from "./useConstructorStats";

const ConstructorDetails = ({ constructor, goBack }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("biography");
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [seasons, setSeasons] = useState([]);

  // При монтировании компонента загружаем список сезонов конструктора
  useEffect(() => {
    if (constructor) {
      const formattedConstructorName =
        CONSTRUCTOR_API_NAMES[constructor.Constructor.name] ||
        constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");
      setSeasons(seasonsData[formattedConstructorName] || []);
    }
  }, [constructor]);

  const { stats, loading, error } = useConstructorStats(constructor, selectedSeason);

  if (!constructor) return <div> </div>;
  if (loading) return <div> </div>;
  if (error) return <div> </div>;

  const socialLinks = TEAM_SOCIAL[constructor.Constructor.name];
  const teamColor = TEAM_COLORS[constructor.Constructor.name] || "#000000";
  const biography = TEAM_BIOGRAPHIES[constructor.Constructor.name] || "Биография команды не найдена.";

  const tabOptions = [
    { value: "biography", label: "Биография" },
    { value: "seasons", label: "Сезоны" }
  ];

  return (
    <div
      style={{
        width: "calc(100% - 20px)",
        margin: "10px 10px 100px",
        padding: "15px",
        background: "#212124",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "19px",
        marginTop: "10px"
      }}
    >
      {/* Верхняя строка: кнопка назад, название команды и соцсети */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={goBack}
          style={{
            backgroundColor: "#212124",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          ✕
        </button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ color: teamColor, fontSize: "16px", fontFamily: "Inter" }}>
            {constructor.Constructor.name}
          </div>
        </div>
        {socialLinks && <SocialIcons social={socialLinks} />}
      </div>

      {/* Линия в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColor }} />

      {/* Статистика конструктора за выбранный сезон */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "12px",
          width: "100%"
        }}
      >
        <StatsCard label="ПОЗИЦИЯ" value={stats.position} />
        <StatsCard label="ОЧКОВ" value={stats.points} />
        <StatsCard label="ПОБЕД" value={stats.wins} />
        <StatsCard label="ПОДИУМОВ" value={stats.podiums} />
        <StatsCard label="ПОУЛОВ" value={stats.poles} />
      </div>

      <div style={{ width: "100%" }}>
        {/* Переключение вкладок через CustomSelect */}
        <div style={{ width: "100%", marginTop: "20px" }}>
          <CustomSelect
            options={tabOptions}
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            style={{ width: "100%" }}
          />
        </div>

        {/* Контент для выбранной вкладки */}
        {activeTab === "biography" ? (
          <div style={{ borderRadius: "8px", padding: "10px" }}>
            <p style={{ fontSize: 13, marginTop: "10px", color: "white" }}>{biography}</p>
          </div>
        ) : (
          <div style={{ marginTop: "20px", width: "100%" }}>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "2px solid #1D1D1F",
                backgroundColor: "#1D1D1F",
                fontSize: "14px",
                color: "white",
                cursor: "pointer"
              }}
            >
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>

            {/* Повторное отображение статистики для выбранного сезона */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: "12px",
                marginTop: "20px"
              }}
            >
              <StatsCard label="ПОЗИЦИЯ" value={stats.position} />
              <StatsCard label="ОЧКОВ" value={stats.points} />
              <StatsCard label="ПОБЕД" value={stats.wins} />
              <StatsCard label="ПОДИУМОВ" value={stats.podiums} />
              <StatsCard label="ПОУЛОВ" value={stats.poles} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstructorDetails;
