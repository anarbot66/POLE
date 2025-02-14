import React, { useState, useEffect } from "react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [biography, setBiography] = useState(""); // Стейт для биографии команды

  useEffect(() => {
    if (!constructor) return;

    const formattedConstructorName =
      constructorApiNames[constructor.Constructor.name] ||
      constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");

    fetch(`https://api.jolpi.ca/ergast/f1/2024/constructors/${formattedConstructorName}/results.json?limit=100`)
      .then((response) => response.json())
      .then((data) => {
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
      })
      .catch((error) => {
        console.error("Ошибка загрузки данных:", error);
        setError("Ошибка при получении данных");
        setLoading(false);
      });

    // Загружаем биографию команды
    const teamBio = teamBiographies[constructor.Constructor.name] || "Биография команды не найдена.";
    setBiography(teamBio);

  }, [constructor]);

  if (!constructor) {
    return <div> </div>;
  }

  const teamColor = teamColors[constructor.Constructor.name] || "#000000";

  return (
    <div
      className="constructor-details"
      style={{
        width: "calc(100% - 20px)",
        margin: "10px 10px 100px",
        padding: "15px",
        background: "white",
        borderRadius: "20px",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "19px",
        display: "inline-flex",
        marginTop: "10px",
      }}
    >
      {/* Кнопка "Назад" */}
      <button
        onClick={goBack}
        style={{
          position: "fixed",
          left: "25px",
          bottom: "120px",
          backgroundColor: "white",
          color: "black",
          border: "none",
          padding: "10px 20px",
          borderRadius: "10px",
          cursor: "pointer",
          zIndex: "1000",
        }}
      >
        Назад
      </button>

      {/* Заголовок с информацией о конструкторе */}
      <div style={{ width: "100%", height: "20px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
        <div style={{ width: "100%", height: "10px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
          <div style={{ color: "teamColor", fontSize: "16px", fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word" }}>
            {constructor.Constructor.name}
          </div>
        </div>
      </div>

      {/* Полоска в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColor }} />

      {/* Статистика конструктора */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
        {/* Позиция */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {constructor.position}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>ПОЗИЦИЯ</div>
        </div>

        {/* Очки */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {constructor.points}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>ОЧКОВ</div>
        </div>

        {/* Победы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {loading ? " " : error ? error : wins}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>ПОБЕД</div>
        </div>

        {/* Подиумы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {loading ? " " : error ? error : podiums}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>ПОДИУМОВ</div>
        </div>

        {/* Поулы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {loading ? " " : error ? error : poles}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>ПОУЛОВ</div>
        </div>
      </div>

      {/* Биография команды */}
      <div style={{
        width: "100%",
        marginTop: "20px",
        padding: "10px",
        backgroundColor: "white",
        borderRadius: "8px",
        fontSize: "14px",
        color: "black",
        fontFamily: "Arial, sans-serif",
      }}>
        <strong>Биография команды:</strong>
        <p>{biography}</p>
      </div>
    </div>
  );
};

export default ConstructorDetails;
