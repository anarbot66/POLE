import { useState, useEffect} from "react";
import RaceDetails from "./RaceDetails";
import { useNavigate } from "react-router-dom";
import { useSwipeable } from 'react-swipeable';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import UserStats from "../user/components/UserStats";
import logo from "../recources/images/logo.png";


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
  "British Grand Prix": "ВеликоВеликобритания",
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
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showNotifs, setShowNotifs] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  

  const tabs = ['upcoming','past'];
  const goPrev = () => {
    const i = tabs.indexOf(activeTab);
    const prev = tabs[(i - 1 + tabs.length) % tabs.length];
    setActiveTab(prev);
  };
  const goNext = () => {
    const i = tabs.indexOf(activeTab);
    const next = tabs[(i + 1) % tabs.length];
    setActiveTab(next);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => goNext(),
    onSwipedRight: () => goPrev(),
    trackMouse: true,    // чтобы работало и мышью
    preventDefaultTouchmoveEvent: true
  });

  const today = new Date();
  const upcomingRaces = races.filter(r => new Date(r.FirstPractice.date) >= today);
  const pastRaces = races
  .filter(r => new Date(r.FirstPractice.date) < today)
  .sort((a, b) => new Date(b.FirstPractice.date) - new Date(a.FirstPractice.date));


  const nextRace = upcomingRaces.find(r => new Date(r.FirstPractice.date) > today);

  const nextStartTs = nextRace
  ? new Date(`${nextRace.FirstPractice.date}T${nextRace.FirstPractice.time}`).getTime()
  : null;

    useEffect(() => {
      if (!nextStartTs) return;
    
      const update = () => {
        const now = new Date();
        let diff = nextStartTs - now;
    
        if (diff <= 0) {
          setTimeLeft({ hours: 0, mins: 0, secs: 0 });
        } else {
          // общее количество часов
          const totalHours = Math.floor(diff / (1000 * 60 * 60));
          diff -= totalHours * (1000 * 60 * 60);
    
          const mins = Math.floor(diff / (1000 * 60));
          diff -= mins * (1000 * 60);
    
          const secs = Math.floor(diff / 1000);
    
          setTimeLeft({ hours: totalHours, mins, secs });
        }
      };
    
      update();
  const timerId = setInterval(update, 1000);
  return () => clearInterval(timerId);
}, [nextStartTs]);
    

  const displayedRaces = activeTab === "upcoming"
   ? upcomingRaces.filter(r => r !== nextRace)
   : pastRaces;

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


  let nextRaceCountry = "";
  let nextRaceCountryCode = "";
  if (nextRace) {
    nextRaceCountry = nextRace.Circuit.Location.country;
    if (nextRaceCountry === "Great Britain") nextRaceCountry = "United Kingdom";
    nextRaceCountryCode = countryToFlag[nextRaceCountry] || "un";
  }

  


  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        marginBottom: "70px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "20px",
      }}
    >
      <div 
        style={{
          width: "calc(100% - 30px)",
          margin: "0px 15px",
          paddingTop: "15px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="buttonGlass" style={{borderRadius: '15px', position: 'fixed', width: "100%", left: '0', top: '0'}}>
      <div style={{background: 'rgb(17, 17, 19)', height: '110px', display: 'flex', flexDirection: 'column', alignItems: "center"}}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: 15,
          height: '100%',
          width: '100%',
          width: 'calc(100% - 50px)'
        }}
      >
        <img src={logo} alt='logo' style={{width: '20px', height: '20px'}}></img>
        <span style={{ color: 'white', width: '100%', fontSize: '18px'}}>
          Расписание
        </span>
        <div style={{display: 'flex', gap: '20px', width : "100%", justifyContent: 'end', alignItems: 'center'}}>
        <img
          src={currentUser.photoUrl || 'https://placehold.co/80x80'}
          alt="Avatar"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
          }}
        ></img>
        </div>
        </div>
        <div style={{ position: "relative", display: "flex", borderRadius: "20px", width: '100%'}}>
        
      {/* Кнопки */}
      <button
        onClick={() => setActiveTab("upcoming")}
        style={{
          padding: "10px 20px",
          width: "100%",
          color: activeTab === "upcoming" ? "white" : "var(--col-darkGray)",
          background: activeTab === "upcoming" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Будущие
      </button>
      <button
        onClick={() => setActiveTab("past")}
        style={{
          padding: "10px 20px",
          width: "100%",
          color: activeTab === "past" ? "white" : "var(--col-darkGray)",
          background: activeTab === "past" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Завершены
      </button>

      <div
    style={{
      position: "absolute",
      bottom: -3,
      left: activeTab === "upcoming" ? "25%" : "75%", 
      transform: "translateX(-50%)",                
      height: "6px",
      width: "40%",
      backgroundColor: "blue",
      transition: "left 0.3s ease",
      pointerEvents: "none",
      borderRadius: '3px'
    }}
  />
    </div>
      </div>
      
      </div>

      </div>
      <TransitionGroup>
          <CSSTransition
            key={activeTab}
            classNames="tab"
            timeout={400}
          >
            <div {...swipeHandlers} style={{
              display: "flex",
              gap: "15px",
              flexDirection: 'column',
              margin: "90px auto 10px auto",
              background: '#141416',
              borderRadius: '15px',
              width: "calc(100% - 30px)",
              padding: '15px'
            }}>
              
      {activeTab === 'upcoming' && nextRace && (
          <div onClick={() => handleRaceSelect(nextRace)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: '5px 10px 0px 10px',
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
                {timeLeft && (
  <div style={{ fontSize: 28, color: "white" }}>
    {String(timeLeft.hours).padStart(2, '0')}&nbsp;ч.&nbsp;
    {String(timeLeft.mins).padStart(2, '0')}&nbsp;м.&nbsp;
    {String(timeLeft.secs).padStart(2, '0')}&nbsp;с.&nbsp;
  </div>
)}

              </div>
            </div>
          </div>
        )}

      {displayedRaces.map((race, index) => {
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
              display: "flex",
              borderRadius: "15px",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
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
          </CSSTransition>
        </TransitionGroup>
    </div>
  );
};

export default RacesList;
