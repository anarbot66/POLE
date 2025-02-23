import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import seasonsData from "./json/seasons"; // Загружаем данные о сезонах конструктора

// Словарь для преобразования имен конструкторов в API-формат
const constructorApiNames = {
  "Red Bull": "red_bull",
  "McLaren": "mclaren",
  "Ferrari": "ferrari",
  "Aston Martin": "aston_martin",
  "Alpine F1 Team": "alpine",
  "Haas F1 Team": "haas",
  "RB F1 Team": "rb",
  "Williams": "williams",
  "Sauber": "sauber",
  "Mercedes": "mercedes"
};

// Цвета команд
const teamColors = {
  "Red Bull": "#001690",
  "McLaren": "#F48021",
  "Ferrari": "#FF0000",
  "Aston Martin": "#00594F",
  "Alpine F1 Team": "#0078C1",
  "Haas F1 Team": "#8B8B8B",
  "RB F1 Team": "#1434CB",
  "Williams": "#00A3E0",
  "Sauber": "#00E701",
  "Mercedes": "#00A19C"
};

// Биографии команд
const teamBiographies = {
  "Red Bull": "Red Bull Racing – австрийская команда Формулы-1, участник чемпионата мира с 2005 года. Известна своими инновациями и отличными результатами в гонках.",
  "McLaren": "McLaren – британская команда Формулы-1, одна из самых успешных в истории спорта. Основана в 1963 году и выиграла множество чемпионатов.",
  "Ferrari": "Ferrari – итальянская команда, самая титулованная в истории Формулы-1. Основана в 1929 году и известна своим долгим присутствием в гонках.",
  "Aston Martin": "Aston Martin – британская команда, вернувшаяся в Формулу-1 под этим брендом в 2021 году, но её история в автоспорте начинается с 1950-х годов.",
  "Alpine F1 Team": "Alpine – французская команда, основанная в 2021 году. Это бренд, представляющий французский автопроизводитель Renault в Формуле-1.",
  "Haas F1 Team": "Haas – американская команда, созданная в 2016 году и быстро занявшая место на высоких позициях благодаря тесному сотрудничеству с Ferrari.",
  "RB F1 Team": "RB Racing – это технически другая команда, часто связанна с Red Bull Racing, особенно в контексте используемых технологий.",
  "Williams": "Williams – британская команда, одна из самых успешных в истории Формулы-1. Основана в 1977 году и имеет большое количество побед.",
  "Sauber": "Sauber – швейцарская команда, основанная в 1970-х годах и присутствующая в Формуле-1 с 1993 года. Известна своей стабильной работой и результатами.",
  "Mercedes": "Mercedes – немецкая команда, одна из самых сильных в последние годы в Формуле-1. С 2014 года доминирует в чемпионатах, благодаря чему заслужила большую популярность."
};

const ConstructorDetails = ({ constructor, goBack }) => {
  const [wins, setWins] = useState(0);
  const [podiums, setPodiums] = useState(0);
  const [poles, setPoles] = useState(0);
  const [position, setPosition] = useState(""); // Позиция конструктора в чемпионате
  const [points, setPoints] = useState(""); // Очки конструктора
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [biography, setBiography] = useState(""); // Стейт для биографии команды
  const [activeTab, setActiveTab] = useState("biography"); // Стейт для активной вкладки
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("2023");
  const [seasonStats, setSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0 });
  const navigate = useNavigate();

  // Загружаем данные о сезонах конструктора из JSON
  useEffect(() => {
    if (!constructor) return;

    const formattedConstructorName = constructorApiNames[constructor.Constructor.name] || constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");
    setSeasons(seasonsData[formattedConstructorName] || []);
    setBiography(teamBiographies[constructor.Constructor.name] || "Биография команды не найдена.");

    // Загружаем статистику за текущий сезон (2024)
    fetchCurrentSeasonStats();
  }, [constructor]);

  // Функция для загрузки статистики за текущий сезон (2024)
  const fetchCurrentSeasonStats = async () => {
    try {
      const formattedConstructorName =
        constructorApiNames[constructor.Constructor.name] ||
        constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");

      const response = await fetch(`https://api.jolpi.ca/ergast/f1/2024/constructors/${formattedConstructorName}/results.json?limit=100`);
      const data = await response.json();
      const racesData = data.MRData?.RaceTable?.Races || [];
      let winCount = 0;
      let podiumCount = 0;
      let poleCount = 0;

      racesData.forEach((race) => {
        const top3Finishers = race.Results?.filter((driver) => parseInt(driver.position) <= 3) || [];
        const poleFinishers = race.Results?.filter((driver) => driver.grid === "1") || [];

        if (top3Finishers.some((driver) => parseInt(driver.position) === 1)) winCount++;
        if (top3Finishers.length > 0) podiumCount++;
        if (poleFinishers.length > 0) poleCount++;
      });

      setWins(winCount);
      setPodiums(podiumCount);
      setPoles(poleCount);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки данных текущего сезона:", error);
      setError("Ошибка при получении данных о текущем сезоне");
      setLoading(false);
    }
  };

// Функция для загрузки статистики по выбранному сезону
// Функция для загрузки статистики по выбранному сезону
const fetchSeasonStats = async (season) => {
  try {
    const formattedConstructorName =
      constructorApiNames[constructor.Constructor.name] ||
      constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");

    // 1. Запрос для получения результатов гонок
    const responseResults = await fetch(`https://api.jolpi.ca/ergast/f1/${season}/constructors/${formattedConstructorName}/results.json?limit=100`);
    const dataResults = await responseResults.json();
    const racesData = dataResults.MRData?.RaceTable?.Races || [];

    let winCount = 0;
    let podiumCount = 0;
    let poleCount = 0;

    // Обрабатываем данные по гонкам
    racesData.forEach((race) => {
      const top3Finishers = race.Results?.filter((driver) => parseInt(driver.position) <= 3) || [];
      const poleFinishers = race.Results?.filter((driver) => driver.grid === "1") || [];

      if (top3Finishers.some((driver) => parseInt(driver.position) === 1)) winCount++;
      if (top3Finishers.length > 0) podiumCount++;
      if (poleFinishers.length > 0) poleCount++;
    });

    // 2. Запрос для получения текущих данных о позиции и очках конструктора
    const responseStandings = await fetch(`https://api.jolpi.ca/ergast/f1/${season}/constructorstandings.json`);
    const dataStandings = await responseStandings.json();
    const constructorData = dataStandings?.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings || [];
    
    // Найдем данные о нужном конструкторе
    const constructorInfo = constructorData.find(item => item.Constructor?.name === constructor.Constructor.name);
    let constructorPosition = "-"; // Изначально пустая позиция
    let constructorPoints = "-";  // Изначально пустые очки

    if (constructorInfo) {
      constructorPosition = constructorInfo.position || "-";  // Позиция конструктора
      constructorPoints = constructorInfo.points || "-";     // Очки конструктора
    }

    // Обновляем стейты
    setSeasonStats({ wins: winCount, podiums: podiumCount, poles: poleCount });
    setPosition(constructorPosition);
    setPoints(constructorPoints);  // Обновляем очки конструктора
  } catch (error) {
    console.error("Ошибка загрузки статистики сезона:", error);
    setSeasonStats({ wins: 0, podiums: 0, poles: 0 });
    setPosition("-");
    setPoints("-");  // Если произошла ошибка, ставим дефолтные значения
  }
};








  

  useEffect(() => {
    fetchSeasonStats(selectedSeason);
  }, [selectedSeason]);

  // Обработка переключения вкладок
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (!constructor) return <div> </div>;

  const teamColor = teamColors[constructor.Constructor.name] || "#000000";

  return (
    <div
      className="constructor-details"
      style={{
        width: "calc(100% - 20px)",
        margin: "10px 10px 100px",
        padding: "15px",
        background: "#212124",
        borderRadius: "20px",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "19px",
        display: "inline-flex",
        marginTop: "10px",
      }}
    >
      {/* Родительский контейнер с display: flex */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Кнопка назад */}
        <button
          onClick={goBack}
          style={{
            backgroundColor: "#212124",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000",
          }}
        >
          ✕
        </button>

        {/* Заголовок с информацией о конструкторе */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
          <div style={{ color: teamColor, fontSize: "16px", fontFamily: "Inter", fontWeight: "400" }}>
            {constructor.Constructor.name}
          </div>
        </div>
      </div>


      {/* Полоска в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColor }} />

      {/* Статистика конструктора (для текущего сезона) */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {constructor.position}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600" }}>ПОЗИЦИЯ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {constructor.points}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {wins}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {podiums}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {poles}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
        </div>
      </div>

      {/* Переключение вкладок */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "20px" }}>
        <button
          onClick={() => handleTabChange("biography")}
          style={{
            padding: "10px",
            width: "100%",
            margin: "5px",
            backgroundColor: activeTab === "biography" ? teamColor : "#1D1D1F",
            color: activeTab === "biography" ? "white" : "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: 12
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
            backgroundColor: activeTab === "seasons" ? teamColor : "#1D1D1F",
            color: activeTab === "seasons" ? "white" : "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: 12
          }}
        >
          Сезоны
        </button>
      </div>

      {/* Контент вкладки */}
      {activeTab === "biography" ? (
        <div style={{ marginTop: "0px", padding: "10px", backgroundColor: "#1D1D1F", borderRadius: "8px" }}>
          <strong style={{ fontSize: 13, color: "white"}}>Биография команды:</strong>
          <p style={{ fontSize: 11, marginTop: "10px", color: "white"}}>{biography}</p>
        </div>
      ) : (
        <div style={{}}>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: `2px solid #1D1D1F`,
              backgroundColor: "#1D1D1F",
              fontSize: "14px",
              color: "white",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>

          {/* Статистика для выбранного сезона */}
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "20px" }}>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {position}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {points}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {seasonStats.wins}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {seasonStats.podiums}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {seasonStats.poles}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstructorDetails;
