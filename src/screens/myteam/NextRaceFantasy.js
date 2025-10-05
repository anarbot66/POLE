// src/myteam/NextRaceFantasy.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Firebase imports
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import UserStats from '../user/components/UserStats';
import DriverPickerModal from "../components/DriverPickerModal";
import { CSSTransition } from 'react-transition-group';
import Modal from "../components/Modal"; // <-- импорт твоего Modal.js
import { DRIVER_TRANSLATIONS } from '../recources/json/constants';

// импорт переводов названий гонок (путь подогнать под проект)
import { raceNameTranslations } from '../pilots/driverDetails/constants';
import BackButton from '../components/BackButton';

// Правила начисления
const REWARDS = {
  QUALI: 50,
  RACE: 100
};

// добавь рядом с другими константами стилей
const PICK_LABELS = {
  quali: 'Квалификация',
  race:  'Гонка'
};

// Хелпер: парсит дату+время из Ergast / jolpi и возвращает Date.
// Если время не содержит смещения, считаем его UTC (добавляем 'Z')
function parseErgastDate(dateStr, timeStr) {
  if (!dateStr) return null;
  let time = timeStr || '00:00:00';
  // если нет смещения и не заканчивается на Z - добавим Z (UTC)
  if (!/z$/i.test(time) && !/[+\-]\d{2}:\d{2}$/.test(time)) {
    time = time + 'Z';
  }
  try {
    return new Date(`${dateStr}T${time}`);
  } catch {
    return null;
  }
}

// Простой fetch с кешированием в localStorage (ttl в миллисекундах)
async function fetchWithCache(url, cacheKey, ttl = 6 * 60 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < ttl && parsed.data) {
        return parsed.data;
      }
    }

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Fetch error ${resp.status}`);
    const json = await resp.json();
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: json }));
    return json;
  } catch (err) {
    // если не получилось с кешем/сетью — пробуем вернуть что есть в кеше (даже устаревшее)
    const fallback = localStorage.getItem(cacheKey);
    if (fallback) {
      try {
        return JSON.parse(fallback).data;
      } catch {}
    }
    throw err;
  }
}

export default function NextRaceFantasy({ currentUser }) {
  const [races, setRaces] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [nextRace, setNextRace] = useState(null);
  const [deadlineDate, setDeadlineDate] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, key: null });

  const [picks, setPicks] = useState({ quali: '', race: '' });
  const [locked, setLocked] = useState(false);

  const [profile, setProfile] = useState({ points: 0 });

  // уведомления через Modal.js
  const [notify, setNotify] = useState({ show: false, message: '' });

  // флаг "несохранённые локальные правки" — чтобы избежать перезаписи Firestore
  const [dirty, setDirty] = useState(false);

  const navigate = useNavigate();

  // memo options
  const driversOptions = useMemo(() => {
    return drivers.map(d => ({
      id: d.driverId,
      label: `${d.givenName} ${d.familyName} (${d.nationality || ''})`
    }));
  }, [drivers]);

  const driverName = (id) => {
    const d = drivers.find(x => x.driverId === id);
    return d ? `${d.givenName} ${d.familyName}` : id;
  };

  // helper for localStorage key for current round
  const localKeyForRound = (round) => `fantasy_local_picks_round_${round}`;

  // Загрузка расписания и пилотов с кешированием
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [rJson, dJson] = await Promise.all([
          fetchWithCache('https://api.jolpi.ca/ergast/f1/2025/races.json', 'fantasy_races_2025'),
          fetchWithCache('https://api.jolpi.ca/ergast/f1/2025/drivers.json', 'fantasy_drivers_2025')
        ]);

        const racesData = rJson?.MRData?.RaceTable?.Races || [];
        const driversData = dJson?.MRData?.DriverTable?.Drivers || [];

        if (!mounted) return;
        setRaces(racesData);
        setDrivers(driversData);

        // ближайшая гонка по FirstPractice (как раньше)
        const today = new Date();
        const upcoming = racesData
          .map(r => ({ ...r, _fpDate: parseErgastDate(r.FirstPractice?.date, r.FirstPractice?.time) || (r.FirstPractice?.date ? new Date(r.FirstPractice.date) : null) }))
          .filter(r => r._fpDate && r._fpDate >= today)
          .sort((a, b) => a._fpDate - b._fpDate);

        const nr = upcoming[0] || null;
        setNextRace(nr);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Ошибка при загрузке данных');
        setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // когда появляется nextRace, определяем deadline (start of qualifying)
  useEffect(() => {
    if (!nextRace) {
      setDeadlineDate(null);
      return;
    }
    const qual = nextRace.Qualifying;
    const fp = nextRace.FirstPractice;
    const qualStart = qual ? parseErgastDate(qual.date, qual.time) : parseErgastDate(fp?.date, fp?.time);
    setDeadlineDate(qualStart || null);

    // при смене раунда — сбрасываем локальный dirty, но не перезаписываем picks пока не загрузили FS.
    // НЕ делаем setPicks здесь; данные подтянет loadUserPicks ниже.
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextRace]);

  // Отсчёт до дедлайна (start of qualifying)
  useEffect(() => {
    if (!deadlineDate) {
      setCountdown(null);
      setLocked(false);
      return;
    }

    let mounted = true;
    const update = () => {
      const now = new Date();
      const diffMs = deadlineDate - now;
      if (diffMs <= 0) {
        if (!mounted) return;
        setCountdown({ hours: 0, mins: 0, secs: 0 });
        setLocked(true);
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        let left = diffMs - hours * 1000 * 60 * 60;
        const mins = Math.floor(left / (1000 * 60));
        left -= mins * 1000 * 60;
        const secs = Math.floor(left / 1000);
        if (!mounted) return;
        setCountdown({ hours, mins, secs });
        setLocked(false);
      }
    };

    update();
    const id = setInterval(update, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, [deadlineDate]);

async function markPickSettledAndAddPoints(userRef, round, raceName, gainedPoints, details) {
  // Получаем свежие данные пользователя
  const freshSnap = await getDoc(userRef);
  const freshData = freshSnap.exists() ? freshSnap.data() : {};
  // теперь берем очки из fantasyPoints
  const existingPoints = freshData?.fantasyPoints || 0;
  const newPoints = existingPoints + (gainedPoints || 0);

  const existingFantasyPicks = freshData?.fantasyPicks || {};

  // нормализуем в объектную форму
  let normalized = {};
  if (Array.isArray(existingFantasyPicks)) {
    for (const it of existingFantasyPicks) {
      if (!it || !it.round) continue;
      normalized[String(it.round)] = it;
    }
  } else {
    normalized = { ...existingFantasyPicks };
  }

  const prevPick = normalized[String(round)] || {};
  normalized[String(round)] = {
    ...(prevPick.picks ? prevPick : prevPick.picks ? { picks: prevPick.picks } : prevPick),
    round: String(round),
    raceName: prevPick.raceName || raceName || (`Раунд ${round}`),
    settled: true,
    settledAt: new Date().toISOString(),
    gainedPoints: gainedPoints || 0,
    settleDetails: Array.isArray(details) ? details : [String(details || '')]
  };

  const payloadToWrite = {
    // записываем очки в fantasyPoints (вместо fantasyProfile.points)
    fantasyPoints: newPoints,
    fantasyPicks: normalized
  };

  await setDoc(userRef, payloadToWrite, { merge: true });

  return { newPoints, normalized };
}


// ---------------------- useEffect (() => { loadUserPicks(); }, [currentUser, nextRace, races]) ----------------------
useEffect(() => {
  const loadUserPicks = async () => {
    try {
      const user = currentUser;
      if (!user || !nextRace) return;

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : {};
      const savedPicksObj = data?.fantasyPicks || {};
      // читаем очки из fantasyPoints вместо fantasyProfile.points
      const savedProfilePoints = data?.fantasyPoints || 0;

      // Если в localStorage есть несохранённые picks для этого раунда — используем их и пометим dirty
      const localRaw = localStorage.getItem(localKeyForRound(nextRace.round));
      if (localRaw) {
        try {
          const localP = JSON.parse(localRaw);
          if (localP && (localP.quali || localP.race)) {
            setPicks({ quali: localP.quali || '', race: localP.race || '' });
            setDirty(true);
          }
        } catch { /* ignore */ }
      } else {
        // только если нет локальных правок — грузим из Firestore
        if (!dirty) {
          const currentRoundPick = savedPicksObj?.[nextRace.round];
          if (currentRoundPick) {
            const picksValue = currentRoundPick.picks || currentRoundPick;
            setPicks({
              quali: picksValue.quali || '',
              race: picksValue.race || ''
            });
          } else {
            // если явного прогноза нет — сбросим local picks
            setPicks({ quali: '', race: '' });
          }
        }
      }

      setProfile({ points: savedProfilePoints });

      // --- автоматическая обработка прошлых прогнозов (с пометкой settled) ---
      const now = new Date();

      const raceByRound = (round) => races.find(r => String(r.round) === String(round));

      const picksEntries = [];
      if (Array.isArray(savedPicksObj)) {
        for (const item of savedPicksObj) {
          if (!item || !item.round) continue;
          picksEntries.push({ round: String(item.round), item });
        }
      } else if (savedPicksObj && typeof savedPicksObj === 'object') {
        for (const k of Object.keys(savedPicksObj)) {
          picksEntries.push({ round: String(k), item: savedPicksObj[k] });
        }
      }

      const autoNotifies = [];

      for (const entry of picksEntries) {
        const round = entry.round;
        if (round === String(nextRace.round)) continue;
        const pickObj = entry.item;
        if (!pickObj) continue;
        if (pickObj.settled) continue; // пропускаем уже обработанные

        const raceObj = raceByRound(round);
        let raceDate = null;
        if (raceObj) {
          raceDate = parseErgastDate(raceObj.date, raceObj.time);
        }
        if (raceDate && raceDate > now) continue;

        try {
          const [qualiResp, raceResp] = await Promise.all([
            fetch(`https://api.jolpi.ca/ergast/f1/2025/${round}/qualifying.json`),
            fetch(`https://api.jolpi.ca/ergast/f1/2025/${round}/results.json`)
          ]);

          let qualiWinnerId = null;
          let raceWinnerId = null;

          if (qualiResp.ok) {
            const qj = await qualiResp.json();
            const qRes = qj?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || [];
            if (qRes.length) {
              const first = qRes.find(r => r.position === '1') || qRes[0];
              qualiWinnerId = first?.Driver?.driverId;
            }
          }

          if (raceResp.ok) {
            const rj = await raceResp.json();
            const rRes = rj?.MRData?.RaceTable?.Races?.[0]?.Results || [];
            if (rRes.length) {
              const first = rRes.find(r => r.position === '1') || rRes[0];
              raceWinnerId = first?.Driver?.driverId;
            }
          }

          let gainedPoints = 0;
          const details = [];

          const picksForThis = pickObj.picks || pickObj;
          const qualiPick = picksForThis?.quali;
          const racePick = picksForThis?.race;

          if (qualiWinnerId && qualiPick) {
            if (qualiWinnerId === qualiPick) {
              gainedPoints += REWARDS.QUALI;
              details.push(`Quali: +${REWARDS.QUALI}`);
            } else details.push('Quali: неверно');
          } else details.push('Quali: данные отсутствуют');

          if (raceWinnerId && racePick) {
            if (raceWinnerId === racePick) {
              gainedPoints += REWARDS.RACE;
              details.push(`Race: +${REWARDS.RACE}`);
            } else details.push('Race: неверно');
          } else details.push('Race: данные отсутствуют');

          const hasAnyResult = (qualiWinnerId || raceWinnerId);
          if (!hasAnyResult) continue;

          // Помечаем прогноз settled и прибавляем очки в fantasyPoints
          try {
            const { newPoints } = await markPickSettledAndAddPoints(userRef, round, raceObj?.raceName, gainedPoints, details);
            setProfile({ points: newPoints });

            const raceTitle = raceObj?.raceName || `Раунд ${round}`;
            autoNotifies.push(`${raceTitle}: получено ${gainedPoints} очков. (${details.join(', ')})`);
          } catch (err) {
            console.error('Ошибка при записи settled для раунда', round, err);
          }
        } catch (err) {
          console.error('Ошибка при автоматической проверке прошлых прогнозов', round, err);
        }
      }

      if (autoNotifies.length) {
        setNotify({ show: true, message: `Автоматически начислено:\n\n${autoNotifies.join('\n')}` });
      }

    } catch (err) {
      console.error('Ошибка загрузки picks из Firestore', err);
    }
  };

  loadUserPicks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentUser, nextRace, races]);


  // Обработчик изменения выбора — помечаем dirty, сохраняем в localStorage
  const handlePickChange = (key, value) => {
    if (locked) return;
    setPicks(prev => {
      const next = { ...prev, [key]: value };
      // persist to localStorage for current round (if known)
      if (nextRace && nextRace.round) {
        try {
          localStorage.setItem(localKeyForRound(nextRace.round), JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    setDirty(true);
  };

  // Сохранить picks в Firestore
  const savePicks = async () => {
    if (!currentUser || !nextRace) {
      setNotify({ show: true, message: 'Нет гонки или аккаунта.' });
      return;
    }
    if (locked) {
      setNotify({ show: true, message: 'Прогнозы закрыты' });
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : {};
      const fantasyPicks = data?.fantasyPicks || {};

      const newPickObj = {
        round: nextRace.round,
        raceName: nextRace.raceName,
        picks,
        savedAt: new Date().toISOString()
      };

      if (Array.isArray(fantasyPicks)) {
        const obj = {};
        for (const it of fantasyPicks) {
          if (!it || !it.round) continue;
          obj[String(it.round)] = it;
        }
        obj[String(nextRace.round)] = newPickObj;
        await setDoc(userRef, { fantasyPicks: obj }, { merge: true });
      } else {
        const updatePayload = {
          fantasyPicks: {
            [nextRace.round]: newPickObj
          }
        };
        await setDoc(userRef, updatePayload, { merge: true });
      }

      // удаляем локальный кеш и снимаем dirty
      try { localStorage.removeItem(localKeyForRound(nextRace.round)); } catch {}
      setDirty(false);

      setNotify({ show: true, message: 'Прогноз сохранён.' });
    } catch (err) {
      console.error('Ошибка при сохранении прогноза', err);
      setNotify({ show: true, message: 'Не удалось сохранить прогноз: ' + (err.message || err) });
    }
  };


  const clearLocalPicks = () => {
    if (locked) return;
    setPicks({ quali: '', race: '' });
    if (nextRace && nextRace.round) {
      try { localStorage.removeItem(localKeyForRound(nextRace.round)); } catch {}
    }
    setDirty(false);
  };

  const calcPotential = () => ({ points: REWARDS.QUALI + REWARDS.RACE });

  const checkResultsAndSettle = async () => {
    try {
      const user = currentUser;
      if (!user) {
        setNotify({ show: true, message: 'Требуется войти в аккаунт для проверки/начисления.' });
        return;
      }
      if (!nextRace) {
        setNotify({ show: true, message: 'Нет следующей гонки для проверки.' });
        return;
      }

      const round = nextRace.round;

      const [qualiResp, raceResp] = await Promise.all([
        fetch(`https://api.jolpi.ca/ergast/f1/2025/${round}/qualifying.json`),
        fetch(`https://api.jolpi.ca/ergast/f1/2025/${round}/results.json`)
      ]);

      let qualiWinnerId = null;
      let raceWinnerId = null;

      if (qualiResp.ok) {
        const qj = await qualiResp.json();
        const qRes = qj?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || [];
        if (qRes.length) {
          const first = qRes.find(r => r.position === '1') || qRes[0];
          qualiWinnerId = first?.Driver?.driverId;
        }
      }

      if (raceResp.ok) {
        const rj = await raceResp.json();
        const rRes = rj?.MRData?.RaceTable?.Races?.[0]?.Results || [];
        if (rRes.length) {
          const first = rRes.find(r => r.position === '1') || rRes[0];
          raceWinnerId = first?.Driver?.driverId;
        }
      }

      let gainedPoints = 0;
      const details = [];

      if (qualiWinnerId && picks.quali) {
        if (qualiWinnerId === picks.quali) {
          gainedPoints += REWARDS.QUALI;
          details.push(`Quali: +${REWARDS.QUALI} FP`);
        } else details.push('Quali: неверно');
      } else details.push('Quali: данные отсутствуют');

      if (raceWinnerId && picks.race) {
        if (raceWinnerId === picks.race) {
          gainedPoints += REWARDS.RACE;
          details.push(`Race: +${REWARDS.RACE} FP`);
        } else details.push('Race: неверно');
      } else details.push('Race: данные отсутствуют');

      const hasAnyResult = (qualiWinnerId || raceWinnerId);
      if (!hasAnyResult) {
        setNotify({ show: true, message: 'Результаты для этого раунда ещё не доступны.' });
        return;
      }

      const userRef = doc(db, 'users', user.uid);

      // Помечаем прогноз как settled и прибавляем очки
      try {
        const { newPoints } = await markPickSettledAndAddPoints(userRef, round, nextRace.raceName, gainedPoints, details);
        // удаляем локальный кеш и снимаем dirty (на случай, если юзер заранее выбрал, но не сохранил)
        try { localStorage.removeItem(localKeyForRound(round)); } catch {}
        setDirty(false);

        setProfile({ points: newPoints });
        setLocked(true);
        setNotify({ show: true, message: 'Проверка завершена.\n' + details.join('\n') + `\n\nПолучено очков: ${gainedPoints}` });
      } catch (err) {
        console.error('Ошибка при пометке settled/записи очков', err);
        setNotify({ show: true, message: 'Не удалось записать результаты: ' + (err.message || err) });
      }
    } catch (err) {
      console.error('Ошибка при проверке/начислении', err);
      setNotify({ show: true, message: 'Не удалось получить результаты или начислить очки: ' + (err.message || err) });
    }
  };

  // ранние возвраты (после того как все хуки объявлены)
  if (loading) return (<div style={{ padding: 24 }}></div>);
  if (error) return (<div style={{ padding: 24, color: '#ff6b6b' }}>Ошибка: {error}</div>);
  if (!nextRace) return (<div style={{ padding: 24 }}></div>);

  const translatedRaceName = (raceNameTranslations && raceNameTranslations[nextRace.raceName]) ? raceNameTranslations[nextRace.raceName] : nextRace.raceName;

  // inline styles (тот же набор, без изменений)
  const containerStyle = {
    width: "calc(100% - 30px)",
    height: "100%",
    margin: "0px 15px",
    marginBottom: "100px",
    paddingTop: "15px",
    color: '#fff',
    fontFamily: 'Inter, Roboto, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial'
  };

  const headerRow = {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    padding: '5px 0px'
  };

  const topBlock = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    marginTop: 8
  };

  const leftCol = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  };

  const smallText = { fontSize: 12, color: '#9ca3af' }; // gray-400
  const titleText = { fontSize: 20, color: '#fff' };

  const countdownText = { fontSize: 20, color: '#fff' };
  const warnText = { fontSize: 12, color: '#f59e0b' };

  const gridWrapper = { marginTop: 18, display: 'grid', width: '100%' };

  const cardStyle = { background: '#111827', padding: 16, borderRadius: 12, color: '#fff' };

  const labelStyle = { fontSize: 12, color: '#9ca3af', marginBottom: 6 };

  const pickBox = (isLocked) => ({
    width: '100%',
    padding: 10,
    borderRadius: 8,
    cursor: isLocked ? 'default' : 'pointer',
    background: isLocked ? '#374151' : '#111827',
    color: isLocked ? '#9ca3af' : '#fff',
    border: '1px solid rgba(255,255,255,0.03)'
  });

  const btn = (bg = '#2563eb') => ({
    padding: '8px 12px',
    background: bg,
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer'
  });

  const smallMuted = { fontSize: 12, color: '#9ca3af' };

  return (
    <div style={containerStyle}>
      <div>
        <div style={headerRow}>
          <BackButton></BackButton>
          {currentUser && <UserStats uid={currentUser.uid} />}
        </div>

        <div style={topBlock}>
          <div style={leftCol}>
            <div style={smallText}>Следующая гонка</div>
            <div style={{ fontSize: 22, color: '#fff' }}>
              Гран-при {translatedRaceName}
            </div>
            <div style={smallText}>{nextRace.Circuit.Location.locality}, {nextRace.Circuit.Location.country}</div>
            <div style={{ ...smallText, marginBottom: 6 }}>Прогнозы закрываются через</div>
            {deadlineDate ? (
              countdown ? (
                <div style={countdownText}>
                  {String(countdown.hours).padStart(2,'0')}:{String(countdown.mins).padStart(2,'0')}:{String(countdown.secs).padStart(2,'0')}
                </div>
              ) : (
                <div style={smallMuted}>—</div>
              )
            ) : (
              <div style={warnText}>В расписании нет времени квалификации — используется время первой практики</div>
            )}
          </div>
        </div>

        <div style={gridWrapper}>
          <div>
            <div style={{ ...smallText, marginBottom: 8 }}>{locked ? 'Прогнозы закрыты' : 'Выберите прогнозы'}</div>

            {['quali','race'].map(key => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ ...labelStyle }}>
                  {PICK_LABELS[key] || key.toUpperCase()}
                </label>
                <div
                  onClick={() => !locked && setModal({ open: true, key })}
                  style={pickBox(locked)}
                  role="button"
                  aria-disabled={locked}
                  tabIndex={0}
                  onKeyDown={(e) => { if (!locked && (e.key === 'Enter' || e.key === ' ')) setModal({ open: true, key }); }}
                >
                  {picks[key] ? DRIVER_TRANSLATIONS[driverName(picks[key])] : "Нажмите, чтобы выбрать"}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexDirection: "column" }}>
              <button onClick={savePicks} style={btn('#2563eb')} disabled={locked}>Сохранить в аккаунт</button>
            </div>

          </div>
        </div>
      </div>

      <CSSTransition
        in={modal.open}
        timeout={300}
        classNames="window-fade"
        unmountOnExit
        mountOnEnter
        appear
      >
        <DriverPickerModal
          isOpen={modal.open}
          onClose={() => setModal({ open: false, key: null })}
          drivers={drivers}
          title={
            modal.key === "quali"
              ? "Кто победит в квалификации?"
              : "Кто победит в гонке?"
          }
          onSelect={(driverId) => {
            if (modal.key) {
              // применяем выбор и помечаем как несохранённый
              handlePickChange(modal.key, driverId);
              // закрываем модалку — модалка сама вызывала onClose(), но на всякий случай
              setModal({ open: false, key: null });
            }
          }}
        />
      </CSSTransition>

      {/* Модальное уведомление (твой Modal.js) */}
      <Modal
        show={notify.show}
        onClose={() => setNotify({ show: false, message: '' })}
        message={notify.message}
        buttonText="Понятно"
      />
    </div>
  );
}
