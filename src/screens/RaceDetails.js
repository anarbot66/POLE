import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const countryToFlag = {
  "Bahrain": "bh", "Saudi Arabia": "sa", "Australia": "au", "Japan": "jp",
  "China": "cn", "USA": "us", "United States": "us", "Miami": "us",
  "Italy": "it", "Monaco": "mc", "Canada": "ca", "Spain": "es",
  "Austria": "at", "Great Britain": "gb", "United Kingdom": "gb", "UK": "gb",
  "Hungary": "hu", "Belgium": "be", "Netherlands": "nl", "Singapore": "sg",
  "Mexico": "mx", "Brazil": "br", "Las Vegas": "us", "UAE": "ae",
  "Qatar": "qa", "Azerbaijan": "az"
};

const sessionTypeTranslations = {
  "FirstPractice": "Свободная практика 1",
  "SecondPractice": "Свободная практика 2",
  "ThirdPractice": "Свободная практика 3",
  "Qualifying": "Квалификация",
  "Sprint": "Спринт",
  "SprintQualifying": "Квалификация к спринту",
  "Race": "Гонка"
};

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

const convertToMoscowTime = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return "—";
  const date = new Date(`${utcDate}T${utcTime}`);
  date.setHours(date.getHours());
  return date.toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });
};

const RaceDetails = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const race = location.state?.race;

  useEffect(() => {
    const loadImage = async () => {
      if (!race) return;

      const circuitName = race.Circuit.Location.locality;
      try {
        const image = await import(`./images/circuits/${circuitName}.png`);
        const img = new Image();
        img.src = image.default;
        img.onload = () => {
          setImageSrc(image.default);
          setLoading(false); // Снимаем загрузку только после загрузки изображения
        };
        img.onerror = () => {
          console.error("Ошибка загрузки изображения");
          setLoading(false); // Снимаем загрузку даже если изображение не найдено
        };
      } catch (error) {
        console.error("Ошибка загрузки изображения", error);
        setLoading(false);
      }
    };

    loadImage();
  }, [race]);

  if (!race || loading) {
    return <div style={{ padding: "20px", textAlign: "center", color: "white" }}>Загрузка...</div>;
  }

  const countryCode = countryToFlag[race.Circuit.Location.country] || "un";
  const sessions = [
    { type: "FirstPractice", date: race.FirstPractice?.date, time: race.FirstPractice?.time },
    { type: "SecondPractice", date: race.SecondPractice?.date, time: race.SecondPractice?.time },
    { type: "ThirdPractice", date: race.ThirdPractice?.date, time: race.ThirdPractice?.time },
    { type: "Qualifying", date: race.Qualifying?.date, time: race.Qualifying?.time },
    { type: "Sprint", date: race.Sprint?.date, time: race.Sprint?.time },
    { type: "Race", date: race.date, time: race.time }
  ].filter(session => session.date);
  const translatedRaceName = raceNameTranslations[race.raceName] || race.raceName;

  return (
    <div className="race-details" style={{
      width: "calc(100% - 20px)", margin: "10px", padding: "10px",
      display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#1D1D1F"
    }}>
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

      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <img
          src={imageSrc}
          alt=""
          style={{ width: "100%", maxHeight: "100px", objectFit: "contain" }}
        />
      </div>

      <h3 style={{color: "white"}}>Расписание уик-энда</h3>
      {sessions.map((session, index) => (
        <div key={index} style={{
          background: "#212124", padding: "15px", borderRadius: "10px",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{fontSize: "12px", color: "white"}}>{sessionTypeTranslations[session.type] || session.type}</span>
          <span style={{ color: "lightgray", fontSize: "12px" }}>{convertToMoscowTime(session.date, session.time)}</span>
        </div>
      ))}
    </div>
  );
};

export default RaceDetails;
