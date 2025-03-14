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
    <div style={{ width: "100%",
    margin: "0px",
    marginBottom: "100px",  height: '100%', background: '#1D1D1F' }}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', flexDirection: "column", width: 'calc(100% - 20px)', margin: "0px 10px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px",
          backgroundColor: "#212124",
          borderRadius: 15,
          width: "100%"
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
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
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
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
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
            classNames="page"
            timeout={0}
          >
            <div className="page">
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