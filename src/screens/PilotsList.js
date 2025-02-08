import { useState, useEffect } from "react";

const PilotsList = () => {
  const [pilots, setPilots] = useState([]);
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

  const fetchPilots = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2024/driverStandings.json');
      if (!response.ok) {
        throw new Error("Не удалось получить данные о пилотах");
      }

      const data = await response.json();
      
      const drivers = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
      
      if (drivers && Array.isArray(drivers)) {
        setPilots(drivers);
      } else {
        throw new Error("Данные о пилотах отсутствуют или имеют неверный формат");
      }
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      setError("Ошибка при получении данных");
    }
  };

  useEffect(() => {
    fetchPilots();
  }, []);

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  if (!pilots.length) {
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
      {pilots.map((pilot, index) => {
        const teamColor = teamColors[pilot.Constructors[0].name] || "#000000";

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
                {pilot.position}
              </div>
            </div>

            <div style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", flex: 1
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ color: "black", fontSize: "16px" }}>
                  {pilot.Driver.familyName} {pilot.Driver.givenName[0]}.
                </div>
              </div>
              <div style={{
                color: teamColor,
                fontSize: "12px"
              }}>
                {pilot.Constructors[0].name}
              </div>
            </div>

            <div style={{ textAlign: "center", minWidth: "60px" }}>
              <span style={{ color: "black", fontSize: "16px" }}>
                {pilot.points}
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

export default PilotsList;
