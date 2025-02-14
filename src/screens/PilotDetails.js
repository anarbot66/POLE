import React, { useState, useEffect } from 'react';
import biographies from './json/bio'; // подключаем данные о биографиях
import seasonsData from './json/seasons'; // подключаем данные о сезонах

// Словарь для перевода имен пилотов на русский
const firstNameTranslations = {
  "Max": "Макс",
  "Lando": "Ландо",
  "Charles": "Шарль",
  "Oscar": "Оскар",
  "Carlos": "Карлос",
  "George": "Джордж",
  "Lewis": "Льюис",
  "Sergio": "Серхио",
  "Fernando": "Фернандо",
  "Pierre": "Пьер",
  "Nico": "Нико",
  "Yuki": "Юки",
  "Lance": "Лэнс",
  "Esteban": "Эстебан",
  "Kevin": "Кевин",
  "Alexander": "Александер",
  "Daniel": "Даниэль",
  "Oliver": "Оливер",
  "Franco": "Франко",
  "Guanyu": "Гуанью",
  "Liam": "Лиам",
  "Valtteri": "Валттери",
  "Logan": "Логан",
  "Jack": "Джек",
};

// Словарь для перевода фамилий пилотов на русский
const lastNameTranslations = {
  "Verstappen": "Ферстаппен",
  "Norris": "Норрис",
  "Leclerc": "Леклер",
  "Piastri": "Пиастри",
  "Sainz": "Сайнс",
  "Russell": "Расселл",
  "Hamilton": "Хэмилтон",
  "Pérez": "Перес",
  "Alonso": "Алонсо",
  "Gasly": "Гасли",
  "Hülkenberg": "Хюлькенберг",
  "Tsunoda": "Цунода",
  "Stroll": "Стролл",
  "Ocon": "Окон",
  "Magnussen": "Магнуссен",
  "Albon": "Албон",
  "Ricciardo": "Риккьярдо",
  "Bearman": "Бирман",
  "Colapinto": "Колапинто",
  "Zhou": "Джоу",
  "Lawson": "Лоусон",
  "Bottas": "Боттас",
  "Sargeant": "Сарджент",
  "Doohan": "Дуэн",
};

const PilotDetails = ({ pilot, teamColors, goBack }) => {
  const [biography, setBiography] = useState(""); // Стейт для биографии пилота
  const [fadeIn, setFadeIn] = useState(false); // Для плавного появления страницы
  const [activeTab, setActiveTab] = useState("biography"); // Состояние для активной вкладки
  const [selectedYear, setSelectedYear] = useState(""); // Состояние для выбранного года
  const [seasons, setSeasons] = useState([]); // Состояние для списка сезонов пилота
  const [currentSeasonStats, setCurrentSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0 }); // Текущий сезон
  const [selectedSeasonStats, setSelectedSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0 }); // Выбранный сезон

  

  const normalizeName = (name) => {
    // Специальная замена для двух пилотов
    if (name === "Magnussen") {
      return "kevin_magnussen";
    } else if (name === "Verstappen") {
      return "max_verstappen";
    }
    return name
      .normalize("NFD")  // Разделяет символы на базовые и диакритики
      .replace(/[\u0300-\u036f]/g, "")  // Убирает все диакритические знаки
      .toLowerCase();  // Преобразует все в нижний регистр
  };

  const fetchPilotStandings = async (name, year) => {
    try {
      // Устанавливаем временное значение, чтобы не скрывались данные
      if (year !== "2024") {
        setSelectedSeasonStats(prev => ({ ...prev, position: " ", points: " " }));
      } else {
        setCurrentSeasonStats(prev => ({ ...prev, position: " ", points: " " }));
      }
  
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
      if (!response.ok) throw new Error("Ошибка загрузки данных о чемпионате");
  
      const data = await response.json();
      const standings = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
      if (!standings) throw new Error("Данные о пилотах отсутствуют");
  
      // Нормализуем фамилию для поиска
      const normalizedName = normalizeName(name);
      const pilotData = standings.find(driver => normalizeName(driver.Driver.familyName) === normalizedName);
  
      if (!pilotData) throw new Error("Пилот не найден в этом году");
  
      const results = { 
        position: pilotData.position || "-", 
        points: pilotData.points || "-" 
      };
  
      // Устанавливаем данные в состояние
      if (year === "2024") {
        setCurrentSeasonStats(prev => ({ ...prev, position: results.position, points: results.points }));
      } else {
        setSelectedSeasonStats(prev => ({ ...prev, position: results.position, points: results.points }));
      }
    } catch (error) {
      console.error("Ошибка загрузки standings:", error);
      if (year === "2024") {
        setCurrentSeasonStats(prev => ({ ...prev, position: "-", points: "-" }));
      } else {
        setSelectedSeasonStats(prev => ({ ...prev, position: "-", points: "-" }));
      }
    }
  };
  
  
  
  
  


  useEffect(() => {
    const lastNameNormalized = normalizeName(pilot.Driver.familyName);
    const bio = biographies[lastNameNormalized]?.biography || "Биография не найдена";
    setBiography(bio);
  
    setTimeout(() => setFadeIn(true), 100);
  
    const pilotSeasons = seasonsData[lastNameNormalized] || [];
    setSeasons(pilotSeasons);
  
    // Проводим первоначальную загрузку для первого сезона
    if (pilotSeasons.length > 0) {
      setSelectedYear(pilotSeasons[0]); 
      fetchPilotResults(lastNameNormalized, pilotSeasons[0], false);
      fetchPilotStandings(lastNameNormalized, pilotSeasons[0]); // Загружаем очки и место за выбранный год
    }
  
    fetchPilotResults(lastNameNormalized, "2024", true); // Загружаем текущий сезон (2024)
    fetchPilotStandings(lastNameNormalized, "2024"); // Загружаем текущий сезон (2024)
  
  }, [pilot]);
  
  

  


  // Функция для получения результатов пилота с учетом выбранного года
  const fetchPilotResults = async (lastName, year, isCurrentSeason) => {
    try {
      const lastNameNormalized = lastName.toLowerCase();
  
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/drivers/${lastNameNormalized}/results.json`);
      if (!response.ok) {
        throw new Error("Не удалось получить данные о результатах пилота");
      }
  
      const data = await response.json();
      const results = data?.MRData?.RaceTable?.Races;
  
  
      if (results && Array.isArray(results)) {
        const wins = results.filter(result => parseInt(result?.Results?.[0]?.position, 10) === 1).length;
        const podiums = results.filter(result => {
          const position = parseInt(result?.Results?.[0]?.position, 10);
          return position >= 1 && position <= 3;
        }).length;
        const poles = results.filter(result => parseInt(result?.Results?.[0]?.grid, 10) === 1).length;
        const dnf = results.filter(result => {
          const status = result?.Results?.[0]?.status;
          return status !== "Finished" && !status.toLowerCase().includes("+1 lap") && !status.toLowerCase().includes("+2 laps");
        }).length;
  
        if (isCurrentSeason) {
          setCurrentSeasonStats({ wins, podiums, poles, dnf });
        } else {
          setSelectedSeasonStats({ wins, podiums, poles, dnf });
        }
      } else {
        if (isCurrentSeason) {
          setCurrentSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
        } else {
          setSelectedSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
        }
      }
    } catch (error) {
      if (isCurrentSeason) {
        setCurrentSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
      } else {
        setSelectedSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
      }
    }
  };
  
  

  const teamColor = teamColors[pilot.Constructors[0].name] || "#000000";
  const pilotFirstName = firstNameTranslations[pilot.Driver.givenName] || pilot.Driver.givenName;
  const pilotLastName = lastNameTranslations[pilot.Driver.familyName] || pilot.Driver.familyName;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  
    if (tab === "seasons") {
      const normalizedLastName = normalizeName(pilot.Driver.familyName);
      // Загружаем данные о сезонах для текущего выбранного сезона
      fetchPilotResults(normalizedLastName, selectedYear, false);
      fetchPilotStandings(normalizedLastName, selectedYear);
    }
  };

  const handleYearChange = async (event) => {
    const selected = event.target.value;
    setSelectedYear(selected);
  
    const normalizedLastName = normalizeName(pilot.Driver.familyName);
  
    // Загружаем данные с серверов для нового сезона
    await fetchPilotResults(normalizedLastName, selected, false);
    await fetchPilotStandings(normalizedLastName, selected);
  };
  
  
  
  

  return (
    <div
      className={`pilot-details ${fadeIn ? "fade-in" : ""}`}
      style={{
        width: "calc(100% - 40px)", // Убираем отступы по бокам
        margin: "0 auto", // Центрируем контейнер
        padding: "15px",
        background: "white",
        height: "100%",
        marginBottom: "100px",
        overflowY: "auto",
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

      {/* Заголовок с информацией о пилоте и команде */}
      <div style={{ width: "100%", height: "70px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
        <div style={{ width: "100%", height: "60px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
          <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word" }}>
            {pilotFirstName}
          </div>
          <div style={{ color: "#B9B9B9", fontSize: "16px", fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word" }}>
            {pilotLastName}
          </div>
        </div>
        <div style={{ color: teamColor, fontSize: "12px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
          {pilot.Constructors[0].name}
        </div>
      </div>

      {/* Полоска в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColor }} />

      {/* Статистика пилота */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
        {/* Позиция */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {pilot.position}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            ПОЗИЦИЯ
          </div>
        </div>

        {/* Очки */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {pilot.points}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            ОЧКОВ
          </div>
        </div>

        {/* Победы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {currentSeasonStats.wins || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            ПОБЕД
          </div>
        </div>

        {/* Подиумы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {currentSeasonStats.podiums || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            ПОДИУМОВ
          </div>
        </div>

        {/* Поулы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {currentSeasonStats.poles || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            ПОУЛОВ
          </div>
        </div>

        {/* DNF */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            {currentSeasonStats.dnf || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
            DNF
          </div>
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
            color: activeTab === "biography" ? "white" : "black", // белый цвет для активной вкладки
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
            color: activeTab === "seasons" ? "white" : "black", // белый цвет для активной вкладки
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
                  width: "100%", // ширина на весь контейнер
                  padding: "10px", // добавляем отступы внутри
                  borderRadius: "8px", // скругленные углы
                  border: `2px solid ${teamColor}`, // рамка в цвет команды
                  backgroundColor: "#f0f0f0", // фоновый цвет
                  fontSize: "14px", // размер текста
                  color: "black", // цвет текста
                  cursor: "pointer",
                  marginTop: "10px", // курсор как указатель
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
            {/* Позиция */}
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                {selectedYear === "2024" ? currentSeasonStats.position || " " : selectedSeasonStats.position || " "}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                ПОЗИЦИЯ
              </div>
            </div>

            {/* Очки */}
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                {selectedYear === "2024" ? currentSeasonStats.points || " " : selectedSeasonStats.points || " "}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                ОЧКОВ
              </div>
            </div>


            {/* Победы за выбранный год */}
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                {selectedSeasonStats.wins} {/* Выбранный сезон */}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                ПОБЕД
              </div>
            </div>

            {/* Подиумы */}
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                {selectedSeasonStats.podiums || 0}  {/* Выводим количество подиумов */}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                ПОДИУМОВ
              </div>
            </div>

            {/* Поулы */}
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                {selectedSeasonStats.poles || 0}  {/* Выводим количество поулов */}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                ПОУЛОВ
              </div>
            </div>

            {/* DNF */}
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                {selectedSeasonStats.dnf || 0}  {/* Выводим количество DNF */}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word" }}>
                DNF
              </div>
            </div>
          </div>

          </>
        )}
      </div>
    </div>
  );
};

export default PilotDetails;
