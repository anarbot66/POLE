import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import championsData from "./champions.json";

const ChampionsList = () => {
  const [champions, setChampions] = useState([]);
  const navigate = useNavigate();

  const nationalityToFlag = {
    "British": "gb",
    "Dutch": "nl",
    "Spanish": "es",
    "Monegasque": "mc",
    "Mexican": "mx",
    "French": "fr",
    "German": "de",
    "Finnish": "fi",
    "Australian": "au",
    "Canadian": "ca",
    "Japanese": "jp",
    "Danish": "dk",
    "Chinese": "cn",
    "Thai": "th",
    "American": "us",
    "Brazilian": "br",
    "Italian": "it",
    "Austrian": "at",
    "Swiss": "ch",
    "New Zealander": "nz",
    "Argentinian": "ar",
    "South African": "za",
  };

  useEffect(() => {
    setChampions(championsData.champions);
  }, []);

  const goBack = () => {
    navigate(-1);
  };

  const teamColors = {
    "Mclaren": "#F48021",
    "Ferrari": "#FF0000",
    "RedBull": "#2546FF",
    "Mercedes": "#00A19C",
    "Aston Martin": "#00594F",
    "Alpine F1 Team": "#0078C1",
    "Haas F1 Team": "#8B8B8B",
    "RB F1 Team": "#1434CB",
    "Williams": "#00A3E0",
    "Sauber": "#00E701",
    "Alfa Romeo": "#A42134",
    "Maserati": "#002C5F",
    "Cooper": "#E9742D",
    "BRM": "white",
    "Lotus": "#008744",
    "Brabham": "#F52122",
    "Matra": "#059BFF",
    "Tyrell": "#014897",
    "Benetton": "#F8DA0E",
    "Renault": "#369FEA",
    "BrawnGP": "#D3FA61",
  };

  if (!champions.length) return <div>Загрузка...</div>;

  return (
    <div>
      <button
        onClick={goBack}
        style={{
          color: "white",
          border: "none",
          padding: "5px 5px",
          borderRadius: "10px",
          cursor: "pointer",
          zIndex: "1000",
          width: 40,
          height: 40,
          position: "fixed",
          top: 0,
          left: 0,
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

      {/* Добавляем отступ сверху в 40px */}
      <div 
        className="fade-in"
        style={{
          width: "calc(100% - 20px)",
          margin: "0 auto",
          marginBottom: "100px",
          height: "100%",
          overflowY: "auto",
          paddingTop: "50px", // 40px + немного дополнительного отступа для комфортного размещения
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          background: "#1D1D1F",
        }}
      >
        {champions.map((champion, index) => {
          const { year, driver, points } = champion;
          const driverFullName = `${driver.firstName} ${driver.lastName}`;
          const countryCode = nationalityToFlag[driver.nationality] || "un";
          const teamColor = teamColors[driver.team] || "#000000";

          return (
            <div
              key={index}
              style={{
                width: "100%",
                background: "#212124",
                borderRadius: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "10px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "65px",
                  height: "65px",
                  borderRadius: "20px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "#212124",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  {year}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "4px",
                  flex: 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ color: "white", fontSize: "12px", fontWeight: "300" }}>
                    {driverFullName}
                  </div>
                  <img
                    src={`https://flagcdn.com/w40/${countryCode}.png`}
                    alt={driver.nationality}
                    style={{ width: "15px", height: "15px", borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
                <div
                  style={{
                    color: teamColor,
                    fontSize: "12px",
                    fontWeight: "300",
                  }}
                >
                  {driver.team}
                </div>
              </div>
              <div style={{ textAlign: "center", minWidth: "60px" }}>
                <span style={{ color: "white", fontSize: "16px" }}>
                  {points}
                </span>
                <br />
                <span style={{ color: "white", fontSize: "10px" }}>
                  PTS
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChampionsList;
