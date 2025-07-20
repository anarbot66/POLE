// RaceDetails.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useSwipeable } from 'react-swipeable';
import { nationalityToFlag } from "../pilots/driverList/constants";
import { TEAM_COLORS } from "../../screens/recources/json/constants";
import { driverSurnames } from "../pilots/driverDetails/constants";
import BackButton from "../components/BackButton";

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

const RaceDetails = ({ currentUser }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [RimageSrc, RsetImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  

  

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  

  const location = useLocation();
  const navigate = useNavigate();
  const race = location.state?.race;

  const [activeTab, setActiveTab] = useState("schedule");

  const tabs = ['schedule','results','circuit'];
const labels = {
  schedule: 'Расписание',
  results:  'Результаты',
  circuit:'Трасса'
};

  
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
  textAlign: "center", 
  position: "absolute", 
  zIndex: -1, 
  margin: 0, 
  top: 0, 
  width: "100%", 
  height: "400px", 
  overflow: "hidden", 
  left: 0,
}}>
  <img
    src={RimageSrc}
    alt="Изображение трассы"
    style={{ 
      width: "100%", 
      height: '400px', 
      objectFit: 'cover',
      display: "block",
      position: "relative",
      zIndex: 1,
    }}
  />
  <div
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: '400px', 
      background: "linear-gradient(to top, rgba(0, 0, 0, 1), transparent)",
      zIndex: 2,
      pointerEvents: "none",
    }}
  />
</div>

    <div className="race-details" style={{
      width: "calc(100% - 20px)",
      margin: "10px",
      padding: "10px",
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      position: "relative",
      marginBottom: '100px'
    }}>
      
      <div style={{position: 'fixed'}}>
      <BackButton
        label="Назад"
        style={{}}
      />
        
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: '200px'}}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <div style={{ color: "white", fontSize: "26px" }}>{translatedRaceName}</div>
          <div style={{ color: "lightgray", fontSize: "20px" }}>{race.Circuit.circuitName}</div>
        </div>
      </div>

      

      



      <div
  style={{
    position: 'relative',
    display: 'flex',
    marginTop: '10px',
    overflow: 'hidden',
    padding: '2px'
  }}
>
  {tabs.map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        flex: 1,
        padding: '10px 0',
        background: 'transparent',
        color: 'white',
        boxShadow: activeTab === tab
          ? '0 0 0 1px rgba(255,255,255,0.2)'
          : '0 0 0 0 rgba(255,255,255,0)',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: 14,
        textAlign: 'center',
        transition: 'box-shadow 0.3s ease'
      }}
    >
      {labels[tab]}
    </button>
  ))}
</div>

        <div style={{ position: 'relative', height: 'calc(100% - 70px)' }}>
        <div
  {...swipeHandlers}
  style={{ position: 'relative', height: 'calc(100% - 70px)' }}
>
        <TransitionGroup>
          <CSSTransition
            key={activeTab}
            classNames="tab"
            timeout={400}
          >
            <div className="">
            {activeTab === "schedule" && (
            <div>
          {sessions.map((session, index) => (
            <div key={index} style={{
              padding: "15px",
              borderRadius: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px"
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
          padding: "15px",
          borderRadius: "10px",
          color: "white",
          alignItems: 'center',
          justifyItems: 'center'
        }}>
          <img
    src={imageSrc}
    alt="Изображение трассы"
    style={{ 
      width: "100%", 
      height: '100px', 
      objectFit: 'contain',
      display: "block",
      position: "relative",
      zIndex: 1,
    }}
  />
        </div>
      )}

    {activeTab === "results" && (
  <div style={{ display: "flex", flexDirection: "column", gap: '10px', maxHeight: '350px', overflowY: "auto", overflowX: "hidden"  }}>
    {resultsLoading && <p style={{ color: "white" }}> </p>}
    {!resultsLoading && results.map((r, i) => {
  const driverName = driverSurnames[r.Driver.familyName] || r.Driver.familyName;
  const nat = r.Driver.nationality;
  const countryCode = nationalityToFlag[nat] || "un";
  const bg = TEAM_COLORS[r.Constructor.name] || "#888";

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
      className="Frame24 inline-flex items-center justify-between p-2"
      style={{ borderRadius: 10, cursor: 'pointer', border: "1px solid rgba(255, 255, 255, 0.2)", }}
      onClick={() => navigate(`/pilot-details/${slug}`)}
    >
      <div className="inline-flex items-center gap-4">
        <div
          style={{
            width: 30,
            height: 32,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <span style={{ color: bg, fontSize: 15, fontWeight: 500 }}>
            {r.position}
          </span>
        </div>
          <div style={{width: '130px', display: 'flex', alignItems: 'center', gap:'10px' }}>
          <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>
          {driverName}
        </span>
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
      </div>
      <span style={{ color: bg, fontSize: 13, fontWeight: 500, width: '100px', textAlign: 'left' }}>
        {r.Constructor.name}
      </span>
      <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>
        {r.points} Очков
      </span>
    </div>
  );
})}
{!resultsLoading && results.length === 0 && (
  <p style={{
    textAlign: "center",
    marginTop: 20,
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
    </div>
  );
};

export default RaceDetails;
