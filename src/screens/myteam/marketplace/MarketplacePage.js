// MarketplacePage.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useSwipeable } from 'react-swipeable';
import { subscribeActiveListings, buyListing, cancelListing } from './marketplaceApi';
import ListingCard from './ListingCard';
import SellModal from '../../components/SellModal';
import ModalConfirm from '../../components/ModalConfirm';
import cardsData from "../cards/cards.json";
import Modal from '../../components/Modal';
import UserStats from '../../user/components/UserStats';
import logo from '../../recources/images/logo.png'
import BackButton from '../../components/BackButton';

/* -------------------------
   Вынесенные мемоизированные компоненты
   (определены вне основного компонента, чтобы React.memo работал корректно)
   ------------------------- */
   

const CardTile = React.memo(function CardTile({ card, onClick }) {
  const cardData = cardsData.cards.find(c => c.id === card.cardId);

  return (
    <div
      onClick={() => onClick(card.cardId)}
      style={{
        cursor: 'pointer',
        borderRadius: 10,
        padding: 10,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: '30%', height: "100%", borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        {cardData ? (
          <img
            src={cardData.image}
            alt={cardData.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666'
            }}
          >
            {card.cardName?.slice(0,1) || '?'}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ color: 'white', fontSize: 15, marginBottom: 6 }}>
          {card.cardName}
        </div>
        <div style={{ color: '#999', fontSize: 13, display: 'flex', gap: '5px', alignItems: 'center' }}>
          {card.count} {card.count === 1 ? 'лот' : 'лота'}
          {card.minPrice != null ? ` • от ${card.minPrice}` : ''}
          <div style={{ width: '16px', height: '16px' }}
          >
            <img src={logo} alt='logo'></img>

          </div>
        </div>
          
      </div>
    </div>
  );
});

const CardGrid = React.memo(function CardGrid({ cards, onOpenCard }) {
  if (cards.length === 0) {
    return <div style={{ color: '#888', padding: 20, textAlign: 'center', height: '100%'}}>Нет лотов</div>;
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 12
    }}>
      {cards.map(c => (
        <CardTile key={c.cardId} card={c} onClick={onOpenCard} />
      ))}
    </div>
  );
});

const CardDetail = React.memo(function CardDetail({
  card,
  displayImage,
  sortOption,
  setSortOption,
  selectedCardListings,
  currentUser,
  onBuy,
  onCancel,
  setSellCardId,
  setShowSell,
  loadingBuy,
  onBack
}) {
  if (!card) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ padding: '8px 12px', borderRadius: 10, background: 'transparent', color: 'white', cursor: 'pointer' }}
        >
          ← Назад
        </button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontSize: 16 }}>{card.cardName}</div>
            <div style={{ color: '#999', fontSize: 13 }}>{card.listings.length} {card.listings.length === 1 ? 'лот' : 'лотов'}</div>
          </div>
        </div>
      </div>

      {/* Список лотов конкретной карточки */}
      <div style={{ display: 'grid', gap: 12 }}>
        {selectedCardListings.length === 0 ? (
          <div style={{ color: '#888', padding: 20 }}>Нет лотов для этой карточки</div>
        ) : (
          selectedCardListings.map(l => (
            <ListingCard
              key={l.id}
              listing={l}
              currentUser={currentUser}
              onBuy={() => onBuy(l)}
              onCancel={() => onCancel(l)}
              disabled={loadingBuy && loadingBuy !== l.id}
            />
          ))
        )}
      </div>
    </div>
  );
});

/* -------------------------
   Утилиты
   ------------------------- */

function shallowListingsEqual(a = [], b = []) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i], bi = b[i];
    if (!ai || !bi) return false;
    // сравнение по id и, если есть, по timestamp/updatedAt
    if (ai.id !== bi.id) return false;
    const ta = ai.updatedAt || ai.createdAt || null;
    const tb = bi.updatedAt || bi.createdAt || null;
    // допускаем, что это числа или объекты - приводим к строке
    if ((ta != null || tb != null) && String(ta) !== String(tb)) return false;
  }
  return true;
}

/* -------------------------
   Основной компонент
   ------------------------- */

export default function MarketplacePage({ currentUser }) {
  const [listings, setListings] = useState([]);
  const [loadingBuy, setLoadingBuy] = useState(null); // listingId
  const [showSell, setShowSell] = useState(false);
  const [sellCardId, setSellCardId] = useState(null);
  const [activeTab, setActiveTab] = useState('community'); // 'my' or 'community'
  const [modalMessage, setModalMessage] = useState('');
  const [modalShow, setModalShow] = useState(false);

  const showMessage = (msg) => {
    setModalMessage(msg);
    setModalShow(true);
  };

  // state for confirm modal
  const [confirmState, setConfirmState] = useState({
    show: false,
    key: '', // localStorage key
    title: '',
    message: '',
    onConfirm: null,
    showRemember: true,
  });

  // selected card for "card detail" view
  const [selectedCardId, setSelectedCardId] = useState(null);
  // sort option inside card detail
  const [sortOption, setSortOption] = useState('price_asc'); // price_asc, price_desc, newest

  useEffect(() => {
    // Подписка: обёрнута в handler, который ставит состояние только если данные изменились
    const handler = (data) => {
      setListings(prev => {
        if (shallowListingsEqual(prev, data)) {
          return prev; // избегаем лишнего setState -> лишних ререндеров
        }
        return data;
      });
    };

    const unsub = subscribeActiveListings(handler);
    return () => unsub && unsub();
  }, []);

  // фильтруем лоты
  const myListings = useMemo(() => (currentUser ? listings.filter(l => l.sellerId === currentUser.uid) : []), [listings, currentUser]);
  const communityListings = useMemo(() => listings.filter(l => !currentUser || l.sellerId !== currentUser.uid), [listings, currentUser]);

  const tabs = ['my', 'community'];

  // мемоизируем goPrev/goNext — чтобы useSwipeable не пересоздавался каждую отрисовку
  const goPrev = useCallback(() => {
    setActiveTab(prev => {
      const i = tabs.indexOf(prev);
      const prevTab = tabs[(i - 1 + tabs.length) % tabs.length];
      return prevTab;
    });
    setSelectedCardId(null);
  }, [tabs]);

  const goNext = useCallback(() => {
    setActiveTab(prev => {
      const i = tabs.indexOf(prev);
      const next = tabs[(i + 1) % tabs.length];
      return next;
    });
    setSelectedCardId(null);
  }, [tabs]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => goNext(),
    onSwipedRight: () => goPrev(),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true
  });

  // Helper to show confirm modal or run action immediately if remembered
  const requestConfirmation = useCallback(({ storageKey, title, message, showRemember = true, action }) => {
    try {
      const remembered = localStorage.getItem(storageKey) === 'true';
      if (remembered) {
        action();
        return;
      }
    } catch (e) {
      // ignore localStorage errors
    }

    setConfirmState({
      show: true,
      key: storageKey,
      title,
      message,
      onConfirm: async (rememberFlag) => {
        try {
          if (rememberFlag) localStorage.setItem(storageKey, 'true');
        } catch (e) {
          // ignore
        }
        setConfirmState(prev => ({ ...prev, show: false }));
        await action();
      },
      showRemember,
    });
  }, []);

  const handleBuy = useCallback(async (listing) => {
    if (!currentUser) return showMessage('Нужно войти в аккаунт');
  
    const storageKey = 'market.confirm.buy';
    const message = `Купить карту ${listing.cardName} за ${listing.price} AP?`;
  
    requestConfirmation({
      storageKey,
      title: 'Покупка',
      message,
      showRemember: true,
      action: async () => {
        setLoadingBuy(listing.id);
        try {
          await buyListing(listing.id, currentUser.uid);
          showMessage('Покупка успешна');
  
          // Возврат к сетке карточек
          setSelectedCardId(null);
        } catch (e) {
          showMessage(e?.message || 'Ошибка покупки');
        } finally {
          setLoadingBuy(null);
        }
      }
    });
  }, [currentUser, requestConfirmation]);
  
  const handleCancel = useCallback(async (listing) => {
    if (!currentUser) return showMessage('Нужно войти');
    if (currentUser.uid !== listing.sellerId) return showMessage('Только продавец может отменить');
  
    const storageKey = 'market.confirm.cancel';
    const message = 'Отменить лот и вернуть карты?';
  
    requestConfirmation({
      storageKey,
      title: 'Отмена лота',
      message,
      showRemember: true,
      action: async () => {
        setLoadingBuy(listing.id);
        try {
          await cancelListing(listing.id, currentUser.uid);
          showMessage('Лот отменён, карты возвращены');
  
          // Возврат к сетке карточек
          setSelectedCardId(null);
        } catch (e) {
          showMessage(e?.message || 'Ошибка отмены');
        } finally {
          setLoadingBuy(null);
        }
      }
    });
  }, [currentUser, requestConfirmation]);
  


  // Источник лотов в зависимости от вкладки (используется для построения сетки карточек)
  const sourceListings = activeTab === 'my' ? myListings : communityListings;

  // Собираем уникальные карточки из sourceListings
  const cardsMap = useMemo(() => {
    const map = new Map();
    for (const l of sourceListings) {
      const cardId = l.cardId != null ? String(l.cardId) : l.cardName;
      if (!map.has(cardId)) {
        map.set(cardId, {
          cardId,
          cardName: l.cardName,
          image: l.cardImage || l.imageUrl || l.cardImageUrl || null,
          listings: [l],
        });
      } else {
        map.get(cardId).listings.push(l);
      }
    }
    return map;
  }, [sourceListings]);

  // Массив карточек, отсортированный (по количеству лотов и мин. цене)
  const cards = useMemo(() => {
    const arr = Array.from(cardsMap.values()).map(card => {
      const prices = card.listings.map(x => Number(x.price) || 0).filter(p => !isNaN(p));
      const minPrice = prices.length ? Math.min(...prices) : null;
      return { ...card, count: card.listings.length, minPrice };
    });
    arr.sort((a, b) => {
      if (a.minPrice == null && b.minPrice == null) return b.count - a.count;
      if (a.minPrice == null) return 1;
      if (b.minPrice == null) return -1;
      return a.minPrice - b.minPrice;
    });
    return arr;
  }, [cardsMap]);

  // Список лотов для выбранной карточки, с сортировкой
  const selectedCardListings = useMemo(() => {
    if (!selectedCardId) return [];
    const card = cardsMap.get(selectedCardId);
    if (!card) return [];
    const arr = [...card.listings];
    if (sortOption === 'price_asc') arr.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sortOption === 'price_desc') arr.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sortOption === 'newest') arr.sort((a, b) => {
      const ta = a.createdAt ? Number(a.createdAt) : 0;
      const tb = b.createdAt ? Number(b.createdAt) : 0;
      return tb - ta;
    });
    return arr;
  }, [selectedCardId, cardsMap, sortOption]);

  // Вычисленные значения для детальной карточки
  const selectedCard = useMemo(() => cardsMap.get(selectedCardId), [cardsMap, selectedCardId]);
  const selectedCardImage = selectedCard?.image || null;

  /* -------------------------
     Render
     ------------------------- */

  return (
    <div style={{ width: "100%", margin: 0, height: 'calc(100vh - 120px)' }}>
      {/* Фиксированный хедер */}
      <div style={{position: 'fixed', left: '0', padding: "15px", top: '0', width: '100%', background: 'rgb(17, 17, 19)', zIndex: '9'}}>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center', padding: '5px 0px'}}>
          <BackButton />
          {currentUser && <UserStats uid={currentUser.uid} />}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, width: '100%' }}>
          <button
            onClick={() => { setActiveTab('my'); setSelectedCardId(null); }}
            style={{
              padding: '6px 10px',
              borderRadius: 30,
              background: activeTab === 'my' ? 'black' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 280ms ease',
              width: '100%'
            }}
          >
            Мои лоты
          </button>
          <button
            onClick={() => { setActiveTab('community'); setSelectedCardId(null); }}
            style={{
              padding: '6px 10px',
              borderRadius: 30,
              background: activeTab === 'community' ? 'black' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 280ms ease',
              width: '100%'
            }}
          >
            Лоты сообщества
          </button>
        </div>
      </div>

      <div style={{ height: 'calc(100% - 110px)', padding: '15px', marginTop: 115 }}>
        <TransitionGroup>
          <CSSTransition key={activeTab + (selectedCardId ? ':card' : ':grid')} classNames="tab" timeout={300}>
            <div {...swipeHandlers} style={{ display: "flex", gap: "15px", flexDirection: 'column', marginTop: '0px', height: '100%'}}>
              {selectedCardId ? (
                <CardDetail
                  card={selectedCard}
                  displayImage={selectedCardImage}
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  selectedCardListings={selectedCardListings}
                  currentUser={currentUser}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                  setSellCardId={setSellCardId}
                  setShowSell={setShowSell}
                  loadingBuy={loadingBuy}
                  onBack={() => setSelectedCardId(null)}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, height: '100%' }}>
                  <div style={{ display: 'flex' }}>
                    <button
                      style={{background: 'rgb(17, 17, 19)', padding: '10px', width: '100%', textAlign: 'center', borderRadius: '20px'}}
                      onClick={() => { setSellCardId(null); setShowSell(true); setActiveTab('my'); }}
                    >
                      Продать карту
                    </button>
                  </div>

                  {!currentUser && activeTab === 'my' && <div style={{ color: '#888' }}>Войдите чтобы увидеть свои лоты</div>}

                  {/* Grid of cards */}
                  <CardGrid cards={cards} onOpenCard={(cardId) => setSelectedCardId(cardId)} />
                </div>
              )}
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>

      {showSell && (
        <SellModal
          show={showSell}
          cardId={sellCardId || (currentUser && Object.keys(currentUser.cards || {})[0])}
          currentUser={currentUser}
          onClose={() => setShowSell(false)}
          onListed={() => { setShowSell(false); }}
        />
      )}

      {/* Confirm modal */}
      <ModalConfirm
        show={confirmState.show}
        onClose={() => setConfirmState(prev => ({ ...prev, show: false }))}
        onConfirm={(remember) => {
          confirmState.onConfirm?.(remember);
        }}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Да"
        cancelText="Нет"
        showRemember={confirmState.showRemember}
      />
      <Modal
        show={modalShow}
        onClose={() => setModalShow(false)}
        message={modalMessage}
      />
    </div>
  );
}
