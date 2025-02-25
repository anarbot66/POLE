import React, { useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import PilotsList from './PilotsList';
import ConstructorsList from './ConstructorsList';

const Standings = ({ onConstructorSelect }) => {
  const [activeTab, setActiveTab] = useState('pilots');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div style={{ width: "calc(100% - 20px)", 
    margin: "0 auto", 
    marginBottom: "100px",  height: '100%', background: '#1D1D1F' }}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            background: '#212124',
            borderRadius: '20px',
          }}
        >
          <button
            onClick={() => handleTabChange('pilots')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'pilots' ? '#0077FF' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
            }}
          >
            Пилоты
          </button>
          <button
            onClick={() => handleTabChange('constructors')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'constructors' ? '#0077FF' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
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
            timeout={300}
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