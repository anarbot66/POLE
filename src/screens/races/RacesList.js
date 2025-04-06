import { useState, useEffect, useContext } from "react";
import RaceDetails from "./RaceDetails";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeContext } from "../user/ThemeContext"; // Проверь путь к ThemeContext

const countryToFlag = {
  "Bahrain": "bh", "Saudi Arabia": "sa", "Australia": "au", "Japan": "jp",
  "China": "cn", "USA": "us", "United States": "us", "Miami": "us",
  "Italy": "it", "Monaco": "mc", "Canada": "ca", "Spain": "es",
  "Austria": "at", "Great Britain": "gb", "United Kingdom": "gb", "UK": "gb",
  "Hungary": "hu", "Belgium": "be", "Netherlands": "nl", "Singapore": "sg",
  "Mexico": "mx", "Brazil": "br", "Las Vegas": "us", "UAE": "ae",
  "Qatar": "qa", "Azerbaijan": "az"
};

// Перевод названий гонок
const raceNameTranslations = {
  "Bahrain Grand Prix": "Бахрейн",
  "Saudi Arabian Grand Prix": "Саудовская Аравия",
  "Australian Grand Prix": "Австралия",
  "Japanese Grand Prix": "Япония",
  "Chinese Grand Prix": "Китай",
  "Miami Grand Prix": "Майами",
  "Emilia Romagna Grand Prix": "Эмилия-Романья",
  "Monaco Grand Prix": "Монако",
  "Canadian Grand Prix": "Канада",
  "Spanish Grand Prix": "Испания",
  "Austrian Grand Prix": "Австрия",
  "British Grand Prix": "Великобритания",
  "Hungarian Grand Prix": "Венгрия",
  "Belgian Grand Prix": "Бельгия",
  "Dutch Grand Prix": "Нидерланды",
  "Italian Grand Prix": "Италия",
  "Azerbaijan Grand Prix": "Азербайджан",
  "Singapore Grand Prix": "Сингапур",
  "United States Grand Prix": "США",
  "Mexico City Grand Prix": "Мексика",
  "São Paulo Grand Prix": "Бразилия",
  "Las Vegas Grand Prix": "Лас-Вегас",
  "Qatar Grand Prix": "Катар",
  "Abu Dhabi Grand Prix": "Абу-Даби"
};

// Функция форматирования даты в "7 марта"
const formatRaceWeekend = (firstPracticeDate, raceDate) => {
  const months = [
    "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
    "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"
  ];
  const startDate = new Date(firstPracticeDate);
  return `${startDate.getDate()} ${months[startDate.getMonth()]}`;
};

const RacesList = ({ currentUser }) => {
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext); // Получаем объект темы

  // Функция загрузки данных о гонках
  const fetchRaces = async () => {
    try {
      const response = await fetch("https://api.jolpi.ca/ergast/f1/2025/races.json");
      if (!response.ok) throw new Error("Ошибка загрузки гонок");

      const data = await response.json();
      const racesData = data?.MRData?.RaceTable?.Races || [];
      setRaces(racesData);
    } catch (error) {
      console.error("Ошибка загрузки гонок:", error);
      setError("Ошибка загрузки данных");
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  if (error) return <div>Ошибка: {error}</div>;
  if (!races.length)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          textAlign: "center"
        }}
      ></div>
    );

  // Функция выбора гонки
  const handleRaceSelect = (race) => {
    navigate(`/races/${race.round}`, { state: { race } });
  };

  // Функция возврата к списку гонок
  const handleBackToList = () => {
    setSelectedRace(null);
  };

  // Если выбрана гонка, показываем детали гонки
  if (selectedRace) {
    return <RaceDetails race={selectedRace} goBack={handleBackToList} />;
  }

  const today = new Date();
  const nextRace = races.find((race) => new Date(race.FirstPractice.date) > today);
  const daysUntilNextRace = nextRace
    ? Math.ceil((new Date(nextRace.FirstPractice.date) - today) / (1000 * 60 * 60 * 24))
    : null;

  let nextRaceCountry = "";
  let nextRaceCountryCode = "";
  if (nextRace) {
    nextRaceCountry = nextRace.Circuit.Location.country;
    if (nextRaceCountry === "Great Britain") nextRaceCountry = "United Kingdom";
    nextRaceCountryCode = countryToFlag[nextRaceCountry] || "un";
  }

  const filteredRaces = races.filter((race) => race !== nextRace);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        marginBottom: "100px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "15px",
        backgroundColor: theme.primary // Используем основной цвет темы
      }}
    >
      <div
        style={{
          width: "calc(100% - 30px)",
          margin: "0px 15px",
          paddingTop: "15px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderRadius: 15,
          }}
        >
          <img 
            onClick={() => navigate("/profile")} 
            src={currentUser.photoUrl || "https://placehold.co/80x80"} 
            alt="Avatar" 
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              alignContent: "right"
            }} 
          />
          <span style={{ color: "white", padding: "10px" }}>Расписание</span>
        </div>
        {/* Блок с информацией о следующей гонке */}
        {nextRace && (
          <div
            style={{
              width: "100%",
              height: 250,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 10,
              marginTop: "15px"
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: 20,
                background: theme.secondary, // Используем вторичный цвет темы
                borderRadius: 15,
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >
              <div style={{ color: "lightgray", fontSize: 13 }}>Следующее гран-при:</div>
              {/* Флаг и название гонки в одной строке */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "20px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: theme.primary
                  }}
                >
                  <img
                    src={`https://flagcdn.com/w320/${nextRaceCountryCode}.png`}
                    alt={nextRace.Circuit.Location.country}
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      objectPosition: ["UAE", "United States", "Singapore", "USA", "Qatar"].includes(
                        nextRace.Circuit.Location.country
                      )
                        ? "20% center"
                        : "center"
                    }}
                  />
                </div>
                <span style={{ color: "white", fontSize: 20 }}>
                  {raceNameTranslations[nextRace.raceName] || nextRace.raceName}
                </span>
              </div>
              <div>
                <span style={{ color: "lightgray", fontSize: 16 }}>
                  {nextRace.Circuit.circuitName}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ fontSize: 14, color: "white" }}>Начало через:</div>
                <div style={{ fontSize: 28, color: "white" }}>{daysUntilNextRace} дней</div>
              </div>
              <div
                style={{
                  width: 121,
                  height: 80,
                  background: theme.accent, // Используем акцентный цвет темы
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer"
                }}
                onClick={() => handleRaceSelect(nextRace)}
              >
                <span style={{ color: "white", fontSize: 12 }}>Подробнее</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {filteredRaces.map((race, index) => {
        let countryName = race.Circuit.Location.country;
        if (countryName === "Great Britain") countryName = "United Kingdom";
        const countryCode = countryToFlag[countryName] || "un";
        const weekendDate = formatRaceWeekend(race.FirstPractice.date, race.date);
        const translatedRaceName = raceNameTranslations[race.raceName] || race.raceName;

        return (
          <div
            key={index}
            onClick={() => handleRaceSelect(race)}
            style={{
              width: "calc(100% - 30px)",
              margin: "0px 15px",
              display: "flex",
              background: theme.secondary, // Используем вторичный цвет для карточек
              borderRadius: "15px",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              cursor: "pointer"
            }}
          >
            {/* Флаг страны */}
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: theme.secondary
              }}
            >
              <img
                src={`https://flagcdn.com/w320/${countryCode}.png`}
                alt={race.Circuit.Location.country}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  objectPosition: ["UAE", "United States", "Singapore", "USA", "Qatar"].includes(
                    race.Circuit.Location.country
                  )
                    ? "20% center"
                    : "center"
                }}
              />
            </div>
            {/* Название гонки с переводом */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
                flex: 1
              }}
            >
              <div style={{ color: "white", fontSize: "13px" }}>{translatedRaceName}</div>
              <div style={{ color: "#B9B9B9", fontSize: "10px" }}>
                {race.Circuit.circuitName}
              </div>
            </div>
            {/* Даты уик-энда */}
            <div style={{ textAlign: "center", minWidth: "80px" }}>
              <span style={{ color: "white", fontSize: "12px" }}>{weekendDate}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RacesList;
