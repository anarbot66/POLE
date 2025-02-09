import React, { useState, useEffect } from 'react';
import biographies from './json/bio'; // подключаем данные о биографиях

// Словарь для перевода имен пилотов на русский
const firstNameTranslations = {
  "Max": "Макс",
  "Lando": "Ландо",
  "Charles": "Шарль",
  "Oscar": "Оскар",
  "Carlos": "Карлос",
  "George": "Джордж",
  "Lewis": "Льюис",
  "Sergio": "Серхио",
  "Fernando": "Фернандо",
  "Pierre": "Пьер",
  "Nico": "Нико",
  "Yuki": "Юки",
  "Lance": "Лэнс",
  "Esteban": "Эстебан",
  "Kevin": "Кевин",
  "Alexander": "Александер",
  "Daniel": "Даниэль",
  "Oliver": "Оливер",
  "Franco": "Франко",
  "Guanyu": "Гуанью",
  "Liam": "Лиам",
  "Valtteri": "Валттери",
  "Logan": "Логан",
  "Jack": "Джек",
};

// Словарь для перевода фамилий пилотов на русский
const lastNameTranslations = {
  "Verstappen": "Ферстаппен",
  "Norris": "Норрис",
  "Leclerc": "Леклер",
  "Piastri": "Пиастри",
  "Sainz": "Сайнс",
  "Russell": "Расселл",
  "Hamilton": "Хэмилтон",
  "Pérez": "Перес",
  "Alonso": "Алонсо",
  "Gasly": "Гасли",
  "Hülkenberg": "Хюлькенберг",
  "Tsunoda": "Цунода",
  "Stroll": "Стролл",
  "Ocon": "Окон",
  "Magnussen": "Магнуссен",
  "Albon": "Албон",
  "Ricciardo": "Риккьярдо",
  "Bearman": "Бирман",
  "Colapinto": "Колапинто",
  "Zhou": "Джоу",
  "Lawson": "Лоусон",
  "Bottas": "Боттас",
  "Sargeant": "Сарджент",
  "Doohan": "Дуэн",
};



const PilotDetails = ({ pilot, teamColors, pilotResults, goBack }) => {
  const [biography, setBiography] = useState(""); // Стейт для биографии пилота
  const [fadeIn, setFadeIn] = useState(false); // Для плавного появления страницы

  useEffect(() => {
    // Загрузка биографии пилота из объекта
    const lastNameNormalized = normalizeName(pilot.Driver.familyName);
    const bio = biographies[lastNameNormalized]?.biography || "Биография не найдена";
    setBiography(bio); // Устанавливаем биографию

    // Плавное появление контента
    setTimeout(() => setFadeIn(true), 100);
  }, [pilot]);

  const normalizeName = (name) => {
    // Нормализуем фамилию в нижний регистр и удаляем диакритические знаки
    return name
      .normalize("NFD") // Нормализация с разделением символов и диакритики
      .replace(/[\u0300-\u036f]/g, "") // Удаление всех диакритических знаков
      .toLowerCase(); // Преобразуем в нижний регистр
  };

  const teamColor = teamColors[pilot.Constructors[0].name] || "#000000";
  const pilotFirstName = firstNameTranslations[pilot.Driver.givenName] || pilot.Driver.givenName;
  const pilotLastName = lastNameTranslations[pilot.Driver.familyName] || pilot.Driver.familyName;

  return (
    <div
      className={`pilot-details ${fadeIn ? "fade-in" : ""}`}
      style={{
        width: "calc(100% - 40px)", // Убираем отступы по бокам
        margin: "0 auto", // Центрируем контейнер
        padding: "15px",
        background: "white",
        borderRadius: "20px",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "19px",
        display: "inline-flex",
        marginTop: "10px",
      }}
    >
      {/* Кнопка "Назад" */}
      <button
        onClick={goBack}
        style={{
          position: "fixed",
          left: "25px",
          bottom: "120px",
          backgroundColor: "white",
          color: "black",
          border: "none",
          padding: "10px 20px",
          borderRadius: "10px",
          cursor: "pointer",
          zIndex: "1000",
        }}
      >
        Назад
      </button>

      {/* Заголовок с информацией о пилоте и команде */}
      <div style={{
        width: "100%",
        height: "70px",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        display: "flex"
      }}>
        <div style={{
          width: "100%",
          height: "60px",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          display: "flex"
        }}>
          <div style={{
            color: "black",
            fontSize: "16px",
            fontFamily: "Inter",
            fontWeight: "400",
            wordWrap: "break-word"
          }}>
            {pilotFirstName}
          </div>
          <div style={{
            color: "#B9B9B9",
            fontSize: "16px",
            fontFamily: "Inter",
            fontWeight: "400",
            wordWrap: "break-word"
          }}>
            {pilotLastName}
          </div>
        </div>
        <div style={{
          color: teamColor,
          fontSize: "12px",
          fontFamily: "Inter",
          fontWeight: "600",
          wordWrap: "break-word"
        }}>
          {pilot.Constructors[0].name}
        </div>
      </div>

      {/* Полоска в цвет команды */}
      <div style={{
        width: "100%",
        height: "5px",
        background: teamColor
      }} />

      {/* Статистика пилота */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        width: "100%"
      }}>
        {/* Позиция */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{
            color: "black",
            fontSize: "16px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            {pilot.position}
          </span>
          <div style={{
            color: "#B9B9B9",
            fontSize: "10px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            ПОЗИЦИЯ
          </div>
        </div>

        {/* Очки */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{
            color: "black",
            fontSize: "16px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            {pilot.points}
          </span>
          <div style={{
            color: "#B9B9B9",
            fontSize: "10px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            ОЧКОВ
          </div>
        </div>

        {/* Победы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{
            color: "black",
            fontSize: "16px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            {pilotResults?.wins || 0}
          </span>
          <div style={{
            color: "#B9B9B9",
            fontSize: "10px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            ПОБЕД
          </div>
        </div>

        {/* Подиумы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{
            color: "black",
            fontSize: "16px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            {pilotResults?.podiums || 0}
          </span>
          <div style={{
            color: "#B9B9B9",
            fontSize: "10px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            ПОДИУМОВ
          </div>
        </div>

        {/* Поулы */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{
            color: "black",
            fontSize: "16px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            {pilotResults?.poles || 0}
          </span>
          <div style={{
            color: "#B9B9B9",
            fontSize: "10px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            ПОУЛОВ
          </div>
        </div>

        {/* DNF */}
        <div style={{ width: "65px", textAlign: "center" }}>
          <span style={{
            color: "black",
            fontSize: "16px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            {pilotResults?.dnf || 0}
          </span>
          <div style={{
            color: "#B9B9B9",
            fontSize: "10px",
            fontFamily: "Inter",
            fontWeight: "600",
            wordWrap: "break-word"
          }}>
            DNF
          </div>
        </div>
      </div>

      {/* Биография пилота (нижняя часть) */}
      <div style={{
        width: "100%",
        marginTop: "20px",
        padding: "10px",
        backgroundColor: "white",
        borderRadius: "8px",
        fontSize: "14px",
        color: "black",
        fontFamily: "Arial, sans-serif",
      }}>
        <strong>Биография:</strong>
        <p>{biography}</p>
      </div>
    </div>
  );
};

export default PilotDetails;
