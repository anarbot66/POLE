import React from "react";



const countryToFlag = {
  "Bahrain": "bh", "Saudi Arabia": "sa", "Australia": "au", "Japan": "jp",
  "China": "cn", "USA": "us", "United States": "us", "Miami": "us",
  "Italy": "it", "Monaco": "mc", "Canada": "ca", "Spain": "es",
  "Austria": "at", "Great Britain": "gb", "United Kingdom": "gb", "UK": "uk",
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
  

const convertToMoscowTime = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return "—";
  const date = new Date(`${utcDate}T${utcTime}`);
  date.setHours(date.getHours());
  return date.toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });
};

const RaceDetails = ({ race, goBack }) => {
  if (!race) return <div style={{ padding: "20px", textAlign: "center" }}>Загрузка...</div>;

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
      width: "calc(100% - 20px)",
        margin: "10px 10px 100px", padding: "10px",
      display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#F9F9F9"
    }}>
      <button
        onClick={goBack}
        style={{
          position: "fixed",
          left: "25px",
          bottom: "120px",
          backgroundColor: "white",
          color: "black",
          border: "none",
          padding: "10px 20px",
          borderRadius: "10px",
          cursor: "pointer",
          zIndex: "1000",
        }}
      >
        Назад
      </button>
      

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
      </div>

      

      <h3>Расписание уик-энда</h3>
      {sessions.map((session, index) => (
        <div key={index} style={{
          background: "white", padding: "10px", borderRadius: "10px",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span>{sessionTypeTranslations[session.type] || session.type}</span>
          <span style={{ color: "gray" }}>{convertToMoscowTime(session.date, session.time)}</span>
        </div>
      ))}
    </div>
  );
};

export default RaceDetails;
