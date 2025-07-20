// PilotDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import BiographyTab from "./BiographyTab";
import FavoriteButton from "./FavoriteButton";
import { usePilotData } from "./usePilotData";
import { usePilotStats } from "./usePilotStats";
import { teamColors } from "./constants";
import SeasonPickerModal from "../../components/SeasonPickerModal";
import { useSwipeable } from 'react-swipeable';
import Hint from "../../user/services/Hint";

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
  const { pilot, biography, seasons, loading } = usePilotData(lastName);
  const [activeTab, setActiveTab] = useState("biography");
  const [selectedYear, setSelectedYear] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const rating = driverRating[lastName] || "N/A";
  const tabs = ['biography','seasons'];
  const labels = {
    biography: 'Биография',
    seasons:  'Сезоны'
  };

  const [tipOpen, setTipOpen] = useState(false);

  const showTip = () => setTipOpen(true);
  
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
  
  if (loading || !pilot || imgLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span> </span>
      </div>
    );
  }
  
  const goBack = () => {
    navigate(-1);
  };

  

  return (
    <div
      style={{
        width: "calc(100% - 20px)",
        margin: "10px",
        padding: "10px",
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
    src={imageSrc}
    alt=" "
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
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <button
          onClick={goBack}
          style={{
            color: "white",
            border: "none",
            padding: "5px",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000"
          }}
        >
          ✕
        </button>
        
      </div>

      <div style={{ display: "flex", marginTop: '230px'}}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: '10px' }}>
          <div>
          <div style={{ color: "white", fontSize: "26px", fontFamily: "Inter" }}>
            {pilot.Driver.translatedName}
          </div>
          <div style={{ color: teamColors[pilot.Constructors[0].name] || "#000000", fontSize: "20px", fontFamily: "Inter" }}>
            {pilot.Constructors[0].name}
          </div>
          </div>
          <FavoriteButton 
      currentUser={currentUser} 
      pilot={pilot} 
      teamColor={teamColors[pilot.Constructors[0].name] || "#000000"} 
    />
        </div>
        <div onClick={showTip} style={{display: 'flex', flexDirection: 'column'}}>
          <span style={{ color: "white", fontSize: "50px", height: '63px', marginTop: -10 }}>
          {rating}
          </span>
          <span style={{ color: "white", fontSize: "10px", textAlign: 'center' }}>
          Рейтинг
          </span>
          </div>
          
      </div>

      <Hint
        isOpen={tipOpen}
        message="Рейтинг пилота от Apex"
        onClose={() => setTipOpen(false)}
        duration={3000} // 10 секунд
      />
        



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

<TransitionGroup>
          <CSSTransition
            key={activeTab}
            classNames="tab"
            timeout={400}
          >
            <div {...swipeHandlers} className="">
      {activeTab === "biography" && <BiographyTab biography={biography} />}
      
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
        padding: "10px 15px",
        borderRadius: "10px",
        border: "1px solid #505050",
        background: "transparent",
        color: "#fff",
        fontSize: "13px",
        fontFamily: "Inter",
        fontWeight: 500,
        letterSpacing: "0.65px",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      {selectedYear || "Выберите сезон"}
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
  />
</CSSTransition>



<CSSTransition
      in={!loadingStats}         // показываться, когда данные загрузились
      timeout={300}
      classNames="window-fade"
      mountOnEnter                // не рендерить до начала анимации
      unmountOnExit               // удалять после скрытия
      appear                      // анимировать при первом появлении
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "12px",
          marginTop: "10px"
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
</div>
      </CSSTransition>
        </TransitionGroup>


  
      {/* Плавное появление уведомления реализовано через CSSTransition */}
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
