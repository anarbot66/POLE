import React from "react";
import { useConstructorsData } from "./useConstructorsData";
import ConstructorCard from "./ConstructorCard";


const ConstructorsList = ({ }) => {
  const { constructors, drivers, error } = useConstructorsData();

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
        marginBottom: "60px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "15px",
        background: '#141416',
        borderRadius: '15px',
        padding: '15px 0px 15px 0px'
      }}
    >
      
      {constructors.map((constructor, index) => (
        <ConstructorCard
          key={index}
          constructor={constructor}
          drivers={drivers}
        />
      ))}
    </div>
  );
};

export default ConstructorsList;
