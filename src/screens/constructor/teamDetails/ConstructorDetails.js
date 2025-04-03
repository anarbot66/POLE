// ConstructorDetails.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../../user/components/CustomSelect";
import SocialIcons from "../../../screens/recources/SocialIcons";
import seasonsData from "../../recources/json/seasons";
import StatsCard from "./StatsCard";
import {
  TEAM_SOCIAL,
  CONSTRUCTOR_API_NAMES,
  TEAM_COLORS,
  TEAM_BIOGRAPHIES
} from "../../recources/json/constants";
import { useConstructorStats } from "./useConstructorStats";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

const ConstructorDetails = ({ constructor, goBack, currentUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("biography");
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [seasons, setSeasons] = useState([]);

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

  // Получаем статистику конструктора для выбранного сезона
  const { stats, loading, error } = useConstructorStats(constructor, selectedSeason);

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

  if (!constructor) return <div> </div>;
  if (loading) return <div> </div>;
  if (error) return <div> </div>;

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
        background: "#212124",
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
            backgroundColor: "#212124",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          ✕
        </button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ color: teamColor, fontSize: "16px", fontFamily: "Inter" }}>
            {constructor.Constructor.name}
          </div>
        </div>
        {socialLinks && <SocialIcons social={socialLinks} />}
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
              background: "#1D1D1F",
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
      )}

      {/* Линия в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColor }} />

      {currentUser && currentUser.uid && (
            <button
              onClick={isFavorite ? handleUnfavorite : handleFavorite}
              disabled={favLoading}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "none",
                background: isFavorite ? "#888" : teamColor, // Используем цвет команды
                color: "white",
                cursor: "pointer"
              }}
            >
              {favLoading
                ? "Обработка..."
                : isFavorite
                ? "Удалить из избранного"
                : "Люблю эту команду"}
            </button>
          )}

      {/* Статистика конструктора за выбранный сезон */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "12px",
          width: "100%"
        }}
      >
        <StatsCard label="ПОЗИЦИЯ" value={stats.position} />
        <StatsCard label="ОЧКОВ" value={stats.points} />
        <StatsCard label="ПОБЕД" value={stats.wins} />
        <StatsCard label="ПОДИУМОВ" value={stats.podiums} />
        <StatsCard label="ПОУЛОВ" value={stats.poles} />
      </div>

      <div style={{ width: "100%" }}>
        {/* Переключение вкладок через CustomSelect */}
        <div style={{ width: "100%", marginTop: "20px" }}>
          <CustomSelect
            options={tabOptions}
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            style={{ width: "100%" }}
          />
        </div>

        {/* Контент для выбранной вкладки */}
        {activeTab === "biography" ? (
          <div style={{ borderRadius: "8px", padding: "10px" }}>
            <p style={{ fontSize: 13, marginTop: "10px", color: "white" }}>{biography}</p>
          </div>
        ) : (
          <div style={{ marginTop: "20px", width: "100%" }}>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "2px solid #1D1D1F",
                backgroundColor: "#1D1D1F",
                fontSize: "14px",
                color: "white",
                cursor: "pointer"
              }}
            >
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>

            {/* Повторное отображение статистики для выбранного сезона */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: "12px",
                marginTop: "20px"
              }}
            >
              <StatsCard label="ПОЗИЦИЯ" value={stats.position} />
              <StatsCard label="ОЧКОВ" value={stats.points} />
              <StatsCard label="ПОБЕД" value={stats.wins} />
              <StatsCard label="ПОДИУМОВ" value={stats.podiums} />
              <StatsCard label="ПОУЛОВ" value={stats.poles} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstructorDetails;
