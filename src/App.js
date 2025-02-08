import './App.css';
import React, { useEffect } from 'react';
import Home from './screens/Home';
import PilotsList from './screens/PilotsList';
import BottomNavigation from "./components/BottomNavigation";

function App() {
  useEffect(() => {
    // Проверка на наличие Telegram Web App SDK
    if (window.Telegram && window.Telegram.WebApp) {
      // Расширяет Web App на весь экран внутри Telegram
      window.Telegram.WebApp.expand();

      // Вы можете получать данные о пользователе и чате, если нужно
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      const chat = window.Telegram.WebApp.initDataUnsafe.chat;

      console.log(user);
      console.log(chat);
    }
  }, []);

  return (
    <div className="App" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Основной контент вашего приложения */}
      <PilotsList />
      
      {/* Кнопка для открытия вашего приложения в Telegram Web App */}
      <button
        onClick={() => {
          // Открывает ваше приложение в Telegram Web App
          window.Telegram.WebApp.openLink('https://pole-cwd8.onrender.com/');
        }}
      >
        Open Mini App
      </button>
      
      {/* Навигация */}
      <BottomNavigation />
    </div>
  );
}

export default App;
