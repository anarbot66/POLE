import { useState, useEffect } from "react";

const ConstructorsList = () => {
  const [constructors, setConstructors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);

  // Цвета команд
  const teamColors = {
    "McLaren": "#F48021",
    "Ferrari": "#FF0000",
    "Red Bull": "#001690",
    "Mercedes": "#00A19C",
    "Aston Martin": "#00594F",
    "Alpine F1 Team": "#0078C1",
    "Haas F1 Team": "#8B8B8B",
    "RB F1 Team": "#1434CB",
    "Williams": "#00A3E0",
    "Sauber": "#00E701",
  };

  // Функция для получения данных по конструкторам
  const fetchConstructors = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2024/constructorstandings.json');
      if (!response.ok) {
        throw new Error("Не удалось получить данные о конструкторах");
      }

      const data = await response.json();
      const constructorData = data?.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings;
      
      if (constructorData && Array.isArray(constructorData)) {
        setConstructors(constructorData);
      } else {
        throw new Error("Данные о конструкторах отсутствуют или имеют неверный формат");
      }
    } catch (error) {
      console.error("Ошибка при получении данных о конструкторах:", error);
      setError("Ошибка при получении данных о конструкторах");
    }
  };

  // Функция для получения данных о пилотах
  const fetchDrivers = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2024/driverstandings.json');
      if (!response.ok) {
        throw new Error("Не удалось получить данные о пилотах");
      }

      const data = await response.json();
      const driverData = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
      
      if (driverData && Array.isArray(driverData)) {
        setDrivers(driverData);
      } else {
        throw new Error("Данные о пилотах отсутствуют или имеют неверный формат");
      }
    } catch (error) {
      console.error("Ошибка при получении данных о пилотах:", error);
      setError("Ошибка при получении данных о пилотах");
    }
  };

  useEffect(() => {
    fetchConstructors();
    fetchDrivers();
  }, []);

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  if (!constructors.length || !drivers.length) {
    return <div>Загрузка...</div>;
  }

  return (
    <div style={{
      width: "100vw",
      height: "calc(100vh - 100px)",
      overflowY: "auto",
      padding: "10px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: "15px",
      backgroundColor: "#F9F9F9"
    }}>
      {constructors.map((constructor, index) => {
        const teamColor = teamColors[constructor.Constructor.name] || "#000000";
        
        // Получаем двух пилотов, принадлежащих этому конструктору
        const pilots = drivers.filter(driver => 
          driver.Constructors.some(c => c.name === constructor.Constructor.name)
        ).slice(0, 2); // Только два пилота

        // Объединяем полные имена пилотов через & и делаем их серыми
        const pilotNames = pilots.map((pilot) => 
          `${pilot.Driver.familyName} ${pilot.Driver.givenName}`).join(' & ');

        return (
          <div key={index} style={{
            width: "100%",
            background: "white",
            borderRadius: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "10px",
          }}>
            <div style={{
              width: "65px", height: "65px", borderRadius: "20px",
              display: "flex", justifyContent: "center", alignItems: "center",
              background: "white"
            }}>
              <div style={{
                color: teamColor,
                fontSize: "24px", fontWeight: "600"
              }}>
                {constructor.position}
              </div>
            </div>

            <div style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", flex: 1
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ color: "black", fontSize: "16px" }}>
                  {constructor.Constructor.name}
                </div>
              </div>
              <div style={{
                color: "#B9B9B9", // Серый цвет для имен пилотов
                fontSize: "10px"
              }}>
                {pilotNames} {/* Имена пилотов, разделённые & */}
              </div>
            </div>

            <div style={{ textAlign: "center", minWidth: "60px" }}>
              <span style={{ color: "black", fontSize: "16px" }}>
                {constructor.points}
              </span>
              <br />
              <span style={{ color: "black", fontSize: "10px" }}>
                PTS
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConstructorsList;
