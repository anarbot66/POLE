// ConstructorDetails.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../../user/components/CustomSelect";
import SocialIcons from "../../../screens/recources/SocialIcons";
import seasonsData from "../../recources/json/seasons";
import StatsCard from "./StatsCard";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import {
  TEAM_SOCIAL,
  CONSTRUCTOR_API_NAMES,
  TEAM_COLORS,
  TEAM_BIOGRAPHIES
} from "../../recources/json/constants";
import { useConstructorStats } from "./useConstructorStats";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import FavoriteConstructorButton from "./FavoriteConstructorButton";
import { useSwipeable } from 'react-swipeable';
import SeasonPickerModal from "../../components/SeasonPickerModal";

const ConstructorDetails = ({ constructor, goBack, currentUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("biography");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [seasons, setSeasons] = useState([]);
  const tabs = ['biography','seasons', 'social'];
  const labels = {
    biography: 'Биография',
    seasons:  'Сезоны',
    social:  'Соц.Сети'
  };
  const [pickerOpen, setPickerOpen] = useState(false);
  


  // Состояния для избранного конструктора
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);

  // При монтировании компонента загружаем список сезонов конструктора
  useEffect(() => {
    if (constructor) {
      const formattedConstructorName =
        CONSTRUCTOR_API_NAMES[constructor.Constructor.name] ||
        constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");
      setSeasons(seasonsData[formattedConstructorName] || []);
    }
  }, [constructor]);

  const currentYear = new Date().getFullYear().toString();


  // Для текущего календарного года
    const {
      stats: statsCurrent,
      loading: loadCurrent,
      error: errCurrent
    } = useConstructorStats(constructor, currentYear);

    // Для выбранного пользователем года
    const {
      stats: statsSelected,
      loading: loadSelected,
      error: errSelected
    } = useConstructorStats(constructor, selectedYear);

  // Проверка, добавлен ли данный конструктор в избранное
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !constructor) return;
      try {
        const formattedConstructorName =
          CONSTRUCTOR_API_NAMES[constructor.Constructor.name] ||
          constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");
        const favDocRef = doc(db, "favoritesConstructors", `${currentUser.uid}_${formattedConstructorName}`);
        const favDoc = await getDoc(favDocRef);
        setIsFavorite(favDoc.exists());
      } catch (error) {
        console.error("Ошибка проверки избранного конструктора:", error);
      }
    };
    checkFavoriteStatus();
  }, [currentUser, constructor]);

  // Функция добавления конструктора в избранное
  const handleFavorite = async () => {
    if (!currentUser || !constructor) return;
    try {
      // Проверяем, сколько избранных конструкторов уже есть у пользователя
      const favCollRef = collection(db, "favoritesConstructors");
      const q = query(favCollRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length >= 3) {
        setShowFavoriteAlert(true);
        return;
      }
      setFavLoading(true);
      const formattedConstructorName =
        CONSTRUCTOR_API_NAMES[constructor.Constructor.name] ||
        constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");
      const favDocRef = doc(db, "favoritesConstructors", `${currentUser.uid}_${formattedConstructorName}`);
      await setDoc(favDocRef, {
        userId: currentUser.uid,
        constructorId: formattedConstructorName,
        constructorData: constructor,
        createdAt: new Date()
      });
      setIsFavorite(true);
    } catch (error) {
      console.error("Ошибка при добавлении конструктора в избранное:", error);
    }
    setFavLoading(false);
  };

  // Функция удаления конструктора из избранного
  const handleUnfavorite = async () => {
    if (!currentUser || !constructor) return;
    setFavLoading(true);
    try {
      const formattedConstructorName =
        CONSTRUCTOR_API_NAMES[constructor.Constructor.name] ||
        constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");
      const favDocRef = doc(db, "favoritesConstructors", `${currentUser.uid}_${formattedConstructorName}`);
      await deleteDoc(favDocRef);
      setIsFavorite(false);
    } catch (error) {
      console.error("Ошибка при удалении конструктора из избранного:", error);
    }
    setFavLoading(false);
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

  if (!constructor) return <div> </div>;

  const socialLinks = TEAM_SOCIAL[constructor.Constructor.name];
  const teamColor = TEAM_COLORS[constructor.Constructor.name] || "#000000";
  const biography = TEAM_BIOGRAPHIES[constructor.Constructor.name] || "Биография команды не найдена.";

  const tabOptions = [
    { value: "biography", label: "Биография" },
    { value: "seasons", label: "Сезоны" }
  ];

  

  return (
    <div
      style={{
        width: "calc(100% - 20px)",
        margin: "10px 10px 100px",
        padding: "15px",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "19px",
        marginTop: "10px"
      }}
    >
      {/* Верхняя строка: кнопка назад, название команды и соцсети */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={goBack}
          style={{
            color: "white",
            border: "none",
            padding: "5px",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          ✕
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: teamColor, fontSize: "16px", fontFamily: "Inter" }}>
            {constructor.Constructor.name}
          </div>
        
        </div>
        
        <FavoriteConstructorButton
          currentUser={currentUser}
          constructor={constructor}
        />
        
      </div>
    
          
      {/* Уведомление о лимите избранного */}
      {showFavoriteAlert && (
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
          onClick={() => setShowFavoriteAlert(false)}
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
            <p style={{ marginBottom: "20px" }}>У вас уже выбрано 3 любимых конструктора</p>
            <button
              onClick={() => setShowFavoriteAlert(false)}
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
      )}
      {/* Статистика конструктора за текущий сезон */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "12px",
          width: "100%"
        }}
      >
        <StatsCard label="ПОЗИЦИЯ" value={statsCurrent.position} />
        <StatsCard label="ОЧКОВ" value={statsCurrent.points} />
        <StatsCard label="ПОБЕД" value={statsCurrent.wins} />
        <StatsCard label="ПОДИУМОВ" value={statsCurrent.podiums} />
        <StatsCard label="ПОУЛОВ" value={statsCurrent.poles} />
      </div>
      

      <div style={{ width: "100%" }}>
        {/* Переключение вкладок через CustomSelect */}
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
        {activeTab === "biography" && (
          <div style={{ borderRadius: "8px", padding: "10px" }}>
            <p style={{ fontSize: 13, marginTop: "10px", color: "white" }}>{biography}</p>
          </div>
        )}
        {activeTab === "seasons" && (
          <div style={{ marginTop: "20px", width: "100%" }}>

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

            {/* Статистика за выбранный через SeasonPickerModal (не связанно с текущим годом) */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: "12px",
                marginTop: "20px"
              }}
            >
              <StatsCard label="ПОЗИЦИЯ" value={statsSelected.position} />
              <StatsCard label="ОЧКОВ" value={statsSelected.points} />
              <StatsCard label="ПОБЕД" value={statsSelected.wins} />
              <StatsCard label="ПОДИУМОВ" value={statsSelected.podiums} />
              <StatsCard label="ПОУЛОВ" value={statsSelected.poles} />
            </div>
          </div>
        )}
        {activeTab === "social" && (
          <div style={{marginTop: '30px'}}>
            {socialLinks && <SocialIcons social={socialLinks} />}
          </div>
        )}</div>
        </CSSTransition>
          </TransitionGroup>
      </div>

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
      
    </div>
  );
};

export default ConstructorDetails;
