import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import PilotsList from "./screens/PilotsList";
import ConstructorsList from "./screens/ConstructorsList";
import ConstructorDetails from "./screens/ConstructorDetails";
import RacesList from "./screens/RacesList";
import RaceDetails from "./screens/RaceDetails";
import BottomNavigation from "./components/BottomNavigation";
import logo from "./screens/images/logo.png";
import Feed from "./screens/Feed";
import PilotDetails from "./screens/PilotDetails";
import LegendDetails from "./screens/LegendDetails";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Состояния
  const [activePage, setActivePage] = useState(0);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [userName, setUserName] = useState("");

  // Получаем данные пользователя из Telegram
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
      const userData = window.Telegram.WebApp.initDataUnsafe?.user;
  
      if (userData) {
        const name = userData.username
          ? userData.username
          : `${userData.first_name}${userData.last_name ? " " + userData.last_name : ""}`;
  
        console.log("Имя пользователя:", name); // ✅ Проверяем значение в консоли
  
        setUserName(name); // 👈 Здесь точно строка, а не объект
      } else {
        setUserName("Гость");
      }
    } else {
      setUserName("TestUser");
    }
  }, []);
  

  // Анимация загрузки
  useEffect(() => {
    setTimeout(() => {
      setContentLoaded(true);
    }, 300);

    setTimeout(() => {
      if (contentLoaded) {
        setFadeOut(true);
        setTimeout(() => setLoading(false), 600);
      }
    }, 600);
  }, [contentLoaded]);

  // Функция для навигации
  const handlePageChange = (page) => {
    setSelectedConstructor(null);
    setSelectedRace(null);
    setActivePage(page);
    if (page === 0) navigate("/");
    if (page === 1) navigate("/pilots");
    if (page === 2) navigate("/constructors");
    if (page === 3) navigate("/races");
  };

  const handleSelectConstructor = (constructor) => {
    setSelectedConstructor({
      ...constructor,
      position: constructor.position,
      points: constructor.points,
    });
    navigate("/constructor-details");
  };

  const handleSelectRace = (race) => {
    setSelectedRace(race);
    navigate("/race-details");
  };

  const handleBackToRaces = () => {
    setSelectedRace(null);
    navigate("/races");
  };

  const handleBackToConstructors = () => {
    setSelectedConstructor(null);
    navigate("/constructors");
  };

  const handleBackToPilots = () => {
    navigate("/pilots");
  };

  return (
    <div
      className="App"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F9F9F9",
      }}
    >
      {loading && (
        <div className={`loading-screen ${fadeOut ? "fade-out" : ""}`}>
          <img src={logo} alt="Логотип" className="logo" />
        </div>
      )}

      {!loading && (
        <>
          <div className="content-container">
          <TransitionGroup>
      <CSSTransition key={location.pathname} classNames="page" timeout={500}>
    <div key={location.pathname}>
    <Routes location={location}>
      <Route path="/" element={<Feed userName={userName} />} />
      <Route path="/pilots" element={<PilotsList />} />
      <Route path="/pilot-details/:lastName" element={<PilotDetails />} />
      <Route
        path="/constructors"
        element={<ConstructorsList onConstructorSelect={handleSelectConstructor} />}
      />
      <Route path="/races" element={<RacesList onRaceSelect={handleSelectRace} />} />
      <Route
        path="/constructor-details"
        element={<ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} />}
      />
      <Route path="/races/:raceId" element={<RaceDetails />} />
      <Route path="/legend-details/:lastName" element={<LegendDetails />} />
    </Routes>

    </div>
  </CSSTransition>
</TransitionGroup>

          </div>

          <BottomNavigation setActivePage={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default App;
