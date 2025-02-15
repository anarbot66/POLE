import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

const Standings = ({ setSelectedPilot, setSelectedConstructor }) => {
  const [activeTab, setActiveTab] = useState("pilots"); // Вкладки: "pilots" или "constructors"
  const [pilots, setPilots] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const formattedDate = getFormattedDate();

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

  useEffect(() => {
    const fetchPilots = async () => {
      try {
        const response = await fetch("https://api.jolpi.ca/ergast/f1/2024/driverstandings.json");
        if (!response.ok) throw new Error("Ошибка загрузки пилотов");
        const data = await response.json();
        const drivers = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
        if (drivers && Array.isArray(drivers)) {
          setPilots(drivers);
        } else {
          throw new Error("Данные о пилотах отсутствуют");
        }
      } catch (error) {
        console.error(error);
        setError("Ошибка при загрузке пилотов");
      }
    };

    const fetchConstructors = async () => {
      try {
        const response = await fetch("https://api.jolpi.ca/ergast/f1/2024/constructorstandings.json");
        if (!response.ok) throw new Error("Ошибка загрузки конструкторов");
        const data = await response.json();
        const constructorData = data?.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings;
        if (constructorData && Array.isArray(constructorData)) {
          setConstructors(constructorData);
        } else {
          throw new Error("Данные о конструкторах отсутствуют");
        }
      } catch (error) {
        console.error(error);
        setError("Ошибка при загрузке конструкторов");
      }
    };

    fetchPilots();
    fetchConstructors();
  }, []);

  const handlePilotSelect = (pilot) => {
    setSelectedPilot(pilot); // Передаем весь объект пилота
    navigate("/pilot-details");
  };

  const handleConstructorSelect = (constructor) => {
    setSelectedConstructor(constructor); // Передаем весь объект конструктора
    navigate("/constructor-details");
  };

  if (error) return <div>Ошибка: {error}</div>;
  if (!pilots.length || !constructors.length) return <div>Загрузка...</div>;

  return (
    <div style={{
      width: "calc(100% - 20px)",
      margin: "0 auto",
      marginBottom: "100px",
      height: "100%",
      overflowY: "auto",
      paddingTop: "10px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: "15px",
      backgroundColor: "#F9F9F9"
    }}>
      <div>
        <button onClick={() => setActiveTab("pilots")}
          style={activeTab === "pilots" ? { backgroundColor: "blue", color: "white" } : {}}>
          Пилоты
        </button>
        <button onClick={() => setActiveTab("constructors")}
          style={activeTab === "constructors" ? { backgroundColor: "blue", color: "white" } : {}}>
          Конструкторы
        </button>
      </div>

      {activeTab === "pilots" && (
        <>
          <h2>Таблица пилотов</h2>
          <h3>{formattedDate}</h3>
          {pilots.map((pilot, index) => {
            const teamColor = teamColors[pilot.Constructors[0]?.name] || "#000000";

            return (
              <div key={index} onClick={() => handlePilotSelect(pilot)}
                style={{
                  width: "100%",
                  background: "white",
                  borderRadius: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px",
                  cursor: "pointer"
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

                <div style={{ flex: 1 }}>
                  <strong>{pilot.Driver.givenName} {pilot.Driver.familyName}</strong>
                  <div style={{ color: teamColor }}>{pilot.Constructors[0]?.name}</div>
                </div>

                <div style={{ textAlign: "center", minWidth: "60px" }}>
                  <span>{pilot.points} PTS</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {activeTab === "constructors" && (
        <>
          <h2>Таблица конструкторов</h2>
          <h3>{formattedDate}</h3>
          {constructors.map((constructor, index) => {
            const teamColor = teamColors[constructor.Constructor.name] || "#000000";

            return (
              <div key={index} onClick={() => handleConstructorSelect(constructor)}
                style={{
                  width: "100%",
                  background: "white",
                  borderRadius: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px",
                  cursor: "pointer"
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

                <div style={{ flex: 1 }}>
                  <strong>{constructor.Constructor.name}</strong>
                </div>

                <div style={{ textAlign: "center", minWidth: "60px" }}>
                  <span>{constructor.points} PTS</span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default Standings;
