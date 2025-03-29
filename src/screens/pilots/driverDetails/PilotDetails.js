// PilotDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import CustomSelect from "../../user/components/CustomSelect";
import { db } from "../../../firebase";
import BiographyTab from "./BiographyTab";
import FavoriteButton from "./FavoriteButton";
import { usePilotData } from "./usePilotData";
import { usePilotStats } from "./usePilotStats";
import allTimeStats from "../../recources/json/allTimeStats.json";
import { teamColors } from "./constants";

const tabOptions = [
  { value: "biography", label: "Биография" },
  { value: "seasons", label: "Сезоны" },
  { value: "allTime", label: "За всё время" }
];

const PilotDetails = ({ currentUser }) => {
  const { lastName } = useParams();
  const navigate = useNavigate();
  const { pilot, biography, seasons, loading, error } = usePilotData(lastName);
  const [activeTab, setActiveTab] = useState("biography");
  const [selectedYear, setSelectedYear] = useState("");
  
  // Для сезонной статистики
  const { seasonStats, loadingStats } = usePilotStats(pilot, selectedYear);
  
  useEffect(() => {
    if (seasons.length > 0) {
      setSelectedYear(seasons[0]);
    }
  }, [seasons]);
  
  if (loading || !pilot) return <div> </div>;
  if (error) return <div>{error}</div>;
  
  
  const goBack = () => {
    navigate(-1);
  };

  // Пример отображения даты (можно вынести в отдельную утилиту)
  const getFormattedDate = () => {
    const now = new Date();
    const day = now.getDate();
    const monthNames = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    return `${day} ${month} ${year}`;
  };
  const formattedDate = getFormattedDate();
  
  // Данные для вкладки "За всё время"
  const normalizedPilotName = lastName; // Если ключи в allTimeStats совпадают с lastName
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
      {/* Заголовок и кнопка "Назад" */}
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <button
          onClick={goBack}
          style={{
            backgroundColor: "#212124",
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ color: "white", fontSize: "16px", fontFamily: "Inter" }}>
            {pilot.Driver.translatedName}
          </div>
          <div style={{ color: teamColors[pilot.Constructors[0].name] || "#000000", fontSize: "12px", fontFamily: "Inter" }}>
            {pilot.Constructors[0].name}
          </div>
        </div>
        {/* Кнопка для избранного */}
        
      </div>

      {/* Линия в цвет команды */}
      <div style={{ width: "100%", height: "5px", background: teamColors[pilot.Constructors[0].name] || "#000000" }} />
      <FavoriteButton 
      currentUser={currentUser} 
      pilot={pilot} 
      teamColor={teamColors[pilot.Constructors[0].name] || "#000000"} 
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

      {/* Переключение вкладок */}
      <div style={{ width: "100%", marginTop: "20px" }}>
        <CustomSelect
          options={tabOptions}
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
          style={{ width: "100%" }}
        />
      </div>

      {/* Контент вкладок */}
      {activeTab === "biography" && <BiographyTab biography={biography} />}
      
      {activeTab === "seasons" && (
        <>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
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
            {seasons.map((year, index) => (
              <option key={index} value={year}>
                {year}
              </option>
            ))}
          </select>
          {loadingStats ? (
            <div> </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: "12px", marginTop: "10px" }}>
              {/* Здесь также можно вынести компонент для отображения отдельного показателя */}
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedYear === "2024" ? pilot.position : seasonStats.position}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {selectedYear === "2024" ? pilot.points : seasonStats.points}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {seasonStats.wins}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {seasonStats.podiums || 0}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {seasonStats.poles || 0}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
              </div>
              <div style={{ width: "65px", textAlign: "center" }}>
                <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>
                  {seasonStats.dnf || 0}
                </span>
                <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
              </div>
            </div>
          )}
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
            padding: "10px"
          }}
        >
          {allTimeData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>WDC (Чемпионства): {allTimeData.personalChampionships}</div>
              <div>WCC (Кубки конструкторов): {allTimeData.constructorsChampionships}</div>
              <div>Гонок: {allTimeData.races}</div>
              <div>Подиумов: {allTimeData.podiums}</div>
              <div>Побед: {allTimeData.wins}</div>
              <div>Поулов: {allTimeData.poles}</div>
              <div>Очков: {allTimeData.points}</div>
              <div>Гранд-слемов: {allTimeData.grandSlams}</div>
            </div>
          ) : (
            <div>Статистика не найдена</div>
          )}
        </div>
      )}

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
              background: "#1D1D1F",
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
