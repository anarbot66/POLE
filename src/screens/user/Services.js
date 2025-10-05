import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import { NavButton } from "./components/NavButton";
import logo from "../recources/images/logo.png";

const Services = ({currentUser}) => {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isTsar, setIsTsar] = useState(false);

  // Проверка роли tsar
  useEffect(() => {
    if (!currentUser) return setIsTsar(false);
    setIsTsar(currentUser.role === "tsar");
  }, [currentUser]);

  // Функция-обработчик для кнопок, где нет своей логики
  const handleUnavailableFeature = () => {
    setShowNotification(true);
  };

  return (
    <div
      style={{
        width: "calc(100% - 30px)",
        height: "100%",
        margin: "0px 15px",
        marginBottom: "100px",
        paddingTop: "15px"
      }}
    >
<div style={{borderRadius: '15px', position: 'fixed', width: "100%", left: '0', top: '0'}}>
      <div style={{background: 'rgb(17, 17, 19)', height: '69px', display: 'flex', flexDirection: 'column', alignItems: "center"}}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: 15,
          height: '100%',
          width: '100%',
          width: 'calc(100% - 50px)'
        }}
      >
        <img src={logo} alt='logo' style={{width: '20px', height: '20px'}}></img>
        <span style={{ color: 'white', width: '100%', fontSize: '18px'}}>
          Сервисы
        </span>
        <div style={{display: 'flex', gap: '20px', width : "100%", justifyContent: 'end', alignItems: 'center'}}>
        <img
          src={currentUser.photoUrl || 'https://placehold.co/80x80'}
          alt="Avatar"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
          }}
        ></img>
        </div>
        </div>
      </div>
      
      </div>

      <div
        style={{
          display: "flex",
          gap: "30px",
          alignItems: "flex-start",
          marginTop: '70px',
          flexDirection: 'column'
        }}
      >
        {/* Кнопка "Информация" – навигация */}
        

            <NavButton label="Зал славы" onClick={() => navigate("/hall-of-fame")} tip="Лучшие пилоты всех времен">
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
              <svg width="25" height="25" viewBox="0 0 25 25" fill="#D6AF36" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.4999 0L15.1072 1.35046L18.0104 1.79047L19.326 4.41556L21.4161 6.47797L20.9374 9.375L21.4161 12.272L19.326 14.3344L18.0104 16.9595L15.1072 17.3995L12.4999 18.75L9.89256 17.3995L6.98941 16.9595L5.67381 14.3344L3.58374 12.272L4.06239 9.375L3.58374 6.47797L5.67381 4.41556L6.98941 1.79047L9.89256 1.35046L12.4999 0Z"
                  
                />
                <path
                  d="M6.24989 18.4278V25L12.4999 23.4375L18.7499 25V18.4278L15.5966 18.9057L12.4999 20.5097L9.40316 18.9057L6.24989 18.4278Z"
                  
                />
              </svg>
            </span>
            </NavButton>

        <NavButton label="Чемпионы" onClick={() => navigate("/champions")} tip="Чемпионы формулы-1">
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
              <svg width="25" height="25" viewBox="0 0 25 25" fill="#FFD700" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.90625 0.78125C3.90625 0.349778 4.25603 0 4.6875 0H20.3125C20.744 0 21.0938 0.349778 21.0938 0.78125C21.0938 1.62113 21.0752 2.42049 21.0398 3.18109C23.2833 3.53057 25 5.47105 25 7.8125C25 10.4013 22.9013 12.5 20.3125 12.5C19.9549 12.5 19.606 12.4598 19.2704 12.3836C18.0363 15.2981 16.3358 16.723 14.8438 17.0898V20.4838L17.0709 21.0405C17.3739 21.1163 17.6588 21.2519 17.9087 21.4393L20.7813 23.5938C21.0503 23.7955 21.16 24.1468 21.0537 24.4658C20.9473 24.7848 20.6488 25 20.3125 25H4.6875C4.35123 25 4.05268 24.7848 3.94634 24.4658C3.84 24.1468 3.94973 23.7955 4.21875 23.5938L7.09132 21.4393C7.34123 21.2519 7.62608 21.1163 7.92913 21.0405L10.1562 20.4838V17.0898C8.66417 16.723 6.96372 15.2981 5.7296 12.3836C5.39402 12.4598 5.04514 12.5 4.6875 12.5C2.09867 12.5 0 10.4013 0 7.8125C0 5.47105 1.71674 3.53057 3.96018 3.18109C3.9248 2.42049 3.90625 1.62113 3.90625 0.78125ZM4.06093 4.75033C2.63531 5.04048 1.5625 6.30121 1.5625 7.8125C1.5625 9.53839 2.96161 10.9375 4.6875 10.9375C4.85701 10.9375 5.02308 10.9241 5.18478 10.8983C4.66543 9.25839 4.26661 7.23357 4.06093 4.75033ZM19.8152 10.8983C19.9769 10.9241 20.143 10.9375 20.3125 10.9375C22.0384 10.9375 23.4375 9.53839 23.4375 7.8125C23.4375 6.30121 22.3647 5.04048 20.9391 4.75033C20.7334 7.23357 20.3346 9.25839 19.8152 10.8983Z"

                />
              </svg>
            </span>
            </NavButton>

            <NavButton label="Награды" onClick={() => navigate("/daily-rewards")} tip="Ежедневные награды и квесты">
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
              <svg width="25" height="25" viewBox="0 0 25 25" fill="#b9f2ff" xmlns="http://www.w3.org/2000/svg">
<path d="M4.84375 1.09375C4.99129 0.897027 5.22285 0.78125 5.46875 0.78125H19.5312C19.7773 0.78125 20.009 0.897188 20.1565 1.09414L24.8067 7.30249C25.039 7.59161 25.05 8.0062 24.823 8.30887L13.125 23.9063C12.9775 24.103 12.7459 24.2188 12.5 24.2188C12.2541 24.2188 12.0225 24.103 11.875 23.9063L0.15625 8.28125C-0.0520833 8.00347 -0.0520833 7.62153 0.15625 7.34375L4.84375 1.09375ZM22.6343 7.00846L19.8124 3.24097L18.6 7.01267L22.6343 7.00846ZM16.9582 7.01438L18.4595 2.34375H6.54048L8.04474 7.02368L16.9582 7.01438ZM8.54681 8.58565L12.5 20.8845L16.4558 8.57741L8.54681 8.58565ZM6.40406 7.02539L5.18729 3.23987L2.34497 7.02962L6.40406 7.02539ZM2.34253 8.59212L10.3315 19.2441L6.90613 8.58736L2.34253 8.59212ZM14.6685 19.2441L22.6734 8.57092L18.0976 8.57569L14.6685 19.2441Z"/>
</svg>

            </span>
            </NavButton>

            <NavButton label="Настройки" onClick={handleUnavailableFeature}>
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
              <svg width="25" height="25" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.5727 2.29772C19.6697 -0.765907 15.3303 -0.765906 14.4273 2.29772L14.2083 3.04069C13.6313 4.99822 11.3955 5.92435 9.6033 4.94815L8.9231 4.57765C6.11827 3.04985 3.04985 6.11827 4.57765 8.9231L4.94815 9.6033C5.92435 11.3955 4.99822 13.6313 3.04069 14.2083L2.29772 14.4273C-0.765907 15.3303 -0.765906 19.6697 2.29772 20.5727L3.04069 20.7917C4.99822 21.3687 5.92435 23.6045 4.94815 25.3967L4.57765 26.0769C3.04985 28.8817 6.11827 31.9502 8.92309 30.4224L9.6033 30.0518C11.3955 29.0757 13.6313 30.0018 14.2083 31.9593L14.4273 32.7023C15.3303 35.7659 19.6697 35.7659 20.5727 32.7023L20.7917 31.9593C21.3687 30.0018 23.6045 29.0757 25.3967 30.0518L26.0769 30.4224C28.8817 31.9502 31.9502 28.8817 30.4224 26.0769L30.0518 25.3967C29.0756 23.6045 30.0018 21.3687 31.9593 20.7917L32.7023 20.5727C35.7659 19.6697 35.7659 15.3303 32.7023 14.4273L31.9593 14.2083C30.0018 13.6313 29.0756 11.3955 30.0518 9.6033L30.4224 8.92309C31.9502 6.11827 28.8817 3.04985 26.0769 4.57765L25.3967 4.94815C23.6045 5.92435 21.3687 4.99822 20.7917 3.04069L20.5727 2.29772ZM17.5 23.9068C13.9616 23.9068 11.0932 21.0384 11.0932 17.5C11.0932 13.9616 13.9616 11.0932 17.5 11.0932C21.0384 11.0932 23.9068 13.9616 23.9068 17.5C23.9068 21.0384 21.0384 23.9068 17.5 23.9068Z" fill="white"/>
</svg>

            </span>
            </NavButton>

            <NavButton label="Информация" onClick={() => navigate("/info")}>
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
                width="25"
                height="25"
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
            </NavButton>

            


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
      inset: 0, 
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "rgba(0,0,0,0.4)", 
      zIndex: 2000
    }}
  >
    <div
      style={{
        padding: "25px",
        borderRadius: "20px",
        textAlign: "center",
        color: "white",
        maxWidth: "300px",
        background: "#141416"
      }}
    >
      <p style={{ marginBottom: "10px" }}>Этот раздел в разработке</p>
      <p style={{ fontSize: '12px', color: 'gray',  marginBottom: "10px" }}>Следите за обновлениями</p>
      <button
        style={{
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "white",
          padding: "10px 20px",
          borderRadius: "15px",
          cursor: "pointer",
          width: "100%"
        }}
        onClick={() => setShowNotification(false)}
      >
        Понятно
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
