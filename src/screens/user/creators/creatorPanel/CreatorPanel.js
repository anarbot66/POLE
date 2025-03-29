import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../../firebase";
import MenuCard from "../../components/MenuCard"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  doc,
  getCountFromServer,
} from "firebase/firestore";
import { CSSTransition, TransitionGroup } from "react-transition-group";


const CreatorPanel = ({ currentUser }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const toggleMenu = () => {
      setMenuOpen(!menuOpen);
    };


    return (
        <div style={{position: "relative", background: "#1D1D1F"}}>
          <div style={{width: "100%", height: 255, background: '#212124', borderRadius: "0px 0px 12px 12px", position: "absolute", zIndex: 0}}></div>
          <div style={{position: "relative", width: "100%", zIndex: 3, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 39, display: 'inline-flex', padding: "10px 15px 0px 15px"}}>
            <div style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 28, display: 'flex'}}>
            <div style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 105, display: 'flex'}}>
            <div style={{alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex'}}>
                <div style={{flex: '1 1 0', height: 50, justifyContent: 'flex-start', alignItems: 'center', gap: 17, display: 'flex'}}>
                <img
                onClick={() => navigate("/profile")}
                src={currentUser.photoUrl || "https://placehold.co/80x80"}
                alt="Avatar"
                style={{ width: "45px", height: "45px", borderRadius: "50%", alignContent: "right" }}
                />
                <div style={{width: 125, height: 46}} />
                </div>
                <div style={{ position: "relative" }}>
                {/* Иконка для открытия меню */}
                <div
                  onClick={toggleMenu}
                  style={{
                    width: 50,
                    height: 50,
                    padding: 12,
                    borderRadius: 30,
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                  }}
                >
                  <svg
                    width="25"
                    height="26"
                    viewBox="0 0 25 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.125 16.9062C3.125 16.4748 3.47478 16.125 3.90625 16.125H8.59375C9.02522 16.125 9.375 16.4748 9.375 16.9062C9.375 17.3377 9.02522 17.6875 8.59375 17.6875H3.90625C3.47478 17.6875 3.125 17.3377 3.125 16.9062Z"
                      fill="white"
                    />
                    <path
                      d="M3.125 12.2188C3.125 11.7873 3.47478 11.4375 3.90625 11.4375H14.8438C15.2752 11.4375 15.625 11.7873 15.625 12.2188C15.625 12.6502 15.2752 13 14.8438 13H3.90625C3.47478 13 3.125 12.6502 3.125 12.2188Z"
                      fill="white"
                    />
                    <path
                      d="M3.125 7.53125C3.125 7.09978 3.47478 6.75 3.90625 6.75H21.0938C21.5252 6.75 21.875 7.09978 21.875 7.53125C21.875 7.96272 21.5252 8.3125 21.0938 8.3125H3.90625C3.47478 8.3125 3.125 7.96272 3.125 7.53125Z"
                      fill="white"
                    />
                  </svg>
                </div>

                {/* Выпадающее меню с анимацией */}
                <CSSTransition
                  in={menuOpen}
                  timeout={300}
                  classNames="menuFade"
                  unmountOnExit
                  nodeRef={menuRef}
                >
                  <div
                    ref={menuRef}
                    style={{
                      position: "absolute",
                      top: "40px",
                      right: "10px",
                      background: "#1D1D1F",
                      borderRadius: "12px 0px 12px 12px",
                      padding: "5px",
                      zIndex: 10,
                    }}
                  >
                    <button
                      onClick={() => navigate("/creator-new-post")}
                      style={{
                        display: "block",
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        padding: "5px 10px",
                        textAlign: "left",
                        width: "150px",
                      }}
                    >
                      Новый пост
                    </button>
                  </div>
                </CSSTransition>
              </div>
            </div>
            <div style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'flex'}}>
                <div style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex'}}>
                <div style={{alignSelf: 'stretch', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: 20, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word'}}>Добрый день, {currentUser.firstName}!</div>
                <div style={{alignSelf: 'stretch', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: 28, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word'}}>Чем сегодня займемся?</div>
                </div>
            </div>
            </div>
            <div
      style={{
        alignSelf: "stretch",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: 10,
        display: "flex",
      }}
    >
      {/* Первая строка – два элемента с flex: '1 1 0' */}
      <div
        style={{
          alignSelf: "stretch",
          height: 122,
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 10,
          display: "inline-flex",
        }}
      >
        <MenuCard
          onClick={() => navigate("/articles")}
          icon={
            <svg
              
              width="24"
              height="30"
              viewBox="0 0 24 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_2887_2893)">
                <path
                  d="M6.375 7.5C5.85725 7.5 5.4375 7.91975 5.4375 8.4375C5.4375 8.95525 5.85725 9.375 6.375 9.375H17.625C18.1428 9.375 18.5625 8.95525 18.5625 8.4375C18.5625 7.91975 18.1428 7.5 17.625 7.5H6.375Z"
                  fill="white"
                />
                <path
                  d="M5.4375 12.1875C5.4375 11.6697 5.85725 11.25 6.375 11.25H17.625C18.1428 11.25 18.5625 11.6697 18.5625 12.1875C18.5625 12.7053 18.1428 13.125 17.625 13.125H6.375C5.85725 13.125 5.4375 12.7053 5.4375 12.1875Z"
                  fill="white"
                />
                <path
                  d="M6.375 15C5.85725 15 5.4375 15.4197 5.4375 15.9375C5.4375 16.4553 5.85725 16.875 6.375 16.875H17.625C18.1428 16.875 18.5625 16.4553 18.5625 15.9375C18.5625 15.4197 18.1428 15 17.625 15H6.375Z"
                  fill="white"
                />
                <path
                  d="M6.375 18.75C5.85725 18.75 5.4375 19.1697 5.4375 19.6875C5.4375 20.2053 5.85725 20.625 6.375 20.625H12C12.5178 20.625 12.9375 20.2053 12.9375 19.6875C12.9375 19.1697 12.5178 18.75 12 18.75H6.375Z"
                  fill="white"
                />
                <path
                  d="M0.75 3.75C0.75 1.67893 2.42895 0 4.5 0L19.5 0C21.571 0 23.25 1.67893 23.25 3.75V26.25C23.25 28.321 21.571 30 19.5 30H4.5C2.42895 30 0.75 28.321 0.75 26.25L0.75 3.75ZM19.5 1.875L4.5 1.875C3.46445 1.875 2.625 2.71447 2.625 3.75L2.625 26.25C2.625 27.2855 3.46445 28.125 4.5 28.125H19.5C20.5355 28.125 21.375 27.2855 21.375 26.25V3.75C21.375 2.71447 20.5355 1.875 19.5 1.875Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_2887_2893">
                  <rect width="24" height="30" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }
          label="Статьи"
          textStyle={{ width: 62 }}
          containerStyle={{ flex: "1 1 0", alignSelf: "stretch" }}
        />

        <MenuCard
          icon={
            <svg
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_2887_2887)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0 0H1.875V28.125H30V30H0V0ZM18.75 6.5625C18.75 6.04474 19.1698 5.625 19.6875 5.625H27.1875C27.7052 5.625 28.125 6.04474 28.125 6.5625V14.0625C28.125 14.5803 27.7052 15 27.1875 15C26.6698 15 26.25 14.5803 26.25 14.0625V9.18881L19.4756 17.4687C19.3078 17.6737 19.0613 17.7981 18.7967 17.8113C18.5322 17.8245 18.2744 17.7252 18.0871 17.5379L13.2379 12.6887L6.38319 22.1139C6.07866 22.5326 5.49232 22.6252 5.07358 22.3207C4.65486 22.0161 4.56227 21.4298 4.86681 21.0111L12.3668 10.6986C12.5281 10.4768 12.7783 10.3368 13.0517 10.3154C13.325 10.2939 13.594 10.3932 13.7879 10.5871L18.6804 15.4796L25.2092 7.5H19.6875C19.1698 7.5 18.75 7.08026 18.75 6.5625Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_2887_2887">
                  <rect width="30" height="30" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }
          label="Статистика"
          textStyle={{ width: 102 }}
          containerStyle={{ flex: "1 1 0", alignSelf: "stretch" }}
        />
      </div>

      {/* Вторая строка – два элемента с шириной 100% */}
      <div
        style={{
          alignSelf: "stretch",
          height: 122,
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 10,
          display: "inline-flex",
        }}
      >
        <MenuCard
          icon={
            <svg
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_2887_2921)">
                <path
                  d="M17.6337 1.96947C16.8597 -0.656491 13.1402 -0.656491 12.3662 1.96947L12.1785 2.60631C11.684 4.28419 9.76755 5.078 8.2314 4.24127L7.64835 3.92369C5.24425 2.61415 2.61415 5.24425 3.92369 7.64835L4.24127 8.2314C5.078 9.76755 4.28418 11.684 2.6063 12.1785L1.96947 12.3662C-0.656491 13.1402 -0.656491 16.8597 1.96947 17.6337L2.60631 17.8214C4.28419 18.316 5.078 20.2324 4.24127 21.7686L3.92369 22.3516C2.61415 24.7557 5.24425 27.3858 7.64835 26.0763L8.2314 25.7587C9.76755 24.922 11.684 25.7158 12.1785 27.3937L12.3662 28.0305C13.1402 30.6565 16.8597 30.6565 17.6337 28.0305L17.8214 27.3937C18.316 25.7158 20.2324 24.922 21.7686 25.7587L22.3516 26.0763C24.7557 27.3858 27.3858 24.7557 26.0763 22.3516L25.7587 21.7686C24.922 20.2324 25.7158 18.316 27.3937 17.8214L28.0305 17.6337C30.6565 16.8597 30.6565 13.1402 28.0305 12.3662L27.3937 12.1785C25.7158 11.684 24.922 9.76755 25.7587 8.2314L26.0763 7.64835C27.3858 5.24425 24.7557 2.61416 22.3516 3.9237L21.7686 4.24127C20.2324 5.078 18.316 4.28418 17.8214 2.6063L17.6337 1.96947ZM15 20.4915C11.9671 20.4915 9.50845 18.0329 9.50845 15C9.50845 11.9671 11.9671 9.50845 15 9.50845C18.0329 9.50845 20.4915 11.9671 20.4915 15C20.4915 18.0329 18.0329 20.4915 15 20.4915Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_2887_2921">
                  <rect width="30" height="30" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }
          label="Настройки"
          // Для этой карточки в тексте не задаём фиксированную ширину, оставляем базовый flex
          containerStyle={{ width: "100%", alignSelf: "stretch" }}
        />

        <MenuCard
          icon={
            <svg
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.83509 6.8349C5.67416 5.18237 6.97292 3.75 8.63437 3.75L13.1251 3.75003C13.6429 3.75004 14.0626 4.16977 14.0626 4.68753V5.40385C14.0626 6.70843 13.1302 7.62043 12.428 8.15802C12.3063 8.25121 12.2425 8.3292 12.2122 8.37926C12.1978 8.4032 12.1919 8.41902 12.1897 8.42667C12.1876 8.43376 12.1876 8.43755 12.1876 8.43755L12.1882 8.44265C12.1882 8.44265 12.1902 8.4512 12.1939 8.46033C12.2015 8.47884 12.2196 8.51354 12.2605 8.5619C12.346 8.66299 12.5065 8.79426 12.7677 8.92485C13.2906 9.18629 14.0785 9.37505 15.0001 9.37505C15.9216 9.37505 16.7096 9.18629 17.2325 8.92485C17.4937 8.79426 17.6541 8.66299 17.7396 8.5619C17.7806 8.51354 17.7987 8.47884 17.8063 8.46033C17.81 8.4512 17.812 8.44265 17.812 8.44265L17.8126 8.43755C17.8126 8.43755 17.8126 8.43376 17.8105 8.42667C17.8082 8.41902 17.8024 8.4032 17.788 8.37926C17.7577 8.3292 17.6939 8.25121 17.5722 8.15802C16.87 7.62043 15.9376 6.70843 15.9376 5.40385V4.68753C15.9376 4.16977 16.3573 3.75003 16.8751 3.75003H21.3656C23.0271 3.75003 24.3258 5.18239 24.1649 6.83493L23.7084 12.1875H24.1538C24.519 12.1875 24.9417 11.9117 25.4192 11.2881C25.8128 10.7739 26.4097 10.3125 27.1875 10.3125C28.2517 10.3125 28.9627 11.1508 29.3518 11.9291C29.769 12.7634 30 13.8505 30 15C30 16.1495 29.769 17.2365 29.3518 18.0709C28.9627 18.8492 28.2517 19.6875 27.1875 19.6875C26.4097 19.6875 25.8128 19.226 25.4192 18.7119C24.9417 18.0882 24.519 17.8125 24.1538 17.8125H23.7084L24.1649 23.1651C24.3258 24.8176 23.0271 26.25 21.3656 26.25H16.8751C16.3573 26.25 15.9376 25.8303 15.9376 25.3125V24.5962C15.9376 23.2916 16.87 22.3796 17.5722 21.842C17.6939 21.7488 17.7577 21.6708 17.788 21.6208C17.8024 21.5968 17.8082 21.581 17.8105 21.5734C17.8126 21.5663 17.8126 21.5625 17.8126 21.5625L17.812 21.5574C17.812 21.5574 17.81 21.5488 17.8063 21.5397C17.7987 21.5212 17.7806 21.4865 17.7396 21.4381C17.6541 21.337 17.4937 21.2058 17.2325 21.0752C16.7096 20.8137 15.9216 20.625 15.0001 20.625C14.0785 20.625 13.2906 20.8137 12.7677 21.0752C12.5065 21.2058 12.346 21.337 12.2605 21.4381C12.2196 21.4865 12.2015 21.5212 12.1939 21.5397C12.1902 21.5488 12.1882 21.5574 12.1882 21.5574L12.1876 21.5625C12.1876 21.5625 12.1876 21.5664 12.1897 21.5734C12.1919 21.581 12.1978 21.5968 12.2122 21.6208C12.2425 21.6708 12.3063 21.7488 12.428 21.842C13.1302 22.3796 14.0626 23.2916 14.0626 24.5962V25.3125C14.0626 25.5611 13.9638 25.7996 13.788 25.9754C13.6122 26.1512 13.3737 26.25 13.1251 26.25H8.63437C6.97294 26.25 5.67417 24.8176 5.83508 23.1651L6.29164 17.8125H5.8462C5.48099 17.8125 5.05827 18.0882 4.58082 18.7118C4.18719 19.226 3.5903 19.6875 2.8125 19.6875C1.74833 19.6875 1.03729 18.8491 0.648149 18.0709C0.230973 17.2365 0 16.1495 0 15C0 13.8504 0.230973 12.7634 0.648149 11.929C1.03729 11.1508 1.74833 10.3125 2.8125 10.3125C3.5903 10.3125 4.18719 10.7739 4.58082 11.2881C5.05827 11.9117 5.48099 12.1875 5.8462 12.1875H6.29164L5.83509 6.8349Z"
                fill="white"
              />
            </svg>
          }
          label="Мой клуб"
          textStyle={{ width: 84 }}
          containerStyle={{ width: "100%", alignSelf: "stretch" }}
        />
      </div>
    </div>
                </div>
            <div style={{justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#454545', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word'}}>Скоро эта страница станет цветной</div>
        </div>
        </div>
    );
};

export default CreatorPanel;