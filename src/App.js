// App.jsx
import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PilotsList from "./screens/PilotsList";
import ConstructorsList from "./screens/ConstructorsList";
import ConstructorDetails from "./screens/ConstructorDetails";
import RacesList from "./screens/RacesList";
import RaceDetails from "./screens/RaceDetails";
import BottomNavigation from "./components/BottomNavigation";
import logo from "./screens/images/logo.png";
import Feed from "./screens/Feed";

function App() {
  const navigate = useNavigate();

  // Сохраняем существующие состояния
  const [activePage, setActivePage] = useState(0);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [userName, setUserName] = useState(""); // Для имени пользователя

  // Эффект для получения данных пользователя из Telegram
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
      console.log("Telegram WebApp object:", window.Telegram.WebApp);
      const userData = window.Telegram.WebApp.initDataUnsafe.user;
      if (userData) {
        const name = userData.username
          ? userData.username
          : `${userData.first_name}${userData.last_name ? " " + userData.last_name : ""}`;
        setUserName(name);
      } else {
        setUserName("Гость");
      }
    } else {
      setUserName("TestUser");
    }
  }, []);

  // Эффект для анимации загрузки
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

  // Метод перехода между главными экранами (Feed, PilotsList, ConstructorsList, RacesList)
  const handlePageChange = (page) => {
    setSelectedConstructor(null);
    setSelectedRace(null);
    setActivePage(page);
    if (page === 0) {
      navigate("/");
    } else if (page === 1) {
      navigate("/pilots");
    } else if (page === 2) {
      navigate("/constructors");
    } else if (page === 3) {
      navigate("/races");
    }
  };

  // При выборе конструктора переходим на страницу деталей
  const handleSelectConstructor = (constructor) => {
    setSelectedConstructor({
      ...constructor,
      position: constructor.position,
      points: constructor.points,
    });
    navigate("/constructor-details");
  };

  // При выборе гонки переходим на страницу деталей
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
            <Routes>
              <Route path="/" element={<Feed userName={userName} />} />
              <Route path="/pilots" element={<PilotsList />} />
              <Route
                path="/constructors"
                element={<ConstructorsList onConstructorSelect={handleSelectConstructor} />}
              />
              <Route path="/races" element={<RacesList onRaceSelect={handleSelectRace} />} />
              <Route
                path="/constructor-details"
                element={
                  <ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} />
                }
              />
              <Route
                path="/race-details"
                element={<RaceDetails race={selectedRace} goBack={handleBackToRaces} />}
              />
            </Routes>
          </div>

          <BottomNavigation setActivePage={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default App;
