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
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 20,
        color: 'white',
        flex: '1 1 300px',
        margin: 10,
        display: 'flex',
        flexDirection: 'column',
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
          padding: '8px 12px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
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
    <div style={{ padding: 15, marginTop: 80, color: 'white' }}>
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
              <h2 style={{ textAlign: 'center', marginBottom: 10 }}>
                Мини‑игры
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <GameCard
                  title="F1 Wordle"
                  description="Угадайте фамилию чемпиона F1 за 3 попытки."
                  record={null}
                  onClick={onSelectWordle}
                />
                <GameCard
                  title="F1 Wordle"
                  description="Угадайте фамилию чемпиона F1 за 3 попытки."
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
