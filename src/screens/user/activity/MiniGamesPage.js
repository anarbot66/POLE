// pages/MiniGamesPage.jsx
import React, { useState, useCallback } from 'react';
import F1WordleGame from './games/F1WordleGame'
import LaneRunnerGame from './games/LaneRunner';
import BackButton from '../../components/BackButton';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

const GameCard = React.memo(function GameCard({
  title,
  description,
  record,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius: 12,
        padding: 20,
        color: 'white',
        flex: '1 1 300px',
        margin: 10,
        display: 'flex',
        flexDirection: 'column',
        background: "#141416",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: '#ccc', flexGrow: 1 }}>{description}</p>
      {record != null && (
        <p style={{ margin: '4px 0', color: '#8af' }}>Рекорд: {record}</p>
      )}
      <button
        onClick={onClick}
        style={{
          marginTop: 10,
          padding: '12px 12px',
          background: 'rgb(17, 17, 19)',
          borderRadius: 8,
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        Играть
      </button>
    </div>
  );
});

export default function MiniGamesPage({ currentUser }) {
  const [selected, setSelected] = useState(null);

  const onSelectLane = useCallback(() => setSelected('lane'), []);
  const onSelectWordle = useCallback(() => setSelected('wordle'), []);
  const goBack = useCallback(() => setSelected(null), []);

  return (
    <div style={{ padding: '15px', color: 'white', height: '100vh', width: '100%' }}>
      <TransitionGroup>
        <CSSTransition
          key={selected }
          classNames="tab"
          timeout={400}
          mountOnEnter
          unmountOnExit
        >
          {selected === 'lane' ? (
            <div>
              <BackButton onClick={goBack} label="Назад" />
              <LaneRunnerGame currentUser={currentUser} />
            </div>
          ) : selected === 'wordle' ? (
            <div>
              <BackButton onClick={goBack} label="Назад" />
              <F1WordleGame currentUser={currentUser} />
            </div>
          ) : (
            <div>
              <div style={{display: "flex",
        flexDirection: "column",
        gap: "19px", position: 'fixed', width: '100%', background: 'rgb(17, 17, 19)', left: '0', top: '0', padding: '20px 20px 20px 20px', zIndex: 100}}>
      <div style={{display: 'flex', width: "100%", gap: "10px", alignItems: "center"}}>
      <BackButton
        label="Назад"
        style={{}}
      />
      <span style={{ color: 'white', fontSize: '18px'}}>
          Мини-игры
        </span>
      </div>
      
      </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginTop: '60px'
                }}
              >
                <GameCard
                  title="F1 Wordle"
                  description="Угадайте фамилию чемпиона F1 за 3 попытки."
                  record={null}
                  onClick={onSelectWordle}
                />
                <GameCard
                  title="Monza Racing"
                  description="Наберите как можно больше очков на опасной прямой в Монце"
                  record={null}
                  onClick={onSelectLane}
                />
              </div>
            </div>
          )}
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
}
