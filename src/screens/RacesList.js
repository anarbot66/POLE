import { useState, useEffect } from "react";

// Сопоставление стран с кодами флагов
const countryToFlag = {
  "Bahrain": "bh",
  "Saudi Arabia": "sa",
  "Australia": "au",
  "Japan": "jp",
  "China": "cn",
  "USA": "us",
  "United States": "us",
  "Miami": "us",
  "Italy": "it",
  "Monaco": "mc",
  "Canada": "ca",
  "Spain": "es",
  "Austria": "at",
  "Great Britain": "gb",
  "United Kingdom": "gb",
  "UK": "gb",
  "Hungary": "hu",
  "Belgium": "be",
  "Netherlands": "nl",
  "Singapore": "sg",
  "Mexico": "mx",
  "Brazil": "br",
  "Las Vegas": "us",
  "Abu Dhabi": "ae",
  "United Arab Emirates": "ae",
  "Qatar": "qa",
  "Azerbaijan": "az"
};

// Перевод названий гонок
const raceNameTranslations = {
  "Bahrain Grand Prix": "Гран-при Бахрейна",
  "Saudi Arabian Grand Prix": "Гран-при Саудовской Аравии",
  "Australian Grand Prix": "Гран-при Австралии",
  "Japanese Grand Prix": "Гран-при Японии",
  "Chinese Grand Prix": "Гран-при Китая",
  "Miami Grand Prix": "Гран-при Майами",
  "Emilia Romagna Grand Prix": "Гран-при Эмилии-Романьи",
  "Monaco Grand Prix": "Гран-при Монако",
  "Canadian Grand Prix": "Гран-при Канады",
  "Spanish Grand Prix": "Гран-при Испании",
  "Austrian Grand Prix": "Гран-при Австрии",
  "British Grand Prix": "Гран-при Великобритании",
  "Hungarian Grand Prix": "Гран-при Венгрии",
  "Belgian Grand Prix": "Гран-при Бельгии",
  "Dutch Grand Prix": "Гран-при Нидерландов",
  "Italian Grand Prix": "Гран-при Италии",
  "Azerbaijan Grand Prix": "Гран-при Азербайджана",
  "Singapore Grand Prix": "Гран-при Сингапура",
  "United States Grand Prix": "Гран-при США",
  "Mexico City Grand Prix": "Гран-при Мексики",
  "São Paulo Grand Prix": "Гран-при Бразилии",
  "Las Vegas Grand Prix": "Гран-при Лас-Вегаса",
  "Qatar Grand Prix": "Гран-при Катара",
  "Abu Dhabi Grand Prix": "Гран-при Абу-Даби"
};

// Функция форматирования даты в "7 - 9 марта"
const formatRaceWeekend = (firstPracticeDate, raceDate) => {
  const months = [
    "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
    "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"
  ];

  const startDate = new Date(firstPracticeDate);
  const endDate = new Date(raceDate);

  return `${startDate.getDate()} - ${endDate.getDate()} ${months[endDate.getMonth()]}`;
};

const RacesList = () => {
  const [races, setRaces] = useState([]);
  const [error, setError] = useState(null);

  // Функция загрузки данных о гонках
  const fetchRaces = async () => {
    try {
      const response = await fetch("https://api.jolpi.ca/ergast/f1/2024/races.json");
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
  if (!races.length) return <div>Загрузка...</div>;

  return (
    <div style={{
      width: "calc(100% - 40px)",
      margin: "0 auto",
      height: "calc(100vh - 100px)",
      overflowY: "auto",
      paddingTop: "10px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: "15px",
      backgroundColor: "#F9F9F9"
    }}>
      {races.map((race, index) => {
        let countryName = race.Circuit.Location.country;

        // Исправляем возможные ошибки в API
        if (countryName === "Great Britain") countryName = "United Kingdom";
        if (countryName === "Abu Dhabi") countryName = "United Arab Emirates";

        const countryCode = countryToFlag[countryName] || "un"; // "un" - заглушка для неизвестных стран
        const weekendDate = formatRaceWeekend(race.FirstPractice.date, race.date);

        // Перевод названия гонки
        const translatedRaceName = raceNameTranslations[race.raceName] || race.raceName;

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
            cursor: "pointer"
          }}>
            {/* Флаг страны (высокое качество) */}
            <div style={{
              width: "65px", height: "65px", borderRadius: "20px",
              display: "flex", justifyContent: "center", alignItems: "center",
              background: "white"
            }}>
              <img src={`https://flagcdn.com/w80/${countryCode}.png`} alt={countryName}
                style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
            </div>

            {/* Название гонки и место проведения */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", flex: 1
            }}>
              <div style={{ color: "black", fontSize: "16px" }}>
                {translatedRaceName}
              </div>
              <div style={{
                color: "#B9B9B9", fontSize: "12px"
              }}>
                {race.Circuit.Location.locality}
              </div>
            </div>

            {/* Даты уик-энда */}
            <div style={{ textAlign: "center", minWidth: "80px" }}>
              <span style={{ color: "black", fontSize: "16px" }}>
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
