import React, { useState, useEffect } from "react";
import RaceDetails from "./RaceDetails";

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
  "United Kingdom": "us",
  "UK": "gb",
  "Hungary": "hu",
  "Belgium": "be",
  "Netherlands": "nl",
  "Singapore": "sg",
  "Mexico": "mx",
  "Brazil": "br",
  "Las Vegas": "us",
  "UAE": "ae",
  "Qatar": "qa",
  "Azerbaijan": "az"
};

// Перевод названий сессий
const sessionTypeTranslations = {
  "FirstPractice": "Свободная практика 1",
  "SecondPractice": "Свободная практика 2",
  "ThirdPractice": "Свободная практика 3",
  "Qualifying": "Квалификация",
  "Sprint": "Спринт",
  "SprintQualifying": "Квалификация к Спринту",
  "Race": "Гонка"
};

// Функция перевода времени в московское
const convertToMoscowTime = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return "—";
  const date = new Date(`${utcDate}T${utcTime}`);
  date.setHours(date.getHours() + 3); // Москва = UTC+3
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
};

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



const randomNames = [
  "Не сбавляй обороты!", 
  "Привет, что сегодня посмотрим?", 
  "Не будь как сарджент!", 
  "Всем тифози привет!", 
  "Какой ты сегодня? Софт или Хард?"
];

const getRandomName = () => {
  const randomIndex = Math.floor(Math.random() * randomNames.length);
  return randomNames[randomIndex];
};


const Feed = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  // Состояние для выбранной гонки
  const [selectedRace, setSelectedRace] = useState(null);
  const formattedDate = getFormattedDate();
  const randomName = getRandomName();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("https://api.jolpi.ca/ergast/f1/2025/races.json");
        if (!response.ok) throw new Error("Ошибка загрузки данных");

        const data = await response.json();
        const races = data?.MRData?.RaceTable?.Races || [];

        const allEvents = races.flatMap((race) => [
          { type: "FirstPractice", date: race.FirstPractice?.date, time: race.FirstPractice?.time, race },
          { type: "SecondPractice", date: race.SecondPractice?.date, time: race.SecondPractice?.time, race },
          { type: "ThirdPractice", date: race.ThirdPractice?.date, time: race.ThirdPractice?.time, race },
          { type: "Qualifying", date: race.Qualifying?.date, time: race.Qualifying?.time, race },
          { type: "Race", date: race.date, time: race.time, race }
        ]).filter(event => event.date); // Убираем пустые события

        const now = new Date();
        const upcomingEvents = allEvents
          .map(event => ({ ...event, fullDate: new Date(`${event.date}T${event.time}`) }))
          .filter(event => event.fullDate > now)
          .sort((a, b) => a.fullDate - b.fullDate)
          .slice(0, 5);

        setEvents(upcomingEvents);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        setError("Ошибка загрузки данных");
      }
    };

    fetchEvents();
  }, []);

  if (error) return <div>Ошибка: {error}</div>;
  if (!events.length) return <div>Загрузка...</div>;

  // Если выбрана гонка, показываем ее детали
  if (selectedRace) {
    return (
      <RaceDetails 
        race={selectedRace} 
        goBack={() => setSelectedRace(null)} 
      />
    );
  }

  return (
    <div style={{
      width: "calc(100% - 20px)",
      height: "calc(100vh - 100px)",
      margin: "0 auto",
      overflowY: "auto",
      paddingTop: "10px",
      display: "flex",
      flexDirection: "column",
      gap: "15px"
    }}>
      <div style={{
          width: "calc(100% - 20px)",
          margin: "0 auto",
          paddingTop: "10px",
          display: "flex",
          flexDirection: "column"
        }}>
        {/* Заголовки */}
        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "black", textAlign: "left"}}>
        {randomName}
        </h2>
        <h3 style={{ fontSize: "14px", color: "black", textAlign: "left", marginBottom: "10px"}}>
        {`Сегодня: ${formattedDate}`}
        </h3>
        <h4 style={{ fontSize: "14px", color: "gray" }}>
          Грядущие события:
        </h4>
      </div>

      {events.map((event, index) => {
        let countryName = event.race.Circuit.Location.country;
        if (countryName === "Great Britain") countryName = "United Kingdom";
        const countryCode = countryToFlag[countryName] || "un"; // "un" для неизвестных стран
        const sessionName = sessionTypeTranslations[event.type] || event.type;
        const formattedTime = convertToMoscowTime(event.date, event.time);

        return (
          <div key={index} 
               onClick={() => setSelectedRace(event.race)} // При клике сохраняем выбранную гонку
               style={{
                  width: "100%",
                  background: "white",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px",
                  cursor: "pointer"
               }}>
            {/* Флаг страны */}
            <div style={{
              width: "55px",
              height: "55px",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "white"
            }}>
              <img 
                src={`https://flagcdn.com/w80/${countryCode}.png`} 
                alt={countryName}
                style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} 
              />
            </div>

            {/* Название сессии и название гонки */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "black" }}>
                {sessionName}
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {event.race.raceName}
              </div>
            </div>

            {/* Время сессии */}
            <div style={{ textAlign: "right", minWidth: "100px" }}>
              <span style={{ fontSize: "12px", color: "#555", fontWeight: "500" }}>
                {formattedTime}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Feed;
