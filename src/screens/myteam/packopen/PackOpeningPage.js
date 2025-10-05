// src/myteam/packopen/PackOpeningPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, runTransaction, getDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import logo from "../../recources/images/logo.png";

import cardsJson from '../cards/cards.json';
import packsJson from '../packs/packs.json';
import './PackOpeningPage.css';

// порядок редкостей (index ↑ = редкость ↑)
const rarityOrder = ['rookie', 'common', 'rare', 'epic', 'legendary', 'hero', 'prime_hero', 'icon', 'prime_icon'];
const rarityRank = Object.fromEntries(rarityOrder.map((r, i) => [r, i]));

// Weighted pick (unchanged) ...
function weightedPickOne(items) {
  if (!items || items.length === 0) return null;
  const effective = items.map(it => {
    const base = Number(it.weight || 0);
    const rtg = Number(it.rtg) || 100;
    return { ...it, effWeight: Math.max(0.0001, base * (100 / rtg)) };
  });
  const total = effective.reduce((s, it) => s + it.effWeight, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const it of effective) {
    acc += it.effWeight;
    if (r <= acc) return it;
  }
  return effective[effective.length - 1];
}

function drawPackFromDefinitions(packDef, cardsPool) {
  if (!packDef || !cardsPool) return [];
  const count = packDef.count || 5;

  let allowedOrig = (packDef.allowedRarities && packDef.allowedRarities.length)
    ? cardsPool.filter(c => packDef.allowedRarities.includes(c.rarity))
    : cardsPool.slice();

  allowedOrig = allowedOrig.filter(c => String(c.rarity).toLowerCase() !== 'event');

  if (!allowedOrig.length) {
    allowedOrig = cardsPool.filter(c => String(c.rarity).toLowerCase() !== 'event');
  }

  const localAllowed = allowedOrig.slice();
  const draws = [];

  const raritiesAtOrAbove = (base) => {
    const br = rarityRank[base];
    if (br === undefined) return [];
    return rarityOrder.filter(r => rarityRank[r] >= br);
  };

  function pickAndRemove(pool) {
    if (!pool || pool.length === 0) return null;
    const chosen = weightedPickOne(pool);
    if (!chosen) return null;
    const idx = localAllowed.findIndex(c => c.id === chosen.id);
    if (idx !== -1) localAllowed.splice(idx, 1);
    return chosen;
  }

  if (packDef.guarantee && Object.keys(packDef.guarantee).length) {
    for (const [k, v] of Object.entries(packDef.guarantee)) {
      // special-case minRtg semantics if you treat value as threshold (existing logic uses cnt = Number(v) )
      // keep old behaviour where numeric v means count for non-minRtg keys
      const cnt = (k === 'minRtg') ? 1 : (Number(v) || 0);

      for (let i = 0; i < cnt; i++) {
        let candidate = [];

        if (k === 'minRtg') {
          const minRtg = Number(v || 0);
          candidate = localAllowed.filter(c => Number(c.rtg || 0) >= minRtg);
        } else {
          const orBetter = k.match(/^(.*)OrBetter$/i);
          if (orBetter) {
            const base = orBetter[1].toLowerCase();
            const allowedRars = raritiesAtOrAbove(base);
            candidate = localAllowed.filter(c => allowedRars.includes(c.rarity));
          } else {
            const twoMatch = k.match(/^([a-z0-9_]+)Or([a-z0-9_]+)$/i);
            if (twoMatch) {
              const a = twoMatch[1].toLowerCase();
              const b = twoMatch[2].toLowerCase();
              candidate = localAllowed.filter(c => c.rarity === a || c.rarity === b);
            } else {
              candidate = localAllowed.filter(c => c.rarity === k.toLowerCase());
            }
          }
        }

        // дополнительно фильтруем кандидат-пул на случай, если туда случайно попали event-карты
        candidate = candidate.filter(c => String(c.rarity).toLowerCase() !== 'event');

        let pick = pickAndRemove(candidate);
        if (!pick) {
          // fallback: пробуем взять из allowedOrig (без event), исключая уже выбранные
          const fallback = allowedOrig.filter(c => !draws.some(d => d.id === c.id));
          pick = pickAndRemove(fallback.length ? fallback : allowedOrig) || weightedPickOne(cardsPool.filter(c => String(c.rarity).toLowerCase() !== 'event'));
        }
        if (pick) draws.push(pick);
      }
    }
  }

  while (draws.length < count) {
    let pick = null;
    if (localAllowed.length) pick = pickAndRemove(localAllowed);
    else {
      const remaining = allowedOrig.filter(c => !draws.some(d => d.id === c.id));
      pick = pickAndRemove(remaining.length ? remaining : allowedOrig) || weightedPickOne(cardsPool.filter(c => String(c.rarity).toLowerCase() !== 'event'));
    }
    if (pick) draws.push(pick);
    else break;
  }

  return draws.slice(0, count).filter(Boolean);
}


function pickTopCard(cards) {
  if (!cards || cards.length === 0) return null;
  let best = cards[0];
  for (const c of cards) {
    const rc = rarityRank[c.rarity] ?? -1;
    const rb = rarityRank[best.rarity] ?? -1;
    if (rc > rb) best = c;
    else if (rc === rb) {
      const wC = Number(c.weight || 0) * (100 / (Number(c.rtg) || 100));
      const wB = Number(best.weight || 0) * (100 / (Number(best.rtg) || 100));
      if (wC > wB) best = c;
      else if (wC === wB && Number(c.rtg || 0) > Number(best.rtg || 0)) best = c;
    }
  }
  return best;
}

const CARDS = (cardsJson && cardsJson.cards) ? cardsJson.cards : [];
const PACKS_ARRAY = (packsJson && packsJson.packs) ? packsJson.packs : [];
const PACKS = Object.fromEntries(PACKS_ARRAY.map(p => [p.id, p]));

export default function PackOpeningPage({ uid, currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const initialPackId = location.state?.packId || params.get('pack') || (PACKS_ARRAY[0] && PACKS_ARRAY[0].id);
  const skipRef = useRef(false);
const [skipAnimation, setSkipAnimation] = useState(false);

const handleSkip = () => {
  skipRef.current = true;
  setSkipAnimation(true);
};

  const [, setPackId] = useState(initialPackId);
  const [packDef, setPackDef] = useState(null);

  const [, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [drawn, setDrawn] = useState(null);
  const [topCard, setTopCard] = useState(null);
  const [stage, setStage] = useState('idle'); // idle -> flag -> team -> reveal
  const [error, setError] = useState(null);

  const flagControls = useAnimation();
  const teamControls = useAnimation();
  const flashControls = useAnimation();
  const cardControls = useAnimation();

  const [prevCards, setPrevCards] = useState({});
  const prevCardsRef = useRef({});
  const [dissolving, setDissolving] = useState({});
  const [, setKept] = useState({});
  const [dissolved, setDissolved] = useState({});

  const userId = uid ?? currentUser?.uid ?? (auth && auth.currentUser ? auth.currentUser.uid : null);
  const pendingRef = useRef(false);

  // small helpers
  const raf = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
  const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    if (location.state && location.state.packDef) {
      setPackDef(location.state.packDef);
      setPackId(location.state.packDef.id);
    } else {
      setPackDef(PACKS[initialPackId] || PACKS_ARRAY[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return setUser(null);
    const userRef = doc(db, 'users', userId);
    getDoc(userRef).then(snap => {
      if (snap.exists()) setUser({ id: snap.id, ...snap.data() });
      else setUser(null);
    }).catch(e => console.error(e));
  }, [userId]);

  async function preloadImages(urls = []) {
    await Promise.all(urls.map(u => new Promise((res) => {
      if (!u) return res(true);
      const img = new Image();
      img.onload = () => res(true);
      img.onerror = () => res(true);
      img.src = u;
    })));
  }

  function getRarityMultiplier(rarity) {
    const map = {
      consumable: 3,
      rookie: 5,
      common: 10,
      rare: 25,
      epic: 40,
      legendary: 80,
      hero: 60,
      prime_hero: 80,
      icon: 100,
      prime_icon: 120
    };
    return map[rarity] || 1;
  }

  function calcDissolveValue(card) {
    const rtg = Number(card.rtg || 0);
    const mult = getRarityMultiplier(card.rarity);
    return Math.round(rtg * mult);
  }

  const handleOpen = async () => {
    if (!packDef) { setError('Не выбран пак для открытия'); return; }
    if (!userId) { setError('Пожалуйста, войдите в аккаунт для открытия пака'); return; }

    if (pendingRef.current) return;
    pendingRef.current = true;
    setError(null);
    setLoading(true);
    setDrawn(null);
    setTopCard(null);
    setPrevCards({});
    prevCardsRef.current = {};
    setKept({});
    setDissolving({});
    setDissolved({});

    const userRef = doc(db, 'users', userId);

    try {
      const snapBefore = await getDoc(userRef);
      const beforeData = snapBefore.exists() ? snapBefore.data() : {};
      const beforeCards = beforeData.cards || {};
      setPrevCards(beforeCards);
      prevCardsRef.current = beforeCards;

      const balanceBefore = beforeData.gsCurrency ?? beforeData.gsCurrency ?? 0;
      if (balanceBefore < packDef.price) {
        setError('Недостаточно ApexPoints');
        setLoading(false);
        pendingRef.current = false;
        return;
      }

      const clientDraws = drawPackFromDefinitions(packDef, CARDS);
      if (!clientDraws || clientDraws.length === 0) {
        setError('Не удалось сформировать карты для пака');
        setLoading(false);
        pendingRef.current = false;
        return;
      }

      const draws = await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User not found');
        const data = snap.data();
        const balance = data.gsCurrency ?? data.gsCurrency ?? 0;
        if (balance < packDef.price) throw new Error('Недостаточно ApexPoints');
      
        const updates = {};
        updates['gsCurrency'] = increment(-packDef.price);
        for (const c of clientDraws) updates[`cards.${c.id}`] = increment(1);
      
        // Записываем последнюю выпавшую карту
        const top = pickTopCard(clientDraws) || clientDraws[0];
        if (top) updates['lastCard'] = top.id;
      
        tx.update(userRef, updates);
        return clientDraws;
      });
      

      setUser(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        next.gsCurrency = (next.gsCurrency || 0) - packDef.price;
        next.cards = { ...(next.cards || {}) };
        for (const d of draws) next.cards[d.id] = (next.cards[d.id] || 0) + 1;
      
        const top = pickTopCard(draws) || draws[0];
        if (top) next.lastCard = top.id;
      
        return next;
      });
      

      setDrawn(draws);
      const top = pickTopCard(draws);
      setTopCard(top || draws[0] || null);

      const topImage = top?.image ? [top.image] : [];
      await preloadImages(topImage);

      await runCinematicSequence(top, packDef, draws);

      const flagUrl = draws[0]?.nation ? `https://flagcdn.com/w160/${String(draws[0].nation).toLowerCase()}.png` : null;
      const imagesToPreload = [
        ...draws.map(d => d.image),
        flagUrl,
      ].filter(Boolean).filter(u => !topImage.includes(u));
      preloadImages(imagesToPreload).catch(() => {});
    } catch (e) {
      console.error('Pack open error', e);
      setError(e.message || 'Ошибка открытия пака');
    } finally {
      setLoading(false);
      pendingRef.current = false;
    }
  };

  async function handleDissolve(card) {
    if (!userId) { setError('Требуется вход'); return; }
    if (!card || !card.id) { setError('Неверная карта'); return; }

    const cardId = card.id;
    if ((prevCardsRef.current[cardId] || 0) <= 0) {
      setError('Нельзя распылить новую карту — распыление доступно только для дубликатов.');
      return;
    }

    const val = calcDissolveValue(card);
    setDissolving(prev => ({ ...prev, [cardId]: true }));

    try {
      const userRef = doc(db, 'users', userId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('Пользователь не найден');
        const data = snap.data();
        const cards = data.cards || {};
        const have = Number(cards[cardId] || 0);
        if (have <= 0) throw new Error('У вас нет этой карты для распыления');

        const updates = {};
        updates['apexPoints'] = increment(val);
        updates[`cards.${cardId}`] = increment(-1);
        tx.update(userRef, updates);
      });

      setUser(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        next.apexPoints = (next.apexPoints || 0) + val;
        next.cards = { ...(next.cards || {}) };
        next.cards[cardId] = Math.max(0, (next.cards[cardId] || 0) - 1);
        return next;
      });

      setDissolved(prev => ({ ...prev, [cardId]: true }));
      setPrevCards(prev => ({ ...prev, [cardId]: Math.max(0, (prev[cardId] || 0) - 1) }));
      setKept(prev => ({ ...prev, [cardId]: false }));
      setError(null);
    } catch (e) {
      console.error('handleDissolve error', e);
      setError(e && e.message ? e.message : 'Ошибка распыления');
    } finally {
      setDissolving(prev => ({ ...prev, [cardId]: false }));
    }
  }

  useEffect(() => {
    const autoOpen = Boolean(location.state && location.state.autoOpen) || params.get('autoOpen') === '1';
    if (autoOpen && packDef && !drawn && !loading) {
      const t = setTimeout(() => { handleOpen(); }, 180);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, packDef]);

  // CINEMATIC: strict fade in/out between flag -> team -> card
  function preloadOne(url) {
    return new Promise((resolve) => {
      if (!url) return resolve();
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  }
  
  async function runCinematicSequence(top, packDef, draws) {
    try {
      if (!top) return;
  
      if (!skipRef.current) {
        setStage('flag');
        await raf();
        if (!skipRef.current && top.nation) {
          const flagUrl = `https://flagcdn.com/w160/${String(top.nation).toLowerCase()}.png`;
          await preloadOne(flagUrl);
          await flagControls.set({ opacity: 0 });
          await flagControls.start({ opacity: 1, transition: { duration: 1.5, ease: 'easeOut' } });
        }
        if (!skipRef.current) await sleep(1400);
      }
  
      if (!skipRef.current) {
        setStage('team');
        await raf();
        await teamControls.set({ opacity: 0 });
        await teamControls.start({ opacity: 1, transition: { duration: 1.5, ease: 'easeOut' } });
        if (!skipRef.current) await sleep(1400);
      }
  
      setStage('reveal');
      await raf();
      if (top.image && !skipRef.current) await preloadOne(top.image);
      await cardControls.set({ opacity: 0 });
      await cardControls.start({ opacity: 1, transition: { duration: 1.55, ease: 'easeOut' } });
    } catch (e) {
      console.error("Cinematic error", e);
    }
  }
  
  
  
  

  function Flag({ nation }) {
    if (!nation) return null;
    const code = String(nation).trim().toLowerCase();
    const src = `https://flagcdn.com/w160/${code}.png`;
    return <img src={src} alt={nation} className="bigFlagImg" onError={(e)=>{e.currentTarget.onerror=null;e.currentTarget.src='/assets/cards/card_placeholder.png'}} />;
  }

  function closeFullAndBack() {
    setStage('idle');
    setDrawn(null);
    setTopCard(null);
    navigate(-1);
  }

  const otherCards = drawn
  ? drawn
      .filter(c => c.id !== (topCard && topCard.id))
      .sort((a, b) => {
        const ra = rarityRank[a.rarity] ?? -1;
        const rb = rarityRank[b.rarity] ?? -1;
        return rb - ra; // по убыванию редкости: редкие сверху
      })
  : [];


  return (
    <div className="packOpenPage cinematicOnly">
      <div className="topBar">
      </div>

      <div className="cinemaOnlyWrap">


        <div className="cinema">

          <AnimatePresence mode="wait">
            {stage === 'flag' && topCard && topCard.nation && (
              <motion.div
                className="flagWrapper"
                initial={{ opacity: 0 }}
                animate={flagControls}
                exit={{ opacity: 0 }}
              >
                <Flag nation={topCard.nation} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {stage === 'team' && (topCard?.team || topCard?.teamName || packDef?.team) && (
              <motion.div
                className="teamWrapper"
                initial={{ opacity: 0 }}
                animate={teamControls}
                exit={{ opacity: 0 }}
              >
                <div className="teamLabel">{topCard?.team || topCard?.teamName || packDef?.team}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div className="flashOverlay" initial={false} animate={flashControls} />

          <AnimatePresence>
            {stage === 'reveal' && topCard && (
              <motion.div className="topCardWrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.img
                  src={topCard.image}
                  alt={topCard.name}
                  className="bigCardImg"
                  initial={{ opacity: 0 }}
                  animate={cardControls}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/cards/card_placeholder.png'; }}
                />
                <div className="bigCardInfo">
                  <div className="bigCardName">{topCard.name}</div>

                  <div style={{ marginTop: 12 }}>
                    {(() => {
                      const wasOwned = (prevCards[topCard.id] || 0) > 0;
                      const isDissolving = !!dissolving[topCard.id];
                      const isDissolved = !!dissolved[topCard.id];
                      const dissolveValue = calcDissolveValue(topCard);

                      if (isDissolved) return <div style={{ color: '#9f9', fontSize: 14 }}>Получено {dissolveValue}</div>;
                      if (!wasOwned) return <div style={{ color: '#bbb', fontSize: 13 }}>Новая карта</div>;

                      return (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                          <div style={{ color: '#bbb', fontSize: 13, marginBottom: 6  }}>Дубликат</div>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                          <button
                            className="openBtn"
                            style={{ padding: '10px 15px', fontSize: 14, width: '100%', border: '1px solid #141416', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleDissolve(topCard)}
                            disabled={isDissolving}
                          >
                            {isDissolving ? 'Распыление…' : `Распылить за ${dissolveValue}`} <div style={{ width: '16px', height: '16px' }}>
          <div
          >
            <img src={logo} alt='logo'></img>

          </div>
        </div>
                          </button>
                  
                            </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {otherCards && otherCards.length > 0 && (
                  <div style={{ marginTop: 14, width: '92%', maxWidth: 920 }}>
                    <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 8 }}>
                      {otherCards.map((c, idx) => {
                        const wasOwned = (prevCards[c.id] || 0) > 0;
                        const isDissolving = !!dissolving[c.id];
                        const isDissolved = !!dissolved[c.id];
                        const dissolveValue = calcDissolveValue(c);
                        return (
                          <div key={c.id + '_' + idx} className="contentCard" style={{ minWidth: 200, maxWidth: 280 }}>
                            <img src={c.image} alt={c.name} className="contentCardImg"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/cards/card_placeholder.png'; }} />

                            {isDissolved ? (
                              <div style={{ marginTop: 8, color: '#9f9', fontSize: 13 }}>Получено: {dissolveValue}</div>
                            ) : wasOwned ? (
                              <div style={{ marginTop: 8 }}>
                                <div style={{ color: '#bbb', fontSize: 13, marginBottom: 6 }}>Дубликат в инвентаре</div>
                                <button
                            className="openBtn"
                            style={{ padding: '10px 15px', fontSize: 12, width: '100%', border: '1px solid #141416', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}
                            onClick={() => handleDissolve(c)}
                            disabled={isDissolving}
                          >
                                  {isDissolving ? 'Распыление…' : `Распылить за: ${dissolveValue}`}
                                  <div style={{ width: '16px', height: '16px' }}>
                                      <img src={logo} alt='logo'></img>
                                  </div>
                                </button>
                              </div>
                            ) : (
                              <div style={{ marginTop: 8, color: '#bbb', fontSize: 13 }}>Новая карта</div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button className="backBtn" style={{background: '#141416', marginTop: '10px'}} onClick={closeFullAndBack}>Забрать в коллекцию</button>
              </motion.div>
            )}
          </AnimatePresence>

          {stage !== 'idle' && drawn && !skipAnimation && (
          <button
            style={{
              position: 'fixed',
              top: 20,
              left: "50%",
              zIndex: 999,
              padding: '8px 12px',
              fontSize: 14,
              borderRadius: 8,
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={handleSkip}
          >
            Пропустить анимацию
          </button>
        )}

        </div>

        

        {!packDef && (
          <div className="hintBox">
            <p>Пак не передан. Вернитесь назад и выберите пак.</p>
            <button onClick={() => navigate(-1)} className="backBtn">Назад</button>
          </div>
        )}

        {packDef && !(location.state?.autoOpen || params.get('autoOpen') === '1') && stage === 'idle' && (
          <div className="hintBox">
            <p>Пак готов к открытию: <strong>{packDef.title}</strong></p>
            <button onClick={() => handleOpen()} className="openBtn">{loading ? 'Открываем…' : 'Открыть'}</button>
            {error && <div className="errorText">{error}</div>}
          </div>
        )}

      </div>
    </div>
  );
}
