// SellModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { createListing } from '../myteam/marketplace/marketplaceApi';
import cardsJson from '../myteam/cards/cards.json';
import './SellModal.css';
import { CSSTransition } from "react-transition-group";

// ---------- FIRESTORE (поправьте путь к вашему экспортированному db) ----------
import { collection, query, where, onSnapshot } from 'firebase/firestore';
// Если ваш проект экспортирует `db` из другого пути — исправьте ниже путь.
// В моём проекте компоненты берут db из '../../../../firebase' — у вас может быть другой.
import { db } from '../../firebase'; // <-- <<--- ПОПРАВЬТЕ путь если нужно
// ---------------------------------------------------------------------------

export default function SellModal({ show, onClose, currentUser, onListed, marketplaceListings }) {
  // stage: 'select' | 'details'
  const [stage, setStage] = useState('select');
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [price, setPrice] = useState('');
  const [count, setCount] = useState(1);
  const [maxCount, setMaxCount] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // локальные лоты (если marketplaceListings не передан, будем фетчить сами)
  const [fetchedListings, setFetchedListings] = useState([]);

  // Подписка на лоты текущего пользователя (only when marketplaceListings prop not provided)
  useEffect(() => {
    if (Array.isArray(marketplaceListings)) {
      // если лоты переданы пропом — ничего не фетчим
      return;
    }
    if (!currentUser || !currentUser.uid) {
      setFetchedListings([]);
      return;
    }

    // Подписываемся на marketplace, где sellerId == currentUser.uid и статус == 'active'
    // При необходимости поменяйте условие where('status','==','active') на ваш набор статусов.
    const col = collection(db, 'marketplace');
    const q = query(col, where('sellerId', '==', currentUser.uid), where('status', '==', 'active'));
    const un = onSnapshot(q, snap => {
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data();
        // включаем id документа если нужно
        arr.push({ id: doc.id, ...d });
      });
      setFetchedListings(arr);
    }, err => {
      console.error('SellModal marketplace onSnapshot error', err);
      setFetchedListings([]);
    });

    return () => un();
  }, [marketplaceListings, currentUser]);

  // Получаем массив лотов — приоритет: проп marketplaceListings -> fetchedListings -> currentUser.marketplaceListings/currentUser.listings
  const listingsArray = useMemo(() => {
    if (Array.isArray(marketplaceListings)) return marketplaceListings;
    if (Array.isArray(fetchedListings) && fetchedListings.length > 0) return fetchedListings;
    if (Array.isArray(currentUser?.marketplaceListings)) return currentUser.marketplaceListings;
    if (Array.isArray(currentUser?.listings)) return currentUser.listings;
    return [];
  }, [marketplaceListings, fetchedListings, currentUser]);

  // при открытии модалки — инициализируем состояние
  useEffect(() => {
    if (!show) return;
    setError(null);
    setLoading(false);
    setPrice('');
    setCount(1);
    setMaxCount(1);
    setStage('select');
    setSelectedCardId(null);
  }, [show]);

  // Рассчитываем userCards: owned, listed (активные лоты текущего пользователя), available.
  // Фильтруем out rarity 'special' и available <= 0
  const userCards = useMemo(() => {
    const raw = currentUser?.cards || {};
    const sellerId = currentUser?.uid;

    // Считаем listed for this seller: суммируем только "активные" лоты этого продавца
    const listedCounts = {};
    listingsArray.forEach(l => {
      if (!l) return;
      const cid = l.cardId || l.cardID || l.card || null;
      const sId = l.sellerId;
      if (!cid || !sId) return;
      if (sId !== sellerId) return;

      // считаем, что в подписке мы получили только активные лоты (по фильтру), но
      // добавим защиту от статусов на случай, если передали массив вручную
      const status = (l.status || '').toString().toLowerCase();
      const inactive = ['cancelled', 'cancelled_at', 'sold', 'deleted', 'archived', 'canceled'];
      if (status && inactive.includes(status)) return;

      const cnt = Number(l.count || 0);
      listedCounts[cid] = (listedCounts[cid] || 0) + (isNaN(cnt) ? 0 : cnt);
    });

    const items = Object.entries(raw || {}).map(([id, c]) => {
      const meta = (cardsJson && cardsJson.cards && cardsJson.cards.find(x => x.id === id)) || {
        id,
        name: id,
        image: '/assets/cards/unknown.png',
        rarity: 'unknown'
      };
      const owned = Number(c || 0);
      const listed = Number(listedCounts[id] || 0);
      const available = Math.max(0, owned - listed);
      return { id, owned, listed, available, meta, rarity: meta?.rarity || 'unknown' };
    });

    // Фильтрация: убираем rarity==='special' и available<=0
    const filtered = items.filter(it => {
      const rarity = (it.meta?.rarity || '').toString().toLowerCase();
      if (rarity === 'event') return false;
      if (it.available <= 0) return false;
      return true;
    });

    // Сортировка по rarity + количеству available
    const order = ['rookie', 'common', 'rare', 'epic', 'hero', 'legendary', 'prime_hero', 'icon', 'prime_icon'];
    filtered.sort((a, b) => {
      const ra = order.indexOf(a.meta?.rarity);
      const rb = order.indexOf(b.meta?.rarity);
      if (ra === rb) return b.available - a.available;
      return (rb === -1 ? -1 : rb) - (ra === -1 ? -1 : ra);
    });

    return filtered;
  }, [currentUser, listingsArray]);

  // когда выбираем карту — пересчитываем maxCount (учёт уже выставленных активных лотов для этой карты)
  useEffect(() => {
    if (!selectedCardId) {
      setMaxCount(1);
      setCount(1);
      return;
    }
    const have = Number((currentUser?.cards && currentUser.cards[selectedCardId]) || 0);
    const sellerId = currentUser?.uid;
    let listedForThis = 0;
    listingsArray.forEach(l => {
      if (!l) return;
      const cid = l.cardId || l.cardID || l.card || null;
      if (cid !== selectedCardId) return;
      if (l.sellerId !== sellerId) return;
      const status = (l.status || '').toString().toLowerCase();
      const inactive = ['cancelled', 'cancelled_at', 'sold', 'deleted', 'archived', 'canceled'];
      if (status && inactive.includes(status)) return;
      listedForThis += Number(l.count || 0);
    });
    const available = Math.max(0, have - listedForThis);
    setMaxCount(available);
    setCount(prev => Math.min(Math.max(1, prev), Math.max(1, available)));
    setError(null);
    // debug
    // console.debug('SellModal selectedCard', selectedCardId, { have, listedForThis, available });
  }, [selectedCardId, currentUser, listingsArray]);

  const recommendedPrice = useMemo(() => {
    if (!selectedCardId) return null;
    const meta = (cardsJson && cardsJson.cards && cardsJson.cards.find(c => c.id === selectedCardId)) || {};
    const rp = meta?.recomendPrice ?? meta?.recommendedPrice ?? null;
    return typeof rp === 'number' ? rp : (rp ? Number(rp) : null);
  }, [selectedCardId]);

  const formatPrice = (val) => {
    if (val == null || val === '') return '';
    try {
      return new Intl.NumberFormat('ru-RU').format(Number(val));
    } catch {
      return String(val);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!currentUser || !currentUser.uid) {
      return setError('Нужно войти в аккаунт');
    }
    if (!selectedCardId) return setError('Выберите карточку');
    const p = Number(price);
    if (!p || p <= 0) return setError('Введите корректную цену');
    if (count <= 0 || count > maxCount) return setError('Неверное количество');

    try {
      setLoading(true);

      const meta = (cardsJson && cardsJson.cards && cardsJson.cards.find(c => c.id === selectedCardId)) || {};
      const cardName = meta.name || selectedCardId;

      const listingId = await createListing({
        sellerId: currentUser.uid,
        cardId: selectedCardId,
        cardName,
        count,
        price: p,
        listingMeta: { sellerName: currentUser.name || '' }
      });

      console.log('createListing returned id:', listingId);
      setLoading(false);
      onListed && onListed();
      onClose && onClose();
    } catch (err) {
      console.error('createListing error', err);
      setLoading(false);
      setError(err?.message || 'Ошибка при создании лота');
    }
  }

  function renderSelectStage() {
    return (
      <>
        <div className="modalSectionTitle">Выберите карточку для продажи</div>
        <div className="cardGrid">
          {userCards.length === 0 && <div className="emptyMsg">У вас нет доступных для продажи карточек</div>}

          {userCards.map(card => (
            <div
              key={card.id}
              className={`selectCard ${selectedCardId === card.id ? 'selected' : ''}`}
              onClick={() => {
                if (!card.available || card.available <= 0) return;
                setSelectedCardId(card.id);
                setStage('details');
              }}
            >
              <img src={card.meta.image} alt={card.meta.name} className="selectCardImg" />
              <div className="cardCountOverlay">x{card.available}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button className="btnSecondary" onClick={onClose}>Отмена</button>
        </div>
      </>
    );
  }

  function renderDetailsStage() {
    const meta = (cardsJson && cardsJson.cards && cardsJson.cards.find(c => c.id === selectedCardId)) || { name: selectedCardId, image: '/assets/cards/unknown.png', rarity: 'unknown' };

    return (
      <>
        <div className="detailsRow">
          <div className="selectedPreview">
            <img src={meta.image} alt={meta.name} className="previewImg" />
            <div className="previewName">{meta.name}</div>
            <div className="previewRarity">{meta.rarityText}</div>
          </div>

          <form className="detailsForm" onSubmit={handleSubmit}>
            <label>Количество</label>
            <input
              type="number"
              min="1"
              max={maxCount}
              value={count}
              onChange={e => {
                const v = Number(e.target.value || 0);
                setCount(Math.min(Math.max(1, v), Math.max(1, maxCount)));
              }}
            />

            {recommendedPrice ? (
              <div className="recommendedRow" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <div style={{ fontSize: 13, color: '#888' }}>
                  Рекомендованная цена: <strong>{formatPrice(recommendedPrice)}</strong> AP
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>Нет рекомендованной цены для этой карточки</div>
            )}

            <input
              type="number"
              min="1"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Введите цену"
            />

            {error && <div className="errorMsg">{error}</div>}

            <div className="btnRow">
              <button type="button" className="btnSecondary" onClick={() => setStage('select')}>Назад к выбору</button>
              <button type="submit" className="btnPrimary" disabled={loading}>
                {loading ? 'Выставление…' : 'Выставить'}
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  return (
    <CSSTransition in={show} timeout={250} classNames="fade" unmountOnExit mountOnEnter>
      <div className="modalBackdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
        <div className="modalDark modalWide" onClick={(e) => e.stopPropagation()}>
          <div className="modalHeader">
            <h3>{stage === 'select' ? 'Выбрать карту' : 'Выставить карту'}</h3>
            <button className="closeBtn" onClick={onClose}>✕</button>
          </div>

          <div className="modalBody">
            {stage === 'select' ? renderSelectStage() : renderDetailsStage()}
          </div>
        </div>
      </div>
    </CSSTransition>
  );
}
