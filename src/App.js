import './App.css';
import React, { useState, useEffect } from 'react';
import Home from './screens/Home';
import PilotsList from './screens/PilotsList';
import ConstructorsList from './screens/ConstructorsList';
import BottomNavigation from "./components/BottomNavigation";

function App() {
  // Состояние для активной страницы
  const [activePage, setActivePage] = useState(0); // 0 - Pilots, 1 - Constructors

  // Проверка на наличие Telegram Web App SDK
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();

      const user = window.Telegram.WebApp.initDataUnsafe.user;
      const chat = window.Telegram.WebApp.initDataUnsafe.chat;

      console.log(user);
      console.log(chat);
    }
  }, []);

  return (
    <div className="App" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: '#F9F9F9' }}>
      {/* Основной контент */}
      {activePage === 0 ? <PilotsList /> : <ConstructorsList />}

      {/* Кнопка для открытия вашего приложения в Telegram Web App */}
      <button
        onClick={() => {
          window.Telegram.WebApp.openLink('https://pole-cwd8.onrender.com/');
        }}
      >
        Open Mini App
      </button>

      {/* Навигация */}
      <BottomNavigation setActivePage={setActivePage} />
    </div>
  );
}

export default App;
