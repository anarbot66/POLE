// src/myteam/wordle/F1WordleGameWithConfig.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../../firebase';
import Modal from '../../../components/Modal';
import GameRulesModal from './components/GameRulesModal';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import BackButton from '../../../components/BackButton';
import QUESTIONS from './wordle/questions.json'; // <- локальный конфиг

// Мемоизированный Tile
const Tile = React.memo(function Tile({ displayChar, isRevealing, isRevealedStatic, status }) {
  const classes = [
    'fw-tile',
    isRevealing ? 'flipping' : '',
    isRevealedStatic ? 'revealed' : '',
    (status && (isRevealedStatic || isRevealing)) ? status : ''
  ].join(' ').trim();

  return (
    <div className={classes}>
      <div className="fw-tile-inner">
        <div className="fw-tile-front">{displayChar}</div>
        <div className={`fw-tile-back ${status}`}>{displayChar}</div>
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.displayChar === next.displayChar &&
         prev.isRevealing === next.isRevealing &&
         prev.isRevealedStatic === next.isRevealedStatic &&
         prev.status === next.status;
});

export default function F1WordleGameWithConfig({ currentUser }) {
  const MAX_ATTEMPTS = 3;
  const REWARD_POINTS = 150;
  const MAX_ANSWER_LEN = 12;

  const [questions, setQuestions] = useState(QUESTIONS || []);
  const [qIndex, setQIndex] = useState(null);
  const [answer, setAnswer] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // reveal animation
  const [revealRow, setRevealRow] = useState(-1);
  const [revealProgress, setRevealProgress] = useState(0);
  const revealIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    };
  }, []);

  // ---------- Нормализация: приводим к lower + заменяем ё->е ----------
  const normalize = useCallback((s = '') => {
    return String(s).trim().toLowerCase().replace(/ё/g, 'е').replace(/Ё/g, 'е');
  }, []);

  // ---------- Регекс: разрешаем латиницу и кириллицу ----------
  const ALLOWED_LETTERS_RE = /[A-Za-z\u0400-\u04FF]/g;
  const VALID_WORD_RE = /^[A-Za-z\u0400-\u04FF]+$/i;

  const pickQuestion = useCallback(() => {
    if (!questions || questions.length === 0) return null;
    const idx = Math.floor(Math.random() * questions.length);
    const q = questions[idx];
    return { q, idx };
  }, [questions]);

  const clearRevealInterval = useCallback(() => {
    if (revealIntervalRef.current) {
      clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
  }, []);

  const startRevealForRow = useCallback((rowIndex) => {
    clearRevealInterval();
    setRevealRow(rowIndex);
    setRevealProgress(0);

    revealIntervalRef.current = setInterval(() => {
      setRevealProgress(prev => {
        const next = prev + 1;
        if (next >= (answer ? answer.length : MAX_ANSWER_LEN)) {
          clearRevealInterval();
          setTimeout(() => setRevealRow(-1), 300);
        }
        return next;
      });
    }, 180);
  }, [answer, clearRevealInterval]);

  const initGame = useCallback(() => {
    clearRevealInterval(); // очищаем предыдущие интервалы перед новой игрой

    const picked = pickQuestion();
    if (!picked) {
      setModalMessage('Нет доступных вопросов в конфиге.');
      setShowModal(true);
      return;
    }
    const { q, idx } = picked;
    if (!q.answer || typeof q.answer !== 'string') {
      setModalMessage('Неверный формат ответа в конфиге (answer).');
      setShowModal(true);
      return;
    }
    const ansRaw = q.answer;
    const ans = normalize(ansRaw);
    if (ans.length > MAX_ANSWER_LEN) {
      setModalMessage(`Ответ "${ansRaw}" длиннее ${MAX_ANSWER_LEN} символов. Отредактируйте конфиг.`);
      setShowModal(true);
      return;
    }

    setQIndex(idx);
    setAnswer(ans);
    setQuestionText(q.question || '');
    setGuesses([]);
    setCurrentGuess('');
    setStarted(true);
    setGameOver(false);
    setWon(false);
    setRevealRow(-1);
    setRevealProgress(0);
  }, [pickQuestion, normalize, clearRevealInterval]);

  const getStatus = useCallback((guessChar, idx, answerStr) => {
    if (!guessChar) return 'empty';
    const g = normalize(guessChar);
    if (g === answerStr[idx]) return 'correct';
    if (answerStr.includes(g)) return 'present';
    return 'absent';
  }, [normalize]);

  const submitGuess = useCallback(async () => {
    if (!started || gameOver) return;
    const raw = (currentGuess || '').trim();
    if (!VALID_WORD_RE.test(raw)) {
      setModalMessage('Пожалуйста, вводите только буквы (латиница или кириллица).');
      setShowModal(true);
      return;
    }

    if (!answer) {
      setModalMessage('Игра не инициализирована.');
      setShowModal(true);
      return;
    }

    const guessNorm = normalize(raw);
    if (guessNorm.length !== answer.length) {
      setModalMessage(`Слово должно быть длины ${answer.length}.`);
      setShowModal(true);
      return;
    }

    setGuesses(prev => {
      const newG = [...prev, guessNorm];
      return newG;
    });
    setCurrentGuess('');

    const rowIndex = guesses.length; // текущая длина before push
    startRevealForRow(rowIndex);

    if (guessNorm === answer) {
      setWon(true);
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { apexPoints: increment(REWARD_POINTS) });
      } catch (err) {
        console.error('Award error', err);
      }
      setTimeout(() => setGameOver(true), (answer.length * 180) + 200);
    } else if (guesses.length + 1 >= MAX_ATTEMPTS) {
      setTimeout(() => setGameOver(true), (answer.length * 180) + 200);
    }
  }, [started, gameOver, currentGuess, answer, guesses.length, startRevealForRow, normalize, currentUser]);

  const onInputChange = useCallback((e) => {
    const filtered = (e.target.value.match(ALLOWED_LETTERS_RE) || []).join('');
    const limit = answer ? answer.length : MAX_ANSWER_LEN;
    setCurrentGuess(filtered.slice(0, limit));
  }, [answer]);

  const onInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') submitGuess();
  }, [submitGuess]);

  // Мемоизированный grid
  const gridJSX = useMemo(() => {
    const len = answer ? answer.length : 5;
    const boxSize = `calc((328px - ${(len - 1) * 6}px) / ${len})`;

    const rows = Array.from({ length: MAX_ATTEMPTS }).map((_, row) => {
      return Array.from({ length: len }).map((_, col) => {
        const guess = guesses[row];
        let ch = '';
        if (guess) ch = guess[col] || '';
        else if (row === guesses.length) ch = (currentGuess[col] || '');
        const isRevealing = row === revealRow && col < revealProgress;
        const isRevealedStatic = (row < revealRow) || (revealRow === -1 && row < guesses.length);
        let status = 'empty';
        if (row < guesses.length) {
          status = getStatus(guesses[row][col] || '', col, answer);
        } else if (isRevealing) {
          status = getStatus((guesses[row] || '')[col] || '', col, answer);
        }
        return { char: ch, isRevealing, isRevealedStatic, status };
      });
    });

    return (
      <div style={{
        display: 'grid',
        gridTemplateRows: `repeat(${MAX_ATTEMPTS}, auto)`,
        gap: '10px',
        marginBottom: '16px',
        marginTop: '10px'
      }}>
        {rows.map((cols, row) => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, ${boxSize})`, gap: '6px' }}>
            {cols.map((cell, col) => (
              <div key={col} style={{ width: boxSize, height: boxSize }}>
                <Tile
                  displayChar={cell.char ? cell.char.toUpperCase() : ''}
                  isRevealing={cell.isRevealing}
                  isRevealedStatic={cell.isRevealedStatic}
                  status={cell.status}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }, [guesses, currentGuess, answer, revealRow, revealProgress, getStatus]);

  return (
    <div style={{ borderRadius: '12px', height: '100%' }}>
      <div style={{ padding: '15px', height: '100%' }}>
        {!started && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '340px' }}>
              <h2 style={{ color: 'white', textAlign: 'center' }} onClick={() => setShowRules(true)}>Wordle</h2>
              <p style={{ color: 'gray', textAlign: 'center' }}>Типичная Worlde игра. Более 100 разных вопросов про формулу-1. За правильные ответы награда!</p>
              <button onClick={initGame} style={{ padding: '12px', borderRadius: '10px' }}>Начать игру</button>
            </div>
          </div>
        )}

        <div>
          <TransitionGroup>
            <CSSTransition key={answer || 'ph'} classNames="tab" timeout={300}>
              <div>
                {started && (
                  <>
                    <div style={{ marginBottom: '8px' }}>
                      <p style={{ color: 'white', margin: 0, fontWeight: 600 }}>Вопрос:</p>
                      <p style={{ color: '#9CA3AF', marginTop: '4px', fontSize: '13px' }}>{questionText}</p>
                    </div>

                    {gridJSX}

                    {!gameOver ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={currentGuess}
                          onChange={onInputChange}
                          onKeyDown={onInputKeyDown}
                          maxLength={answer ? answer.length : MAX_ANSWER_LEN}
                          placeholder={answer ? `Введите слово из ${answer.length} букв` : 'Введите слово'}
                          style={{
                            flex: 1,
                            padding: '10px',
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: '10px',
                            background: 'transparent',
                            color: 'white',
                            outline: 'none'
                          }}
                        />
                        <button onClick={submitGuess} style={{ padding: '10px 12px', borderRadius: '10px' }}>Отправить</button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        {won ? (
                          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ color: '#16A34A' }}>Поздравляем! +{REWARD_POINTS} AP</div>
                            <button onClick={initGame} style={{ padding: '10px 14px', borderRadius: '10px' }}>Сыграть ещё раз</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ color: '#DC2626' }}>Вы не угадали. Было слово: <b style={{ color: 'white' }}>{answer}</b></div>
                            <button onClick={initGame} style={{ padding: '10px 14px', borderRadius: '10px' }}>Сыграть ещё раз</button>
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

      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
      <GameRulesModal show={showRules} onClose={() => setShowRules(false)} />

      {/* CSS для плиток */}
      <style>{`
        .fw-tile { width: 100%; height: 100%; perspective: 900px; }
        .fw-tile .fw-tile-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.55s; }
        .fw-tile.flipping .fw-tile-inner { transform: rotateX(-180deg); }
        .fw-tile.revealed .fw-tile-inner { transform: rotateX(-180deg); }

        .fw-tile-front, .fw-tile-back {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          border-radius: 10px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border: 1px solid rgba(255,255,255,0.06);
          box-sizing: border-box;
        }
        .fw-tile-front { color: #9CA3AF; background: #0b1020; }
        .fw-tile-back { transform: rotateX(180deg); color: #fff; }

        .fw-tile-back.correct { background: #16A34A; color: #fff; }
        .fw-tile-back.present { background: #FACC15; color: #000; }
        .fw-tile-back.absent  { background: #374151; color: #fff; }
      `}</style>
    </div>
  );
}
