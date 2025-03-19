import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import CustomSelect from "../user/components/CustomSelect";

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

// Перевод названий сессий
const sessionTypeTranslations = {
  "FirstPractice": "Свободная практика 1",
  "SecondPractice": "Свободная практика 2",
  "ThirdPractice": "Свободная практика 3",
  "Qualifying": "Квалификация",
  "Sprint": "Спринт",
  "SprintQualifying": "Квалификация к спринту",
  "Race": "Гонка"
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

// Функция конвертации даты и времени в московское время
const convertToMoscowTime = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return "—";
  const date = new Date(`${utcDate}T${utcTime}`);
  // Для корректного отображения московского времени прибавляем 3 часа (UTC+3)
  date.setHours(date.getHours() + 3);
  return date.toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });
};

const RaceDetails = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  // Новый state для активной вкладки: "schedule" или "lapRecord"
  const [activeTab, setActiveTab] = useState("schedule");
  // State для данных рекорда круга
  const [lapRecord, setLapRecord] = useState(null);
  const [lapRecordLoading, setLapRecordLoading] = useState(false);
  const [lapRecordError, setLapRecordError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const race = location.state?.race;

  // Загружаем изображение трассы
  useEffect(() => {
    const loadImage = async () => {
      if (!race) return;
      // Здесь используется locality (например, "Melbourne") для загрузки изображения
      const circuitName = race.Circuit.Location.locality;
      try {
        const image = await import(`../recources/images/circuits/${circuitName}.png`);
        const img = new Image();
        img.src = image.default;
        img.onload = () => {
          setImageSrc(image.default);
          setLoading(false);
        };
        img.onerror = () => {
          console.error("Ошибка загрузки изображения");
          setLoading(false);
        };
      } catch (error) {
        console.error("Ошибка загрузки изображения", error);
        setLoading(false);
      }
    };
    loadImage();
  }, [race]);

  // Подготавливаем данные расписания
  const sessions = [
    { type: "FirstPractice", date: race?.FirstPractice?.date, time: race?.FirstPractice?.time },
    { type: "SecondPractice", date: race?.SecondPractice?.date, time: race?.SecondPractice?.time },
    { type: "ThirdPractice", date: race?.ThirdPractice?.date, time: race?.ThirdPractice?.time },
    { type: "Qualifying", date: race?.Qualifying?.date, time: race?.Qualifying?.time },
    { type: "Sprint", date: race?.Sprint?.date, time: race?.Sprint?.time },
    { type: "Race", date: race?.date, time: race?.time }
  ].filter(session => session.date);
  
  const translatedRaceName = raceNameTranslations[race?.raceName] || race?.raceName;

  // Загружаем данные рекорда круга из Firestore при активной вкладке "lapRecord"
  useEffect(() => {
    if (activeTab === "lapRecord" && race) {
      const fetchLapRecordFromDB = async () => {
        setLapRecordLoading(true);
        setLapRecordError(null);
        try {
          // Используем race.Circuit.Location.locality для запроса
          const circuitName = race.Circuit.Location.locality;
          const lapQuery = query(
            collection(db, "lapRecords"),
            where("circuitName", "==", circuitName)
          );
          const snapshot = await getDocs(lapQuery);
          if (!snapshot.empty) {
            // Берем первый найденный документ (при необходимости можно добавить сортировку)
            const recordData = snapshot.docs[0].data();
            setLapRecord(recordData);
          } else {
            setLapRecord(null);
          }
        } catch (error) {
          console.error("Ошибка загрузки данных рекорда круга", error);
          setLapRecordError("Ошибка загрузки данных рекорда круга");
        } finally {
          setLapRecordLoading(false);
        }
      };

      fetchLapRecordFromDB();
    }
  }, [activeTab, race]);

  if (!race || loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "white" }}>
        
      </div>
    );
  }

  const countryCode = countryToFlag[race.Circuit.Location.country] || "un";

  return (
    <div className="race-details fade-in" style={{
      width: "calc(100% - 20px)", margin: "10px", padding: "10px",
      display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#1D1D1F"
    }}>
      {/* Заголовок с кнопкой возврата */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: "#1D1D1F", color: "white", border: "none",
            padding: "5px 10px", borderRadius: "10px", cursor: "pointer"
          }}
        >
          ✕
        </button>
        <img 
          src={`https://flagcdn.com/w80/${countryCode}.png`} 
          alt={race.Circuit.Location.country}
          style={{ 
            width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover",
            objectPosition: ["UAE", "United States", "Singapore", "USA", "Qatar"].includes(race.Circuit.Location.country) 
              ? "20% center" : "center"
          }} 
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <div style={{ color: "white", fontSize: "13px" }}>{translatedRaceName}</div>
          <div style={{ color: "lightgray", fontSize: "10px" }}>{race.Circuit.circuitName}</div>
        </div>
      </div>

      {/* Изображение трассы */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <img
          src={imageSrc}
          alt="Изображение трассы"
          style={{ width: "100%", maxHeight: "100px", objectFit: "contain" }}
        />
      </div>

      {/* Блок навигации по вкладкам через кастомный селект */}
      <CustomSelect
        options={[
          { value: "schedule", label: "Расписание" },
          { value: "lapRecord", label: "Рекорд круга" }
        ]}
        value={activeTab}
        onChange={setActiveTab}
        style={{ width: "100%", marginBottom: "15px" }}
      />

      {/* Контент вкладок */}
      {activeTab === "schedule" && (
        <div>
          {sessions.map((session, index) => (
            <div key={index} style={{
              background: "#212124", padding: "15px", borderRadius: "10px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "10px"
            }}>
              <span style={{ fontSize: "12px", color: "white" }}>
                {sessionTypeTranslations[session.type] || session.type}
              </span>
              <span style={{ color: "lightgray", fontSize: "12px" }}>
                {convertToMoscowTime(session.date, session.time)}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "lapRecord" && (
        <div style={{
          background: "#212124", padding: "15px", borderRadius: "10px",
          color: "white"
        }}>
          {lapRecordLoading && <p> </p>}
          {lapRecordError && <p>{lapRecordError}</p>}
          {!lapRecordLoading && !lapRecordError && lapRecord ? (
            <div>
              <p><strong>Время:</strong> {lapRecord.lapRecord}</p>
              <p><strong>Пилот:</strong> {lapRecord.driver}</p>
              <p><strong>Год:</strong> {lapRecord.year}</p>
            </div>
          ) : (!lapRecordLoading && !lapRecordError && !lapRecord && (
            <p>Данных о рекорде круга нет</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default RaceDetails;
