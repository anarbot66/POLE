// PilotsList.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Маппинги и утилиты
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
  "Russian": "ru"
};

const driverTranslations = {
  "Verstappen": "Макс Ферстаппен",
  "Norris": "Ландо Норрис",
  "Leclerc": "Шарль Леклер",
  "Piastri": "Оскар Пиастри",
  "Sainz": "Карлос Сайнс",
  "Russell": "Джордж Расселл",
  "Hamilton": "Льюис Хэмилтон",
  "Pérez": "Серхио Перес",
  "Alonso": "Фернандо Алонсо",
  "Gasly": "Пьер Гасли",
  "Hulkenberg": "Нико Хюлькенберг",
  "Tsunoda": "Юки Цунода",
  "Stroll": "Лэнс Стролл",
  "Ocon": "Эстебан Окон",
  "Magnussen": "Кевин Магнуссен",
  "Albon": "Александер Албон",
  "Ricciardo": "Даниэль Риккьярдо",
  "Bearman": "Оливер Бирман",
  "Colapinto": "Франко Колапинто",
  "Zhou": "Гуанью Джоу",
  "Lawson": "Лиам Лоусон",
  "Bottas": "Валттери Боттас",
  "Sargeant": "Логан Сарджент",
  "Doohan": "Джек Дуэн",
  "Antonelli": "Кими Антонелли",
  "Bortoleto": "Габриэль Бортолето",
  "Hadjar": "Исак Хаджар"
};

const teamColors = {
  "McLaren": "#F48021",
  "Ferrari": "#FF0000",
  "Red Bull": "#2546FF",
  "Mercedes": "#00A19C",
  "Aston Martin": "#00594F",
  "Alpine F1 Team": "#F60195",
  "Haas F1 Team": "#8B8B8B",
  "RB F1 Team": "#1434CB",
  "Williams": "#00A3E0",
  "Sauber": "#00E701"
};

const normalizeName = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Компонент
const PilotsList = () => {
  const [pilots, setPilots] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchPilots = async () => {
    try {
      const res = await fetch(
        "https://ergast.com/api/f1/2025/driverStandings.json"
      );
      if (!res.ok) throw new Error("Network response was not ok");
      const json = await res.json();

      const standings =
        json.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];

      const pilotsFromApi = standings.map((item) => {
        const fullName = `${item.Driver.givenName} ${item.Driver.familyName}`;
        const translatedName =
          driverTranslations[item.Driver.familyName] || fullName;
        const constructorName =
          item.Constructors[0]?.name || "Unknown";

        return {
          Driver: {
            givenName: item.Driver.givenName,
            familyName: item.Driver.familyName,
            translatedName,
            nationality: item.Driver.nationality
          },
          Constructors: [{ name: constructorName }],
          position: Number(item.position),
          points: Number(item.points),
          extraStats: {
            wins: item.wins
          }
        };
      });

      pilotsFromApi.sort((a, b) => a.position - b.position);
      setPilots(pilotsFromApi);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить данные о пилотах");
    }
  };

  useEffect(() => {
    fetchPilots();
  }, []);

  const handlePilotSelect = (pilot) => {
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${pilotLastName}`);
  };

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }
  if (!pilots.length) {
    return <div> </div>;
  }

  return (
    <div
      style={{
        width: "calc(100% - 30px)",
        margin: "0 auto",
        marginBottom: "100px",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        background: "#1D1D1F",
        paddingTop: "20px"
      }}
    >
      {pilots.map((pilot, idx) => {
        const constructorName = pilot.Constructors[0].name;
        const teamColor = teamColors[constructorName] || "#000";
        const nameDisplay = pilot.Driver.translatedName;
        const countryCode =
          nationalityToFlag[pilot.Driver.nationality] || "un";

        return (
          <div
            key={idx}
            onClick={() => handlePilotSelect(pilot)}
            style={{
              width: "100%",
              borderRadius: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              cursor: "pointer"
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
              }}
            >
              <div
                style={{
                  color: teamColor,
                  fontSize: "24px",
                  fontWeight: 600
                }}
              >
                {pilot.position}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
                flex: 1
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <div style={{ color: "white", fontSize: "14px" }}>
                  {nameDisplay}
                </div>
                <img
                  src={`https://flagcdn.com/w40/${countryCode}.png`}
                  alt={pilot.Driver.nationality}
                  style={{
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%"
                  }}
                />
              </div>
              <div style={{ color: teamColor, fontSize: "12px" }}>
                {constructorName}
              </div>
            </div>
            <div style={{ textAlign: "center", minWidth: "60px" }}>
              <span style={{ color: "white", fontSize: "16px" }}>
                {pilot.points}
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
  );
};

export default PilotsList;
