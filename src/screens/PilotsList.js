// PilotsList.js
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

const PilotsList = () => {
  const [pilots, setPilots] = useState([]);
  const [error, setError] = useState(null);
  const formattedDate = getFormattedDate();
  const navigate = useNavigate();

  // Цвета команд
  const teamColors = {
    "McLaren": "#F48021",
    "Ferrari": "#FF0000",
    "Red Bull": "#2546FF",
    "Mercedes": "#00A19C",
    "Aston Martin": "#00594F",
    "Alpine F1 Team": "#0078C1",
    "Haas F1 Team": "#8B8B8B",
    "RB F1 Team": "#1434CB",
    "Williams": "#00A3E0",
    "Sauber": "#00E701",
  };

  const driverTranslations = {
    "Max Verstappen": "Макс Ферстаппен",
    "Lando Norris": "Ландо Норрис",
    "Charles Leclerc": "Шарль Леклер",
    "Oscar Piastri": "Оскар Пиастри",
    "Carlos Sainz": "Карлос Сайнс",
    "George Russell": "Джордж Расселл",
    "Lewis Hamilton": "Льюис Хэмилтон",
    "Sergio Pérez": "Серхио Перес",
    "Fernando Alonso": "Фернандо Алонсо",
    "Pierre Gasly": "Пьер Гасли",
    "Nico Hülkenberg": "Нико Хюлькенберг",
    "Yuki Tsunoda": "Юки Цунода",
    "Lance Stroll": "Лэнс Стролл",
    "Esteban Ocon": "Эстебан Окон",
    "Kevin Magnussen": "Кевин Магнуссен",
    "Alexander Albon": "Александер Албон",
    "Daniel Ricciardo": "Даниэль Риккьярдо",
    "Oliver Bearman": "Оливер Бирман",
    "Franco Colapinto": "Франко Колапинто",
    "Guanyu Zhou": "Гуанью Джоу",
    "Liam Lawson": "Лиам Лоусон",
    "Valtteri Bottas": "Валттери Боттас",
    "Logan Sargeant": "Логан Сарджент",
    "Jack Doohan": "Джек Дуэн",
  };

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

  // Нормализация фамилии
  const normalizeName = (name) => {
    if (name === "Magnussen") {
      return "kevin_magnussen";
    } else if (name === "Verstappen") {
      return "max_verstappen";
    }
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Загружаем данные о пилотах
  const fetchPilots = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2024/driverStandings.json');
      if (!response.ok) throw new Error("Не удалось получить данные о пилотах");

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

  // При клике переходим на страницу деталей, передавая в URL нормализованную фамилию
  const handlePilotSelect = (pilot) => {
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${pilotLastName}`);
  };

  if (error) return <div>Ошибка: {error}</div>;
  if (!pilots.length) return <div> </div>;

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
      gap: "15px",
      background: "#1D1D1F"
    }}>
      <div style={{
        width: "calc(100% - 20px)", 
        margin: "0 auto", 
        paddingTop: "10px", 
        display: "flex", 
        flexDirection: "column"
      }}>
        <h3 style={{ fontSize: "14px", color: "white", textAlign: "left", marginBottom: "10px" }}>
          {`Сегодня: ${getFormattedDate()}`}
        </h3>
        <h4 style={{ fontSize: "12px", color: "lightgray" }}>
          Кликни по пилоту чтобы узнать подробнее
        </h4>
      </div>
      {pilots.map((pilot, index) => {
        const teamColor = teamColors[pilot.Constructors[0].name] || "#000000";
        const pilotFullName = `${pilot.Driver.givenName} ${pilot.Driver.familyName}`;
        const translatedName = driverTranslations[pilotFullName] || pilotFullName;
        const nationality = pilot.Driver.nationality;
        const countryCode = nationalityToFlag[nationality] || "un";

        return (
          <div
            key={index}
            onClick={() => handlePilotSelect(pilot)}
            style={{
              width: "100%",
              background: "#212124",
              borderRadius: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              cursor: "pointer"
            }}
          >
            <div style={{
              width: "65px", height: "65px", borderRadius: "20px",
              display: "flex", justifyContent: "center", alignItems: "center",
              background: "#212124"
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
                <div style={{ color: "white", fontSize: "12px", fontWeight: "300" }}>
                  {translatedName}
                </div>
                <img src={`https://flagcdn.com/w40/${countryCode}.png`} alt={nationality}
                  style={{ width: "15px", height: "15px", borderRadius: "50%", objectFit: "cover" }} />
              </div>
              <div style={{
                color: teamColor,
                fontSize: "12px",
                fontWeight: "300"
              }}>
                {pilot.Constructors[0].name}
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
