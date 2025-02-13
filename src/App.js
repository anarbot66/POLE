import './App.css';
import React, { useState, useEffect } from 'react';
import PilotsList from './screens/PilotsList';
import ConstructorsList from './screens/ConstructorsList';
import ConstructorDetails from './screens/ConstructorDetails';
import RacesList from './screens/RacesList';
import RaceDetails from './screens/RaceDetails';
import BottomNavigation from "./components/BottomNavigation";
import logo from './screens/images/logo.png';
import Feed from "./screens/Feed";

function App() {
  const [activePage, setActivePage] = useState(0);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [userName, setUserName] = useState(""); // Состояние для имени пользователя

  // Эффект для получения данных пользователя из Telegram
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      // Раскрываем Web App (это сделает его полноэкранным, уберёт отступы и т.п.)
      window.Telegram.WebApp.expand();
      console.log("Telegram WebApp object:", window.Telegram.WebApp);
      const userData = window.Telegram.WebApp.initDataUnsafe.user;
      if (userData) {
        // Если задан username, используем его, иначе объединяем first_name и last_name
        const name = userData.username 
          ? userData.username 
          : `${userData.first_name}${userData.last_name ? " " + userData.last_name : ""}`;
        setUserName(name);
      } else {
        setUserName("Гость");
      }
    } else {
      // Если приложение не запущено через Telegram – для разработки
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

  const handlePageChange = (page) => {
    setSelectedConstructor(null);
    setSelectedRace(null);
    setActivePage(page);
  };

  const handleSelectConstructor = (constructor) => {
    setSelectedConstructor({
      ...constructor,
      position: constructor.position,
      points: constructor.points,
    });
  };

  const handleSelectRace = (race) => {
    setSelectedRace(race);
  };

  const handleBackToRaces = () => {
    setSelectedRace(null);
  };

  const handleBackToConstructors = () => {
    setSelectedConstructor(null);
  };

  return (
    <div className="App" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: '#F9F9F9' }}>
      {loading && (
        <div className={`loading-screen ${fadeOut ? "fade-out" : ""}`}>
          <img src={logo} alt="Логотип" className="logo" />
        </div>
      )}

      {!loading && (
        <>
          <div className="content-container">
            {selectedConstructor ? (
              <ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} />
            ) : selectedRace ? (
              <RaceDetails race={selectedRace} goBack={handleBackToRaces} />
            ) : activePage === 0 ? (
              // Передаём имя пользователя в Feed через проп userName
              <Feed userName={userName} />
            ) : activePage === 1 ? (
              <PilotsList />
            ) : activePage === 2 ? (
              <ConstructorsList onConstructorSelect={handleSelectConstructor} />
            ) : (
              <RacesList onRaceSelect={handleSelectRace} />
            )}
          </div>

          <BottomNavigation setActivePage={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default App;
