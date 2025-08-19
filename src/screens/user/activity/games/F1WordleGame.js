import React, { useState, useEffect } from 'react';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import Modal from '../../../components/Modal';
import GameRulesModal from './components/GameRulesModal';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import BackButton from '../../../components/BackButton';

// Sample word list — F1 driver surnames (lowercase)
const WORD_LIST = [
  'schumacher',  // Михаэль Шумахер (2001–2004)
  'alonso',      // Фернандо Алонсо (2005, 2006)
  'raikkonen',   // Кими Райкконен (2007)
  'hamilton',    // Льюис Хэмилтон (2008, 2014–2015, 2017–2020)
  'button',      // Дженсон Баттон (2009)
  'vettel',      // Себастьян Феттель (2010–2013)
  'rosberg',     // Нико Росберг (2016)
  'verstappen'   // Макс Ферстаппен (2021–2023)
];


export default function F1WordleGame({ currentUser }) {
  const MAX_ATTEMPTS = 3;
  const ENTRY_COST = 5;
  const REWARD_POINTS = 150;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const [answer, setAnswer] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Compute last played timestamp in ms
  const getLastPlayedMs = () => {
    const last = currentUser.lastPlayedWordle;
    if (!last) return 0;
    if (last.seconds) return last.seconds * 1000;
    if (last.toMillis) return last.toMillis();
    return new Date(last).getTime();
  };

  const lastPlayedMs = getLastPlayedMs();
  const now = Date.now();
  const canPlayDaily = now - lastPlayedMs >= ONE_DAY_MS;
  const hasEnoughGS = currentUser.gsCurrency >= ENTRY_COST;
  const canStart = canPlayDaily && hasEnoughGS;



  // Start game
  const initGame = async () => {
    if (!canPlayDaily) {
      setModalMessage('Можно сыграть раз в сутки. Приходите завтра!');
      setShowModal(true);
      return;
    }
    if (!hasEnoughGS) {
      setModalMessage('Недостаточно GS для участия');
      setShowModal(true);
      return;
    }
    const random = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setAnswer(random);
    setGuesses([]);
    setCurrentGuess('');
    setStarted(true);
    setGameOver(false);
    setWon(false);

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      gsCurrency: increment(-ENTRY_COST),
      lastPlayedWordle: serverTimestamp()
    });
  };

  // Submit guess
  const submitGuess = async () => {
    if (!currentGuess || gameOver) return;
  
    const guess = currentGuess.trim().toLowerCase();
  
    // Сначала проверяем, что ввод — только латиница:
    if (!/^[a-z]+$/.test(guess)) {
      setModalMessage('Пожалуйста, вводите только английские буквы (A–Z).');
      setShowModal(true);
      return;
    }
  
    // Затем проверяем длину:
    if (guess.length !== answer.length) {
      setModalMessage(`Слово должно быть длины ${answer.length}`);
      setShowModal(true);
      return;
    }
  
    // Если всё ок — добавляем в список попыток и сбрасываем поле ввода:
    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);
    setCurrentGuess('');
  
    // И уже после этого проверяем, угадано ли слово:
    if (guess === answer) {
      setWon(true);
      setGameOver(true);
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { apexPoints: increment(REWARD_POINTS) });
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameOver(true);
    }
  };
  

  return (
    <div style={{borderRadius: '15px', height: '410px'}}>
      <div style={{padding: '15px', height: '100%'}}>

      {!started && (<div style={{
    display: 'flex',
    alignItems: 'center',      // по вертикали
    justifyContent: 'center',  // по горизонтали
    height: '490px'
  }}>
    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
      <h2 style={{color: 'white', fontSize: '40px', textAlign: 'center'}} onClick={() => setShowRules(true)}>Wordle</h2>
      <h2 style={{color: 'gray', fontSize: '16px', textAlign: 'center'}}>Тема: чемпионы F1 (2000 - 2024)</h2>
      <h2 style={{color: 'gray', fontSize: '12px', textAlign: 'center'}}>Нажмите на Wordle чтобы узнать правила</h2>
      </div>
  <button
    onClick={initGame}
    disabled={!canStart}
    style={{
      padding: '15px 20px',
      borderRadius: '15px',
      color: canStart ? 'white' : 'gray',
      border: 'none',
      border: canStart ? "1px solid rgba(255, 255, 255, 0.2)" : 'none',
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    {!canPlayDaily
      ? 'Вы уже играли сегодня :('
      : !hasEnoughGS
      ? 'Недостаточно GS'
      : (
        <>
          Участвовать за {ENTRY_COST}
          <svg width="16" height="15" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#paint0_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint1_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint2_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint3_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<defs>
<clipPath id="paint0_diamond_4291_10_clip_path"><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z"/></clipPath><clipPath id="paint1_diamond_4291_10_clip_path"><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z"/></clipPath><clipPath id="paint2_diamond_4291_10_clip_path"><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z"/></clipPath><clipPath id="paint3_diamond_4291_10_clip_path"><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z"/></clipPath><linearGradient id="paint0_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint1_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint2_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint3_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
</defs>
</svg>
        </>
      )
    }
  </button>
      </div>
      </div>
      )}
<div>
  <TransitionGroup>
            <CSSTransition
            key={answer}
              classNames="tab"
              timeout={400}
            >
<div>
{started && (
  <>
    <div
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${MAX_ATTEMPTS}, auto)`,
        gap: '10px',
        marginBottom: '16px',
        marginTop: '10px'
      }}
    >
      {Array.from({ length: MAX_ATTEMPTS }).map((_, row) => (
        <div
          key={row}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${answer.length}, 1fr)`,
            gap: '4px'
          }}
        >
          {Array.from({ length: answer.length }).map((_, col) => {
            const boxSize = `calc((328px - ${(answer.length - 1) * 4}px) / ${answer.length})`;
            const char = guesses[row] ? guesses[row][col] : '';
            const color = guesses[row]
              ? guesses[row][col] === answer[col]
                ? '#22C55E'
                : answer.includes(guesses[row][col])
                ? '#FACC15'
                : '#D1D5DB'
              : '#F3F4F6';

            return (
              <div
                key={col}
                style={{
                  color: color,
                  width: boxSize,
                  height: boxSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '16px',
                  borderRadius: '10px',
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor: "black",
                }}
              >
                {char}
              </div>
            );
          })}
        </div>
      ))}
    </div>

    {!gameOver ? (
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={currentGuess}
          onChange={(e) => setCurrentGuess(e.target.value)}
          maxLength={answer.length}
          style={{
            flex: 1,
            padding: '8px',
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: '10px',
            fontSize: '16px',
            background: 'transparent',
            outline: 'none',
            color: 'white'
          }}
        />
        <button
          onClick={submitGuess}
          style={{
            padding: '8px 10px',
            color: 'white',
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24.7711 0.228815C24.9921 0.449801 25.0601 0.781222 24.9441 1.07139L15.8521 23.8012C15.4975 24.6879 14.2881 24.8008 13.7754 23.9952L8.80904 16.1909L1.00477 11.2245C0.199116 10.7119 0.312043 9.50247 1.19869 9.14781L23.9285 0.0558698C24.2187 -0.0601979 24.5501 0.00782868 24.7711 0.228815ZM10.3705 15.7343L14.6844 22.5133L22.0797 4.02505L10.3705 15.7343ZM20.9749 2.9202L2.48664 10.3155L9.26566 14.6294L20.9749 2.9202Z" fill="white"/>
          </svg>
        </button>
      </div>
    ) : (
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        {won ? (
          <div style={{display: 'flex', gap: '10px', flexDirection: 'column',alignItems: 'center', justifyItems: 'center'}}>
            <p style={{ color: '#16A34A', fontWeight: '600' }}>
            Поздравляем! +{REWARD_POINTS} AP
            </p>
            <p style={{ color: 'gray', fontWeight: '300', fontSize: '12px' }}>
            Возвращайтесь завтра
            </p>
            </div>
        ) : (
          <div style={{display: 'flex', gap: '10px', flexDirection: 'column',alignItems: 'center', justifyItems: 'center'}}>
          <p style={{ color: '#DC2626', fontWeight: '600' }}>
            Вы не угадали. Было слово: <b>{answer}</b>
          </p>
          </div>
        )}
      </div>
    )}
  </>
)}
</div>
</CSSTransition>
        </TransitionGroup>
</div>

      </div>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        message={modalMessage}
      />
    </div>
  );
}
