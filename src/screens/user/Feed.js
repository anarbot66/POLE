import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Импортируем navigate
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

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

const Feed = ({ uid }) => {
  const [events, setEvents] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("events"); // Состояние для активной вкладки
  const [userName, setUserName] = useState(""); // Состояние для имени пользователя
  const navigate = useNavigate();

  console.log("UID", uid);

  // Функция для перехода на страницу с деталями гонки
  const handleRaceSelect = (race) => {
    navigate(`/races/${race.round}`, { state: { race } });
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

  const formattedDate = getFormattedDate();

  // Загрузка данных о событиях
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
        ]).filter(event => event.date);

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

  // Загрузка данных о подписчиках
  useEffect(() => {
    const fetchFollowing = async () => {
      setLoading(true);
      try {
        // Ищем всех пользователей, на которых подписан текущий пользователь
        const followsQuery = query(
          collection(db, "follows"),
          where("followerId", "==", uid)  // Изменили на followerId
        );
        const snapshot = await getDocs(followsQuery);
        
        // Для каждого пользователя, на которого подписан текущий, получаем данные
        const followingData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const followingId = doc.data().followingId;  // Это ID пользователя, на которого подписан текущий
            const userQuery = query(collection(db, "users"), where("uid", "==", followingId));
            const userSnapshot = await getDocs(userQuery);
            return userSnapshot.docs[0].data();
          })
        );
        setFollowers(followingData);  // Теперь это будут те, на кого подписан пользователь
      } catch (err) {
        console.error("Ошибка при загрузке подписок:", err);
        setError("Ошибка при загрузке подписок");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing(); // вызываем функцию загрузки

}, [uid]);  // Массив зависимостей, чтобы перезагружать при изменении uid


  // Обработка смены вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1D1D1F", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        Загрузка...
      </div>
    );
  }

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
      {/* Заголовки */}
      <h2 style={{ fontSize: "16px", fontWeight: "300", color: "white", textAlign: "left" }}>
        Привет, {userName}!
      </h2>
      <h3 style={{ fontSize: "14px", color: "white", textAlign: "left", marginBottom: "10px" }}>
        {`Сегодня: ${formattedDate}`}
      </h3>

      {/* Переключатель вкладок */}
      <div style={{ display: "flex", gap: "20px" }}>
        <button
          onClick={() => handleTabChange("events")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: activeTab === "events" ? "#212124" : "#333",
            border: "none",
            color: "white",
            cursor: "pointer"
          }}
        >
          События
        </button>
        <button
          onClick={() => handleTabChange("followers")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: activeTab === "followers" ? "#212124" : "#333",
            border: "none",
            color: "white",
            cursor: "pointer"
          }}
        >
          Друзья
        </button>
      </div>

      {/* Содержимое вкладки */}
      {activeTab === "events" && events.map((event, index) => {
        let countryName = event.race.Circuit.Location.country;
        if (countryName === "Great Britain") countryName = "United Kingdom";
        const countryCode = countryToFlag[countryName] || "un"; // "un" для неизвестных стран
        const sessionName = sessionTypeTranslations[event.type] || event.type;
        const formattedTime = convertToMoscowTime(event.date, event.time);

        return (
          <div key={index}
            onClick={() => handleRaceSelect(event.race)}
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
            <div style={{
              width: "55px",
              height: "55px",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#212124"
            }}>
              <img src={`https://flagcdn.com/w320/${countryCode}.png`} alt={countryName} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: "300", color: "white" }}>
                {sessionName}
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {event.race.raceName}
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: "100px" }}>
              <span style={{ fontSize: "12px", color: "white", fontWeight: "light" }}>
                {formattedTime}
              </span>
            </div>
          </div>
        );
      })}

      {/* Содержимое вкладки для подписчиков */}
      {activeTab === "followers" && (
        <div style={{ }}>
          {followers.length > 0 ? (
            followers.map((user, index) => (
              <div key={index} style={{ padding: "10px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #444", cursor: "pointer" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#212124", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                  <img src={user.photoUrl} alt={`${user.firstName} ${user.lastName}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "white", fontSize: "14px" }}>
                    {user.firstName} {user.lastName}
                  </span>
                  <span style={{ color: "#0077FF", fontSize: "12px" }}>
                    {user.username ? "@" + user.username : ""}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "white", fontSize: "14px" }}>У вас нет подписчиков</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
