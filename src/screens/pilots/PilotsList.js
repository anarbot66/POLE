// PilotsList.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import pilotStats from "../recources/json/driversData.json"; // данные из JSON

// Функция форматирования даты (не изменялась)
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

// Маппинг национальностей для отображения флага
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
  "South African": "za"
};

// Переводы имен пилотов  
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

// Цвета команд
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
  "Sauber": "#00E701",
};

// Маппинг пилотов к конструкторам (при необходимости можно корректировать)
const driverToConstructor = {
  "verstappen": "Red Bull",
  "norris": "McLaren",
  "leclerc": "Ferrari",
  "piastri": "McLaren",
  "russell": "Mercedes",
  "hamilton": "Ferrari",
  "lawson": "Red Bull",
  "alonso": "Aston Martin",
  "gasly": "Alpine F1 Team",
  "hulkenberg": "Sauber",
  "tsunoda": "RB F1 Team",
  "stroll": "Aston Martin",
  "ocon": "Haas F1 Team",
  "bearman": "Haas F1 Team",
  "albon": "Williams",
  "sainz": "Williams",
  "hadjar": "RB F1 Team",
  "bortoleto": "Sauber",
  "antonelli": "Mercedes",
  "doohan": "Alpine F1 Team"
};

// Функция для нормализации (приведения к нижнему регистру без диакритики)
const normalizeName = (name) => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// Функция для преобразования ключа (например, "max_verstappen") в "Max Verstappen"
const formatDriverName = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PilotsList = () => {
  const [pilots, setPilots] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Функция получения данных из API оставлена на будущее
  /*
  const fetchPilots = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2025/driverStandings.json');
      if (!response.ok) throw new Error("Не удалось получить данные о пилотах");

      const data = await response.json();
      // Преобразование и объединение данных...
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      setError("Ошибка при получении данных");
    }
  };
  */

  // Вместо запроса к API используем локальные данные из JSON
  useEffect(() => {
    const pilotsFromJson = Object.entries(pilotStats).map(([key, stats]) => {
      // Определяем конструктор для пилота по ключу
      const constructorName = driverToConstructor[key] || "Unknown";
      // Форматируем имя пилота
      const fullName = formatDriverName(key); // Например, "Max Verstappen"
      // Применяем перевод, если он есть
      const translatedName = driverTranslations[fullName] || fullName;
      return {
        Driver: {
          // Разбиваем имя на имя и фамилию
          givenName: fullName.split(" ")[0] || "",
          familyName: fullName.split(" ")[1] || fullName,
          translatedName: translatedName,
          nationality: stats.nationality
        },
        Constructors: [
          {
            name: constructorName
          }
        ],
        position: stats.pos,
        points: stats.point,
        extraStats: { ...stats }
      };
    });
    // Сортировка по позиции (от 1 до 20)
    pilotsFromJson.sort((a, b) => a.position - b.position);
    setPilots(pilotsFromJson);
  }, []);

  const handlePilotSelect = (pilot) => {
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${pilotLastName}`);
  };

  if (!pilots.length) return null;

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
      {pilots.map((pilot, index) => {
        const constructorName = pilot.Constructors[0].name;
        const teamColor = teamColors[constructorName] || "#000000";
        const pilotNameDisplay = pilot.Driver.translatedName;
        const nationality = pilot.Driver.nationality;
        const countryCode = nationalityToFlag[nationality] || "un";
        return (
          <div
            key={index}
            onClick={() => handlePilotSelect(pilot)}
            style={{
              width: "100%",
              background: "#212124",
              borderRadius: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              cursor: "pointer",
              paddingTop: "10px"
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
                <div style={{ color: "white", fontSize: "14px"}}>
                  {pilotNameDisplay}
                </div>
                <img 
                  src={`https://flagcdn.com/w40/${countryCode}.png`} 
                  alt={nationality}
                  style={{ width: "15px", height: "15px", borderRadius: "50%", objectFit: "cover" }} 
                />
              </div>
              <div style={{
                color: teamColor,
                fontSize: "12px"
              }}>
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
