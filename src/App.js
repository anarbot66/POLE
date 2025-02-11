import './App.css';
import React, { useState, useEffect } from 'react';
import PilotsList from './screens/PilotsList';
import ConstructorsList from './screens/ConstructorsList';
import ConstructorDetails from './screens/ConstructorDetails';
import RacesList from './screens/RacesList'; // ✅ Добавили страницу календаря
import BottomNavigation from "./components/BottomNavigation";
import logo from './screens/images/logo.png';

function App() {
  const [activePage, setActivePage] = useState(0); // 0 - Pilots, 1 - Constructors, 2 - Races
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();

      const user = window.Telegram.WebApp.initDataUnsafe.user;
      const chat = window.Telegram.WebApp.initDataUnsafe.chat;

      console.log(user);
      console.log(chat);
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
    setSelectedConstructor(null); // ✅ Сбрасываем выбранного конструктора при смене страницы
    setActivePage(page);
  };

  const handleSelectConstructor = (constructor) => {
    setSelectedConstructor({
      ...constructor,
      position: constructor.position,
      points: constructor.points,
    });
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
          {selectedConstructor ? (
            <ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} />
          ) : activePage === 0 ? (
            <PilotsList />
          ) : activePage === 1 ? (
            <ConstructorsList onConstructorSelect={handleSelectConstructor} />
          ) : (
            <RacesList /> // ✅ Теперь третья кнопка переключает на календарь
          )}

          <BottomNavigation setActivePage={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default App;
