import { useState, useEffect } from "react";
import RaceDetails from "./RaceDetails"; // Импортируем компонент деталей гонки

const getFormattedDate = () => {
  const now = new Date();
  const day = now.getDate();
  const monthNames = [
    "января", "февраля", "марта", "апреля", "мая", "июня", 
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  const month = monthNames[now.getMonth()]; // Используем правильный месяц
  const year = now.getFullYear();
  
  return `${day} ${month} ${year}`;
};

// Сопоставление стран с кодами флагов
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

// Функция форматирования даты в "7 - 9 марта"
const formatRaceWeekend = (firstPracticeDate, raceDate) => {
  const months = [
    "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
    "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"
  ];
  const startDate = new Date(firstPracticeDate);
  const endDate = new Date(raceDate);

  return `${startDate.getDate()} ${months[endDate.getMonth()]}`;
};

const RacesList = () => {
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [error, setError] = useState(null);
  const formattedDate = getFormattedDate();

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
  if (!races.length) return (
    <div style={{
      display: "flex",            // Включаем flexbox
      justifyContent: "center",  // Горизонтальное центрирование
      alignItems: "center",      // Вертикальное центрирование
      height: "100vh",           // Задаем высоту 100% от высоты окна
      textAlign: "center"        // Центрируем текст
    }}>
      Загрузка...
    </div>
  );
  

  // Функция выбора гонки
  const handleRaceSelect = (race) => {
    setSelectedRace(race);
  };

  // Функция возврата к списку гонок
  const handleBackToList = () => {
    setSelectedRace(null);
  };

  // Если выбрана гонка, показываем детали гонки
  if (selectedRace) {
    return <RaceDetails race={selectedRace} goBack={handleBackToList} />;
  }

  return (
    <div style={{
      width: "calc(100% - 20px)",
      margin: "0 auto",
      height: "100%",
      marginBottom: "100px",
      overflowY: "auto",
      paddingTop: "10px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: "15px",
      backgroundColor: "#F9F9F9"
    }} >
      <div style={{
          width: "calc(100% - 20px)",
          margin: "0 auto",
          paddingTop: "10px",
          display: "flex",
          flexDirection: "column"
        }}>
        {/* Заголовки */}
        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "black", textAlign: "left"}}>
        {'Календарь F1 2025'}
        </h2>
        <h3 style={{ fontSize: "14px", color: "black", textAlign: "left", marginBottom: "10px"}}>
        {`Сегодня: ${formattedDate}`}
        </h3>
        <h4 style={{ fontSize: "12px", color: "gray" }}>
          Клинки на гонку чтобы узнать расписание
        </h4>
      </div>
      {races.map((race, index) => {
        let countryName = race.Circuit.Location.country;
        if (countryName === "Great Britain") countryName = "United Kingdom";
        const countryCode = countryToFlag[countryName] || "un";
        const weekendDate = formatRaceWeekend(race.FirstPractice.date, race.date);
        
        // Используем перевод названия гонки, если он есть
        const translatedRaceName = raceNameTranslations[race.raceName] || race.raceName;

        return (
          <div key={index} 
            onClick={() => handleRaceSelect(race)} // Переход к деталям гонки
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
            {/* Флаг страны */} 
            <div style={{
              width: "65px", height: "65px", borderRadius: "20px",
              display: "flex", justifyContent: "center", alignItems: "center",
              background: "white"
            }}>
              <img 
                src={`https://flagcdn.com/w80/${countryCode}.png`} 
                alt={race.Circuit.Location.country}
                style={{ 
                    width: "50px", 
                    height: "50px", 
                    borderRadius: "50%", 
                    objectFit: "cover",
                    objectPosition: ["UAE", "United States", "Singapore", "USA", "Qatar"].includes(race.Circuit.Location.country) 
                    ? "20% center"  // Смещение для выбранных стран
                    : "center"  // Для всех остальных
                }} 
                />

            </div>

            {/* Название гонки с переводом */} 
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", flex: 1
            }}>
              <div style={{ color: "black", fontSize: "13px" }}>
                {translatedRaceName}
              </div>
              <div style={{
                color: "#B9B9B9", fontSize: "10px"
              }}>
                {race.Circuit.circuitName}
              </div>
            </div>

            {/* Даты уик-энда */} 
            <div style={{ textAlign: "center", minWidth: "80px" }}>
              <span style={{ color: "black", fontSize: "12px" }}>
                {weekendDate}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RacesList;
