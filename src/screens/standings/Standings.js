import React, { useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import PilotsList from '../pilots/PilotsList';
import ConstructorsList from '../constructor/ConstructorsList';

const Standings = ({ onConstructorSelect, currentUser }) => {
  const [activeTab, setActiveTab] = useState('pilots');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div 
    className="fade-in"
    style={{ width: "100%",
    margin: "0px",
    marginBottom: "100px",  height: '100%', background: '#1D1D1F' }}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', flexDirection: "column", width: 'calc(100% - 20px)', margin: "0px 15px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: 15,
        }}
      >
        <img
          src={currentUser.photoUrl || "https://placehold.co/80x80"}
          alt="Avatar"
          style={{ width: "30px", height: "30px", borderRadius: "50%" }}
        />

        <span style={{color: "white", padding: "10px"}}>Таблицы</span>
      </div>
        <div
          style={{
            display: 'flex',
            borderRadius: '20px',
            marginTop: "10px"
          }}
        >
          <button
            onClick={() => handleTabChange('pilots')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'pilots' ? '#212124' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'background 1.2s ease',
              fontSize: 12
            }}
          >
            Пилоты
          </button>
          <button
            onClick={() => handleTabChange('constructors')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'constructors' ? '#212124' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'background 1.2s ease',
              fontSize: 12
            }}
          >
            Конструкторы
          </button>
        </div>
      </div>
      <div style={{ position: 'relative', height: 'calc(100% - 70px)' }}>
        <TransitionGroup>
          <CSSTransition
            key={activeTab}
            className="fade-in"
            timeout={300}
          >
            <div className="fade-in">
              {activeTab === 'pilots' ? (
                <PilotsList />
              ) : (
                <ConstructorsList onConstructorSelect={onConstructorSelect} />
              )}
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>
      <style>
      {`
        .fade-in {
          animation: fadeIn 1.2s forwards; /* Было 0.5s */
        }
        .fade-out {
          animation: fadeOut 1.2s forwards; /* Было 0.5s */
        }
        
        /* Анимации */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        `}
      </style>
    </div>
  );
};

export default Standings;