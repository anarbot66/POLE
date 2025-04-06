import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";

const Services = ({currentUser}) => {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const isAdminOrOwner = currentUser && (currentUser.role === "owner");

  // Функция-обработчик для кнопок, где нет своей логики
  const handleUnavailableFeature = () => {
    setShowNotification(true);
  };

  return (
    <div
      style={{
        width: "calc(100% - 20px)",
        height: "100%",
        margin: "0 auto",
        marginBottom: "100px",
        paddingTop: "15px"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px",
          borderRadius: 15
        }}
      >
        <span style={{ color: "white", padding: "10px", fontSize: 22}}>
          Сервисы
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start"
        }}
      >
        {/* Кнопка "Информация" – навигация */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div
            onClick={() => navigate("/info")}
            style={{
              width: 60,
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: "#212124",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "background 0.3s ease, transform 0.2s ease"
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 30,
                height: 30,
                color: "white"
              }}
            >
              <svg
                width="35"
                height="35"
                viewBox="0 0 35 35"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.2352 13.2885L14.622 14.1173L14.3852 15.2167L15.6875 15.4534C16.5332 15.6564 16.7024 15.9609 16.5163 16.8065L14.3852 26.8194C13.827 29.4072 14.6896 30.625 16.7193 30.625C18.2922 30.625 20.1189 29.8977 20.9477 28.8998L21.2014 27.6989C20.6263 28.2063 19.7806 28.4093 19.2225 28.4093C18.4275 28.4093 18.14 27.8512 18.343 26.8702L21.2352 13.2885Z"
                  fill="white"
                />
                <path
                  d="M21.4352 7.2616C21.4352 8.85582 20.1429 10.1482 18.5486 10.1482C16.9544 10.1482 15.662 8.85582 15.662 7.2616C15.662 5.66737 16.9544 4.375 18.5486 4.375C20.1429 4.375 21.4352 5.66737 21.4352 7.2616Z"
                  fill="white"
                />
              </svg>
            </span>
          </div>
          <div style={{ marginTop: "8px", color: "white", fontSize: "10px" }}>Информация</div>
        </div>

        {/* Кнопка "Друзья" – навигация */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div
            onClick={() => navigate("/usersearch")}
            style={{
              width: 60,
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: "#212124",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "background 0.3s ease, transform 0.2s ease"
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 30,
                height: 30,
                color: "white"
              }}
            >
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10.9375 21.875C10.9375 21.875 9.375 21.875 9.375 20.3125C9.375 18.75 10.9375 14.0625 17.1875 14.0625C23.4375 14.0625 25 18.75 25 20.3125C25 21.875 23.4375 21.875 23.4375 21.875H10.9375Z"
                  fill="white"
                />
                <path
                  d="M17.1875 12.5C19.7763 12.5 21.875 10.4013 21.875 7.8125C21.875 5.22367 19.7763 3.125 17.1875 3.125C14.5987 3.125 12.5 5.22367 12.5 7.8125C12.5 10.4013 14.5987 12.5 17.1875 12.5Z"
                  fill="white"
                />
                <path
                  d="M8.15056 21.875C7.93057 21.4311 7.8125 20.9049 7.8125 20.3125C7.8125 18.1946 8.87352 16.0165 10.8374 14.4999C9.97827 14.2251 8.97671 14.0625 7.8125 14.0625C1.5625 14.0625 0 18.75 0 20.3125C0 21.875 1.5625 21.875 1.5625 21.875H8.15056Z"
                  fill="white"
                />
                <path
                  d="M7.03125 12.5C9.18861 12.5 10.9375 10.7511 10.9375 8.59375C10.9375 6.43639 9.18861 4.6875 7.03125 4.6875C4.87389 4.6875 3.125 6.43639 3.125 8.59375C3.125 10.7511 4.87389 12.5 7.03125 12.5Z"
                  fill="white"
                />
              </svg>
            </span>
          </div>
          <div style={{ marginTop: "8px", color: "white", fontSize: "10px" }}>Друзья</div>
        </div>

        {/* Кнопка "Настройки" – пока не реализовано, поэтому обработчик открытия уведомления */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div
            style={{
              width: 60,
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: "#212124",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "background 0.3s ease, transform 0.2s ease"
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 30,
                height: 30,
                color: "white"
              }}
            >
              <svg width="25" height="26" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14.6948 2.14123C14.0498 -0.0470764 10.9502 -0.0470756 10.3052 2.14123L10.1488 2.67192C9.73667 4.07016 8.13961 4.73168 6.8595 4.03439L6.37364 3.76975C4.37019 2.67846 2.17846 4.8702 3.26975 6.87364L3.53439 7.3595C4.23168 8.63962 3.57016 10.2367 2.17192 10.6488L1.64123 10.8052C-0.547076 11.4502 -0.547076 14.5498 1.64123 15.1948L2.17192 15.3512C3.57016 15.7633 4.23168 17.3604 3.53439 18.6405L3.26975 19.1264C2.17846 21.1298 4.37019 23.3215 6.37364 22.2303L6.8595 21.9656C8.13961 21.2683 9.73667 21.9298 10.1488 23.3281L10.3052 23.8588C10.9502 26.0471 14.0498 26.0471 14.6948 23.8588L14.8512 23.3281C15.2633 21.9298 16.8604 21.2683 18.1405 21.9656L18.6264 22.2303C20.6298 23.3215 22.8215 21.1298 21.7303 19.1264L21.4656 18.6405C20.7683 17.3604 21.4298 15.7633 22.8281 15.3512L23.3588 15.1948C25.5471 14.5498 25.5471 11.4502 23.3588 10.8052L22.8281 10.6488C21.4298 10.2367 20.7683 8.63962 21.4656 7.3595L21.7303 6.87364C22.8215 4.87019 20.6298 2.67847 18.6264 3.76975L18.1405 4.0344C16.8604 4.73168 15.2633 4.07016 14.8512 2.67192L14.6948 2.14123ZM12.5 17.5763C9.97259 17.5763 7.92373 15.5274 7.92373 13C7.92373 10.4726 9.97259 8.42373 12.5 8.42373C15.0274 8.42373 17.0763 10.4726 17.0763 13C17.0763 15.5274 15.0274 17.5763 12.5 17.5763Z"
                  fill="white"
                />
              </svg>
            </span>
          </div>
          <div style={{ marginTop: "8px", color: "white", fontSize: "10px" }}>Настройки</div>
        </div>

        {/* Кнопка "Магазин" – пока не реализовано */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div
            onClick={() => navigate("/club-search")}
            style={{
              width: 60,
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: "#212124",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "background 0.3s ease, transform 0.2s ease"
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 30,
                height: 30,
                color: "white"
              }}
            >
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.64428 24.1292C5.04046 24.4396 4.35677 23.8972 4.47833 23.2043L5.77478 15.8145L0.271134 10.5697C-0.243211 10.0796 0.0230394 9.18338 0.712085 9.0855L8.36595 7.9982L11.7786 1.23798C12.0861 0.629008 12.9188 0.629008 13.2262 1.23798L16.6389 7.9982L24.2928 9.0855C24.9818 9.18338 25.2481 10.0796 24.7337 10.5697L19.2301 15.8145L20.5266 23.2043C20.6481 23.8972 19.9644 24.4396 19.3606 24.1292L12.5024 20.6043L5.64428 24.1292Z" fill="white"/>
              </svg>
            </span>
          </div>
          <div style={{ marginTop: "8px", color: "white", fontSize: "10px" }}>Клубы</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "20px",
          gap: "20px",
          alignItems: "flex-start"
        }}
      >
        {/* Кнопка "Креаторство" – пока не реализовано */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
          <div
            onClick={() => navigate("/creatorForm")}
            style={{
              width: 60,
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: "#212124",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "background 0.3s ease, transform 0.2s ease"
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 30,
                height: 30,
                color: "white"
              }}
            >
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24.727 0.187953C24.9896 0.412916 25.0731 0.783739 24.9322 1.09953C22.5408 6.46043 17.5214 13.8661 13.8471 17.7262C12.8548 18.7687 11.7907 19.407 10.974 19.7852C10.6527 19.934 10.3681 20.0434 10.1386 20.1218C10.1109 20.4767 10.0448 20.9623 9.888 21.4775C9.57459 22.5072 8.84739 23.7888 7.22069 24.1954C5.54544 24.6142 3.67891 24.6148 2.41063 24.4034C2.08962 24.3499 1.79021 24.2802 1.53192 24.1928C1.29009 24.111 1.0166 23.9918 0.803921 23.8057C0.693299 23.7089 0.562606 23.5624 0.486434 23.3564C0.403344 23.1317 0.405319 22.8885 0.492134 22.6642C0.640586 22.2806 0.986515 22.0708 1.21309 21.9575C1.82723 21.6504 2.18902 21.2504 2.56759 20.668C2.71475 20.4416 2.85509 20.2028 3.01561 19.9296C3.07333 19.8314 3.13366 19.7288 3.19785 19.6207C3.43451 19.2221 3.70774 18.7775 4.05176 18.2959C4.87646 17.1413 5.92788 16.8508 6.77933 16.8956C6.97652 16.906 7.15957 16.9338 7.32346 16.9698C7.42067 16.7012 7.54487 16.3769 7.69536 16.0203C8.10334 15.0535 8.72335 13.8036 9.55044 12.7879C12.9491 8.61433 19.2052 3.09057 23.7947 0.125066C24.0852 -0.0625926 24.4644 -0.0370105 24.727 0.187953Z"
                  fill="white"
                />
              </svg>
            </span>
          </div>
          <div style={{ marginTop: "8px", color: "white", fontSize: "10px" }}>Креаторство</div>
        </div>

        {/* Кнопка "Зал славы" – пока не реализовано */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
          <div
            onClick={handleUnavailableFeature}
            style={{
              width: 60,
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: "#212124",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "background 0.3s ease, transform 0.2s ease"
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 30,
                height: 30,
                color: "white"
              }}
            >
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.4999 0L15.1072 1.35046L18.0104 1.79047L19.326 4.41556L21.4161 6.47797L20.9374 9.375L21.4161 12.272L19.326 14.3344L18.0104 16.9595L15.1072 17.3995L12.4999 18.75L9.89256 17.3995L6.98941 16.9595L5.67381 14.3344L3.58374 12.272L4.06239 9.375L3.58374 6.47797L5.67381 4.41556L6.98941 1.79047L9.89256 1.35046L12.4999 0Z"
                  fill="white"
                />
                <path
                  d="M6.24989 18.4278V25L12.4999 23.4375L18.7499 25V18.4278L15.5966 18.9057L12.4999 20.5097L9.40316 18.9057L6.24989 18.4278Z"
                  fill="white"
                />
              </svg>
            </span>
          </div>
          <div style={{ marginTop: "8px", color: "white", fontSize: "10px" }}>Зал славы</div>
        </div>

        {/* Кнопка "Чемпионы" – пока не реализовано */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
          <div
            onClick={() => navigate("/champions")}
            style={{
              width: 60,
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: "#212124",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "background 0.3s ease, transform 0.2s ease"
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 30,
                height: 30,
                color: "white"
              }}
            >
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.90625 0.78125C3.90625 0.349778 4.25603 0 4.6875 0H20.3125C20.744 0 21.0938 0.349778 21.0938 0.78125C21.0938 1.62113 21.0752 2.42049 21.0398 3.18109C23.2833 3.53057 25 5.47105 25 7.8125C25 10.4013 22.9013 12.5 20.3125 12.5C19.9549 12.5 19.606 12.4598 19.2704 12.3836C18.0363 15.2981 16.3358 16.723 14.8438 17.0898V20.4838L17.0709 21.0405C17.3739 21.1163 17.6588 21.2519 17.9087 21.4393L20.7813 23.5938C21.0503 23.7955 21.16 24.1468 21.0537 24.4658C20.9473 24.7848 20.6488 25 20.3125 25H4.6875C4.35123 25 4.05268 24.7848 3.94634 24.4658C3.84 24.1468 3.94973 23.7955 4.21875 23.5938L7.09132 21.4393C7.34123 21.2519 7.62608 21.1163 7.92913 21.0405L10.1562 20.4838V17.0898C8.66417 16.723 6.96372 15.2981 5.7296 12.3836C5.39402 12.4598 5.04514 12.5 4.6875 12.5C2.09867 12.5 0 10.4013 0 7.8125C0 5.47105 1.71674 3.53057 3.96018 3.18109C3.9248 2.42049 3.90625 1.62113 3.90625 0.78125ZM4.06093 4.75033C2.63531 5.04048 1.5625 6.30121 1.5625 7.8125C1.5625 9.53839 2.96161 10.9375 4.6875 10.9375C4.85701 10.9375 5.02308 10.9241 5.18478 10.8983C4.66543 9.25839 4.26661 7.23357 4.06093 4.75033ZM19.8152 10.8983C19.9769 10.9241 20.143 10.9375 20.3125 10.9375C22.0384 10.9375 23.4375 9.53839 23.4375 7.8125C23.4375 6.30121 22.3647 5.04048 20.9391 4.75033C20.7334 7.23357 20.3346 9.25839 19.8152 10.8983Z"
                  fill="white"
                />
              </svg>
            </span>
          </div>
          <div style={{ marginTop: "8px", color: "white", fontSize: "10px" }}>Чемпионы</div>
        </div>

        {/* Кнопка "Мой пилот" – навигация */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
          <div
            onClick={() => navigate("/creatorView")}
            style={{
              width: 60,
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: "#212124",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              opacity: isAdminOrOwner ? 1 : 0,  // Если роль не admin/owner, кнопка станет прозрачной
              pointerEvents: isAdminOrOwner ? "auto" : "none" // Отключаем клики, если кнопка скрыта
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 30,
                height: 30,
                color: "white"
              }}
            >
              <svg width="29" height="26" viewBox="0 0 29 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.1092 19.3357C12.4414 19.2265 16.9011 19.9816 24.4648 22.8439L26 19.3357L26.5 18C26.7472 17.1328 28.1324 15.9232 27.5 15.5C23.6164 12.9011 17.7004 15.7072 16.785 13.5456C16.2335 12.2435 15.4291 11.131 16.2321 9.96707C17.2904 8.43309 21.3312 10.4817 24.1431 9.81629C19.5325 0.922891 15.3149 -1.26017 4.10395 3.34909C3.60614 3.85809 5.23291 3.64099 3.74206 4.50508C2.25121 5.36918 -1.68967 13.9511 3.90816 18.8532L4.1092 19.3357Z"
                  fill="white"
                  stroke="white"
                />
                <path
                  d="M9.31759 20.8006C9.31759 21.187 8.88146 21.1663 8.58449 21.187C6.85154 21.3292 5.95348 20.8474 4.38198 20.5493C4.03756 20.4464 4.01144 19.7394 4 19.5C5.33792 19.4001 6.44985 19.9688 9.31759 20.0768M9.31759 20.8006V20.0768M9.31759 20.8006C10 21.5 9.97101 21.4756 11 21.5C14.4662 22.0271 16.5614 22.1174 19.4602 23.2935M9.31759 20.0768C13.6608 20.3806 17.8968 19.9046 21.8759 21.187M19.4602 23.2935C19.8953 22.8886 21.8868 21.7026 21.8759 21.187M19.4602 23.2935C19.9013 23.8011 20.2175 24.0543 21.0384 24.3892C22.4365 24.8206 23.0805 24.5637 24.1847 23.9469C24.3779 23.8283 24.3154 23.5673 24.3154 23.5673C24.5059 23.6703 23.8938 21.7528 21.8759 21.187"
                  stroke="white"
                />
              </svg>
            </span>
          </div>
          <div style={{ marginTop: "8px", color: "white", fontSize: "10px", opacity: isAdminOrOwner ? 1 : 0}}>Заявки</div>
        </div>
      </div>

      <CSSTransition
        in={showNotification}
        timeout={300}
        classNames="fade"
        unmountOnExit
      >
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
          }}
        >
          <div
            style={{
              background: "#1D1D1F",
              padding: "20px",
              borderRadius: "20px",
              textAlign: "center",
              color: "white",
              maxWidth: "300px"
            }}
          >
            <p style={{ marginBottom: "20px" }}>Этот раздел в разработке.</p>
            <button
              style={{
                background: "#212124",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "15px",
                cursor: "pointer",
                width: "100%"
              }}
              onClick={() => setShowNotification(false)}
            >
              Хорошо
            </button>
          </div>
        </div>
      </CSSTransition>
      <style>
        {`
          .fade-enter {
            opacity: 0;
          }
          .fade-enter-active {
            opacity: 1;
            transition: opacity 300ms;
          }
          .fade-exit {
            opacity: 1;
          }
          .fade-exit-active {
            opacity: 0;
            transition: opacity 300ms;
          }
        `}
      </style>
    </div>
  );
};

export default Services;
