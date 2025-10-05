// src/components/EventPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EventChapter from './EventChapter';
import { loadEventConfig, loadProgressLocal, saveProgressLocal } from './utils/loaders';
import { doc, getDoc, runTransaction, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function EventPage({ user }) {
  const { eventId } = useParams();
  const [eventCfg, setEventCfg] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [progress, setProgress] = useState({ completed: {}, rewards: [] });
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(null);

useEffect(() => {
  let mounted = true;

  async function load() {
    setLoading(true);
    try {
      const cfg = await loadEventConfig(eventId);
      if (!mounted) return;
      setEventCfg(cfg);

      if (user?.uid) {
        const userEventRef = doc(db, "users", user.uid, "events", eventId);
        const snap = await getDoc(userEventRef);
        if (snap.exists()) {
          setProgress(snap.data());
        } else {
          setProgress({ completed: {}, rewards: [] });
        }
      }
    } catch (err) {
      console.error("load event error", err);
      setEventCfg(null);
    } finally {
      if (mounted) setLoading(false);
    }
  }

  load();
  return () => { mounted = false; };
}, [eventId, user?.uid]); // <-- используем только uid

  

  useEffect(() => {
    setServerTime(new Date());
    const t = setInterval(() => setServerTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const chapters = eventCfg?.chapters || [];

  // helper: глава открыта?
  const isOpen = (chapter, index) => {
    if (!eventCfg) return false;
    try {
      const start = new Date(eventCfg.startDate);
      const openDate = new Date(start.getTime() + (chapter.dayOffset || 0) * 86400000);

      if (index > 0) {
        const prevChapter = chapters[index - 1];
        if (!progress?.completed?.[prevChapter.id]) {
          return false;
        }
      }
      return Date.now() >= openDate.getTime();
    } catch {
      return false;
    }
  };

  async function handleCompleteFromChapter(result) {
    const chId = activeChapter?.id;
    if (!chId) return;

    const newProgress = { ...(progress || { completed: {}, rewards: [] }) };

    if (!newProgress.completed[chId]) {
      newProgress.completed = { ...(newProgress.completed || {}), [chId]: true };

      // Локальное сохранение
      if (result && result.reward) {
        newProgress.rewards = [
          ...(newProgress.rewards || []),
          { chapterId: chId, reward: result.reward, ts: new Date().toISOString() }
        ];
      }

      try {
        saveProgressLocal(eventId, user, newProgress);
      } catch (err) {
        console.warn('saveProgressLocal failed', err);
      }
      setProgress(newProgress);

      // 🔥 Логируем в Firebase
      try {
        await addDoc(collection(db, "eventLogs"), {
          eventId,
          chapterId: chId,
          uid: user?.uid,
          completedAt: serverTimestamp(),
          reward: result?.reward || null
        });
      } catch (err) {
        console.error("Ошибка логирования в eventLogs", err);
      }

      // 🔥 Если глава последняя — выдаём карточку
      const isFinal = chapters.length > 0 && chapters[chapters.length - 1].id === chId;
      if (isFinal && eventCfg.rewardCard && user?.uid) {
        const userRef = doc(db, "users", user.uid);
        try {
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(userRef);
            if (!snap.exists()) throw new Error("user doc not found");
            tx.update(userRef, {
              [`cards.${eventCfg.rewardCard}`]: increment(1)
            });
          });
          console.log("Карточка добавлена пользователю:", eventCfg.rewardCard);
        } catch (err) {
          console.error("Ошибка добавления карточки:", err);
        }
      }
    }

    setActiveChapter(null);
  }

  if (loading) return <div style={{ padding: 16 }}> </div>;
  if (!eventCfg) return <div style={{ padding: 16 }}>Событие не найдено</div>;

  return (
    <div className="eventPage" style={{ padding: 16 }}>
      <h1 style={{ margin: 0 }}>{eventCfg.title}</h1>

      <div className="eventMeta" style={{ marginTop: 8, color: '#555' }}>
        <div>Старт: {new Date(eventCfg.startDate).toLocaleString()}</div>
        <div>Длительность: {eventCfg.durationDays ?? '—'} дней</div>
      </div>

      <div
        className="chaptersGrid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
          marginTop: 16
        }}
      >
        {chapters.map((ch, idx) => {
          const opened = isOpen(ch, idx);
          const done = Boolean(progress?.completed?.[ch.id]);
          const openDate = new Date(new Date(eventCfg.startDate).getTime() + (ch.dayOffset || 0) * 86400000);

          return (
            <div
              key={ch.id}
              className={`chapterCard ${opened ? 'open' : 'locked'} ${done ? 'done' : ''}`}
              style={{
                padding: 12,
                border: '1px solid #ddd',
                borderRadius: 8,
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px' }}>{ch.title}</h3>
                <div style={{ fontSize: 13, marginBottom: 8, color: opened ? '#222' : '#888' }}>
                  {opened ? (done ? 'Пройдено' : 'Открыта') : `Откроется ${openDate.toLocaleDateString()}`}
                </div>
                {ch.teaser && <div style={{ fontSize: 13, color: '#444' }}>{ch.teaser}</div>}
              </div>

              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                {opened ? (
                  done ? (
                    <button
                      className="btnSecondary"
                      onClick={() => setActiveChapter(ch)}
                      style={{ padding: '8px 10px', borderRadius: 6 }}
                    >
                      Просмотреть
                    </button>
                  ) : (
                    <button
                      className="btnPrimary"
                      onClick={() => setActiveChapter(ch)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: '#0b74de',
                        color: '#fff',
                        border: 'none'
                      }}
                    >
                      Открыть
                    </button>
                  )
                ) : (
                  <button className="btnDisabled" disabled style={{ padding: '8px 10px', borderRadius: 6 }}>
                    Закрыта
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeChapter && (
        <EventChapter
          eventId={eventId}
          chapter={activeChapter}
          user={user}
          eventCfg={eventCfg}
          onClose={() => setActiveChapter(null)}
          onComplete={(res) => handleCompleteFromChapter(res)}
        />
      )}
    </div>
  );
}
