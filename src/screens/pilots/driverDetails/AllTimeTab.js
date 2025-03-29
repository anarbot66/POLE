import React from "react";

const AllTimeTab = ({ allTimeData }) => {
  return (
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
  );
};

export default AllTimeTab;
