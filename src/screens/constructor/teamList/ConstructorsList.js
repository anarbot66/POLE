import React from "react";
import { useConstructorsData } from "./useConstructorsData";
import ConstructorCard from "./ConstructorCard";

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

const ConstructorsList = ({ onConstructorSelect }) => {
  const { constructors, drivers, error } = useConstructorsData();
  const formattedDate = getFormattedDate();

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  // Пока данные не загружены – можно вернуть индикатор загрузки или null
  if (!constructors.length || !drivers.length) {
    return null;
  }

  return (
    <div
      style={{
        width: "calc(100% - 30px)",
        margin: "0 auto",
        height: "100%",
        marginBottom: "100px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "15px",
        paddingTop: "20px"
      }}
    >
      
      {constructors.map((constructor, index) => (
        <ConstructorCard
          key={index}
          constructor={constructor}
          drivers={drivers}
          onClick={onConstructorSelect}
        />
      ))}
    </div>
  );
};

export default ConstructorsList;
