import './App.css';
import React, { useState, useEffect } from 'react';
import PilotsList from './screens/PilotsList';
import ConstructorsList from './screens/ConstructorsList';
import ConstructorDetails from './screens/ConstructorDetails';
import RacesList from './screens/RacesList';
import RaceDetails from './screens/RaceDetails'; // Добавляем страницу с деталями гонки
import BottomNavigation from "./components/BottomNavigation";
import logo from './screens/images/logo.png';
import Feed from "./screens/Feed";

function App() {
  const [activePage, setActivePage] = useState(0);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null); // Новое состояние для выбранной гонки
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
      console.log(window.Telegram.WebApp.initDataUnsafe.user);
    }

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
    setSelectedConstructor(null); // Сбрасываем выбранного конструктора при смене страницы
    setSelectedRace(null); // Сбрасываем выбранную гонку
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
              <RaceDetails race={selectedRace} goBack={handleBackToRaces} /> // Отображаем детали гонки
            ) : activePage === 0 ? (
              <Feed />
            ) : activePage === 1 ? (
              <PilotsList />
            ) : activePage === 2 ? (
              <ConstructorsList onConstructorSelect={handleSelectConstructor} />
            ) : (
              <RacesList onRaceSelect={handleSelectRace} /> // Передаем обработчик выбора гонки
            )}
          </div>

          <BottomNavigation setActivePage={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default App;
