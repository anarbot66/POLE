import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  getDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import biographies from "../recources/json/bio"; // данные о биографиях
import seasonsData from "../recources/json/seasons"; // данные о сезонах
import allTimeStats from "../recources/json/allTimeStats.json"; // статистика за всё время для 2025 года
import SocialIcons from "../recources/SocialIcons";
import pilotSocialData from "../recources/json/social.json";
import CustomSelect from "../user/components/CustomSelect"; // импорт кастомного селекта
import { CSSTransition } from "react-transition-group";

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
  "Jack": "Джек"
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
  "Doohan": "Дуэн"
};

const PilotDetails = ({ currentUser }) => {
  const { lastName } = useParams();
  const navigate = useNavigate();
  const [pilot, setPilot] = useState(null);
  const [biography, setBiography] = useState("");
  const [activeTab, setActiveTab] = useState("biography"); // "biography", "seasons", "allTime"
  const [selectedYear, setSelectedYear] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [currentSeasonStats, setCurrentSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0, position: "", points: "" });
  const [selectedSeasonStats, setSelectedSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0, position: "", points: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния для избранного пилота
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  // Состояние для кастомного уведомления
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);

  // Функция нормализации имени
  const normalizeName = (name) => {
    if (name === "Magnussen") return "kevin_magnussen";
    if (name === "Verstappen") return "max_verstappen";
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const getPilotSocial = (pilot) => {
    if (!pilot) return null;
    const driverName = normalizeName(pilot.Driver.familyName);
    const driver = pilotSocialData.drivers.find((item) => item.name === driverName);
    return driver ? driver.social : null;
  };

  // Загрузка данных о пилоте из API
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

  // Загрузка биографии, сезонов и статистики после загрузки пилота
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
      // Загружаем данные для текущего сезона (2024)
      fetchPilotResults(lastNameNormalized, "2024", true);
      fetchPilotStandings(lastNameNormalized, "2024");
    }
  }, [pilot]);

  // Функция для получения данных о позициях пилота за сезон
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

  // Функция для получения результатов пилота за сезон
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
          setCurrentSeasonStats(prev => ({ ...prev, wins, podiums, poles, dnf }));
        } else {
          setSelectedSeasonStats({ wins, podiums, poles, dnf, position: selectedSeasonStats.position, points: selectedSeasonStats.points });
        }
      } else {
        if (isCurrentSeason) {
          setCurrentSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0, position: "-", points: "-" });
        } else {
          setSelectedSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0, position: "-", points: "-" });
        }
      }
    } catch (error) {
      if (isCurrentSeason) {
        setCurrentSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0, position: "-", points: "-" });
      } else {
        setSelectedSeasonStats({ wins: 0, podiums: 0, poles: 0, dnf: 0, position: "-", points: "-" });
      }
    }
  };

  // Функция для переключения вкладок (используется CustomSelect)
  const tabOptions = [
    { value: "biography", label: "Биография" },
    { value: "seasons", label: "Сезоны" },
    { value: "allTime", label: "За всё время" }
  ];

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

  // Проверка статуса "Любимого пилота"
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !pilot) return;
      try {
        const favDocRef = doc(db, "favorites", `${currentUser.uid}_${pilot.Driver.driverId}`);
        const favDoc = await getDoc(favDocRef);
        setIsFavorite(favDoc.exists());
      } catch (error) {
        console.error("Ошибка проверки избранного:", error);
      }
    };
    checkFavoriteStatus();
  }, [currentUser, pilot]);

  // Добавление в избранное с кастомным уведомлением
  const handleFavorite = async () => {
    if (!currentUser || !pilot) return;
    try {
      const userFavoritesRef = collection(db, "favorites");
      const q = query(userFavoritesRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Вместо стандартного alert – показываем кастомное уведомление
        setShowFavoriteAlert(true);
        return;
      }
      setFavLoading(true);
      const favDocRef = doc(db, "favorites", `${currentUser.uid}_${pilot.Driver.driverId}`);
      await setDoc(favDocRef, {
        userId: currentUser.uid,
        pilotId: pilot.Driver.driverId,
        pilotData: pilot,
        createdAt: new Date()
      });
      setIsFavorite(true);
    } catch (error) {
      console.error("Ошибка при добавлении в избранное:", error);
    }
    setFavLoading(false);
  };

  // Удаление из избранного
  const handleUnfavorite = async () => {
    if (!currentUser || !pilot) return;
    setFavLoading(true);
    try {
      const favDocRef = doc(db, "favorites", `${currentUser.uid}_${pilot.Driver.driverId}`);
      await deleteDoc(favDocRef);
      setIsFavorite(false);
    } catch (error) {
      console.error("Ошибка при удалении из избранного:", error);
    }
    setFavLoading(false);
  };

  if (loading || !pilot) return <div> </div>;
  if (error) return <div>{error}</div>;

  // Словарь цветов команд
  const teamColors = {
    "McLaren": "#F48021",
    "Ferrari": "#FF0000",
    "Red Bull": "#2546FF",
    "Mercedes": "#00A19C",
    "Aston Martin": "#00594F",
    "Alpine F1 Team": "#0078C1",
    "Haas F1 Team": "#8B8B8B",
    "RB F1 Team": "#1434CB",
    "Williams": "#00A3E0",
    "Sauber": "#00E701"
  };

  const teamColor = teamColors[pilot.Constructors[0].name] || "#000000";
  const pilotFirstName = firstNameTranslations[pilot.Driver.givenName] || pilot.Driver.givenName;
  const pilotLastNameDisplay = lastNameTranslations[pilot.Driver.familyName] || pilot.Driver.familyName;
  const pilotSocialLinks = pilot ? getPilotSocial(pilot) : null;

  // Данные для вкладки "За всё время"
  const normalizedPilotName = normalizeName(pilot.Driver.familyName);
  const allTimeData = allTimeStats[normalizedPilotName];

  return (
    <div
      style={{
        width: "calc(100% - 20px)",
        margin: "10px",
        padding: "15px",
        background: "#212124",
        height: "100%",
        marginBottom: "100px",
        overflowY: "auto",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "19px",
        marginTop: "10px"
      }}
    >
      {/* Кнопка "Назад" и заголовок */}
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <button
          onClick={goBack}
          style={{
            backgroundColor: "#212124",
            color: "white",
            border: "none",
            padding: "5px 5px",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000"
          }}
        >
          ✕
        </button>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "300" }}>
              {pilotFirstName} {pilotLastNameDisplay}
            </div>
          </div>
          <div style={{ color: teamColor, fontSize: "12px", fontFamily: "Inter", fontWeight: "200" }}>
            {pilot.Constructors[0].name}
          </div>
        </div>
        {pilotSocialLinks && <SocialIcons social={pilotSocialLinks} />}
      </div>
      
      {/* Полоска в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColor }} />

      {/* Статистика пилота (текущий сезон) */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {pilot.position}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {pilot.points}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {currentSeasonStats.wins || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {currentSeasonStats.podiums || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {currentSeasonStats.poles || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {currentSeasonStats.dnf || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
        </div>
      </div>

      {/* Кнопка добавления в избранное */}
      {currentUser && currentUser.uid && (
        <button
          onClick={isFavorite ? handleUnfavorite : handleFavorite}
          disabled={favLoading}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: isFavorite ? "#888" : teamColor,
            color: "white",
            cursor: "pointer"
          }}
        >
          {favLoading
            ? "Обработка..."
            : isFavorite
            ? "Больше не любимый..."
            : "Мой любимый пилот!"}
        </button>
      )}

      {/* Кастомный селект для переключения вкладок */}
      <CustomSelect
        options={tabOptions}
        value={activeTab}
        onChange={handleTabChange}
        style={{ width: "100%", margin: "10px 0" }}
      />

      {/* Контент вкладок */}
      {activeTab === "biography" && (
        <div
          style={{
            width: "100%",
            backgroundColor: "#212124",
            borderRadius: "8px",
            fontSize: "14px",
            color: "white",
            fontFamily: "Arial, sans-serif",
            fontWeight: "300",
            padding: "10px"
          }}
        >
          <p>{biography}</p>
        </div>
      )}
      
      {activeTab === "seasons" && (
        <>
          <div>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: `2px solid #1D1D1F`,
                backgroundColor: "#1D1D1F",
                fontSize: "14px",
                color: "white",
                cursor: "pointer",
              }}
            >
              {seasons.map((year, index) => (
                <option key={index} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginTop: "10px",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              width: "100%"
            }}
          >
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {selectedYear === "2024" ? currentSeasonStats.position || " " : selectedSeasonStats.position || " "}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {selectedYear === "2024" ? currentSeasonStats.points || " " : selectedSeasonStats.points || " "}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {selectedSeasonStats.wins}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {selectedSeasonStats.podiums || 0}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {selectedSeasonStats.poles || 0}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
            </div>
            <div style={{ width: "65px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                {selectedSeasonStats.dnf || 0}
              </span>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
            </div>
          </div>
        </>
      )}
      {activeTab === "allTime" && (
        <div
          style={{
            width: "100%",
            backgroundColor: "#212124",
            borderRadius: "8px",
            fontSize: "14px",
            color: "white",
            fontFamily: "Arial, sans-serif",
            fontWeight: "300",
            padding: "10px"
          }}
        >
          {allTimeData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px"}}>
              <div>WDC (Чемпионства): {allTimeData.personalChampionships}</div>
              <div>WCC (Кубки конструкторов): {allTimeData.constructorsChampionships}</div>
              <div>Гонок: {allTimeData.races}</div>
              <div>Подиумов: {allTimeData.podiums}</div>
              <div>Побед: {allTimeData.wins}</div>
              <div>Поуло: {allTimeData.poles}</div>
              <div>Очков: {allTimeData.points}</div>
              <div>Гранд-слемов: {allTimeData.grandSlams}</div>
            </div>
          ) : (
            <div>Статистика не найдена</div>
          )}
        </div>
      )}

      {/* Кастомное уведомление при попытке повторного добавления в избранное */}
      <CSSTransition
        in={showFavoriteAlert}
        timeout={300}
        classNames="fade"
        unmountOnExit
      >
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
          }}
        >
          <div
            style={{
              background: "#1D1D1F",
              padding: "20px",
              borderRadius: "20px",
              textAlign: "center",
              color: "white",
              maxWidth: "300px"
            }}
          >
            <p style={{ marginBottom: "20px" }}>Вы уже выбрали любимого пилота</p>
            <button
              onClick={() => setShowFavoriteAlert(false)}
              style={{
                background: "#212124",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "15px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Хорошо
            </button>
          </div>
        </div>
        </CSSTransition>

      {/* Стили для анимации fade */}
      <style>
        {`
          .fade-enter {
            opacity: 0;
          }
          .fade-enter-active {
            opacity: 1;
            transition: opacity 300ms;
          }
          .fade-exit {
            opacity: 1;
          }
          .fade-exit-active {
            opacity: 0;
            transition: opacity 300ms;
          }
        `}
      </style>
    </div>
  );
};

export default PilotDetails;
