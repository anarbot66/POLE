import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import PilotsList from '../pilots/driverList/PilotsList';
import ConstructorsList from '../constructor/teamList/ConstructorsList';
import { useSwipeable } from 'react-swipeable';
import UserStats from '../user/components/UserStats';
import logo from "../recources/images/logo.png";

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