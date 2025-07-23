import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import PilotsList from '../pilots/driverList/PilotsList';
import ConstructorsList from '../constructor/teamList/ConstructorsList';
import NotificationsPanel from '../user/notify/NotificationsPanel'
import { useSwipeable } from 'react-swipeable';
import UserStats from '../user/components/UserStats';

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
      <div className="buttonGlass" style={{borderRadius: '15px', position: 'fixed', width: "calc(100% - 30px)", top: 85, left: 15, right: 15, padding: 15}}>
      
        <div
          style={{
            display: 'flex',
            borderRadius: '20px'
          }}
        >
          <button
            onClick={() => handleTabChange('pilots')}
            style={{
              padding: '10px 20px',
              width: '100%',
              boxShadow: activeTab === 'pilots' ? '0 0 0 1px rgba(255,255,255,0.2)' : '0 0 0 0 rgba(255,255,255,0)',
              color: 'white',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'box-shadow 0.3s ease',
              fontSize: 14
            }}
          >
            Пилоты
          </button>
          <button
            onClick={() => handleTabChange('constructors')}
            style={{
              padding: '10px 20px',
              width: '100%',
              boxShadow: activeTab === 'constructors' ? '0 0 0 1px rgba(255,255,255,0.2)' : '0 0 0 0 rgba(255,255,255,0)',
              color: 'white',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'box-shadow 0.3s ease',
              fontSize: 14
            }}
          >
            Команды
          </button>
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
              marginTop: '135px'
            }}>
              {activeTab === 'pilots' ? (
                <PilotsList />
              ) : (
                <ConstructorsList onConstructorSelect={onConstructorSelect} />
              )}
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>
      
    </div>
  );
};

export default Standings;