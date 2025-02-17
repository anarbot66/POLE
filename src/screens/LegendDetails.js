import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import biographies from "./json/bio"; // данные о биографиях
import seasonsData from "./json/seasons"; // данные о сезонах

// Словари для перевода имен на русский
const firstNameTranslations = {
  "Michael": "Михаэль",
  "Sebastian": "Себастьян",
  "Ayrton": "Айртон",
  "Niki": "Ники",
  "Alain": "Ален",
  // Добавьте другие легенды по аналогии
};

const lastNameTranslations = {
  "Schumacher": "Шумахер",
  "Vettel": "Феттель",
  "Senna": "Сенна",
  "Lauda": "Лауда",
  "Prost": "Прост",
  // Добавьте другие легенды по аналогии
};

const LegendDetails = () => {
  const { lastName } = useParams(); // получаем фамилию из URL
  const navigate = useNavigate();
  const [legend, setLegend] = useState(null);
  const [biography, setBiography] = useState("");
  const [activeTab, setActiveTab] = useState("biography");
  const [selectedYear, setSelectedYear] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [currentSeasonStats, setCurrentSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
  const [selectedSeasonStats, setSelectedSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeName = (name) => {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Загружаем общую информацию о легенде
  useEffect(() => {
    const fetchLegendInfo = async () => {
      try {
        // Пример: Данные о легенде
        const legendData = {
          name: "Michael Schumacher", // Пример, для добавления других легенд можно делать так
          lastTeam: "Mercedes",
          nationality: "German",
          biography: "Михаэль Шумахер — один из величайших гонщиков в истории Формулы 1.",
          lastSeason: "2011", // Последний сезон в карьере
        };

        // Для легенд определяем фамилию и имя для корректной обработки
        if (normalizeName(legendData.name) === normalizeName(lastName)) {
          setLegend(legendData);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных о легенде:", error);
        setError("Ошибка загрузки данных о легенде");
      } finally {
        setLoading(false);
      }
    };

    if (lastName) fetchLegendInfo();
  }, [lastName]);

  useEffect(() => {
    if (legend) {
      const lastNameNormalized = normalizeName(legend.name);
      const bio = biographies[lastNameNormalized]?.biography || "Биография не найдена";
      setBiography(bio);

      const legendSeasons = seasonsData[lastNameNormalized] || [];
      setSeasons(legendSeasons);

      // Для легенды, устанавливаем последний сезон как текущий
      const lastSeason = legend.lastSeason || legendSeasons[0];
      setSelectedYear(lastSeason);
      fetchLegendStats(lastNameNormalized, lastSeason, true); // Загрузка статистики для последнего сезона
    }
  }, [legend]);

  const fetchLegendStats = async (name, year, isCurrentSeason) => {
    try {
      const normalizedName = normalizeName(name);
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/drivers/${normalizedName}/results.json`);
      if (!response.ok) throw new Error("Не удалось получить данные о результатах");

      const data = await response.json();
      const results = data?.MRData?.RaceTable?.Races;

      const wins = results ? results.filter(result => parseInt(result?.Results?.[0]?.position, 10) === 1).length : 0;
      const podiums = results ? results.filter(result => {
        const pos = parseInt(result?.Results?.[0]?.position, 10);
        return pos >= 1 && pos <= 3;
      }).length : 0;
      const poles = results ? results.filter(result => parseInt(result?.Results?.[0]?.grid, 10) === 1).length : 0;
      const dnf = results ? results.filter(result => {
        const status = result?.Results?.[0]?.status;
        return status !== "Finished" && !status.toLowerCase().includes("+1 lap") && !status.toLowerCase().includes("+2 laps");
      }).length : 0;

      if (isCurrentSeason) {
        setCurrentSeasonStats({ wins, podiums, poles, dnf });
      } else {
        setSelectedSeasonStats({ wins, podiums, poles, dnf });
      }
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
      setCurrentSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
      setSelectedSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleYearChange = async (event) => {
    const selected = event.target.value;
    setSelectedYear(selected);
    const normalizedLastName = normalizeName(legend.name);
    await fetchLegendStats(normalizedLastName, selected, false);
  };

  const goBack = () => {
    navigate(-1);
  };

  // Если еще не загрузились данные о легенде, ничего не рендерим
  if (loading || !legend) return <div></div>;
  if (error) return <div>{error}</div>;

  // Словарь цветов команд
  const teamColors = {
    "McLaren": "#F48021",
    "Ferrari": "#FF0000",
    "Red Bull": "#001690",
    "Mercedes": "#00A19C",
    "Aston Martin": "#00594F",
    "Alpine F1 Team": "#0078C1",
    "Haas F1 Team": "#8B8B8B",
    "RB F1 Team": "#1434CB",
    "Williams": "#00A3E0",
    "Sauber": "#00E701",
  };

  const teamColor = teamColors[legend.lastTeam] || "#000000";
  const legendFirstName = firstNameTranslations[legend.name.split(" ")[0]] || legend.name.split(" ")[0];
  const legendLastNameDisplay = lastNameTranslations[legend.name.split(" ")[1]] || legend.name.split(" ")[1];

  return (
    <div
      style={{
        width: "calc(100% - 20px)",
        margin: "10px 10px 100px",
        padding: "15px",
        background: "white",
        height: "100%",
        marginBottom: "100px",
        overflowY: "auto",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "19px",
        marginTop: "10px",
      }}
    >
      {/* Кнопка "Назад" */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={goBack}
          style={{
            backgroundColor: "white",
            color: "black",
            border: "none",
            padding: "5px 10px",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000",
          }}
        >
          ✕
        </button>
        {/* Заголовок с информацией о легенде и команде */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "400" }}>
              {legendFirstName}
            </div>
            <div style={{ color: "#B9B9B9", fontSize: "16px", fontFamily: "Inter", fontWeight: "400" }}>
              {legendLastNameDisplay}
            </div>
          </div>
          <div style={{ color: teamColor, fontSize: "12px", fontFamily: "Inter", fontWeight: "600" }}>
            {legend.lastTeam}
          </div>
        </div>
      </div>

      {/* Полоска в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColor }} />

      {/* Статистика легенды */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {currentSeasonStats.wins || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {currentSeasonStats.podiums || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {currentSeasonStats.poles || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {currentSeasonStats.dnf || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
        </div>
      </div>

      {/* Вкладки для переключения */}
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        marginTop: "20px",
      }}>
        <button
          onClick={() => handleTabChange("biography")}
          style={{
            padding: "10px",
            width: "100%",
            margin: "5px",
            backgroundColor: activeTab === "biography" ? teamColor : "#f0f0f0",
            color: activeTab === "biography" ? "white" : "black",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Биография
        </button>
        <button
          onClick={() => handleTabChange("seasons")}
          style={{
            padding: "10px",
            width: "100%",
            margin: "5px",
            backgroundColor: activeTab === "seasons" ? teamColor : "#f0f0f0",
            color: activeTab === "seasons" ? "white" : "black",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Сезоны
        </button>
      </div>

      {/* Контент вкладки */}
      <div style={{
        width: "100%",
        backgroundColor: "white",
        borderRadius: "8px",
        fontSize: "14px",
        color: "black",
        fontFamily: "Arial, sans-serif",
      }}>
        {activeTab === "biography" ? (
          <>
            <strong>Биография:</strong>
            <p>{biography}</p>
          </>
        ) : (
          <>
            <div>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: `2px solid ${teamColor}`,
                  backgroundColor: "#f0f0f0",
                  fontSize: "14px",
                  color: "black",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                {seasons.map((year, index) => (
                  <option key={index} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "row", marginTop: "10px", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedSeasonStats.position || " "}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedSeasonStats.points || " "}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedSeasonStats.wins || 0}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedSeasonStats.podiums || 0}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LegendDetails;
