// src/myteam/packopen/PackOpener.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import packsJson from '../packs/packs.json';
import cardsJson from '../cards/cards.json'; // <-- импорт карт для расчёта шансов
import Modal from '../../components/Modal';
import './PackOpener.css';
import UserStats from '../../user/components/UserStats';
import { useSwipeable } from 'react-swipeable';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// Firebase
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebase';
import BackButton from '../../components/BackButton';

const PACKS = (packsJson && packsJson.packs) ? packsJson.packs : [];
const CARDS = (cardsJson && cardsJson.cards) ? cardsJson.cards : [];

// предполагаем, что все редкости встречаются в CARDS
const rarityTextMap = {};
CARDS.forEach(c => {
  if (c.rarity && c.rarityText) rarityTextMap[c.rarity] = c.rarityText;
});


function genInstanceUid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// helper: calculate effWeight (the same logic as weightedPickOne uses)
function effWeightOf(card) {
  const base = Number(card.weight || 0);
  const rtg = Number(card.rtg) || 100;
  return Math.max(0.0001, base * (100 / rtg));
}

// Exclude event cards helper
function isEventCard(card) {
  if (!card) return false;
  return String(card.rarity).toLowerCase() === 'event';
}

// Aggregate by rarity helper
function aggregateByRarity(items) {
  const map = {};
  let totalWeight = 0;
  for (const it of items) {
    if (isEventCard(it)) continue;
    const w = effWeightOf(it);
    const r = it.rarity || 'unknown';
    map[r] = map[r] || { weight: 0, count: 0 };
    map[r].weight += w;
    map[r].count += 1;       // <-- добавляем количество карт
    totalWeight += w;
  }
  const result = Object.entries(map)
    .map(([rarity, { weight, count }]) => ({
      rarity,
      weight,
      count,
      pct: totalWeight > 0 ? (weight / totalWeight) * 100 : 0
    }))
    .sort((a, b) => b.weight - a.weight);
  return { total: totalWeight, breakdown: result };
}


// Build candidate pool for a given guarantee key (mimics drawPackFromDefinitions logic)
function buildCandidatePoolForGuarantee(key, value, allowedOrig, cardsPool, rarityOrder, rarityRank) {
  // key could be: 'minRtg', 'rareOrBetter', 'epic', 'rareOrEpic', 'someOrBetter', etc.
  let candidate = [];

  if (key === 'minRtg') {
    const minRtg = Number(value || 0);
    candidate = allowedOrig.filter(c => Number(c.rtg || 0) >= minRtg);
  } else {
    const orBetter = String(key).match(/^(.*)OrBetter$/i);
    if (orBetter) {
      const base = orBetter[1].toLowerCase();
      const br = rarityRank[base];
      const raritiesAtOrAbove = br === undefined ? [] : rarityOrder.filter(r => rarityRank[r] >= br);
      candidate = allowedOrig.filter(c => raritiesAtOrAbove.includes(c.rarity));
    } else {
      const twoMatch = String(key).match(/^([a-z0-9_]+)Or([a-z0-9_]+)$/i);
      if (twoMatch) {
        const a = twoMatch[1].toLowerCase();
        const b = twoMatch[2].toLowerCase();
        candidate = allowedOrig.filter(c => c.rarity === a || c.rarity === b);
      } else {
        candidate = allowedOrig.filter(c => c.rarity === String(key).toLowerCase());
      }
    }
  }

  // remove event cards if any slipped in
  candidate = (candidate || []).filter(c => !isEventCard(c));

  // fallback: if candidate empty, use allowedOrig (without events); if that's empty, use cardsPool without events
  if (!candidate || candidate.length === 0) {
    const fallbackSource = (allowedOrig && allowedOrig.length) ? allowedOrig.filter(c => !isEventCard(c)) : (Array.isArray(cardsPool) ? cardsPool.filter(c => !isEventCard(c)) : []);
    candidate = fallbackSource.slice();
  }
  return candidate;
}

export default function PackOpener({ currentUser }) {
  const navigate = useNavigate();
  const uid = currentUser?.uid ?? null;


  // UI state (kept as in original)
  const [loadingPack, setLoadingPack] = useState(null);
  const [error, setError] = useState(null);

  // modal state for balance/other warnings
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalButtonText, setModalButtonText] = useState('Понятно');

  // odds modal
  const [showOddsModal, setShowOddsModal] = useState(false);
  const [, setOddsPackDef] = useState(null);
  const [oddsData, setOddsData] = useState(null);

  // tabs: 'shop' | 'my'
  const [tab, setTab] = useState('shop');

  // my packs state (from firestore)
  const [ownedPacks, setOwnedPacks] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // welcome bonus states
  const [welcomeClaimed, setWelcomeClaimed] = useState(false);
  const [welcomeLoading, setWelcomeLoading] = useState(false); // loading status when checking
  const [claimingWelcome, setClaimingWelcome] = useState(false); // true while claiming

  // last loaded uid to avoid re-loading on unrelated prop object changes
  const lastLoadedUserIdRef = useRef(null);

  // clear error on mount (keeps original behaviour)
  useEffect(() => { setError(null); }, []);

  // helper: preload image
  const preloadImage = useCallback((url) => {
    return new Promise(resolve => {
      if (!url) return resolve();
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  }, []);

  const tabs = ['shop','my'];

  const goPrev = () => {
    const i = tabs.indexOf(tab);
    const prev = tabs[(i - 1 + tabs.length) % tabs.length];
    setTab(prev);
  };
  const goNext = () => {
    const i = tabs.indexOf(tab);
    const next = tabs[(i + 1) % tabs.length];
    setTab(next);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => goNext(),
    onSwipedRight: () => goPrev(),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true
  });

  // --- original onPackClick behaviour preserved (shop: immediate navigate to pack-opening) ---
  const onPackClick = useCallback(async (packId) => {
    setError(null);
    if (loadingPack) return; // блокируем клики во время подготовки
    // pack lookup
    const packDef = PACKS.find(p => p.id === packId);
    if (!packDef) {
      setError('Пак не найден');
      return;
    }
    if (currentUser) {
      // возможные варианты поля баланса в объекте currentUser
      const raw = currentUser.gsCurrency;
      let balance = null;
      if (raw != null) {
        balance = typeof raw === 'number' ? raw : (Number(raw) || 0);
      }
      if (balance == null) {
        setModalMessage(
          `Не удалось определить ваш баланс Gems.\n` +
          `Для открытия пака ${packDef.title} требуется ${packDef.price} Gems.\n` +
          `Пожалуйста, обновите страницу или войдите снова, чтобы увидеть актуальный баланс.`
        );
        setModalButtonText('Закрыть');
        setShowModal(true);
        return;
      }
      if (balance < (Number(packDef.price) || 0)) {
        setModalMessage(`Недостаточно Gems :(`);
        setModalButtonText('Понятно');
        setShowModal(true);
        return;
      }
    }

    try {
      setLoadingPack(packId);
      await preloadImage(packDef.image);
      // navigate to pack opening page — it will handle charging/opening (autoOpen)
      navigate('/pack-opening', { state: { packId, autoOpen: true, packDef } });
    } catch (e) {
      console.error('[PackOpener] failed to navigate', e);
      setError('Не удалось перейти к открытию пака');
    } finally {
      setLoadingPack(null);
    }
  }, [currentUser, loadingPack, navigate, preloadImage]);

  // --- Load user's owned packs from Firestore (only when tab === 'my' AND uid changed) ---
  const loadMyPacks = useCallback(async () => {
    setError(null);
    const uid = currentUser?.uid ?? null;
    if (!uid) {
      setOwnedPacks([]);
      lastLoadedUserIdRef.current = null;
      return;
    }

    // if already loaded for this uid, skip
    if (lastLoadedUserIdRef.current === uid) return;

    setLoadingMy(true);
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        setOwnedPacks([]);
        lastLoadedUserIdRef.current = uid;
      } else {
        const data = snap.data();
        const arr = data.ownedPacks || [];
        // only update state if different (simple check by length + first/last uid)
        const arrSafe = Array.isArray(arr) ? arr : [];
        const prev = ownedPacks;
        const prevIds = Array.isArray(prev) ? prev.map(x => x.uid).join(',') : '';
        const newIds = arrSafe.map(x => x.uid).join(',');
        if (prevIds !== newIds) setOwnedPacks(arrSafe);
        lastLoadedUserIdRef.current = uid;
      }
    } catch (e) {
      console.error('loadMyPacks', e);
      setError('Не удалось загрузить ваши паки');
    } finally {
      setLoadingMy(false);
    }
  }, [currentUser, ownedPacks]);

  // call loadMyPacks when switching to 'my' tab
  useEffect(() => {
    if (tab === 'my') {
      loadMyPacks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loadMyPacks]);

  // --- Open an owned pack: удалить экземпляр из users/{uid}.ownedPacks и перейти на PackOpeningPage (бесплатно) ---
  // ВОТ ОНА — openOwnedPack (название сохранено)
  const openOwnedPack = useCallback(async (instanceUid) => {
    setError(null);
    if (!currentUser) {
      setError('Требуется вход в аккаунт');
      return;
    }
    if (busyId) return;
    const userId = currentUser.uid;
    const userRef = doc(db, 'users', userId);
    setBusyId(instanceUid);

    try {
      const removedObj = await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('Пользователь не найден');
        const data = snap.data();
        const arr = Array.isArray(data.ownedPacks) ? data.ownedPacks.slice() : [];
        const idx = arr.findIndex(it => it && it.uid === instanceUid);
        if (idx === -1) throw new Error('Экземпляр пака не найден или уже открыт');
        const [removed] = arr.splice(idx, 1);
        tx.update(userRef, { ownedPacks: arr });
        return removed;
      });

      // оптимистично обновляем UI
      setOwnedPacks(prev => (prev || []).filter(p => p.uid !== instanceUid));

      const packDef = PACKS.find(p => p.id === removedObj.packId) || PACKS[0] || null;

      // navigate to opening page — mark fromInventory so PackOpeningPage can skip charging
      navigate('/pack-opening', { state: { packId: removedObj.packId, packDef, autoOpen: true, fromInventory: true, userPackId: instanceUid } });
    } catch (e) {
      console.error('openOwnedPack error', e);
      setError(e.message || 'Не удалось открыть пак из инвентаря');
    } finally {
      setBusyId(null);
    }
  }, [currentUser, busyId, navigate]);

  // ========== NEW: Welcome bonus logic ==========
  // constants — можно отредактировать
  const WELCOME_APEX_AMOUNT = 5000;
  const WELCOME_GEMS_AMOUNT = 500;

  // load welcome bonus claimed status from Firestore (check on mount, when currentUser changes, and when switching to 'shop')
  const loadWelcomeStatus = useCallback(async () => {
    setWelcomeLoading(true);
    setError(null);
    if (!uid) {
      // если already false — не менять, чтобы не вызывать лишний рендер
      setWelcomeLoading(false);
      if (welcomeClaimed) setWelcomeClaimed(false); // только если нужно
      return;
    }
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const claimed = snap.exists() ? !!snap.data().welcomeBonusClaimed : false;
      // обновляем только если значение изменилось
      setWelcomeClaimed(prev => (prev === claimed ? prev : claimed));
    } catch (e) {
      console.error('loadWelcomeStatus', e);
      setError('Не удалось проверить статус приветственного бонуса');
    } finally {
      setWelcomeLoading(false);
    }
  }, [uid, welcomeClaimed]);
  

  // проверяем при монтировании и при смене currentUser, а также при переключении на вкладку shop
  useEffect(() => {
    loadWelcomeStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (tab === 'shop') {
      // обновим статус при заходе на вкладку shop: пользователь мог успеть собрать бонус в другом месте
      loadWelcomeStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Claim welcome bonus: атомарно через транзакцию
  const claimWelcomeBonus = useCallback(async () => {
    setError(null);
    if (!uid) {
      setModalMessage('Требуется войти в аккаунт, чтобы получить приветственный бонус');
      setModalButtonText('Ок');
      setShowModal(true);
      return;
    }
    if (welcomeClaimed || claimingWelcome) return;
  
    setClaimingWelcome(true);
    const userRef = doc(db, 'users', uid);
  
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) {
          tx.set(userRef, {
            apexPoints: Number(WELCOME_APEX_AMOUNT),
            gsCurrency: Number(WELCOME_GEMS_AMOUNT),
            welcomeBonusClaimed: true
          }, { merge: true });
          return;
        }
        const data = snap.data();
        if (data && data.welcomeBonusClaimed) throw new Error('Бонус уже был получен');
        const currentApex = Number(data.apexPoints || 0);
        const currentGems = Number(data.gsCurrency || data.gs_currency || 0);
        tx.update(userRef, {
          apexPoints: currentApex + Number(WELCOME_APEX_AMOUNT),
          gsCurrency: currentGems + Number(WELCOME_GEMS_AMOUNT),
          welcomeBonusClaimed: true
        });
      });
  
      setWelcomeClaimed(true);
      setModalMessage(`Поздравляем! Вы получили ${WELCOME_APEX_AMOUNT} AP и ${WELCOME_GEMS_AMOUNT} Gems.`);
      setModalButtonText('Отлично');
      setShowModal(true);
    } catch (e) {
      console.error('claimWelcomeBonus error', e);
      const msg = (e && e.message) ? e.message : 'Не удалось получить приветственный бонус';
      setError(msg);
      setModalMessage(msg);
      setModalButtonText('Понятно');
      setShowModal(true);
    } finally {
      setClaimingWelcome(false);
    }
  }, [uid, welcomeClaimed, claimingWelcome]);
  

  // ========== NEW: Compute odds for a pack ==========
  // We will compute per-slot rarity breakdown (in percent) using the same effWeight formula as the server/client draw.
  const rarityOrder = ['rookie','common','rare','epic','legendary','hero','prime_hero','icon','prime_icon'];
  const rarityRank = Object.fromEntries(rarityOrder.map((r, i) => [r, i]));

  function computePackOdds(packDef) {
    if (!packDef) return null;
    // base pools: remove event cards from consideration for odds
    const cardsPool = CARDS.slice().filter(c => !isEventCard(c));
    const allowedOrig = (packDef.allowedRarities && packDef.allowedRarities.length)
      ? cardsPool.filter(c => packDef.allowedRarities.includes(c.rarity))
      : cardsPool.slice();

    const count = Number(packDef.count || 1);
    const guarantee = packDef.guarantee || {};

    const slots = []; // each slot: { type: 'guarantee'|'normal', key?, pool, rarityBreakdown }

    // First: process guarantees
    // NOTE: special-case 'minRtg' as a threshold (single guaranteed slot), because many pack definitions
    // use { "minRtg": 85 } to mean "one slot guaranteed with rtg >= 85", not "85 slots".
    for (const [key, value] of Object.entries(guarantee)) {
      if (key === 'minRtg') {
        const minRtg = Number(value || 0);
        if (minRtg > 0) {
          const candidate = buildCandidatePoolForGuarantee(key, minRtg, allowedOrig, cardsPool, rarityOrder, rarityRank);
          const agg = aggregateByRarity(candidate);
          slots.push({ type: 'guarantee', key, poolSize: candidate.length, rarityBreakdown: agg.breakdown, meta: { minRtg } });
        }
        // do not treat the numeric value as slot COUNT
      } else {
        // other keys: value is the count of guaranteed slots for that key (e.g. "rareOrEpic": 1)
        const cnt = Number(value) || 0;
        for (let i = 0; i < cnt; i++) {
          const candidate = buildCandidatePoolForGuarantee(key, value, allowedOrig, cardsPool, rarityOrder, rarityRank);
          const agg = aggregateByRarity(candidate);
          slots.push({ type: 'guarantee', key, poolSize: candidate.length, rarityBreakdown: agg.breakdown });
        }
      }
    }

    // Remaining slots: how many generic picks we will do
    const guaranteedCount = slots.length;
    const remaining = Math.max(0, count - guaranteedCount);
    if (remaining > 0) {
      // For remaining slots, the pool is allowedOrig (cards allowed for the pack) — already without event cards
      const remainingPool = allowedOrig.length ? allowedOrig.slice() : cardsPool.slice();
      const aggRem = aggregateByRarity(remainingPool);
      for (let i = 0; i < remaining; i++) {
        slots.push({ type: 'normal', poolSize: remainingPool.length, rarityBreakdown: aggRem.breakdown });
      }
    }

    // Prepare human-friendly output: per-slot breakdown and combined overview
    const overview = {}; // rarity -> approximate combined pct (averaged across slots)
    if (slots.length) {
      const slotCount = slots.length;
      for (const s of slots) {
        for (const item of s.rarityBreakdown) {
          overview[item.rarity] = (overview[item.rarity] || 0) + item.pct / slotCount;
        }
      }
    } else {
      const agg = aggregateByRarity(allowedOrig.length ? allowedOrig : cardsPool);
      for (const item of agg.breakdown) overview[item.rarity] = item.pct;
    }

    const combined = Object.entries(overview)
      .map(([rarity, pct]) => ({ rarity, pct }))
      .sort((a, b) => b.pct - a.pct);

    return { packId: packDef.id, packTitle: packDef.title, count, slots, combined };
  }

  // show odds modal
  const onShowOdds = useCallback((packDef) => {
    try {
      const data = computePackOdds(packDef);
      setOddsPackDef(packDef);
      setOddsData(data);
      setShowOddsModal(true);
    } catch (e) {
      console.error('compute odds error', e);
      setError('Не удалось посчитать шансы для этого пака');
    }
  }, []);

  // close odds
  const onCloseOdds = () => {
    setShowOddsModal(false);
    setOddsPackDef(null);
    setOddsData(null);
  };

  // --- Render: keep original appearance for shop; add small tabs row above packs ---
  return (
    <div className="container">
      <div style={{position: 'fixed', left: '0', padding: "15px", top: '0', width: '100%', background: 'rgb(17, 17, 19)', zIndex: '9'}}>
      
        <div style={{display: 'flex', gap: '15px', alignItems: 'center', padding: '5px 0px'}}>
          <BackButton />
          {currentUser && <UserStats uid={currentUser.uid} />}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, width: '100%' }}>
          <button
            onClick={() => setTab('shop')}
            style={{
              padding: '6px 10px',
              borderRadius: 30,
              background: tab === 'shop' ? 'black' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 280ms ease',
              width: '100%'
            }}
          >
            Магазин
          </button>
          <button
            onClick={() => setTab('my')}
            style={{
              padding: '6px 10px',
              borderRadius: 30,
              background: tab === 'my' ? 'black' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 280ms ease',
              width: '100%'
            }}
          >
            Мои паки
          </button>
        </div>
      </div>
      <TransitionGroup>
        <CSSTransition
          key={tab}
          classNames="tab"
          timeout={400}
        >
          <div {...swipeHandlers}>
            <div className="card">

              {/* SHOP: original grid preserved exactly (only triggered when tab === 'shop') */}
              {tab === 'shop' && (
                <div style={{ marginTop: 8 }}>
                  {/* Welcome bonus button — показываем только если не получен */}
                  <div style={{ display: 'flex', justifyContent: 'center',}}>
                    {!welcomeLoading && !welcomeClaimed ? (
                      <button
                        onClick={claimWelcomeBonus}
                        disabled={claimingWelcome}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 30,
                          background: claimingWelcome ? 'black' : 'transparent',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.06)',
                          transition: 'background 280ms ease',
                          width: '100%'
                        }}
                        title="Получить приветственный бонус"
                      >
                        {claimingWelcome ? 'Обработка...' : `Получить приветственный бонус!`}
                      </button>
                    ) : (
                      // либо показываем сообщение что бонус собран, либо пустое место
                      <div style={{ color: '#9aa4b2' }}>
                        {welcomeClaimed ? ' ' : ' '}
                      </div>
                    )}
                  </div>

                  <div className="packsRow" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                    gap: 12,
                    marginTop: 8
                  }}>
                    {PACKS.map(p => (
                      <div
                        key={p.id}
                        className="packItem"
                        role="button"
                        tabIndex={0}
                        title={p.description}
                        aria-pressed={loadingPack === p.id}
                        style={{
                          cursor: loadingPack ? 'not-allowed' : 'pointer',
                          opacity: loadingPack && loadingPack !== p.id ? 0.7 : 1, borderRadius: 10,
                          textAlign: 'center', userSelect: 'none',
                          position: 'relative',
                        }}
                      >
                        <img src={p.image || '/assets/packs/pack_placeholder.png'} alt={p.title}
                             style={{ width: '100%', height: 240, objectFit: 'contain', marginBottom: 8 }} />
                        <div style={{ fontWeight: 500, color: '#fff' }}>{p.title}</div>
                        

                        <div style={{ marginTop: 5, fontSize: 11, color: '#bbb' }}>{p.description}</div>

                        <button onClick={() => onPackClick(p.id)} style={{background: 'black', marginTop: 10, display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', width: '100%', fontSize: '12px', padding: '10px 0px', borderRadius: '20px' }}>
                          Открыть за {p.price} <div style={{ width: '16px', height: '16px' }}><svg width="16" height="15" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#paint0_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint0_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/></g></g><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
    <g clipPath="url(#paint1_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint1_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/></g></g><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
    <g clipPath="url(#paint2_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint2_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/></g></g><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
    <g clipPath="url(#paint3_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint3_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/></g></g><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
    <defs>
    <clipPath id="paint0_diamond_4291_10_clip_path"><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z"/></clipPath><clipPath id="paint1_diamond_4291_10_clip_path"><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z"/></clipPath><clipPath id="paint2_diamond_4291_10_clip_path"><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z"/></clipPath><clipPath id="paint3_diamond_4291_10_clip_path"><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z"/></clipPath><linearGradient id="paint0_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
    <stop stopColor="#00FFD5"/>
    <stop offset="1" stopColor="#0084FF"/>
    </linearGradient>
    <linearGradient id="paint1_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
    <stop stopColor="#00FFD5"/>
    <stop offset="1" stopColor="#0084FF"/>
    </linearGradient>
    <linearGradient id="paint2_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
    <stop stopColor="#00FFD5"/>
    <stop offset="1" stopColor="#0084FF"/>
    </linearGradient>
    <linearGradient id="paint3_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
    <stop stopColor="#00FFD5"/>
    <stop offset="1" stopColor="#0084FF"/>
    </linearGradient>
    </defs>
    </svg></div>
                        </button>

                        {/* NEW: odds button near pack */}
      <button
        onClick={(e) => { e.stopPropagation(); onShowOdds(p); }}
        style={{
          position: 'absolute',
          right: 20,
          top: 15,
          padding: '6px 8px',
          borderRadius: 8,
          border: 'none',
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12
        }}
        aria-label={`Показать шансы для пака ${p.title}`}
        title="Посмотреть шансы"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15ZM8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="white"/>
          <path d="M8.9307 6.58789L6.63969 6.875L6.55766 7.25586L7.00883 7.33789C7.3018 7.4082 7.36039 7.51367 7.29594 7.80664L6.55766 11.2754C6.3643 12.1719 6.66313 12.5938 7.36625 12.5938C7.91117 12.5938 8.54398 12.3418 8.83109 11.9961L8.91898 11.5801C8.71977 11.7559 8.4268 11.8262 8.23344 11.8262C7.95805 11.8262 7.85844 11.6328 7.92875 11.293L8.9307 6.58789Z" fill="white"/>
          <path d="M9 4.5C9 5.05228 8.55229 5.5 8 5.5C7.44772 5.5 7 5.05228 7 4.5C7 3.94772 7.44772 3.5 8 3.5C8.55229 3.5 9 3.94772 9 4.5Z" fill="white"/>
        </svg>
      </button>


                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MY PACKS: minimal UI, does not change the style of pack cards when showing shop */}
              {tab === 'my' && (
                <div style={{ marginTop: 8 }}>
                  {loadingMy && <div style={{ color: '#bbb' }}>Загрузка...</div>}

                  {!loadingMy && currentUser && ownedPacks.length === 0 && (
                    <div style={{ color: '#bbb', height: 'calc(100vh - 200px)', textAlign: 'center', alignContent: 'center' }}>У вас нет наборов</div>
                  )}

                  {!loadingMy && currentUser && ownedPacks.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                      {ownedPacks.map(it => {
                        const p = PACKS.find(x => x.id === it.packId) || {};
                        return (
                          <div key={it.uid} onClick={() => openOwnedPack(it.uid)} className="packItem" style={{ textAlign: 'center' }}>
                            <img src={p.image || '/assets/packs/pack_placeholder.png'} alt={p.title} style={{ width: '100%', height: 240, objectFit: 'contain' }} />
                            <div style={{ fontWeight: 500, color: '#fff', marginTop: 8 }}>{p.title || it.packId}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
            </div>
          </div>
        </CSSTransition>
      </TransitionGroup>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        message={modalMessage}
        buttonText={modalButtonText}
      />

      {/* NEW: Odds Modal */}
      {showOddsModal && oddsData && (
        <Modal
          show={showOddsModal}
          onClose={onCloseOdds}
          message={
            <div style={{ color: '#fff', textAlign: 'left' }}>
              <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 6 }}>Шансы выпадения</h3>

              {oddsData.slots && oddsData.slots.length > 0 && oddsData.slots.map((s, idx) => (
                <div key={idx} style={{ marginBottom: 10, paddingTop: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {s.rarityBreakdown && s.rarityBreakdown.length ? s.rarityBreakdown.map(r => (
                      <div key={r.rarity} style={{ minWidth: 120, background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        <div style={{ fontSize: 12, color: '#ccc' }}>
                          {rarityTextMap[r.rarity] || r.rarity}
                        </div>
                        <div>
                        <div style={{ fontSize: 14, color: '#fff'}}>
                          {r.pct.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          {r.count != null ? `${r.count} карты всего` : ''}
                        </div>
                          </div>

                      </div>
                    )) : <div style={{ color: '#999' }}>Нет данных</div>}
                  </div>
                </div>
              ))}
            </div>
          }
        />
      )}

    </div>
  );
}
