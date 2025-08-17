import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import PilotsList from '../pilots/driverList/PilotsList';
import ConstructorsList from '../constructor/teamList/ConstructorsList';
import { useSwipeable } from 'react-swipeable';
import UserStats from '../user/components/UserStats';
import logo from "../recources/images/racehub-logo.png";

const Standings = ({ onConstructorSelect, currentUser }) => {
  const [activeTab, setActiveTab] = useState('pilots');
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const tabs = ['pilots','constructors'];
  const goPrev = () => {
    const i = tabs.indexOf(activeTab);
    const prev = tabs[(i - 1 + tabs.length) % tabs.length];
    setActiveTab(prev);
  };
  const goNext = () => {
    const i = tabs.indexOf(activeTab);
    const next = tabs[(i + 1) % tabs.length];
    setActiveTab(next);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => goNext(),
    onSwipedRight: () => goPrev(),
    trackMouse: true,    // чтобы работало и мышью
    preventDefaultTouchmoveEvent: true
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div 
    style={{ width: "100%",
    margin: "0px",
    marginBottom: "20px",  height: '100%'}}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '15px', flexDirection: "column", width: 'calc(100% - 30px)', margin: "0px 15px", zIndex: 999 }}>
      <div className="buttonGlass" style={{borderRadius: '15px', position: 'fixed', width: "100%", left: '0', top: '0'}}>
      <div style={{background: 'rgb(17, 17, 19)', height: '110px', display: 'flex', flexDirection: 'column', alignItems: "center"}}>
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
          Чемпионат
        </span>
        <div style={{display: 'flex', gap: '20px', width : "100%", justifyContent: 'end', alignItems: 'center'}}>
        <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.0166 19.3948C23.4992 17.3762 24.375 14.8841 24.375 12.1875C24.375 5.45653 18.9185 0 12.1875 0C5.45653 0 0 5.45653 0 12.1875C0 18.9185 5.45653 24.375 12.1875 24.375C14.8848 24.375 17.3775 23.4987 19.3964 22.0153L19.3948 22.0166C19.4501 22.0915 19.5117 22.1633 19.5796 22.2312L26.7992 29.4508C27.5314 30.1831 28.7186 30.1831 29.4508 29.4508C30.1831 28.7186 30.1831 27.5314 29.4508 26.7992L22.2312 19.5796C22.1633 19.5117 22.0915 19.4501 22.0166 19.3948ZM22.5 12.1875C22.5 17.8829 17.8829 22.5 12.1875 22.5C6.49206 22.5 1.875 17.8829 1.875 12.1875C1.875 6.49206 6.49206 1.875 12.1875 1.875C17.8829 1.875 22.5 6.49206 22.5 12.1875Z" fill="white"/>
</svg>
        <img
          onClick={() => navigate('/profile')}
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
        <div style={{ position: "relative", display: "flex", borderRadius: "20px", width: '100%'}}>
        
      {/* Кнопки */}
      <button
        onClick={() => handleTabChange("pilots")}
        style={{
          padding: "10px 20px",
          width: "100%",
          color: activeTab === "pilots" ? "white" : "var(--col-darkGray)",
          background: activeTab === "pilots" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Пилоты
      </button>
      <button
        onClick={() => handleTabChange("constructors")}
        style={{
          padding: "10px 20px",
          width: "100%",
          color: activeTab === "constructors" ? "white" : "var(--col-darkGray)",
          background: activeTab === "constructors" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Команды
      </button>

      <div
    style={{
      position: "absolute",
      bottom: -3,
      left: activeTab === "pilots" ? "25%" : "75%", 
      transform: "translateX(-50%)",                
      height: "6px",
      width: "40%",
      backgroundColor: "blue",
      transition: "left 0.3s ease",
      pointerEvents: "none",
      borderRadius: '3px'
    }}
  />
    </div>
      </div>
      
      </div>
      </div>
      <div style={{ height: 'calc(100% - 70px)' }}>
        <TransitionGroup>
          <CSSTransition
            key={activeTab}
            classNames="tab"
            timeout={400}
          >
            <div {...swipeHandlers} style={{
              display: "flex",
              gap: "15px",
              flexDirection: 'column',
              marginTop: '115px'
            }}>
              {activeTab === 'pilots' ? (
                <PilotsList />
              ) : (
                <ConstructorsList />
              )}
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>
      
    </div>
  );
};

export default Standings;