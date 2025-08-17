// PilotDetails.js
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import BiographyTab from "./BiographyTab";
import FavoriteButton from "./FavoriteButton";
import { usePilotData } from "./usePilotData";
import { usePilotStats } from "./usePilotStats";
import { CONSTRUCTOR_API_NAMES, TEAM_COLORS } from "../../recources/json/constants";
import SeasonPickerModal from "../../components/SeasonPickerModal";
import { useSwipeable } from 'react-swipeable';
import Hint from "../../user/services/Hint";
import BackButton from "../../components/BackButton";
import { countryToFlag } from "./constants";
import { raceNameTranslations } from "./constants";
import { normalizeName } from "./constants";

const convertToMoscowTime = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return "—";
  const date = new Date(`${utcDate}T${utcTime}`);
  // Прибавляем 3 часа для московского времени (UTC+3)
  date.setHours(date.getHours());
  return date.toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });
};

const driverRating = {
  "verstappen": "92",
  "norris": "95",
  "leclerc": "90",
  "piastri": "98",
  "sainz": "80",
  "russell": "91",
  "hamilton": "85",
  "pérez": "N/A",
  "alonso": "80",
  "gasly": "79",
  "hulkenberg": "83",
  "tsunoda": "79",
  "stroll": "73",
  "ocon": "81",
  "magnussen": "N/A",
  "albon": "88",
  "ricciardo": "N/A",
  "bearman": "79",
  "colapinto": "70",
  "zhou": "N/A",
  "lawson": "78",
  "bottas": "N/A",
  "sargeant": "N/A",
  "doohan": "N/A",
  "antonelli": "85",
  "bortoleto": "75",
  "hadjar": "82"
};



const PilotDetails = ({ currentUser }) => {
  const { lastName } = useParams();
  const navigate = useNavigate();
  const { pilot, childhood, waytoformula, career, seasons, firstRace, lastRaceData, loading } = usePilotData(lastName);
  const [activeTab, setActiveTab] = useState("biography");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [imageSrc, setImageSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const rating = driverRating[lastName] || "N/A";
  const tabs = ['biography','seasons','results', 'achievements'];
  const labels = {
    biography: 'Биография',
    seasons:  'Сезоны',
    results:  'Результаты'
  };
  const [driverResults, setDriverResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [tipOpen, setTipOpen] = useState(false);

  const showTip = () => setTipOpen(true);

  const goToConstructor = useCallback(() => {
    const constructorName = pilot?.Constructors?.[0]?.name;
    const apiName = CONSTRUCTOR_API_NAMES?.[constructorName];

    if (apiName) {
      navigate(`/constructor-details/${apiName}`);
    } else {
      console.warn("Constructor id not found for", constructorName);
    }
  }, [pilot, navigate]);

  
  
  // Для сезонной статистики
  const { seasonStats, loadingStats } = usePilotStats(pilot, selectedYear);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const bioRef = useRef(null);
  const seasonsRef = useRef(null);
  const resultsRef = useRef(null);

  useLayoutEffect(() => {
    const updateUnderline = () => {
      let ref;
      if (activeTab === "biography") ref = bioRef;
      if (activeTab === "seasons") ref = seasonsRef;
      if (activeTab === "results") ref = resultsRef;
  
      if (ref?.current) {
        const { offsetLeft, offsetWidth } = ref.current;
        setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
      }
    };
  
    requestAnimationFrame(updateUnderline); // ждем, пока браузер нарисует DOM
    window.addEventListener("resize", updateUnderline);
    return () => window.removeEventListener("resize", updateUnderline);
  }, [activeTab, bioRef.current, seasonsRef.current, resultsRef.current]);
  

  
  useEffect(() => {
    if (seasons.length > 0) {
      setSelectedYear(seasons[0]);
    }
  }, [seasons]);

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

  useEffect(() => {
    if (activeTab !== "results" || !pilot) return;
  
    const fetchDriverResults = async () => {
  
      setResultsLoading(true);
      try {
        const driverId = normalizeName(pilot.Driver.familyName.toLowerCase());
        const url = `https://api.jolpi.ca/ergast/f1/2025/drivers/${driverId}/results.json?limit=1000`;
  
        const res = await fetch(url);
  
        if (!res.ok) {
          throw new Error(`Network response was not ok: ${res.status}`);
        }
  
        const json = await res.json();
  
        const races = json?.MRData?.RaceTable?.Races;
  
        setDriverResults(races || []);
      } catch (err) {
        console.error("Ошибка загрузки результатов пилота:", err);
        setDriverResults([]);
      } finally {
        setResultsLoading(false);
        console.groupEnd();
      }
    };
  
    fetchDriverResults();
  }, [activeTab, pilot]);

  const handleRaceSelect = (race) => {
    navigate(`/races/${race.round}`, { state: { race } });
  };
  
  
  
  
  if (loading || !pilot || imgLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span> </span>
      </div>
    );
  }
  

  

  return (
    <div
      style={{
        height: "100%",
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
        gap: "19px", position: 'fixed', width: '100%', background: 'rgb(17, 17, 19)', left: '0', top: '0', padding: '20px 20px 0px 20px'}}>
      <div style={{display: 'flex', width: "100%"}}>
      <BackButton
        label="Назад"
        style={{width: '100%'}}
      />
      <FavoriteButton 
      currentUser={currentUser} 
      pilot={pilot} 
      teamColor={TEAM_COLORS[pilot.Constructors[0].name] || "#000000"} 
    />
      </div>

      <div style={{ display: "flex"}}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: '10px' }}>
          <div style={{display: 'flex', gap: '10px'}}>
          <div style={{ display: "flex", flexDirection: "column", gap: '5px' }}>
          <div style={{ color: "white", fontSize: "20px", fontFamily: "Inter" }}>
            {pilot.Driver.translatedName}
          </div>
          <div onClick={goToConstructor} style={{
          padding: '5px 15px',
          background: 'rgb(25, 25, 25, 0.7)',
          borderRadius: '30px',
          display: "inline-flex",     
          alignSelf: "flex-start",    
          whiteSpace: "nowrap"  
        }}>
          <span style={{ color: TEAM_COLORS[pilot.Constructors[0].name] || "#000000", fontSize: "14px", fontFamily: "Inter" }}>
            {pilot.Constructors[0].name}
          </span>
          </div>
          </div>
          </div>
          
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <span style={{ color: "white", fontSize: "30px", }}>
          {rating}
          </span>
          <span style={{ color: "white", fontSize: "10px", textAlign: 'center' }}>
          Рейтинг
          </span>
          </div>
          
      </div>
        



      {/* Статистика пилота за текущий сезон (локальные данные) */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: "12px", width: "100%" }}>
        {/* Здесь можно вынести отдельный компонент для статистики, аналогично StatsCard */}
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
            {pilot.extraStats.wins || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {pilot.extraStats.podiums || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {pilot.extraStats.poles || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
        </div>
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
            {pilot.extraStats.dnf || 0}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", borderRadius: "20px", gap: "19px" }}>
      <button
        ref={bioRef}
        onClick={() => setActiveTab("biography")}
        style={{
          padding: "10px 5px",
          color: activeTab === "biography" ? "white" : "var(--col-darkGray)",
          background: activeTab === "biography" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Биография
      </button>

      <button
        ref={seasonsRef}
        onClick={() => setActiveTab("seasons")}
        style={{
          padding: "10px 5px",
          color: activeTab === "seasons" ? "white" : "var(--col-darkGray)",
          background: activeTab === "seasons" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Сезоны
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

<TransitionGroup>
          <CSSTransition
            key={activeTab}
            classNames="tab"
            timeout={400}
          >
            <div style={{marginTop: '240px'}} {...swipeHandlers} className="">
            {activeTab === "biography" && (
  <div style={{padding: '15px'}}>
    <BiographyTab
    childhood={childhood}
    waytoformula={waytoformula}
    career={career}
  />
  </div>
)}

      
      {activeTab === "seasons" && (
  <div
  style={{
    height: "300px",     
    overflowY: "auto",    
  }}
>
    <button
      onClick={() => setPickerOpen(true)}
      style={{
        width: "100%",
        padding: "15px 20px",
        background: "transparent",
        color: "#fff",
        fontSize: "13px",
        fontFamily: "Inter",
        fontWeight: 500,
        cursor: "pointer",
        borderBottom: "1px solid #242424",
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}
    >
      <span
  style={{
        color: TEAM_COLORS[seasonStats.constructor] || "#000000",
        whiteSpace: "nowrap",
      }}
    >
      {seasonStats.constructor}
    </span>

      <span style={{width: '100%', textAlign: 'left'}}>{selectedYear || "Выберите сезон"}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.24738 11.1399L2.45115 5.6585C1.88539 5.01192 2.34457 4 3.20373 4H12.7962C13.6554 4 14.1145 5.01192 13.5488 5.6585L8.75254 11.1399C8.35413 11.5952 7.6458 11.5952 7.24738 11.1399Z" fill="white"/>
</svg>

    </button>

    <CSSTransition
  in={pickerOpen}
  timeout={300}
  classNames="window-fade"
  unmountOnExit
  mountOnEnter
  appear
>
  <SeasonPickerModal
    seasons={seasons}
    isOpen={pickerOpen}
    onClose={() => setPickerOpen(false)}
    onSelect={(year) => setSelectedYear(year)}
    type={"driver"}
  />
</CSSTransition>



<CSSTransition
      in={!loadingStats}         
      timeout={300}
      classNames="window-fade"
      mountOnEnter                
      unmountOnExit              
      appear                     
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "12px",
          padding: '15px',
          background: '#141416',
          borderRadius: '15px',
          margin: '10px'
        }}
      >
        {/* ПОЗИЦИЯ */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            {seasonStats.position}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
        </div>

        {/* ОЧКОВ */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            {seasonStats.points}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
        </div>

        {/* ПОБЕД */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            {seasonStats.wins}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
        </div>

        {/* ПОДИУМОВ */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            {seasonStats.podiums}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
        </div>

        {/* ПОУЛОВ */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            {seasonStats.poles}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
        </div>

        {/* DNF */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
            {seasonStats.dnf}
          </span>
          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
        </div>
      </div>
    
    </CSSTransition>
  </div>
)}
{activeTab === "results" && (
  <div style={{
    padding: '15px',
  }}>
    <div style={{borderRadius: '15px', background: '#141416', display: 'flex', gap: '10px', flexDirection: 'column', overflowY: 'auto', padding: '10px'}}>
    {resultsLoading && <p style={{ color: "white" }}> </p>}
    {!resultsLoading && driverResults.map((race, idx) => {
      // извлечём данные
      const { raceName, date, Circuit, Results } = race;
      const result = Results[0]; // всегда один элемент для конкретного пилота
      const pos = result.position;
      const pts = result.points;
      // код трассы для флага
      const countryCode = countryToFlag[Circuit.Location.country] || "un";
      const translatedRaceName = raceNameTranslations[race?.raceName] || race?.raceName;

      return (
        <div
          key={idx}
          className="Frame24 inline-flex items-center justify-between p-2"
          style={{
            borderRadius: 10,
            cursor: "pointer",
          }}
          onClick={() => handleRaceSelect(race)}
        >
          <div className="inline-flex items-center gap-4">
            <div style={{
              width: 30,
              height: 32,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                P{pos}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>
                {translatedRaceName}
              </span>
              <img
                src={`https://flagcdn.com/w20/${countryCode}.png`}
                alt={Circuit.Location.country}
                style={{
                  width: "15px",
                  height: "15px",
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
              />
            </div>
          </div>
          <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>
            +{pts} очк.
          </span>
        </div>
      );
    })}
    {!resultsLoading && driverResults.length === 0 && (
      <p style={{ color: "lightgray", textAlign: "center" }}>
        Нет данных по выбранному сезону
      </p>
    )}
      </div>
  </div>
)}

{activeTab === "achievements" && (
  <div style={{
    padding: '15px',
  }}>
    <p style={{
    textAlign: "center",
    marginTop: 20,
    lineHeight: "1.4em",
    display: 'flex',
    gap: '0px',
    flexDirection: 'column'
  }}>
    <span style={{ color: "white", fontSize: 15}}>
      Этот раздел еще в разработке
    </span>
    <br/>
    <span style={{ color: "lightgray", fontSize: 11}}>
      Следите за обновлениями в Telegram канале проекта
    </span>
  </p>
  </div>
)}

</div>
      </CSSTransition>
        </TransitionGroup>


  
      <CSSTransition
        in={false}  // Здесь логика показа уже вынесена в FavoriteButton
        timeout={300}
        classNames="window-fade"
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
              padding: "20px",
              borderRadius: "20px",
              textAlign: "center",
              color: "white",
              maxWidth: "300px"
            }}
          >
            <p style={{ marginBottom: "20px" }}>Уведомление</p>
            <button
              onClick={() => {}}
              style={{
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
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
      <style>
        {`
          .window-fade-enter {
            opacity: 0;
          }
          .window-fade-enter-active {
            opacity: 1;
            transition: opacity 300ms;
          }
          .window-fade-exit {
            opacity: 1;
          }
          .window-fade-exit-active {
            opacity: 0;
            transition: opacity 300ms;
          }
        `}
      </style>
    </div>
  );
};

export default PilotDetails;
