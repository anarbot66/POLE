import { useState, useEffect } from "react";
import PilotDetails from './PilotDetails'; // импортируем новый компонент для отображения детальной информации о пилоте

const PilotsList = () => {
  const [pilots, setPilots] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPilot, setSelectedPilot] = useState(null); // для выбранного пилота
  const [pilotResults, setPilotResults] = useState(null); // для результатов пилота

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
    // Добавьте другие имена по необходимости
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
    "Argentine": "ar",
    "South African": "za",
  };

  // Функция нормализации фамилии
  const normalizeName = (name) => {
    // Специальная замена для двух пилотов
    if (name === "Magnussen") {
      return "kevin_magnussen";
    } else if (name === "Verstappen") {
      return "max_verstappen";
    }
    return name
      .normalize("NFD")  // Разделяет символы на базовые и диакритики
      .replace(/[\u0300-\u036f]/g, "")  // Убирает все диакритические знаки
      .toLowerCase();  // Преобразует все в нижний регистр
  };

  // Функция для получения данных о пилотах
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

  // Функция для получения результатов пилота
  const fetchPilotResults = async (lastName) => {
    try {
      console.log(`Запрос на результаты для пилота с фамилией: ${lastName}`);

      const response = await fetch(`https://api.jolpi.ca/ergast/f1/2024/drivers/${lastName}/results.json`);
      if (!response.ok) {
        throw new Error("Не удалось получить данные о результатах пилота");
      }

      const data = await response.json();
      const results = data?.MRData?.RaceTable?.Races;

      console.log("Полученные результаты гонок:", results);

      if (results && Array.isArray(results)) {
        // Подсчитываем победы (position === 1), подиумы (position <= 3) и поулы (grid === 1)
        const wins = results.filter(result => parseInt(result?.Results?.[0]?.position, 10) === 1).length; // Победы
        const podiums = results.filter(result => {
          const position = parseInt(result?.Results?.[0]?.position, 10);
          return position >= 1 && position <= 3; // Подиумы
        }).length;

        const poles = results.filter(result => parseInt(result?.Results?.[0]?.grid, 10) === 1).length; // Поулы

        const dnf = results.filter(result => {
          const status = result?.Results?.[0]?.status;
          // Если статус не "Finished", не "+1 lap" и не "+2 laps", то считаем DNF
          return status !== "Finished" && !status.toLowerCase().includes("+1 lap") && !status.toLowerCase().includes("+2 laps");
        }).length; // DNF

        setPilotResults({ wins, podiums, poles, dnf });
      } else {
        setPilotResults({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
      }
    } catch (error) {
      console.error("Ошибка при получении данных о результатах пилота:", error);
      setPilotResults({ wins: 0, podiums: 0, poles: 0, dnf: 0 });
    }
  };

  useEffect(() => {
    fetchPilots();
  }, []);

  const handlePilotSelect = (pilot) => {
    setSelectedPilot(pilot);
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    fetchPilotResults(pilotLastName);
  };

  const handleBackToList = () => {
    setSelectedPilot(null); // Возвращаемся на страницу списка пилотов
  };

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  if (!pilots.length) {
    return <div>Загрузка...</div>;
  }

  if (selectedPilot) {
    return <PilotDetails pilot={selectedPilot} teamColors={teamColors} pilotResults={pilotResults} goBack={handleBackToList} />;
  }

  return (
    <div style={{
      width: "calc(100% - 40px)", // Убираем отступы по бокам
      margin: "0 auto", // Центрируем контейнер
      height: "calc(100vh - 100px)",
      overflowY: "auto",
      paddingTop: "10px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: "15px",
      backgroundColor: "#F9F9F9"
    }}>
      {pilots.map((pilot, index) => {
        const teamColor = teamColors[pilot.Constructors[0].name] || "#000000";
        const pilotFullName = `${pilot.Driver.givenName} ${pilot.Driver.familyName}`;
        const translatedName = driverTranslations[pilotFullName] || pilotFullName;
        const nationality = pilot.Driver.nationality;
        const countryCode = nationalityToFlag[nationality] || "un";

        return (
          <div
            key={index}
            onClick={() => handlePilotSelect(pilot)} // Переход к деталям пилота
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
            }}
          >
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
                  {translatedName}
                </div>
                <img src={`https://flagcdn.com/w40/${countryCode}.png`} alt={nationality}
                  style={{ width: "15px", height: "15px", borderRadius: "50%", objectFit: "cover" }} />
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
