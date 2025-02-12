import React from "react";



const countryToFlag = {
  "Bahrain": "bh", "Saudi Arabia": "sa", "Australia": "au", "Japan": "jp",
  "China": "cn", "USA": "us", "United States": "us", "Miami": "us",
  "Italy": "it", "Monaco": "mc", "Canada": "ca", "Spain": "es",
  "Austria": "at", "Great Britain": "gb", "United Kingdom": "gb",
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

const convertToMoscowTime = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return "—";
  const date = new Date(`${utcDate}T${utcTime}`);
  date.setHours(date.getHours() + 3);
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

  return (
    <div style={{
      width: "calc(100% - 20px)", margin: "0 auto", padding: "10px",
      display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#F9F9F9"
    }}>
      <button onClick={goBack} style={{
        backgroundColor: "white", color: "black", padding: "10px",
        borderRadius: "10px", border: "1px solid #ddd", cursor: "pointer", marginBottom: "10px"
      }}>
        Назад
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img src={`https://flagcdn.com/w80/${countryCode}.png`} alt={race.Circuit.Location.country}
          style={{ width: "50px", height: "50px", borderRadius: "50%" }} />
        <div>
          <h2 style={{ margin: 0 }}>{race.raceName}</h2>
          <p style={{ margin: 0, color: "gray" }}>{race.Circuit.circuitName}</p>
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
