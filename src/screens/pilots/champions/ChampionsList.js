// ChampionsList.js
import React from "react";
import { useChampionsData } from "./useChampionsData";
import ChampionsCard from "./ChampionsCard";
import { useNavigate } from "react-router-dom";

const ChampionsList = ({ onChampionSelect }) => {
  const { champions, loading, error } = useChampionsData();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  // Утилита для форматирования текущей даты
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

  if (loading) return <div> </div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      {/* Фиксированная панель с кнопкой назад */}
      <div style={{ width: "100%", position: "fixed", display: "flex", height: 54 }}>
        <button
          onClick={goBack}
          style={{
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000",
            width: 40,
            height: 40,
            position: "fixed",
            top: 0,
            left: 0
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M30 20C30 20.6904 29.4404 21.25 28.75 21.25H14.2678L19.6339 26.6161C20.122 27.1043 20.122 27.8957 19.6339 28.3839C19.1457 28.872 18.3543 28.872 17.8661 28.3839L10.3661 20.8839C9.87796 20.3957 9.87796 19.6043 10.3661 19.1161L17.8661 11.6161C18.3543 11.128 19.1457 11.128 19.6339 11.6161C20.122 12.1043 20.122 12.8957 19.6339 13.3839L14.2678 18.75H28.75C29.4404 18.75 30 19.3096 30 20Z"
              fill="white"
            />
          </svg>
        </button>
      </div>

      <div
        style={{
          width: "calc(100% - 30px)",
          margin: "0 auto",
          height: "100%",
          marginBottom: "100px",
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          background: "#1D1D1F",
          marginTop: "40px"
        }}
      >
        {champions.map((champion, index) => (
          <ChampionsCard
            key={index}
            champion={champion}
            onClick={onChampionSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ChampionsList;
