// src/components/EventChapter.jsx
import React, { useEffect, useState } from 'react';
import { loadGameById, loadProgressLocal, saveProgressLocal } from './utils/loaders';
import QuizComponent from './QuizComponent';
import DecisionComponent from './DecisionComponent';
import { doc, setDoc, updateDoc, serverTimestamp, increment, addDoc, collection } from "firebase/firestore";
import { db } from "../../../firebase";

/**
 * EventChapter:
 * - загружает story (md/txt) из chapter.storyPath (если есть)
 * - пытается получить мини-игру в порядке:
 *    chapter.gameId -> loadGameById
 *    chapter.gamePath -> fetch JSON
 *    chapter.decisionPath -> fetch /events/<eventId>/decisions.json (and pick by chapter.decisionKey || chapter.id)
 * - поддерживает game.type === 'quiz' (QuizComponent) или type === 'decision' (DecisionComponent)
 *
 * onComplete(serverLikeResp) вызывается при успешном submitGameResult
 */

export default function EventChapter({ eventId, chapter, user, eventCfg, onClose, onComplete }) {
  const [story, setStory] = useState('');
  const [game, setGame] = useState(null);
  const [gameMeta, setGameMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resultError, setResultError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setResultError(null);
      setStory('');
      setGame(null);
      setGameMeta(null);

      try {
        // 1) story
        if (chapter.storyPath) {
          const sResp = await fetch(chapter.storyPath, { cache: 'no-cache' });
          if (!sResp.ok) throw new Error('Story not found: ' + chapter.storyPath);
          const text = await sResp.text();
          if (mounted) setStory(text);
        } else {
          setStory('');
        }

        // 2) gameId -> loadGameById (if loader exists)
        if (chapter.gameId && typeof loadGameById === 'function') {
          try {
            const { meta, game: loadedGame } = await loadGameById(chapter.gameId);
            if (mounted) {
              setGame(loadedGame);
              setGameMeta(meta);
            }
            return;
          } catch (e) {
            console.warn('loadGameById failed for', chapter.gameId, e);
            // continue to try other sources
          }
        }

        // 3) gamePath (explicit)
        if (chapter.gamePath) {
          const gResp = await fetch(chapter.gamePath, { cache: 'no-cache' });
          if (!gResp.ok) throw new Error('Game not found: ' + chapter.gamePath);
          const gJson = await gResp.json().catch(() => { throw new Error('Invalid JSON in ' + chapter.gamePath); });
          if (mounted) setGame(gJson);
          return;
        }

        // 4) decisions: explicit decisionPath OR default /events/<eventId>/decisions.json
        if (chapter.type === 'decision' || chapter.decisionKey || chapter.decisionPath) {
          // explicit path
          if (chapter.decisionPath) {
            const dResp = await fetch(chapter.decisionPath, { cache: 'no-cache' });
            if (!dResp.ok) throw new Error('Decisions file not found: ' + chapter.decisionPath);
            const dJson = await dResp.json().catch(() => { throw new Error('Invalid JSON in ' + chapter.decisionPath); });
            const key = chapter.decisionKey || chapter.id || '0';
            const entry = dJson[key];
            if (!entry) throw new Error(`Decision entry not found for key "${key}" in ${chapter.decisionPath}`);
            if (mounted) setGame(entry);
            return;
          }

          // default path
          try {
            const base = `/events/${eventId}/decisions.json`;
            const dResp = await fetch(base, { cache: 'no-cache' });
            if (!dResp.ok) {
              console.warn('Decisions file not found at', base);
            } else {
              const dJson = await dResp.json().catch(() => { throw new Error('Invalid JSON in ' + base); });
              const key = chapter.decisionKey || chapter.id || '0';
              const entry = dJson[key];
              if (!entry) throw new Error(`Decision entry not found for key "${key}" in ${base}`);
              if (mounted) setGame(entry);
              return;
            }
          } catch (e) {
            console.warn(e);
          }
        }

        // 5) questions.json fallback for quizzes (optional) — try /events/<eventId>/questions.json
        if (chapter.type === 'quiz' && !chapter.gamePath && !chapter.gameId) {
          try {
            const qBase = `/events/${eventId}/questions.json`;
            const qResp = await fetch(qBase, { cache: 'no-cache' });
            if (qResp.ok) {
              const qJson = await qResp.json().catch(() => { throw new Error('Invalid JSON in ' + qBase); });
              // key by chapter.id
              const key = chapter.questionKey || chapter.id || String(chapter.index || '0');
              const entry = qJson[key];
              if (!entry) throw new Error(`Questions entry not found for key "${key}" in ${qBase}`);
              // build quiz object compatible with QuizComponent
              if (mounted) setGame({ type: 'quiz', questions: entry.questions || entry });
              return;
            } else {
              // no questions file — ok
            }
          } catch (e) {
            console.warn(e);
          }
        }

        // nothing found -> game stays null
      } catch (err) {
        console.error(err);
        if (mounted) setResultError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [chapter, eventId]);

  if (loading) return <div style={{ padding: 16 }}> </div>;

  // submitGameResult: обновляем локальный прогресс и возвращаем server-like ответ
  async function submitGameResult(payload) {
    try {
      setResultError(null);
  
      let reward = null;
      if (chapter.reward) {
        reward = chapter.reward;
      } else if (payload && typeof payload.localScore === "number") {
        reward = { type: "coins", amount: payload.localScore };
      }
  
      // === Firebase update user progress ===
      if (user?.uid) {
        const userEventRef = doc(db, "users", user.uid, "events", eventId);
  
        await setDoc(
          userEventRef,
          {
            completed: { [chapter.id]: true },
            rewards: [{ chapterId: chapter.id, ts: new Date().toISOString() }],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        
      }
  
      // === Лог в eventLogs (отдельная коллекция для аналитики) ===
      await addDoc(collection(db, "eventLogs"), {
        eventId,
        chapterId: chapter.id,
        uid: user?.uid,
        reward: reward || null,
        completedAt: serverTimestamp(),
      });
  
      // === Выдача награды по финальной главе ===
      const isFinal = chapter.id === (chapter.parent?.chapters?.slice(-1)[0]?.id || null);
      if (isFinal && eventCfg?.rewardCard && user?.uid) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          [`cards.${eventCfg.rewardCard}`]: increment(1),
        });
      }
  
      const serverLikeResp = { success: true, reward };
      onComplete && onComplete(serverLikeResp);
      return serverLikeResp;
    } catch (err) {
      console.error(err);
      setResultError(err.message || "Ошибка при сохранении прогресса");
      throw err;
    }
  }

  return (
    <div
      className="chapterModal"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          width: '880px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'black',
          borderRadius: 8,
          padding: 20,
        }}
      >
        <button style={{ float: 'right' }} onClick={onClose}>
          ✕
        </button>
        <h2 style={{ marginTop: 0 }}>{chapter.title}</h2>
  
        <div className="storyBlock" style={{ marginBottom: 16, whiteSpace: 'pre-wrap' }}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{story}</pre>
        </div>
  
        <div className="gameBlock">
          {game ? (
            // detect quiz or decision by explicit type or shape
            (game.type === 'quiz' || Array.isArray(game.questions)) ? (
              <QuizComponent game={game} onSubmit={submitGameResult} />
            ) : (game.type === 'decision' || Array.isArray(game.situations)) ? (
              <DecisionComponent game={game} onSubmit={submitGameResult} />
            ) : (
              <div>Неизвестный тип мини-игры: {game.type || 'unknown'}</div>
            )
          ) : (
            // текстовая глава
            <div>
              <button
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#0b74de',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  try {
                    // сохраняем прогресс в Firebase
                    if (user?.uid) {
                      const userEventRef = doc(db, 'users', user.uid, 'events', eventId);
                      await setDoc(
                        userEventRef,
                        {
                          completed: { [chapter.id]: true },
                          rewards: [],
                          updatedAt: serverTimestamp(),
                        },
                        { merge: true }
                      );
                    }
  
                    // вызываем onComplete для синхронизации с EventPage
                    onComplete && onComplete({ success: true });
  
                    // закрываем модалку
                    onClose && onClose();
                  } catch (err) {
                    console.error('Ошибка при сохранении прогресса текстовой главы', err);
                    setResultError(err.message || 'Ошибка при сохранении прогресса');
                  }
                }}
              >
                Прочёл
              </button>
            </div>
          )}
        </div>
  
        {resultError && <div style={{ color: 'crimson', marginTop: 12 }}>{resultError}</div>}
      </div>
    </div>
  );
  
}
