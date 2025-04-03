import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

const BottomNavigation = ({ setActivePage, currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (location.pathname === "/feed") {
      setActiveIndex(0);
    } else if (location.pathname === "/standings") {
      setActiveIndex(1);
    } else if (location.pathname === "/races") {
      setActiveIndex(2);
    } else if (location.pathname === "/services") {
      setActiveIndex(3);
    } else if ((currentUser?.role === "creator" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "owner") && location.pathname === "/creator-panel") {
      setActiveIndex(4);
    } else {
      setActiveIndex(-1); // Для всех остальных путей
    }
  }, [location.pathname, currentUser]);

  // Базовые кнопки нижней навигации
  const buttons = [
    { 
      id: 0, 
      label: "Лента", 
      icon: (
        <svg width="29" height="30" viewBox="0 0 29 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.7383 2.56937C12.8924 2.25891 13.2325 2.08705 13.5738 2.14723L19.7289 3.23253C19.9762 3.27614 20.1874 3.43597 20.2967 3.6621C20.4059 3.88823 20.3998 4.15308 20.2802 4.37391L16.0908 12.1107L21.9478 13.1434C22.2417 13.1952 22.4803 13.4099 22.5629 13.6966C22.6455 13.9834 22.5575 14.2921 22.3362 14.4922L9.12291 26.4418C8.84319 26.6948 8.42267 26.7118 8.12342 26.4823C7.82416 26.2527 7.7316 25.8422 7.90343 25.5065L12.2627 16.9888L7.14932 16.0872C6.90684 16.0444 6.69871 15.8898 6.58768 15.6701C6.47665 15.4503 6.47571 15.1911 6.58514 14.9705L12.7383 2.56937Z"/>
        </svg>
      ) 
    },
    { 
      id: 1, 
      label: "Таблица", 
      icon: (
        <svg width="24" height="28" viewBox="0 0 24 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.75 5.75C22.1642 5.75 22.5 6.14175 22.5 6.625V22.375C22.5 22.8582 22.1642 23.25 21.75 23.25H2.25C1.83579 23.25 1.5 22.8582 1.5 22.375V6.625C1.5 6.14175 1.83579 5.75 2.25 5.75H21.75ZM2.25 4C1.00736 4 0 5.17525 0 6.625V22.375C0 23.8247 1.00736 25 2.25 25H21.75C22.9926 25 24 23.8247 24 22.375V6.625C24 5.17525 22.9926 4 21.75 4H2.25Z"/>
          <path d="M4.5 15.375C4.5 14.8918 4.83579 14.5 5.25 14.5H18.75C19.1642 14.5 19.5 14.8918 19.5 15.375C19.5 15.8582 19.1642 16.25 18.75 16.25H5.25C4.83579 16.25 4.5 15.8582 4.5 15.375ZM4.5 18.875C4.5 18.3918 4.83579 18 5.25 18H14.25C14.6642 18 15 18.3918 15 18.875C15 19.3582 14.6642 19.75 14.25 19.75H5.25C4.83579 19.75 4.5 19.3582 4.5 18.875Z"/>
          <path d="M4.5 10.125C4.5 9.64175 4.83579 9.25 5.25 9.25H18.75C19.1642 9.25 19.5 9.64175 19.5 10.125V11.875C19.5 12.3582 19.1642 12.75 18.75 12.75H5.25C4.83579 12.75 4.5 12.3582 4.5 11.875V10.125Z"/>
        </svg>
      ) 
    },
    { 
      id: 2, 
      label: "Гонки", 
      icon: (
        <svg width="25" height="26" viewBox="0 0 25 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.1875 10.6562C17.1875 10.2248 17.5373 9.875 17.9688 9.875H19.5312C19.9627 9.875 20.3125 10.2248 20.3125 10.6562V12.2188C20.3125 12.6502 19.9627 13 19.5312 13H17.9688C17.5373 13 17.1875 12.6502 17.1875 12.2188V10.6562Z"/>
          <path d="M12.5 10.6562C12.5 10.2248 12.8498 9.875 13.2812 9.875H14.8438C15.2752 9.875 15.625 10.2248 15.625 10.6562V12.2188C15.625 12.6502 15.2752 13 14.8438 13H13.2812C12.8498 13 12.5 12.6502 12.5 12.2188V10.6562Z"/>
          <path d="M4.6875 15.3438C4.6875 14.9123 5.03728 14.5625 5.46875 14.5625H7.03125C7.46272 14.5625 7.8125 14.9123 7.8125 15.3438V16.9062C7.8125 17.3377 7.46272 17.6875 7.03125 17.6875H5.46875C5.03728 17.6875 4.6875 17.3377 4.6875 16.9062V15.3438Z"/>
          <path d="M9.375 15.3438C9.375 14.9123 9.72478 14.5625 10.1562 14.5625H11.7188C12.1502 14.5625 12.5 14.9123 12.5 15.3438V16.9062C12.5 17.3377 12.1502 17.6875 11.7188 17.6875H10.1562C9.72478 17.6875 9.375 17.3377 9.375 16.9062V15.3438Z"/>
          <path d="M5.46875 0.5C5.90022 0.5 6.25 0.849778 6.25 1.28125V2.0625H18.75V1.28125C18.75 0.849778 19.0998 0.5 19.5312 0.5C19.9627 0.5 20.3125 0.849778 20.3125 1.28125V2.0625H21.875C23.6009 2.0625 25 3.46161 25 5.1875V22.375C25 24.1009 23.6009 25.5 21.875 25.5H3.125C1.39911 25.5 0 24.1009 0 22.375V5.1875C0 3.46161 1.39911 2.0625 3.125 2.0625H4.6875V1.28125C4.6875 0.849778 5.03728 0.5 5.46875 0.5ZM1.5625 6.75V22.375C1.5625 23.2379 2.26206 23.9375 3.125 23.9375H21.875C22.7379 23.9375 23.4375 23.2379 23.4375 22.375V6.75H1.5625Z"/>
        </svg>
      ) 
    },
    { 
      id: 3, 
      label: "Сервисы", 
      icon: (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.9375 3.25C5.79638 3.25 3.25 5.79638 3.25 8.9375V17.0625C3.25 20.2036 5.79638 22.75 8.9375 22.75H17.0625C20.2036 22.75 22.75 20.2036 22.75 17.0625V13C22.75 12.5513 23.1138 12.1875 23.5625 12.1875C24.0112 12.1875 24.375 12.5513 24.375 13V17.0625C24.375 21.1011 21.1011 24.375 17.0625 24.375H8.9375C4.89892 24.375 1.625 21.1011 1.625 17.0625V8.9375C1.625 4.89892 4.89892 1.625 8.9375 1.625H13C13.4487 1.625 13.8125 1.98877 13.8125 2.4375C13.8125 2.88623 13.4487 3.25 13 3.25H8.9375Z"/>
          <path d="M26 4.875C26 7.56739 23.8174 9.75 21.125 9.75C18.4326 9.75 16.25 7.56739 16.25 4.875C16.25 2.18261 18.4326 0 21.125 0C23.8174 0 26 2.18261 26 4.875Z"/>
        </svg>
      ) 
    },
  ];

  // Если пользователь является криэйтором, добавляем дополнительный пункт меню "Панель"
  if (
    currentUser?.role === "creator" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "owner"
  ) {
    buttons.push({
      id: 4,
      label: "Панель",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20V8H4V4ZM4 10H20V14H4V10ZM4 16H20V20H4V16Z" />
        </svg>
      ),
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: -1,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "5px 20px",
        background: "#1D1D1F",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: currentUser?.role === "creator" || currentUser?.role === "admin" || currentUser?.role === "owner" ? 25 : 45,
        zIndex: 998,
        width: "100%"
      }}
    >
      {buttons.map((button) => (
        <div
          key={button.id}
          onClick={() => {
            setActivePage(button.id);
            setActiveIndex(button.id);
            if (button.label === "Панель") {
              navigate("/creator-panel");
            }
          }}
          style={{
            width: 50,
            height: 70,
            borderRadius: 15,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            transition: "transform 0.2s ease",
            background: "transparent"
          }}
        >
          <span
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: 30,
              height: 30,
              color: activeIndex === button.id ? "#00b9ff" : "gray",
              transition: "color 0.3s ease",
            }}
          >
            {button.icon}
          </span>
          <span
            style={{
              marginTop: 4,
              fontSize: 12,
              color: activeIndex === button.id ? "#00b9ff" : "gray",
              transition: "color 0.3s ease",
            }}
          >
            {button.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BottomNavigation;
