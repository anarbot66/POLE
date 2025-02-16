// PilotDetails.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import biographies from "./json/bio"; // данные о биографиях
import seasonsData from "./json/seasons"; // данные о сезонах

// Словари для перевода имен на русский
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

const PilotDetails = () => {
  const { lastName } = useParams(); // получаем фамилию из URL
  const navigate = useNavigate();
  const [pilot, setPilot] = useState(null);
  const [biography, setBiography] = useState("");
  const [activeTab, setActiveTab] = useState("biography");
  const [selectedYear, setSelectedYear] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [currentSeasonStats, setCurrentSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
  const [selectedSeasonStats, setSelectedSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeName = (name) => {
    if (name === "Magnussen") return "kevin_magnussen";
    if (name === "Verstappen") return "max_verstappen";
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Загружаем общую информацию о пилоте
  useEffect(() => {
    const fetchPilotInfo = async () => {
      try {
        const response = await fetch(`https://api.jolpi.ca/ergast/f1/2024/drivers/${lastName}/driverStandings.json`);
        if (!response.ok) throw new Error("Ошибка загрузки данных о пилоте");
        const data = await response.json();
        const pilotData = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings[0];
        if (pilotData) {
          setPilot(pilotData);
        } else {
          throw new Error("Пилот не найден");
        }
      } catch (error) {
        console.error("Ошибка загрузки пилота:", error);
        setError("Ошибка загрузки пилота");
      } finally {
        setLoading(false);
      }
    };

    if (lastName) fetchPilotInfo();
  }, [lastName]);

  // После загрузки пилота загружаем биографию, сезоны и статистику
  useEffect(() => {
    if (pilot) {
      const lastNameNormalized = normalizeName(pilot.Driver.familyName);
      const bio = biographies[lastNameNormalized]?.biography || "Биография не найдена";
      setBiography(bio);

      const pilotSeasons = seasonsData[lastNameNormalized] || [];
      setSeasons(pilotSeasons);

      if (pilotSeasons.length > 0) {
        setSelectedYear(pilotSeasons[0]);
        fetchPilotResults(lastNameNormalized, pilotSeasons[0], false);
        fetchPilotStandings(lastNameNormalized, pilotSeasons[0]);
      }
      // Загружаем текущий сезон (2024)
      fetchPilotResults(lastNameNormalized, "2024", true);
      fetchPilotStandings(lastNameNormalized, "2024");
    }
  }, [pilot]);

  const fetchPilotStandings = useCallback(async (name, year) => {
    try {
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

      const normalizedName = normalizeName(name);
      const pilotData = standings.find(driver => normalizeName(driver.Driver.familyName) === normalizedName);
      if (!pilotData) throw new Error("Пилот не найден в этом году");

      const results = { 
        position: pilotData.position || "-", 
        points: pilotData.points || "-" 
      };

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
  }, []);

  const fetchPilotResults = async (lastName, year, isCurrentSeason) => {
    try {
      const lastNameNormalized = lastName.toLowerCase();
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/drivers/${lastNameNormalized}/results.json`);
      if (!response.ok) throw new Error("Не удалось получить данные о результатах пилота");
      const data = await response.json();
      const results = data?.MRData?.RaceTable?.Races;
  
      if (results && Array.isArray(results)) {
        const wins = results.filter(result => parseInt(result?.Results?.[0]?.position, 10) === 1).length;
        const podiums = results.filter(result => {
          const pos = parseInt(result?.Results?.[0]?.position, 10);
          return pos >= 1 && pos <= 3;
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "seasons") {
      const normalizedLastName = normalizeName(pilot.Driver.familyName);
      fetchPilotResults(normalizedLastName, selectedYear, false);
      fetchPilotStandings(normalizedLastName, selectedYear);
    }
  };

  const handleYearChange = async (event) => {
    const selected = event.target.value;
    setSelectedYear(selected);
    const normalizedLastName = normalizeName(pilot.Driver.familyName);
    await fetchPilotResults(normalizedLastName, selected, false);
    await fetchPilotStandings(normalizedLastName, selected);
  };

  const goBack = () => {
    navigate(-1);
  };

  // Если еще не загрузились данные о пилоте, ничего не рендерим
  if (loading || !pilot) return <div></div>;
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

  const teamColor = teamColors[pilot.Constructors[0].name] || "#000000";
  const pilotFirstName = firstNameTranslations[pilot.Driver.givenName] || pilot.Driver.givenName;
  const pilotLastNameDisplay = lastNameTranslations[pilot.Driver.familyName] || pilot.Driver.familyName;

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
        {/* Заголовок с информацией о пилоте и команде */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "400" }}>
              {pilotFirstName}
            </div>
            <div style={{ color: "#B9B9B9", fontSize: "16px", fontFamily: "Inter", fontWeight: "400" }}>
              {pilotLastNameDisplay}
            </div>
          </div>
          <div style={{ color: teamColor, fontSize: "12px", fontFamily: "Inter", fontWeight: "600" }}>
            {pilot.Constructors[0].name}
          </div>
        </div>
      </div>

      {/* Полоска в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColor }} />

      {/* Статистика пилота */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {pilot.position}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {pilot.points}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
        </div>
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
                  {selectedYear === "2024" ? currentSeasonStats.position || " " : selectedSeasonStats.position || " "}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedYear === "2024" ? currentSeasonStats.points || " " : selectedSeasonStats.points || " "}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedSeasonStats.wins}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedSeasonStats.podiums || 0}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedSeasonStats.poles || 0}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedSeasonStats.dnf || 0}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PilotDetails;
