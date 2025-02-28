import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Импортируем navigate

// Сопоставление стран с кодами флагов
const countryToFlag = {
  "Bahrain": "bh", "Saudi Arabia": "sa", "Australia": "au", "Japan": "jp",
  "China": "cn", "USA": "us", "United States": "us", "Miami": "us",
  "Italy": "it", "Monaco": "mc", "Canada": "ca", "Spain": "es",
  "Austria": "at", "Great Britain": "gb", "United Kingdom": "us", "UK": "gb",
  "Hungary": "hu", "Belgium": "be", "Netherlands": "nl", "Singapore": "sg",
  "Mexico": "mx", "Brazil": "br", "Las Vegas": "us", "UAE": "ae",
  "Qatar": "qa", "Azerbaijan": "az"
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
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  
  return `${day} ${month} ${year}`;
};

const Feed = ({ userName }) => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const formattedDate = getFormattedDate();

  const navigate = useNavigate(); // Хук для навигации

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
  if (!events.length) return <div> </div>;

  // Функция для перехода на страницу с деталями гонки
  const handleRaceSelect = (race) => {
    navigate(`/races/${race.round}`, { state: { race } });
  };

  // Функция для перехода на страницу поиска пользователей
  const handleFindFriends = () => {
    navigate("/usersearch");
  };

  return (
    <div style={{
      width: "calc(100% - 20px)",
      height: "100%",
      margin: "0 auto",
      marginBottom: "100px",
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
        {/* Заголовки */}
        <h2 style={{ fontSize: "16px", fontWeight: "300", color: "white", textAlign: "left"}}>
          Привет, {userName}!
        </h2>
        <h3 style={{ fontSize: "14px", color: "white", textAlign: "left", marginBottom: "10px"}}>
          {`Сегодня: ${formattedDate}`}
        </h3>
        <h4 style={{ fontSize: "14px", color: "lightgray" }}>
          Грядущие события:
        </h4>

          {/* Кнопка "Найдите друзей" */}
        <div style={{
          display: "flex",
          justifyContent: "left",
          marginTop: "20px"
        }}>
          <button 
            onClick={handleFindFriends}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#212124",
              border: "none",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            Найдите друзей
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 16C14.433 16 16 14.433 16 12.5C16 10.567 14.433 9 12.5 9C10.567 9 9 10.567 9 12.5C9 14.433 10.567 16 12.5 16ZM13 11V12H14C14.2761 12 14.5 12.2239 14.5 12.5C14.5 12.7761 14.2761 13 14 13H13V14C13 14.2761 12.7761 14.5 12.5 14.5C12.2239 14.5 12 14.2761 12 14V13H11C10.7239 13 10.5 12.7761 10.5 12.5C10.5 12.2239 10.7239 12 11 12H12V11C12 10.7239 12.2239 10.5 12.5 10.5C12.7761 10.5 13 10.7239 13 11Z" fill="white"/>
            <path d="M11 5C11 6.65685 9.65685 8 8 8C6.34315 8 5 6.65685 5 5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5Z" fill="white"/>
            <path d="M2 13C2 14 3 14 3 14H8.25606C8.09023 13.5308 8 13.026 8 12.5C8 11.1463 8.5977 9.93228 9.54358 9.10733C9.07708 9.03817 8.56399 9 8 9C3 9 2 12 2 13Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>

      {events.map((event, index) => {
        let countryName = event.race.Circuit.Location.country;
        if (countryName === "Great Britain") countryName = "United Kingdom";
        const countryCode = countryToFlag[countryName] || "un"; // "un" для неизвестных стран
        const sessionName = sessionTypeTranslations[event.type] || event.type;
        const formattedTime = convertToMoscowTime(event.date, event.time);

        return (
          <div key={index} 
               onClick={() => handleRaceSelect(event.race)} // При клике переходим к деталям гонки
               style={{
                  width: "100%",
                  background: "#212124",
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
              background: "#212124"
            }}>
              <img 
                src={`https://flagcdn.com/w320/${countryCode}.png`} 
                alt={countryName}
                style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} 
              />
            </div>

            {/* Название сессии и название гонки */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: "300", color: "white" }}>
                {sessionName}
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {event.race.raceName}
              </div>
            </div>

            {/* Время сессии */}
            <div style={{ textAlign: "right", minWidth: "100px" }}>
              <span style={{ fontSize: "12px", color: "white", fontWeight: "light" }}>
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
