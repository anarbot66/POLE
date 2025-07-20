// src/components/DailyRewardsGrid.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isWeekend
} from 'date-fns';
import { useSwipeable } from 'react-swipeable';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import logo from "../../recources/images/apex-logo.png";
import { useNavigate } from "react-router-dom";
import { ru } from 'date-fns/locale';

export default function DailyRewardsGrid({ currentUser }) {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'quests'
  const [yearMonth, setYearMonth] = useState(new Date());
  const [weekendDates, setWeekendDates] = useState(new Set());
  const [claimedDates, setClaimedDates] = useState(new Set());
  const [quests, setQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState(new Set());
  const navigate = useNavigate();

  if (!currentUser || !currentUser.uid) {
    navigate("/");
  }

  const today = new Date();
  const uid = currentUser?.uid;
  const tabs = ['daily','quests'];
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

  // ------- Загрузка дат гоночных уик-эндов -------
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('https://api.jolpi.ca/ergast/f1/2025/races.json');
        const json = await resp.json();
        const races = json.MRData.RaceTable.Races;
        const s = new Set();
        races.forEach(r => {
          const start = new Date(r.FirstPractice.date);
          const end   = new Date(r.date);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
            s.add(format(d, 'yyyy-MM-dd'));
        });
        setWeekendDates(s);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // ------- Загрузка уже собранных наград -------
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const snap = await getDocs(collection(db, 'users', uid, 'dailyRewards'));
      setClaimedDates(new Set(snap.docs.map(d => d.id)));
    })();
  }, [uid]);

  // ------- Загрузка списка квестов и их статуса -------
  useEffect(() => {
    if (!uid) return;
    // 1) Все квесты
    getDocs(collection(db, 'quests')).then(snap => {
      setQuests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    // 2) Выполненные пользователем
    getDocs(collection(db, 'users', uid, 'completedQuests')).then(snap => {
      setCompletedQuests(new Set(snap.docs.map(d => d.id)));
    });
  }, [uid]);

  // ------- Календарь дней -------
  const calendar = useMemo(() => {
    const start = startOfWeek(startOfMonth(yearMonth), { weekStartsOn: 1 });
    const end   = endOfWeek(endOfMonth(yearMonth),   { weekStartsOn: 1 });
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
      days.push(new Date(d));
    return days;
  }, [yearMonth]);

  // ------- Сбор ежедневной награды -------
  const handleCollect = async day => {
    const key = format(day, 'yyyy-MM-dd');
    if (claimedDates.has(key) || !isSameDay(day, today)) return;

    let apex = isWeekend(day) ? 0 : 100;
    let gs   = isWeekend(day) ? 10 : 0;
    if (weekendDates.has(key)) { apex = 100; gs = 10; }

    await setDoc(doc(db, 'users', uid, 'dailyRewards', key), {
      collectedAt: new Date(), apex, gs
    });
    await updateDoc(doc(db, 'users', uid), {
      apexPoints: increment(apex),
      gsCurrency: increment(gs)
    });
    setClaimedDates(prev => new Set(prev).add(key));
  };

  // ------- Выполнение квеста -------
  const handleCompleteQuest = async questId => {
    if (completedQuests.has(questId)) return;
    // записываем факт выполнения
    await setDoc(doc(db, 'users', uid, 'completedQuests', questId), {
      completedAt: new Date()
    });
    // начисляем 100 apex
    await updateDoc(doc(db, 'users', uid), {
      apexPoints: increment(100)
    });
    setCompletedQuests(prev => new Set(prev).add(questId));
  };


  return (
    <div style={{ padding: 20, color: 'white', marginBottom: '150px' }}>
      <div className="topNavigateGlass" style={{borderRadius: '15px', position: 'fixed', width: "calc(100% - 30px)", top: 10, left: 15, right: 15, padding: 15, zIndex: 999, marginTop: '100px'}}>

      <div
          style={{
            display: 'flex',
            borderRadius: '20px',
          }}
        >
          <button
            onClick={() => setActiveTab('daily')}
            style={{
              padding: '10px 20px',
              width: '100%',
              boxShadow: activeTab === 'daily' ? '0 0 0 1px rgba(255,255,255,0.2)' : '0 0 0 0 rgba(255,255,255,0)',
              color: 'white',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'box-shadow 0.3s ease',
              fontSize: 14
            }}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            style={{
              padding: '10px 20px',
              width: '100%',
              boxShadow: activeTab === 'quests' ? '0 0 0 1px rgba(255,255,255,0.2)' : '0 0 0 0 rgba(255,255,255,0)',
              color: 'white',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'box-shadow 0.3s ease',
              fontSize: 14
            }}
          >
            Квесты
          </button>
        </div>
      </div>
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
              marginTop: '80px'
            }} className="">
              
        {activeTab === "daily" && (
        // ======== DailyRewardsGrid ========
        <div>

          {/* Грид 5 колонок */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
          }}>
            {calendar.map(day => {
              const key     = format(day, 'yyyy-MM-dd');
              const inMonth = isSameMonth(day, yearMonth);
              const claimed = claimedDates.has(key);
              const isToday = isSameDay(day, today);
              const isPast  = !isToday && day < today;
              const showApex = (!isWeekend(day) && day <= today) || weekendDates.has(key);
              const showGs   = (isWeekend(day) && day <= today) || weekendDates.has(key);

              return (
                <div
                  key={key}
                  onClick={() => handleCollect(day)}
                  style={{
                    minHeight: 100,
                    padding: 8,
                    background: inMonth ? 'transparent' : '#111',
                    color: !inMonth
                      ? '#555'
                      : (claimed || isPast)
                        ? '#404040'
                        : isToday
                          ? '#0f0'
                          : '#fff',
                    cursor: isToday && !claimed ? 'pointer' : 'default',
                    position: 'relative',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.2)',
                    userSelect: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  
                  <div style={{ fontSize: 14, marginBottom: '5px' }}>{day.getDate()}</div>
                  <div style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    flexDirection: 'column'
                  }}>
                    {showApex && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexDirection: 'column'
                      }}>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 'bold'
                        }}>+100</span>
                        <img
                          src={logo}
                          alt="Apex"
                          style={{
                            width: 20,
                            height: 20,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}
                    {showGs && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexDirection: 'column'
                      }}>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 'bold'
                        }}>+10</span>
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
                      </div>
                    )}
                  </div>
                  {claimed && (
                    <span style={{
                      position: 'absolute',
                      top: 6,
                      right: 8,
                      fontSize: 12,
                      color: '#0f0'
                    }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
        {activeTab === "quests" && (
  completedQuests.size === quests.length
    ? (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#A3A3A3',
        fontSize: 16
      }}>
        Квестов больше нет
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {quests.map(q => {
          const done = completedQuests.has(q.id);
          return (
            <div
              key={q.id}
              onClick={() => {
                if (!done) {
                  window.open(q.url, '_blank');
                  handleCompleteQuest(q.id);
                }
              }}
              style={{
                padding: 15,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 25,
                display: 'inline-flex',
                flexDirection: 'column',
                gap: 3,
                cursor: done ? 'default' : 'pointer',
                opacity: done ? 0.5 : 1
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <div style={{
                  flex: 1,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  {q.title}
                </div>
              </div>
              <div style={{
                color: '#A3A3A3',
                fontSize: 11,
                fontWeight: 500
              }}>
                {q.description}
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                {done ? (
                  <div style={{ color: '#0f0', fontSize: 12 }}>Выполнено ✓</div>
                ) : (
                  <div style={{
                    color: '#A3A3A3',
                    fontSize: 11,
                    fontWeight: 500
                  }}>
                    Награда: 100 APoints
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )
)}

      </div>
      </CSSTransition>
        </TransitionGroup>
    </div>
  );
}
