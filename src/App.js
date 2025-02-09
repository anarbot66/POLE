import './App.css';
import React, { useState, useEffect } from 'react';
import PilotsList from './screens/PilotsList';
import ConstructorsList from './screens/ConstructorsList';
import ConstructorDetails from './screens/ConstructorDetails'; // Импортируем страницу конструктора
import BottomNavigation from "./components/BottomNavigation";
import logo from './screens/images/logo.png';

function App() {
  // Состояние для активной страницы
  const [activePage, setActivePage] = useState(0); // 0 - Pilots, 1 - Constructors, 2 - ConstructorDetails
  const [selectedConstructor, setSelectedConstructor] = useState(null); // Храним выбранный конструктор
  const [loading, setLoading] = useState(true); // Состояние загрузки
  const [fadeOut, setFadeOut] = useState(false); // Управляет исчезновением экрана загрузки
  const [contentLoaded, setContentLoaded] = useState(false); // Проверка загрузки контента

  // Проверка на наличие Telegram Web App SDK
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();

      const user = window.Telegram.WebApp.initDataUnsafe.user;
      const chat = window.Telegram.WebApp.initDataUnsafe.chat;

      console.log(user);
      console.log(chat);
    }

    // Симуляция загрузки контента
    setTimeout(() => {
      setContentLoaded(true); // Контент загружен
    }, 300); // Эмулируем задержку для загрузки данных

    // После 3 секунд начинаем затухание экрана загрузки
    setTimeout(() => {
      if (contentLoaded) {
        setFadeOut(true); // Запускаем анимацию исчезновения
        setTimeout(() => setLoading(false), 600); // После 0.6 секунды скрываем экран
      }
    }, 600);
  }, [contentLoaded]);

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const handleSelectConstructor = (constructor) => {
    setSelectedConstructor(constructor);
    setActivePage(2); // Переключаем на страницу конструктора
  };

  const handleBackToConstructors = () => {
    setSelectedConstructor(null); // Сбрасываем выбранный конструктор
    setActivePage(1); // Возвращаемся на страницу списка конструкторов
  };

  return (
    <div className="App" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: '#F9F9F9' }}>
      {/* Экран загрузки с эффектом затухания */}
      {loading && (
        <div className={`loading-screen ${fadeOut ? "fade-out" : ""}`}>
          <img src={logo} alt="Логотип" className="logo" />
        </div>
      )}

      {/* Основной контент, который появляется после загрузки */}
      {!loading && (
        <>
          {activePage === 0 ? (
            <PilotsList />
          ) : activePage === 1 ? (
            <ConstructorsList onConstructorSelect={handleSelectConstructor} />
          ) : (
            <ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} />
          )}
          <BottomNavigation setActivePage={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default App;
