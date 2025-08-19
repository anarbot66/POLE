// RaceDetails.js
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useSwipeable } from 'react-swipeable';
import { nationalityToFlag } from "../pilots/driverList/constants";
import { TEAM_COLORS } from "../../screens/recources/json/constants";
import { driverSurnames } from "../pilots/driverDetails/constants";
import BackButton from "../components/BackButton";
import { CONSTRUCTOR_API_NAMES } from "../../screens/recources/json/constants";

// Сопоставление стран с кодами флагов
const countryToFlag = {
  "Bahrain": "bh", "Saudi Arabia": "sa", "Australia": "au", "Japan": "jp",
  "China": "cn", "USA": "us", "United States": "us", "Miami": "us",
  "Italy": "it", "Monaco": "mc", "Canada": "ca", "Spain": "es",
  "Austria": "at", "Great Britain": "gb", "United Kingdom": "gb", "UK": "gb",
  "Hungary": "hu", "Belgium": "be", "Netherlands": "nl", "Singapore": "sg",
  "Mexico": "mx", "Brazil": "br", "Las Vegas": "us", "UAE": "ae",
  "Qatar": "qa", "Azerbaijan": "az"
};

// Перевод названий сессий
const sessionTypeTranslations = {
  "FirstPractice": "Свободная практика 1",
  "SecondPractice": "Свободная практика 2",
  "ThirdPractice": "Свободная практика 3",
  "Qualifying": "Квалификация",
  "Sprint": "Спринт",
  "SprintQualifying": "Квалификация к спринту",
  "Race": "Гонка"
};

// Перевод названий гонок
const raceNameTranslations = {
  "Bahrain Grand Prix": "Бахрейн",
  "Saudi Arabian Grand Prix": "Саудовская Аравия",
  "Australian Grand Prix": "Австралия",
  "Japanese Grand Prix": "Япония",
  "Chinese Grand Prix": "Китай",
  "Miami Grand Prix": "Майами",
  "Emilia Romagna Grand Prix": "Эмилия-Романья",
  "Monaco Grand Prix": "Монако",
  "Canadian Grand Prix": "Канада",
  "Spanish Grand Prix": "Испания",
  "Austrian Grand Prix": "Австрия",
  "British Grand Prix": "Великобритания",
  "Hungarian Grand Prix": "Венгрия",
  "Belgian Grand Prix": "Бельгия",
  "Dutch Grand Prix": "Нидерланды",
  "Italian Grand Prix": "Италия",
  "Azerbaijan Grand Prix": "Азербайджан",
  "Singapore Grand Prix": "Сингапур",
  "United States Grand Prix": "США",
  "Mexico City Grand Prix": "Мексика",
  "São Paulo Grand Prix": "Бразилия",
  "Las Vegas Grand Prix": "Лас-Вегас",
  "Qatar Grand Prix": "Катар",
  "Abu Dhabi Grand Prix": "Абу-Даби"
};

// Функция конвертации даты и времени в московское время
const convertToMoscowTime = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return "—";
  const date = new Date(`${utcDate}T${utcTime}`);
  // Прибавляем 3 часа для московского времени (UTC+3)
  date.setHours(date.getHours());
  return date.toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });
};

const RaceDetails = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [, RsetImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  

  

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  

  const location = useLocation();
  const navigate = useNavigate();
  const race = location.state?.race;

  const [activeTab, setActiveTab] = useState("schedule");

  const tabs = ['schedule','results','circuit'];

  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const scheduleRef = useRef(null);
  const resultsRef = useRef(null);
  const circuitRef = useRef(null);

  useLayoutEffect(() => {
    const updateUnderline = () => {
      let ref;
      if (activeTab === "schedule") ref = scheduleRef;
      if (activeTab === "results") ref = resultsRef;
      if (activeTab === "circuit") ref = circuitRef;
  
      if (ref?.current) {
        const { offsetLeft, offsetWidth } = ref.current;
        setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
      }
    };
  
    requestAnimationFrame(updateUnderline); // ждем, пока браузер нарисует DOM
    window.addEventListener("resize", updateUnderline);
    return () => window.removeEventListener("resize", updateUnderline);
  }, [activeTab, scheduleRef.current, resultsRef.current, circuitRef.current]);

  
  const goPrev = () => {
    const i = tabs.indexOf(activeTab);
    const prev = tabs[(i - 1 + tabs.length) % tabs.length];
    setActiveTab(prev);
  };
  const goNext = () => {
    const i = tabs.indexOf(activeTab);
    const next = tabs[(i + 1) % tabs.length];
    setActiveTab(next);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => goNext(),
    onSwipedRight: () => goPrev(),
    trackMouse: true,    // чтобы работало и мышью
    preventDefaultTouchmoveEvent: true
  });

  useEffect(() => {
    if (activeTab !== "results" || !race) return;

    const fetchResults = async () => {
      setResultsLoading(true);
      try {
        const { season, round } = race;
        const res = await fetch(
          `https://api.jolpi.ca/ergast/f1/${season}/${round}/results.json?limit=30`
        );
        const json = await res.json();
        const fetched = json.MRData.RaceTable.Races[0];
        setResults(fetched.Results || []);
      } catch (err) {
        console.error("Ошибка загрузки результатов:", err);
        setResults([]);
      } finally {
        setResultsLoading(false);
      }
    };

    fetchResults();
  }, [activeTab, race]);

  // Загрузка изображения трассы
  useEffect(() => {
    const loadImage = async () => {
      if (!race) return;
      const circuitName = race.Circuit.Location.locality;
      try {
        const image = await import(`../recources/images/circuits/${circuitName}.png`);
        const img = new Image();
        img.src = image.default;
        img.onload = () => {
          setImageSrc(image.default);
          setLoading(false);
        };
        img.onerror = () => {
          console.error("Ошибка загрузки изображения");
          setLoading(false);
        };
      } catch (error) {
        console.error("Ошибка загрузки изображения", error);
        setLoading(false);
      }
    };
    loadImage();
  }, [race]);

  useEffect(() => {
    const loadImage = async () => {
      if (!race) return;
      const circuitName = race.Circuit.Location.locality;
      try {
        const image = await import(`../recources/images/circuits/${circuitName}Reality.jpg`);
        const img = new Image();
        img.src = image.default;
        img.onload = () => {
          RsetImageSrc(image.default);
          setLoading(false);
        };
        img.onerror = () => {
          console.error("Ошибка загрузки изображения");
          setLoading(false);
        };
      } catch (error) {
        console.error("Ошибка загрузки изображения", error);
        setLoading(false);
      }
    };
    loadImage();
  }, [race]);

  // Подготовка данных расписания
  const sessions = [
    { type: "FirstPractice", date: race?.FirstPractice?.date, time: race?.FirstPractice?.time },
    { type: "SecondPractice", date: race?.SecondPractice?.date, time: race?.SecondPractice?.time },
    { type: "ThirdPractice", date: race?.ThirdPractice?.date, time: race?.ThirdPractice?.time },
    { type: "Qualifying", date: race?.Qualifying?.date, time: race?.Qualifying?.time },
    { type: "Sprint", date: race?.Sprint?.date, time: race?.Sprint?.time },
    { type: "Race", date: race?.date, time: race?.time }
  ].filter(session => session.date);

  const translatedRaceName = raceNameTranslations[race?.raceName] || race?.raceName;




  useEffect(() => {
    if (activeTab === "results" && race) {
      setResultsLoading(true);
      setResults(race.Results || []);
      setResultsLoading(false);
    }
  }, [activeTab, race]);
  

  if (!race || loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "white" }}>
         
      </div>
    );
  }

  const countryCode = countryToFlag[race.Circuit.Location.country] || "un";

  return (
    <div>

    <div style={{
      marginBottom: "65px",
      overflowY: "auto",
      borderRadius: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "19px",
      marginTop: "10px"
    }}
    >
      
      <div style={{display: "flex",
        flexDirection: "column",
        gap: "19px", position: 'fixed', width: '100%', background: 'rgb(17, 17, 19)', left: '0', top: '0', padding: '20px 20px 0px 20px', zIndex: 100}}>
      <div style={{display: 'flex', width: "100%"}}>
      <BackButton
        label="Назад"
        style={{width: '100%'}}
      />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px"}}>
      
        <div style={{ display: "flex", gap: "10px", flex: 1 }}>
        <img 
          src={`https://flagcdn.com/w80/${countryCode}.png`} 
          alt={race.Circuit.Location.country}
          style={{ 
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            objectFit: "cover",
            objectPosition: ["UAE", "United States", "Singapore", "USA", "Qatar"].includes(race.Circuit.Location.country)
              ? "20% center" : "center"
          }} 
        />
          <div style={{ color: "lightgray", fontSize: "18px" }}>{translatedRaceName}</div>
        </div>
        <div style={{ color: "white", fontSize: "24px" }}>{race.Circuit.circuitName}</div>
      </div>
      <div style={{ position: "relative", display: "flex", borderRadius: "20px", gap: "19px" }}>
      <button
        ref={scheduleRef}
        onClick={() => setActiveTab("schedule")}
        style={{
          padding: "10px 5px",
          color: activeTab === "schedule" ? "white" : "var(--col-darkGray)",
          background: activeTab === "schedule" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Расписание
      </button>

      <button
        ref={resultsRef}
        onClick={() => setActiveTab("results")}
        style={{
          padding: "10px 5px",
          color: activeTab === "results" ? "white" : "var(--col-darkGray)",
          background: activeTab === "results" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Результаты
      </button>

      <button
        ref={circuitRef}
        onClick={() => setActiveTab("circuit")}
        style={{
          padding: "10px 5px",
          color: activeTab === "circuit" ? "white" : "var(--col-darkGray)",
          background: activeTab === "circuit" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Трасса
      </button>

      {/* Полоска */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: underlineStyle.left,
          height: "3px",
          width: underlineStyle.width,
          backgroundColor: "blue",
          borderRadius: "2px",
          transition: "left 0.3s ease, width 0.3s ease",
          pointerEvents: "none",
        }}
      />
    </div>
      </div>
      <div style={{ width: "100%" }}>
        <TransitionGroup>
          <CSSTransition
            key={activeTab}
            classNames="tab"
            timeout={400}
          >
            <div {...swipeHandlers}
  style={{ position: 'relative', marginTop: '200px', padding: '15px'}}>
            {activeTab === "schedule" && (
            <div style={{background: '#141416', padding: '20px', borderRadius: '15px', display: 'flex', flexDirection: "column", gap: "10px"}}>
          {sessions.map((session, index) => (
            <div key={index} style={{
              padding: "5px",
              borderRadius: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "12px", color: "white" }}>
                {sessionTypeTranslations[session.type] || session.type}
              </span>
              <span style={{ color: "lightgray", fontSize: "12px" }}>
                {convertToMoscowTime(session.date, session.time)}
              </span>
            </div>
          ))}
        </div>
        )}
      {activeTab === "circuit" && (
        <div style={{
          padding: "25px",
          borderRadius: "15px",
          color: "white",
          alignItems: 'center',
          justifyItems: 'center',
          background: '#141416'
        }}>
          <img
    src={imageSrc}
    alt="Изображение трассы"
    style={{ 
      width: "100%", 
      aspectRatio: '2 / 1',
      objectFit: 'contain',
      display: "block",
      position: "relative",
      zIndex: 1,
    }}
  />
        </div>
      )}

    {activeTab === "results" && (
  <div style={{ display: "flex", flexDirection: "column", gap: '10px', overflowY: "auto", overflowX: "hidden", padding: "20px", background: '#141416', borderRadius: "15px" }}>
    {resultsLoading && <p style={{ color: "white" }}> </p>}
    {!resultsLoading && results.map((r, i) => {
  const driverName = driverSurnames[r.Driver.familyName] || r.Driver.familyName;
  const nat = r.Driver.nationality;
  const countryCode = nationalityToFlag[nat] || "un";
  const bg = TEAM_COLORS[r.Constructor.name] || "#888";
    const constructorName = r.Constructor.name;
    const apiName = CONSTRUCTOR_API_NAMES?.[constructorName];

  function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();
}

  const slug = slugify(r.Driver.familyName);


  return (
      <div
      key={i}
      className="Frame24 inline-flex items-center justify-between"
      style={{ borderRadius: 10, cursor: 'pointer', }}
    >
      <div className="inline-flex items-center gap-4">
        <div
          style={{
            height: 32,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <span style={{ color: "white", fontSize: 15, fontWeight: 500 }}>
            {r.position}
          </span>
        </div>
          <div style={{width: '130px', display: 'flex', alignItems: 'center', gap:'10px' }} onClick={() => navigate(`/pilot-details/${slug}`)}>
          <img
            src={`https://flagcdn.com/w40/${countryCode}.png`}
            alt={nat}
            style={{
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              objectFit: "cover"
            }}
          ></img>
          <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>
          {driverName}
        </span>
          </div>
      </div>
      <span style={{ color: bg, fontSize: 13, fontWeight: 500, width: '100px', textAlign: 'left' }} onClick={() => navigate(`/constructor-details/${apiName}`)}>
        {r.Constructor.name}
      </span>
      <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>
        {r.points} PTS
      </span>
    </div>
  );
})}
{!resultsLoading && results.length === 0 && (
  <p style={{
    textAlign: "center",
    lineHeight: "1.4em",
    display: 'flex',
    gap: '0px',
    flexDirection: 'column'
  }}>
    <span style={{ color: "white", fontSize: 15}}>
      Это гран‑при ещё не завершено
      или мы не успели обновить данные
    </span>
    <br/>
    <span style={{ color: "lightgray", fontSize: 11}}>
      Узнать когда будет гонка можно во вкладке «Расписание»
    </span>
  </p>
)}

  </div>
    )}
    </div>
      </CSSTransition>
        </TransitionGroup>
      </div>



    </div>
    </div>
  );
};

export default RaceDetails;
